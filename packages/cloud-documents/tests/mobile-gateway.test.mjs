import { describe, expect, it, afterEach } from 'vitest'
import { createServer } from 'node:http'
import { createHash, randomBytes } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { startDocumentServer } from '../src/server.ts'
import { makeMobileGateway } from '../scripts/mobile-connect.mjs'
import { createRemoteOAuth } from '../scripts/remote-oauth.mjs'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
const cleanup = [],
  OWNER = 'synthetic-owner-'.repeat(4),
  AGENT = 'synthetic-agent-'.repeat(4),
  ORIGIN = 'https://synthetic-test.example'
afterEach(async () => {
  for (const close of cleanup.splice(0).reverse()) await close()
})
async function listen(server) {
  await new Promise((done) => server.listen(0, '127.0.0.1', done))
  cleanup.push(
    () =>
      new Promise((done) => {
        server.close(done)
        server.closeAllConnections()
      }),
  )
  return server.address().port
}
async function setup() {
  const directory = await mkdtemp(join(tmpdir(), 'ieum-gateway-'))
  cleanup.push(() => rm(directory, { recursive: true, force: true }))
  const backend = await startDocumentServer({
    directory,
    ownerToken: OWNER,
    agentToken: AGENT,
    port: 0,
  })
  cleanup.push(() => backend.close())
  const web = createServer((_req, res) => res.end('<html>mobile editor</html>')),
    webPort = await listen(web)
  let approval
  const oauth = createRemoteOAuth({
    origin: ORIGIN,
    onApprovalCode: (code) => {
      approval = code
    },
  })
  const gateway = makeMobileGateway({
    webPort,
    apiPort: new URL(backend.url).port,
    getPublicOrigin: () => ORIGIN,
    getOAuth: () => oauth,
    agentToken: AGENT,
  })
  const port = await listen(gateway),
    url = `http://127.0.0.1:${port}`
  async function post(path, body, headers = {}) {
    return fetch(url + path, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
      body: new URLSearchParams(body),
      redirect: 'manual',
    })
  }
  async function authorize() {
    const registration = await fetch(url + '/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        redirect_uris: ['https://chatgpt.com/connector/oauth/test_gateway'],
        token_endpoint_auth_method: 'none',
      }),
    })
    expect(registration.status).toBe(201)
    const client = await registration.json()
    const verifier = randomBytes(32).toString('base64url'),
      challenge = createHash('sha256').update(verifier).digest('base64url')
    const start = await fetch(
      url +
        '/authorize?' +
        new URLSearchParams({
          client_id: client.client_id,
          redirect_uri: client.redirect_uris[0],
          response_type: 'code',
          code_challenge: challenge,
          code_challenge_method: 'S256',
          resource: ORIGIN + '/mcp',
          scope: 'documents:shared',
        }),
    )
    const html = await start.text(),
      id = /name="request" value="([a-f0-9]+)"/.exec(html)[1]
    const consent = await post(
      '/approve',
      { request: id, code: approval },
      { origin: ORIGIN, cookie: start.headers.get('set-cookie').split(';')[0] },
    )
    expect(consent.status).toBe(303)
    const code = new URL(consent.headers.get('location')).searchParams.get('code')
    const response = await post('/token', {
      client_id: client.client_id,
      grant_type: 'authorization_code',
      code,
      code_verifier: verifier,
      redirect_uri: client.redirect_uris[0],
      resource: ORIGIN + '/mcp',
    })
    expect(response.status).toBe(200)
    return (await response.json()).access_token
  }
  return { backend, url, authorize }
}
async function mcp(url, token) {
  const client = new Client({ name: 'gateway-test', version: '1' })
  await client.connect(
    new StreamableHTTPClientTransport(
      new URL(url + '/mcp'),
      token ? { requestInit: { headers: { Authorization: `Bearer ${token}` } } } : {},
    ),
  )
  cleanup.push(() => client.close())
  return client
}
describe('mobile HTTPS gateway boundaries', () => {
  it('allows native HTTPS origins, retains backend authentication and refuses private files and unrelated browser origins', async () => {
    const s = await setup()
    const unauth = await fetch(s.url + '/v1/documents', {
      headers: { origin: 'https://localhost' },
    })
    expect(unauth.status).toBe(401)
    const connection = await fetch(s.url + '/v1/connection', {
      headers: { origin: 'https://localhost', Authorization: `Bearer ${OWNER}` },
    })
    expect(connection.status).toBe(200)
    expect(connection.headers.get('access-control-allow-origin')).toBe('https://localhost')
    expect((await connection.json()).role).toBe('owner')
    expect(
      (
        await fetch(s.url + '/v1/connection', {
          headers: { origin: 'https://evil.example', Authorization: `Bearer ${OWNER}` },
        })
      ).status,
    ).toBe(403)
    expect((await fetch(s.url + '/.env.cloud.local')).status).toBe(404)
    expect((await fetch(s.url + '/packages/cloud-documents/dist/server.mjs')).status).toBe(404)
    expect((await fetch(s.url)).status).toBe(200)
    expect(
      (
        await fetch(s.url + '/v1/documents', {
          method: 'OPTIONS',
          headers: { origin: 'https://localhost' },
        })
      ).status,
    ).toBe(204)
  })
  it('permits tool discovery but challenges anonymous document access, including an owner-key attempt', async () => {
    const s = await setup(),
      client = await mcp(s.url)
    const listed = await client.listTools()
    expect(listed.tools).toHaveLength(6)
    expect(listed.tools.every((tool) => tool._meta.securitySchemes[0].type === 'oauth2')).toBe(true)
    const call = {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: { name: 'list_documents', arguments: {} },
    }
    for (const token of [undefined, OWNER]) {
      const response = await fetch(s.url + '/mcp', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(call),
      })
      expect(response.status).toBe(401)
      expect(response.headers.get('www-authenticate')).toContain(
        '/.well-known/oauth-protected-resource/mcp',
      )
    }
  })
  it('completes OAuth then uses real MCP to read/edit only shared documents and honors immediate sharing revocation', async () => {
    const s = await setup(),
      hidden = await s.backend.store.create('owner', {
        operationId: crypto.randomUUID(),
        name: 'hidden.md',
        content: 'private',
      })
    const shared = await s.backend.store.create('agent', {
      operationId: crypto.randomUUID(),
      name: 'shared.md',
      content: 'before',
    })
    const token = await s.authorize(),
      client = await mcp(s.url, token)
    const listed = await client.callTool({ name: 'list_documents', arguments: {} })
    expect(JSON.parse(listed.content[0].text).documents.map((doc) => doc.id)).toEqual([shared.id])
    const forbidden = await client.callTool({ name: 'read_document', arguments: { id: hidden.id } })
    expect(forbidden.isError).toBe(true)
    const updated = await client.callTool({
      name: 'update_document',
      arguments: {
        id: shared.id,
        baseRevision: shared.revision,
        operationId: crypto.randomUUID(),
        content: 'after remote edit',
      },
    })
    expect(updated.isError).not.toBe(true)
    expect(s.backend.store.read('owner', shared.id).content).toBe('after remote edit')
    const current = s.backend.store.read('owner', shared.id)
    await s.backend.store.share('owner', shared.id, {
      operationId: crypto.randomUUID(),
      baseRevision: current.revision,
      enabled: false,
    })
    expect(
      (await client.callTool({ name: 'read_document', arguments: { id: shared.id } })).isError,
    ).toBe(true)
    expect(
      (await fetch(s.url + '/v1/connection', { headers: { Authorization: `Bearer ${token}` } }))
        .status,
    ).toBe(401)
  })
})
