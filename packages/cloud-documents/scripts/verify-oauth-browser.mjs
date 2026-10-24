import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createHash, randomBytes } from 'node:crypto'
import { chromium } from 'playwright-core'
import { createRemoteOAuth } from './remote-oauth.mjs'

// Exercise browser-generated Origin and cookie headers, with no external requests.
const origin = 'https://documents.example',
  redirect = 'https://chatgpt.com/connector/oauth/browser_test'
let approvalCode, approvalOrigin
const oauth = createRemoteOAuth({ origin, onApprovalCode: (code) => (approvalCode = code) })
const server = createServer(oauth.handler)
let browser
try {
  await new Promise((done) => server.listen(0, '127.0.0.1', done))
  const local = `http://127.0.0.1:${server.address().port}`
  const registered = await fetch(local + '/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      redirect_uris: [redirect],
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
    }),
  })
  assert.equal(registered.status, 201)
  const client = await registered.json()
  browser = await chromium.launch({
    ...(process.env.GENOFFICE_TEST_CHROMIUM
      ? { executablePath: process.env.GENOFFICE_TEST_CHROMIUM }
      : { channel: 'chrome' }),
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage()
  await page.route('**/*', async (route) => {
    const req = route.request(),
      url = new URL(req.url())
    if (url.origin === 'https://chatgpt.com') {
      await route.fulfill({ contentType: 'text/html', body: '<p>Callback</p>' })
      return
    }
    assert.equal(url.origin, origin)
    const headers = await req.allHeaders()
    if (url.pathname === '/approve') approvalOrigin = headers.origin
    delete headers.host
    delete headers['content-length']
    const response = await fetch(local + url.pathname + url.search, {
      method: req.method(),
      headers,
      body: req.postDataBuffer() || undefined,
      redirect: 'manual',
    })
    await route.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: Buffer.from(await response.arrayBuffer()),
    })
  })
  await page.goto('https://chatgpt.com/')
  const verifier = randomBytes(32).toString('base64url')
  await page.goto(
    origin +
      '/authorize?' +
      new URLSearchParams({
        client_id: client.client_id,
        redirect_uri: redirect,
        response_type: 'code',
        code_challenge_method: 'S256',
        code_challenge: createHash('sha256').update(verifier).digest('base64url'),
        resource: origin + '/mcp',
        scope: 'documents:shared',
        state: 'browser-state',
      }),
  )
  await page.locator('input[name="code"]').fill(approvalCode)
  await page.locator('button').click()
  await page.waitForLoadState('load')
  assert.equal(approvalOrigin, origin, 'Consent form must retain its same-origin POST Origin')
  const callback = new URL(page.url())
  assert.equal(callback.origin, 'https://chatgpt.com')
  assert.equal(callback.searchParams.get('state'), 'browser-state')
  const token = await fetch(local + '/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: client.client_id,
      grant_type: 'authorization_code',
      code: callback.searchParams.get('code'),
      code_verifier: verifier,
      redirect_uri: redirect,
      resource: origin + '/mcp',
    }),
  })
  assert.equal(token.status, 200)
  assert.equal(
    (await oauth.verify((await token.json()).access_token)).resource.href,
    origin + '/mcp',
  )
  console.log(
    'PASS: Chromium approval retains Origin and cookie, redirects and exchanges PKCE code.',
  )
} finally {
  await browser?.close()
  server.closeAllConnections()
  await new Promise((done) => server.close(done))
}
