import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { startDocumentServer } from '../src/server'
import { CloudDocumentsClient } from '../src/browser'
const OWNER = 'owner-test-token-'.repeat(4),
  AGENT = 'agent-test-token-'.repeat(4)
const cleanup: (() => Promise<void>)[] = []
afterEach(async () => {
  for (const close of cleanup.splice(0).reverse()) await close()
})
async function setup() {
  const directory = await mkdtemp(join(tmpdir(), 'genoffice-cloud-http-'))
  cleanup.push(() => rm(directory, { recursive: true, force: true }))
  const server = await startDocumentServer({
    directory,
    ownerToken: OWNER,
    agentToken: AGENT,
    port: 0,
    allowedOrigins: ['http://localhost:5181'],
  })
  cleanup.push(() => server.close())
  return {
    server,
    owner: new CloudDocumentsClient(server.url, () => OWNER),
    agent: new CloudDocumentsClient(server.url, () => AGENT),
  }
}

describe('authenticated HTTP and MCP document access', () => {
  it('requires authorization, rejects unauthorized origins, and never reflects a supplied origin', async () => {
    const { server } = await setup()
    const anonymous = await fetch(`${server.url}/v1/documents`)
    expect(anonymous.status).toBe(401)
    expect(anonymous.headers.get('cache-control')).toBe('no-store')
    const rebound = await fetch(`${server.url}/v1/documents`, {
      headers: { Authorization: `Bearer ${OWNER}`, Origin: 'https://untrusted.example' },
    })
    expect(rebound.status).toBe(403)
    expect(rebound.headers.get('access-control-allow-origin')).toBeNull()
    const preflight = await fetch(`${server.url}/v1/documents`, {
      method: 'OPTIONS',
      headers: { Origin: 'http://localhost:5181' },
    })
    expect(preflight.status).toBe(204)
    expect(preflight.headers.get('access-control-allow-origin')).toBe('http://localhost:5181')
  })
  it('rejects owner credentials at MCP and rejects writes bound to another workspace', async () => {
    const { server, owner } = await setup()
    const mcp = await fetch(`${server.url}/mcp`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${OWNER}`, 'Content-Type': 'application/json' },
      body: '{}',
    })
    expect(mcp.status).toBe(401)
    await owner.connect()
    const response = await fetch(`${server.url}/v1/documents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OWNER}`,
        'Content-Type': 'application/json',
        'X-Genoffice-Workspace': 'another-workspace',
      },
      body: JSON.stringify({
        operationId: crypto.randomUUID(),
        name: 'note.md',
        content: 'must not arrive',
      }),
    })
    expect(response.status).toBe(409)
    expect(await owner.list()).toEqual([])
  })
  it('validates strict input and does not let an agent grant itself access', async () => {
    const { server, owner, agent } = await setup()
    const doc = await owner.create({
      operationId: crypto.randomUUID(),
      name: 'note.md',
      content: 'private',
    })
    await owner.connect()
    const invalid = await fetch(`${server.url}/v1/documents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AGENT}`,
        'Content-Type': 'application/json',
        'X-Genoffice-Workspace': owner.workspaceId!,
      },
      body: JSON.stringify({
        operationId: crypto.randomUUID(),
        name: 'note.md',
        content: 'x',
        role: 'owner',
      }),
    })
    expect(invalid.status).toBe(400)
    await expect(agent.read(doc.id)).rejects.toThrow('not-found')
    await expect(
      agent.share(doc.id, {
        operationId: crypto.randomUUID(),
        baseRevision: doc.revision,
        enabled: true,
      }),
    ).rejects.toThrow('unauthorized')
  })
  it('supports idempotent create, conditional editing and version restoration over HTTP', async () => {
    const { owner } = await setup()
    const input = { operationId: crypto.randomUUID(), name: '한국어.md', content: '\uFEFF본문\r\n' }
    const created = await owner.create(input)
    expect(await owner.create(input)).toEqual(created)
    const updated = await owner.update(created.id, {
      operationId: crypto.randomUUID(),
      baseRevision: created.revision,
      content: 'edited',
    })
    await expect(
      owner.update(created.id, {
        operationId: crypto.randomUUID(),
        baseRevision: created.revision,
        content: 'stale',
      }),
    ).rejects.toMatchObject({ code: 'conflict' })
    const restored = await owner.restore(created.id, {
      operationId: crypto.randomUUID(),
      baseRevision: updated.revision,
      revision: created.revision,
    })
    expect(restored.content).toBe(input.content)
    expect(await owner.versions(created.id)).toHaveLength(3)
  })
  it('runs a real MCP initialize/list/read/update flow with only the agent credential', async () => {
    const { server, owner } = await setup()
    const hidden = await owner.create({
      operationId: crypto.randomUUID(),
      name: 'private.md',
      content: 'private source',
    })
    const created = await owner.create({
      operationId: crypto.randomUUID(),
      name: 'shared.md',
      content: 'original source',
    })
    const shared = await owner.share(created.id, {
      operationId: crypto.randomUUID(),
      baseRevision: created.revision,
      enabled: true,
    })
    const client = new Client({ name: 'external-agent-test', version: '1.0.0' })
    await client.connect(
      new StreamableHTTPClientTransport(new URL(`${server.url}/mcp`), {
        requestInit: { headers: { Authorization: `Bearer ${AGENT}` } },
      }),
    )
    try {
      expect((await client.listTools()).tools.map((tool) => tool.name)).toContain('update_document')
      const listed = await client.callTool({ name: 'list_documents', arguments: {} })
      expect(JSON.stringify(listed)).toContain(created.id)
      expect(JSON.stringify(listed)).not.toContain(hidden.id)
      const read = await client.callTool({ name: 'read_document', arguments: { id: created.id } })
      expect(JSON.stringify(read)).toContain('original source')
      const edited = await client.callTool({
        name: 'update_document',
        arguments: {
          id: created.id,
          operationId: crypto.randomUUID(),
          baseRevision: shared.revision,
          content: 'edited by external agent',
        },
      })
      expect(edited.isError).not.toBe(true)
      expect((await owner.read(created.id)).content).toBe('edited by external agent')
      const stale = await client.callTool({
        name: 'update_document',
        arguments: {
          id: created.id,
          operationId: crypto.randomUUID(),
          baseRevision: shared.revision,
          content: 'stale',
        },
      })
      expect(stale.isError).toBe(true)
      expect(JSON.stringify(stale)).toContain('conflict')
    } finally {
      await client.close()
    }
  })
  it('rejects weak keys, reused role keys and public binding without an HTTPS deployment URL', async () => {
    const options = { directory: '/tmp/not-created-cloud-test', ownerToken: OWNER, port: 0 }
    await expect(startDocumentServer({ ...options, ownerToken: 'short' })).rejects.toThrow('tokens')
    await expect(startDocumentServer({ ...options, agentToken: OWNER })).rejects.toThrow('Distinct')
    await expect(startDocumentServer({ ...options, host: '0.0.0.0' })).rejects.toThrow('HTTPS')
  })
})
