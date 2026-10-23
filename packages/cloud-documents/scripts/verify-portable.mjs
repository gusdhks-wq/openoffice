import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { cp, mkdtemp, readFile, rm, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createServer } from 'node:net'

const source = resolve(process.argv[2] || '')
await access(join(source, 'Start.cmd'))
for (const filename of ['.env.cloud.local', '.ieumoffice-cloud-data']) {
  let exists = true
  try {
    await access(join(source, filename))
  } catch (error) {
    if (error.code === 'ENOENT') exists = false
    else throw error
  }
  assert.equal(exists, false, 'A distributable must never contain generated settings or documents.')
}
async function freePort() {
  const server = createServer()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const port = server.address().port
  await new Promise((done) => server.close(done))
  return port
}
const temporary = await mkdtemp(join(tmpdir(), 'ieum-portable-'))
let processHandle
try {
  const root = join(temporary, 'app')
  await cp(source, root, { recursive: true })
  const webPort = await freePort(),
    apiPort = await freePort()
  const executable =
    process.platform === 'win32' ? join(root, 'runtime/node.exe') : process.execPath
  processHandle = spawn(executable, ['packages/cloud-documents/scripts/local.mjs'], {
    cwd: root,
    env: {
      ...process.env,
      GENOFFICE_LOCAL_WEB_PORT: String(webPort),
      GENOFFICE_LOCAL_API_PORT: String(apiPort),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
  })
  let ready = false
  processHandle.stdout.on('data', (data) => {
    if (String(data).includes('Mobile editor:')) ready = true
  })
  processHandle.stderr.resume()
  const deadline = Date.now() + 20000
  while (!ready) {
    assert.equal(processHandle.exitCode, null, 'Portable launcher exited before readiness.')
    assert.ok(Date.now() < deadline, 'Portable startup timed out.')
    await new Promise((done) => setTimeout(done, 50))
  }
  const web = `http://127.0.0.1:${webPort}`,
    api = `http://127.0.0.1:${apiPort}`
  assert.equal((await fetch(web)).status, 200)
  assert.equal((await fetch(`${web}/.env.cloud.local`)).status, 404)
  assert.equal((await fetch(`${api}/v1/documents`)).status, 401)
  const settings = await readFile(join(root, '.env.cloud.local'), 'utf8')
  const owner = /^GENOFFICE_CLOUD_OWNER_TOKEN=(.+)$/m.exec(settings)[1].trim()
  const agent = /^GENOFFICE_CLOUD_AGENT_TOKEN=(.+)$/m.exec(settings)[1].trim()
  assert.notEqual(owner, agent)
  const headers = { Authorization: `Bearer ${owner}`, Origin: web }
  const connection = await (await fetch(`${api}/v1/connection`, { headers })).json()
  assert.equal(connection.role, 'owner')
  const created = await fetch(`${api}/v1/documents`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
      'X-Genoffice-Workspace': connection.workspaceId,
    },
    body: JSON.stringify({
      operationId: crypto.randomUUID(),
      name: 'portable.md',
      content: '# Portable test\n',
    }),
  })
  assert.equal(created.status, 201)
  const document = (await created.json()).document
  const restored = await (await fetch(`${api}/v1/documents/${document.id}`, { headers })).json()
  assert.equal(restored.document.content, '# Portable test\n')
  const external = spawn(executable, ['packages/cloud-documents/dist/client.mjs', 'list'], {
    cwd: root,
    env: { ...process.env, GENOFFICE_CLOUD_URL: api, GENOFFICE_CLOUD_AGENT_TOKEN: agent },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
  })
  external.stdout.resume()
  external.stderr.resume()
  assert.equal((await once(external, 'exit'))[0], 0)
  console.log(
    'PASS portable startup, bundled dependencies, private setup, authentication, document write/read and external helper.',
  )
} finally {
  if (processHandle && processHandle.exitCode === null) {
    const exited = once(processHandle, 'exit')
    processHandle.kill('SIGTERM')
    await exited
  }
  await rm(temporary, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 })
}
