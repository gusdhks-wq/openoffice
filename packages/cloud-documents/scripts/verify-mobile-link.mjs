import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createServer } from 'node:net'
import { createHash, randomBytes } from 'node:crypto'
import { chromium } from 'playwright-core'
const source = resolve(process.argv[2]),
  temporary = await mkdtemp(join(tmpdir(), 'ieum-mobile-https-'))
const root = join(temporary, 'app')
let serverProcess, linkProcess, browser
async function freePort() {
  const s = createServer()
  s.listen(0, '127.0.0.1')
  await once(s, 'listening')
  const port = s.address().port
  await new Promise((done) => s.close(done))
  return port
}
async function waitReady(child, ready, label) {
  const deadline = Date.now() + 90000
  while (!ready()) {
    assert.equal(child.exitCode, null, `${label} exited early`)
    assert.ok(Date.now() < deadline, `${label} timed out`)
    await new Promise((done) => setTimeout(done, 100))
  }
}
try {
  await cp(source, root, { recursive: true })
  const webPort = await freePort(),
    apiPort = await freePort(),
    executable = process.platform === 'win32' ? join(root, 'runtime/node.exe') : process.execPath
  const env = {
    ...process.env,
    GENOFFICE_LOCAL_WEB_PORT: String(webPort),
    GENOFFICE_LOCAL_API_PORT: String(apiPort),
  }
  serverProcess = spawn(executable, ['packages/cloud-documents/scripts/local.mjs'], {
    cwd: root,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let ready = false
  serverProcess.stdout.on('data', (data) => {
    if (String(data).includes('Mobile editor:')) ready = true
  })
  serverProcess.stderr.resume()
  await waitReady(serverProcess, () => ready, 'Local editor')
  const settings = await readFile(join(root, '.env.cloud.local'), 'utf8'),
    owner = /^GENOFFICE_CLOUD_OWNER_TOKEN=(.+)$/m.exec(settings)[1].trim()
  const api = `http://127.0.0.1:${apiPort}`,
    headers = { Authorization: `Bearer ${owner}` }
  const connection = await (await fetch(api + '/v1/connection', { headers })).json()
  const created = await fetch(api + '/v1/documents', {
    method: 'POST',
    headers: {
      ...headers,
      'content-type': 'application/json',
      'x-genoffice-workspace': connection.workspaceId,
    },
    body: JSON.stringify({
      operationId: crypto.randomUUID(),
      name: 'phone.md',
      content: '# Remote phone test\n',
    }),
  })
  assert.equal(created.status, 201)
  let document = (await created.json()).document
  linkProcess = spawn(executable, ['packages/cloud-documents/scripts/mobile-connect.mjs'], {
    cwd: root,
    env,
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  })
  let origin,
    approval,
    phoneCode,
    logs = ''
  linkProcess.stdout.on('data', (data) => {
    logs = (logs + String(data)).slice(-12000)
    origin =
      /Mobile server address: (https:\/\/[a-z0-9-]+\.trycloudflare\.com)/.exec(logs)?.[1] || origin
    approval = /PC approval code \(3 minutes\): ([0-9]{8})/.exec(logs)?.[1] || approval
    phoneCode = /Phone pairing code \(3 minutes, one use\): ([0-9]{8})/.exec(logs)?.[1] || phoneCode
  })
  linkProcess.stderr.resume()
  await waitReady(linkProcess, () => !!origin, 'HTTPS connector')
  const deadline = Date.now() + 60000
  for (;;) {
    try {
      const health = await fetch(origin + '/health', { signal: AbortSignal.timeout(5000) })
      if (health.ok) break
    } catch {}
    assert.ok(Date.now() < deadline, 'Public HTTPS did not become ready')
    await new Promise((done) => setTimeout(done, 1000))
  }
  const mobile = await fetch(origin + '/v1/connection', {
    headers: { ...headers, Origin: 'https://localhost' },
  })
  assert.equal(mobile.status, 200)
  assert.equal(mobile.headers.get('access-control-allow-origin'), 'https://localhost')
  assert.equal((await mobile.json()).workspaceId, connection.workspaceId)
  const phone = await (
    await fetch(`${origin}/v1/documents/${document.id}`, {
      headers: { ...headers, Origin: 'https://localhost' },
    })
  ).json()
  assert.equal(phone.document.content, '# Remote phone test\n')
  assert.equal((await fetch(origin + '/.env.cloud.local')).status, 404)
  assert.equal((await fetch(origin + '/v1/documents')).status, 401)
  await waitReady(linkProcess, () => !!phoneCode, 'Phone pairing code')
  browser = await chromium.launch({ channel: 'chrome' })
  const page = await browser.newPage({ viewport: { width: 412, height: 915 }, locale: 'en-US' })
  await page.goto(origin)
  const panel = page.locator('.cloud-panel')
  await panel.locator('summary').click()
  assert.equal(await panel.locator('input[type="url"]').inputValue(), origin)
  await panel.locator('input[type="password"]').fill(phoneCode)
  await panel.getByRole('button', { name: 'Connect server', exact: true }).click()
  await panel.getByRole('button', { name: 'phone.md', exact: true }).click()
  assert.equal(await page.locator('textarea').inputValue(), '# Remote phone test\n')
  const saved = await page.evaluate(() => JSON.stringify(localStorage))
  assert.ok(saved.includes(origin))
  assert.ok(!saved.includes(owner) && !saved.includes('phone_') && !saved.includes(phoneCode))
  await page.locator('textarea').fill('# Saved by phone\n')
  await panel.getByRole('button', { name: 'Sync document', exact: true }).click()
  await panel.getByRole('status').filter({ hasText: 'Document server connected' }).waitFor()
  const synced = await (await fetch(`${api}/v1/documents/${document.id}`, { headers })).json()
  assert.equal(synced.document.content, '# Saved by phone\n')
  document = synced.document
  await panel.getByRole('button', { name: 'Disconnect server', exact: true }).click()
  await browser.close()
  browser = undefined
  const redirect = 'https://chatgpt.com/connector/oauth/test_https_flow'
  const register = await fetch(origin + '/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ redirect_uris: [redirect], token_endpoint_auth_method: 'none' }),
  })
  assert.equal(register.status, 201)
  const client = await register.json()
  const verifier = randomBytes(32).toString('base64url'),
    challenge = createHash('sha256').update(verifier).digest('base64url')
  const authorize = await fetch(
    origin +
      '/authorize?' +
      new URLSearchParams({
        client_id: client.client_id,
        redirect_uri: redirect,
        response_type: 'code',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        resource: origin + '/mcp',
        scope: 'documents:shared',
      }),
  )
  const html = await authorize.text(),
    request = /name="request" value="([a-f0-9]+)"/.exec(html)[1]
  await waitReady(linkProcess, () => !!approval, 'Local approval code')
  const consent = await fetch(origin + '/approve', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Origin: origin,
      Cookie: authorize.headers.get('set-cookie').split(';')[0],
    },
    body: new URLSearchParams({ request, code: approval }),
    redirect: 'manual',
  })
  assert.equal(consent.status, 303)
  const code = new URL(consent.headers.get('location')).searchParams.get('code')
  const exchanged = await fetch(origin + '/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: client.client_id,
      grant_type: 'authorization_code',
      code,
      code_verifier: verifier,
      redirect_uri: redirect,
      resource: origin + '/mcp',
    }),
  })
  assert.equal(exchanged.status, 200)
  const token = (await exchanged.json()).access_token
  async function list() {
    const response = await fetch(origin + '/mcp', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'list_documents', arguments: {} },
      }),
    })
    assert.equal(response.status, 200)
    return JSON.parse((await response.json()).result.content[0].text).documents
  }
  assert.deepEqual(await list(), [])
  const shared = await fetch(`${api}/v1/documents/${document.id}/share`, {
    method: 'POST',
    headers: {
      ...headers,
      'content-type': 'application/json',
      'x-genoffice-workspace': connection.workspaceId,
    },
    body: JSON.stringify({
      operationId: crypto.randomUUID(),
      baseRevision: document.revision,
      enabled: true,
    }),
  })
  assert.equal(shared.status, 200)
  assert.deepEqual(
    (await list()).map((doc) => doc.id),
    [document.id],
  )
  const current = (await list())[0]
  const changed = await fetch(origin + '/mcp', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'update_document',
        arguments: {
          id: current.id,
          baseRevision: current.revision,
          operationId: crypto.randomUUID(),
          content: '# Changed by external tool\n',
        },
      },
    }),
  })
  assert.equal(changed.status, 200)
  const phoneUpdate = await (
    await fetch(`${origin}/v1/documents/${document.id}`, {
      headers: { ...headers, Origin: 'https://localhost' },
    })
  ).json()
  assert.equal(phoneUpdate.document.content, '# Changed by external tool\n')

  assert.equal(await readFile(join(root, '.env.cloud.local'), 'utf8'), settings)
  console.log(
    'PASS real HTTPS tunnel, actual Chromium phone pairing and document open, Android-origin owner connection, private-file/auth boundaries, DCR + PC approval + PKCE and shared-only MCP access. No OpenAI API or real user data used.',
  )
} finally {
  await browser?.close()
  if (linkProcess && linkProcess.exitCode === null) {
    const exited = once(linkProcess, 'exit')
    linkProcess.send('stop-mobile-link')
    await exited
  }
  if (serverProcess && serverProcess.exitCode === null) {
    const exited = once(serverProcess, 'exit')
    serverProcess.kill('SIGTERM')
    await exited
  }
  await rm(temporary, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 })
}
