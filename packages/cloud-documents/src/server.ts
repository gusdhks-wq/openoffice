import { timingSafeEqual } from 'node:crypto'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { z } from 'zod'
import { CloudDocumentStore } from './store'
import { createDocumentMcp } from './mcp'
import { DocumentFailure, MAX_DOCUMENT_BYTES, type Principal } from './contracts'

export interface ServerOptions {
  directory: string
  ownerToken: string
  agentToken?: string
  port?: number
  host?: string
  publicURL?: string
  allowedOrigins?: string[]
}
const MAX_REQUEST_BYTES = 12 * 1024 * 1024
const id = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/)
const createSchema = z
  .object({
    operationId: id,
    name: z.string().max(160),
    content: z.string().max(MAX_DOCUMENT_BYTES),
  })
  .strict()
const updateSchema = z
  .object({
    operationId: id,
    baseRevision: id,
    content: z.string().max(MAX_DOCUMENT_BYTES),
    name: z.string().max(160).optional(),
  })
  .strict()
const restoreSchema = z.object({ operationId: id, baseRevision: id, revision: id }).strict()
const shareSchema = z.object({ operationId: id, baseRevision: id, enabled: z.boolean() }).strict()

async function readJson(req: IncomingMessage): Promise<unknown> {
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] ?? ''))
    throw new DocumentFailure('invalid')
  if (Number(req.headers['content-length']) > MAX_REQUEST_BYTES) throw new DocumentFailure('limit')
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_REQUEST_BYTES) throw new DocumentFailure('limit')
    chunks.push(Buffer.from(chunk))
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new DocumentFailure('invalid')
  }
}
function matches(given: string, expected?: string): boolean {
  if (!expected) return false
  const a = Buffer.from(given),
    b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) throw new DocumentFailure('invalid')
  return result.data
}

export async function startDocumentServer(options: ServerOptions) {
  if (
    options.ownerToken.length < 32 ||
    (options.agentToken &&
      (options.agentToken.length < 32 || options.agentToken === options.ownerToken))
  )
    throw new Error('Distinct connection tokens of at least 32 characters are required.')
  const host = options.host || '127.0.0.1'
  const loopback = new Set(['127.0.0.1', 'localhost', '::1', '[::1]'])
  const publicURL = options.publicURL ? new URL(options.publicURL) : undefined
  if (
    publicURL &&
    (publicURL.protocol !== 'https:' ||
      publicURL.username ||
      publicURL.password ||
      publicURL.pathname !== '/' ||
      publicURL.search ||
      publicURL.hash)
  )
    throw new Error('Public URL must be an HTTPS origin.')
  if (!loopback.has(host) && !publicURL)
    throw new Error('A public HTTPS URL is required for non-loopback binding.')
  const origins = new Set(options.allowedOrigins ?? [])
  if (publicURL) origins.add(publicURL.origin)
  for (const origin of origins) {
    const url = new URL(origin)
    if (
      url.origin !== origin ||
      (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback.has(url.hostname)))
    )
      throw new Error('Allowed origins must be HTTPS or local development origins.')
  }
  const store = await CloudDocumentStore.open(options.directory)
  function json(res: ServerResponse, status: number, body: unknown) {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    })
    res.end(JSON.stringify(body))
  }
  function actor(req: IncomingMessage): Principal {
    const value = /^Bearer (.+)$/i.exec(req.headers.authorization ?? '')?.[1] ?? ''
    if (matches(value, options.ownerToken)) return 'owner'
    if (matches(value, options.agentToken)) return 'agent'
    throw new DocumentFailure('unauthorized')
  }
  const server = createServer((req, res) => {
    void (async () => {
      const reqHost = new URL(`http://${req.headers.host ?? 'invalid'}`).hostname
      if (!loopback.has(reqHost) && reqHost !== publicURL?.hostname) {
        json(res, 403, { error: 'host-not-allowed' })
        return
      }
      const origin = req.headers.origin
      if (origin) {
        if (!origins.has(origin)) {
          json(res, 403, { error: 'origin-not-allowed' })
          return
        }
        res.setHeader('Access-Control-Allow-Origin', origin)
        res.setHeader('Vary', 'Origin')
      }
      if (req.method === 'OPTIONS') {
        if (!origin || !origins.has(origin)) {
          json(res, 403, { error: 'origin-not-allowed' })
          return
        }
        res.writeHead(204, {
          'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
          'Access-Control-Allow-Headers':
            'authorization, content-type, mcp-protocol-version, mcp-session-id, x-genoffice-workspace',
          'Access-Control-Max-Age': '600',
        })
        res.end()
        return
      }
      const url = new URL(req.url ?? '/', 'http://localhost')
      if (url.pathname === '/health' && req.method === 'GET') {
        json(res, 200, { status: 'ok', protocol: 1 })
        return
      }
      const principal = actor(req)
      if (url.pathname === '/v1/connection' && req.method === 'GET') {
        json(res, 200, { role: principal, workspaceId: store.workspaceId })
        return
      }
      if (url.pathname === '/mcp') {
        if (principal !== 'agent') throw new DocumentFailure('unauthorized')
        if (req.method !== 'POST') {
          json(res, 405, { error: 'method-not-allowed' })
          return
        }
        const body = await readJson(req)
        const mcp = createDocumentMcp(store)
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
          enableJsonResponse: true,
        })
        res.once('close', () => {
          void transport.close().catch(() => {})
          void mcp.close().catch(() => {})
        })
        await mcp.connect(transport)
        await transport.handleRequest(req, res, body)
        return
      }
      if (
        ['POST', 'PUT'].includes(req.method ?? '') &&
        req.headers['x-genoffice-workspace'] !== store.workspaceId
      )
        throw new DocumentFailure('conflict')
      if (url.pathname === '/v1/documents') {
        if (req.method === 'GET') {
          json(res, 200, { documents: store.list(principal, url.searchParams.get('query') ?? '') })
          return
        }
        if (req.method === 'POST') {
          json(res, 201, {
            document: await store.create(principal, parse(createSchema, await readJson(req))),
          })
          return
        }
      }
      const match = /^\/v1\/documents\/([A-Za-z0-9_-]{1,128})(?:\/(versions|restore|share))?$/.exec(
        url.pathname,
      )
      if (!match) {
        json(res, 404, { error: 'not-found' })
        return
      }
      const [, documentId, action] = match
      if (!action && req.method === 'GET') {
        json(res, 200, {
          document: store.read(
            principal,
            documentId,
            url.searchParams.get('revision') ?? undefined,
          ),
        })
        return
      }
      if (!action && req.method === 'PUT') {
        json(res, 200, {
          document: await store.update(
            principal,
            documentId,
            parse(updateSchema, await readJson(req)),
          ),
        })
        return
      }
      if (action === 'versions' && req.method === 'GET') {
        json(res, 200, { versions: store.versions(principal, documentId) })
        return
      }
      if (action === 'restore' && req.method === 'POST') {
        json(res, 200, {
          document: await store.restore(
            principal,
            documentId,
            parse(restoreSchema, await readJson(req)),
          ),
        })
        return
      }
      if (action === 'share' && req.method === 'POST') {
        json(res, 200, {
          document: await store.share(
            principal,
            documentId,
            parse(shareSchema, await readJson(req)),
          ),
        })
        return
      }
      json(res, 405, { error: 'method-not-allowed' })
    })().catch((error) => {
      if (res.headersSent) {
        res.end()
        return
      }
      const failure = error instanceof DocumentFailure ? error : new DocumentFailure('storage')
      const status = {
        invalid: 400,
        unauthorized: 401,
        'not-found': 404,
        conflict: 409,
        'idempotency-conflict': 409,
        limit: 413,
        storage: 500,
        network: 502,
      }[failure.code]
      if (status === 401) res.setHeader('WWW-Authenticate', 'Bearer')
      json(res, status, { error: failure.code, currentRevision: failure.currentRevision })
    })
  })
  server.requestTimeout = 30_000
  server.headersTimeout = 10_000
  try {
    await new Promise<void>((done, fail) => {
      server.once('error', fail)
      server.listen(options.port ?? 5182, host, () => {
        server.off('error', fail)
        done()
      })
    })
  } catch (error) {
    await store.close()
    throw error
  }
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : options.port!
  return {
    url: `http://${host.includes(':') ? `[${host}]` : host}:${port}`,
    store,
    async close() {
      const stopped = new Promise<void>((done) => server.close(() => done()))
      server.closeAllConnections()
      await stopped
      await store.close()
    },
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const service = await startDocumentServer({
    directory: resolve(process.env.GENOFFICE_CLOUD_DATA_DIR || './.ieumoffice-cloud-data'),
    ownerToken: process.env.GENOFFICE_CLOUD_OWNER_TOKEN || '',
    agentToken: process.env.GENOFFICE_CLOUD_AGENT_TOKEN,
    host: process.env.GENOFFICE_CLOUD_HOST,
    port: Number(process.env.GENOFFICE_CLOUD_PORT || 5182),
    publicURL: process.env.GENOFFICE_CLOUD_PUBLIC_URL,
    allowedOrigins: process.env.GENOFFICE_CLOUD_ALLOWED_ORIGINS?.split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  })
  console.log(`Document server listening at ${service.url}`)
  const stop = () => {
    void service.close().then(() => process.exit(0))
  }
  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)
}
