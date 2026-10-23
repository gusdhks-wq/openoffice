import { describe, expect, it, afterEach } from 'vitest'
import { createServer } from 'node:http'
import { createHash, randomBytes } from 'node:crypto'
import { createRemoteOAuth, allowedChatGPTRedirect } from '../scripts/remote-oauth.mjs'
import { approvalMessages } from '../scripts/remote-strings.mjs'
const cleanup = []
afterEach(async () => {
  for (const close of cleanup.splice(0).reverse()) await close()
})
const origin = 'https://test-documents.example',
  redirectUri = 'https://chatgpt.com/connector/oauth/test_connection'
async function setup() {
  let code,
    time = Date.now()
  const oauth = createRemoteOAuth({
    origin,
    onApprovalCode: (value) => {
      code = value
    },
    now: () => time,
  })
  const server = createServer(oauth.handler)
  await new Promise((done) => server.listen(0, '127.0.0.1', done))
  cleanup.push(
    () =>
      new Promise((done) => {
        server.close(done)
        server.closeAllConnections()
      }),
  )
  const url = `http://127.0.0.1:${server.address().port}`
  async function post(path, body, extra = {}) {
    return fetch(url + path, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', ...extra },
      body: new URLSearchParams(body),
      redirect: 'manual',
    })
  }
  async function client() {
    const response = await fetch(url + '/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        redirect_uris: [redirectUri],
        token_endpoint_auth_method: 'none',
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
      }),
    })
    expect(response.status).toBe(201)
    return response.json()
  }
  async function begin(registered, changes = {}) {
    const verifier = randomBytes(32).toString('base64url'),
      challenge = createHash('sha256').update(verifier).digest('base64url')
    const response = await fetch(
      url +
        '/authorize?' +
        new URLSearchParams({
          client_id: registered.client_id,
          redirect_uri: redirectUri,
          response_type: 'code',
          code_challenge: challenge,
          code_challenge_method: 'S256',
          resource: origin + '/mcp',
          scope: 'documents:shared offline_access',
          state: 'state-test',
          ...changes,
        }),
      { redirect: 'manual', headers: { 'accept-language': 'ko' } },
    )
    const html = await response.text()
    return {
      response,
      html,
      verifier,
      request: /name="request" value="([a-f0-9]+)"/.exec(html)?.[1],
      cookie: response.headers.get('set-cookie')?.split(';')[0],
      code,
    }
  }
  return {
    oauth,
    url,
    post,
    client,
    begin,
    advance: () => {
      time += 3600001
    },
  }
}
async function authorize(s, client) {
  const start = await s.begin(client)
  expect(start.response.status).toBe(200)
  const approved = await s.post(
    '/approve',
    { request: start.request, code: start.code },
    { origin, cookie: start.cookie },
  )
  expect(approved.status).toBe(303)
  const callback = new URL(approved.headers.get('location'))
  expect(callback.origin).toBe('https://chatgpt.com')
  expect(callback.searchParams.get('state')).toBe('state-test')
  return { code: callback.searchParams.get('code'), verifier: start.verifier }
}
async function token(s, client, grant, changes = {}) {
  return s.post('/token', {
    client_id: client.client_id,
    grant_type: 'authorization_code',
    code: grant.code,
    code_verifier: grant.verifier,
    redirect_uri: redirectUri,
    resource: origin + '/mcp',
    ...changes,
  })
}
describe('temporary OAuth approval for shared document tools', () => {
  it('publishes discovery and requires browser proof, PC code and PKCE before issuing scoped tokens', async () => {
    const s = await setup(),
      client = await s.client(),
      start = await s.begin(client)
    expect(start.html).toContain('공유 문서 연결')
    expect(start.response.headers.get('set-cookie')).toContain('Secure')
    expect(start.response.headers.get('content-security-policy')).toContain(
      "frame-ancestors 'none'",
    )
    expect((await s.post('/approve', { request: start.request, code: start.code })).status).toBe(
      403,
    )
    const approved = await s.post(
      '/approve',
      { request: start.request, code: start.code },
      { origin, cookie: start.cookie },
    )
    expect(approved.status).toBe(303)
    const code = new URL(approved.headers.get('location')).searchParams.get('code')
    const response = await token(s, client, { code, verifier: start.verifier })
    expect(response.status).toBe(200)
    const tokens = await response.json(),
      info = await s.oauth.verify(tokens.access_token)
    expect(info.scopes).toEqual(['documents:shared'])
    expect(info.resource.href).toBe(origin + '/mcp')
    expect((await token(s, client, { code, verifier: start.verifier })).status).toBe(400)
    const metadata = await (await fetch(s.url + '/.well-known/oauth-protected-resource/mcp')).json()
    expect(metadata.resource).toBe(origin + '/mcp')
  })
  it('refuses malicious callbacks, wrong PKCE, another client and another resource', async () => {
    for (const bad of [
      'https://evil.example/callback',
      'https://chatgpt.com.evil.example/connector/oauth/x',
      'https://chatgpt.com/connector/oauth/x?leak=1',
      'http://chatgpt.com/connector/oauth/x',
    ])
      expect(allowedChatGPTRedirect(bad)).toBe(false)
    const s = await setup(),
      client = await s.client(),
      other = await s.client(),
      grant = await authorize(s, client)
    expect((await token(s, client, grant, { code_verifier: 'wrong-verifier' })).status).toBe(400)
    expect((await token(s, other, grant)).status).toBe(400)
    expect((await token(s, client, grant, { resource: 'https://evil.example/mcp' })).status).toBe(
      400,
    )
    expect((await token(s, client, grant)).status).toBe(200)
  })
  it('limits guesses, expires access tokens, rotates refresh tokens and revokes a family', async () => {
    const s = await setup(),
      client = await s.client(),
      start = await s.begin(client)
    for (let i = 0; i < 5; i++)
      expect(
        (
          await s.post(
            '/approve',
            { request: start.request, code: '00000000' },
            { origin, cookie: start.cookie },
          )
        ).status,
      ).toBe(403)
    expect(
      (
        await s.post(
          '/approve',
          { request: start.request, code: start.code },
          { origin, cookie: start.cookie },
        )
      ).status,
    ).toBe(403)
    const grant = await authorize(s, client),
      issued = await (await token(s, client, grant)).json()
    s.advance()
    await expect(s.oauth.verify(issued.access_token)).rejects.toThrow()
    const renewed = await s.post('/token', {
      client_id: client.client_id,
      grant_type: 'refresh_token',
      refresh_token: issued.refresh_token,
      resource: origin + '/mcp',
    })
    expect(renewed.status).toBe(200)
    const next = await renewed.json()
    await s.oauth.verify(next.access_token)
    expect(
      (
        await s.post('/token', {
          client_id: client.client_id,
          grant_type: 'refresh_token',
          refresh_token: issued.refresh_token,
        })
      ).status,
    ).toBe(400)
    await s.oauth.provider.revokeToken(client, { token: next.refresh_token })
    await expect(s.oauth.verify(next.access_token)).rejects.toThrow()
  })
  it('supplies every approval label in all 21 supported languages', () => {
    expect(Object.keys(approvalMessages)).toHaveLength(21)
    for (const values of Object.values(approvalMessages)) {
      expect(values).toHaveLength(5)
      expect(values.every((value) => typeof value === 'string' && value.length > 0)).toBe(true)
    }
  })
})
