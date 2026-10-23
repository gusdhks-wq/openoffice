import { createServer, request as httpRequest } from 'node:http'
import { spawn } from 'node:child_process'
import { access, mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvFile } from 'node:process'
import { timingSafeEqual } from 'node:crypto'
import { createRemoteOAuth } from './remote-oauth.mjs'
import { createMobilePairing } from './mobile-pairing.mjs'
import { createInterface } from 'node:readline'

export function makeMobileGateway({
  webPort = 5181,
  apiPort = 5182,
  getPublicOrigin,
  getOAuth = () => undefined,
  agentToken,
  ownerToken,
  pairing,
}) {
  const server = createServer((incoming, outgoing) => {
    const origin = incoming.headers.origin
    const allowed = ['https://localhost', 'capacitor://localhost', getPublicOrigin()].filter(
      Boolean,
    )
    if (origin && !allowed.includes(origin)) {
      outgoing.writeHead(403).end()
      return
    }
    if (origin) {
      outgoing.setHeader('Access-Control-Allow-Origin', origin)
      outgoing.setHeader('Vary', 'Origin')
    }
    let url
    try {
      url = new URL(incoming.url || '/', 'http://localhost')
    } catch {
      outgoing.writeHead(400).end()
      return
    }
    if (
      ['/authorize', '/approve', '/token', '/register', '/revoke'].includes(url.pathname) ||
      url.pathname.startsWith('/.well-known/')
    ) {
      const oauth = getOAuth()
      if (!oauth) {
        outgoing.writeHead(503).end()
        return
      }
      oauth.handler(incoming, outgoing)
      return
    }
    const pair = ['/pair', '/pair/disconnect'].includes(url.pathname)
    const api = pair || /^\/(?:v1(?:\/|$)|mcp(?:\/|$)|health$)/.test(url.pathname)
    const asset =
      url.pathname === '/' ||
      /^\/(?:index\.html|sw\.js|LICENSE\.txt|NOTICE\.txt|THIRD-PARTY-NOTICES\.txt|assets\/[A-Za-z0-9_.-]+)$/.test(
        url.pathname,
      )
    if (!api && !asset) {
      outgoing.writeHead(404).end()
      return
    }
    if (incoming.method === 'OPTIONS') {
      if (!origin || !api) {
        outgoing.writeHead(403).end()
        return
      }
      outgoing
        .writeHead(204, {
          'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
          'Access-Control-Allow-Headers':
            'authorization, content-type, x-genoffice-workspace, mcp-protocol-version, mcp-session-id',
          'Access-Control-Max-Age': '600',
        })
        .end()
      return
    }
    if (
      !['GET', 'HEAD', 'POST', 'PUT'].includes(incoming.method) ||
      (!api && !['GET', 'HEAD'].includes(incoming.method))
    ) {
      outgoing.writeHead(405).end()
      return
    }
    void (async () => {
      let body
      let authorization = incoming.headers.authorization
      if (pair) {
        outgoing.setHeader('Cache-Control', 'no-store')
        outgoing.setHeader('Content-Type', 'application/json')
        if (
          !origin ||
          incoming.method !== 'POST' ||
          !pairing ||
          !ownerToken ||
          !String(incoming.headers['content-type']).startsWith('application/json')
        ) {
          outgoing.writeHead(403).end(JSON.stringify({ error: 'unauthorized' }))
          return
        }
        const chunks = []
        let size = 0
        for await (const chunk of incoming) {
          size += chunk.length
          if (size > 1024) {
            outgoing.writeHead(413).end(JSON.stringify({ error: 'limit' }))
            return
          }
          chunks.push(chunk)
        }
        if (url.pathname === '/pair/disconnect') {
          pairing.revoke(/^Bearer (.+)$/i.exec(authorization || '')?.[1])
          outgoing.writeHead(204).end()
          return
        }
        let request
        try {
          request = JSON.parse(Buffer.concat(chunks).toString('utf8'))
        } catch {
          outgoing.writeHead(400).end(JSON.stringify({ error: 'invalid' }))
          return
        }
        const token = pairing.redeem(request?.code)
        if (!token) {
          outgoing.writeHead(401).end(JSON.stringify({ error: 'unauthorized' }))
          return
        }
        outgoing.end(JSON.stringify({ token }))
        return
      }
      // A phone session is owner access to REST only; it is never an MCP/agent credential.
      if (
        url.pathname.startsWith('/v1/') &&
        ownerToken &&
        pairing?.verify(/^Bearer (.+)$/i.exec(authorization || '')?.[1])
      ) {
        authorization = `Bearer ${ownerToken}`
      }
      if (url.pathname === '/mcp') {
        const oauth = getOAuth()
        if (!oauth || !agentToken) {
          outgoing.writeHead(503).end()
          return
        }
        const value = /^Bearer (.+)$/i.exec(authorization || '')?.[1]
        let authenticated = false
        if (value) {
          const a = Buffer.from(value),
            b = Buffer.from(agentToken)
          authenticated = a.length === b.length && timingSafeEqual(a, b)
          if (!authenticated) {
            try {
              await oauth.verify(value)
              authenticated = true
            } catch {}
          }
        }
        const chunks = []
        let size = 0
        for await (const chunk of incoming) {
          size += chunk.length
          if (size > (authenticated ? 12 * 1024 * 1024 : 32 * 1024)) {
            outgoing.writeHead(413).end()
            return
          }
          chunks.push(chunk)
        }
        body = Buffer.concat(chunks)
        let payload
        try {
          payload = JSON.parse(body.toString('utf8'))
        } catch {
          outgoing.writeHead(400).end()
          return
        }

        if (
          (!authenticated && value) ||
          (!authenticated &&
            !['initialize', 'notifications/initialized', 'tools/list', 'ping'].includes(
              payload.method,
            ))
        ) {
          outgoing.setHeader(
            'WWW-Authenticate',
            `Bearer resource_metadata="${getPublicOrigin()}/.well-known/oauth-protected-resource/mcp", scope="documents:shared"`,
          )
          outgoing.writeHead(401).end()
          return
        }
        authorization = `Bearer ${agentToken}`
      }
      const port = api ? apiPort : webPort
      // This fixed upstream is never chosen from a URL, Host or forwarded header.
      const headers = { host: `127.0.0.1:${port}` }
      for (const key of [
        'accept',
        'authorization',
        'content-type',
        'content-length',
        'x-genoffice-workspace',
        'mcp-protocol-version',
        'mcp-session-id',
      ]) {
        if (incoming.headers[key]) headers[key] = incoming.headers[key]
      }
      if (authorization) headers.authorization = authorization
      const proxy = httpRequest(
        {
          hostname: '127.0.0.1',
          port,
          path: url.pathname + url.search,
          method: incoming.method,
          headers,
        },
        (response) => {
          for (const key of [
            'content-type',
            'cache-control',
            'x-content-type-options',
            'www-authenticate',
            'mcp-session-id',
          ])
            if (response.headers[key]) outgoing.setHeader(key, response.headers[key])
          if (
            url.pathname === '/mcp' &&
            String(response.headers['content-type']).includes('application/json')
          ) {
            const chunks = []
            let size = 0
            response.on('data', (chunk) => {
              size += chunk.length
              if (size > 16 * 1024 * 1024) {
                response.destroy()
                outgoing.destroy()
                return
              }
              chunks.push(chunk)
            })
            response.on('end', () => {
              const data = Buffer.concat(chunks)
              try {
                const message = JSON.parse(data.toString('utf8'))
                if (Array.isArray(message.result?.tools)) {
                  const securitySchemes = [{ type: 'oauth2', scopes: ['documents:shared'] }]
                  message.result.tools = message.result.tools.map((tool) => ({
                    ...tool,
                    securitySchemes,
                    _meta: { ...tool._meta, securitySchemes },
                  }))
                  outgoing.writeHead(response.statusCode || 502)
                  outgoing.end(JSON.stringify(message))
                  return
                }
              } catch {}
              outgoing.writeHead(response.statusCode || 502)
              outgoing.end(data)
            })
            response.on('error', () => outgoing.destroy())
            return
          }
          outgoing.writeHead(response.statusCode || 502)
          response.on('error', () => outgoing.destroy())
          response.pipe(outgoing)
        },
      )
      proxy.setTimeout(30000, () => proxy.destroy())
      proxy.on('error', () => {
        if (!outgoing.headersSent) outgoing.writeHead(502)
        outgoing.end()
      })
      incoming.on('aborted', () => proxy.destroy())
      outgoing.on('close', () => {
        if (!outgoing.writableFinished) proxy.destroy()
      })
      if (body) proxy.end(body)
      else incoming.pipe(proxy)
    })().catch(() => {
      if (!outgoing.headersSent) outgoing.writeHead(502)
      outgoing.end()
    })
  })
  server.requestTimeout = 30000
  server.headersTimeout = 10000
  server.maxHeadersCount = 64
  return server
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
  const binary = join(
    root,
    'runtime',
    process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared',
  )
  const webPort = Number(process.env.GENOFFICE_LOCAL_WEB_PORT || 5181)
  const apiPort = Number(process.env.GENOFFICE_LOCAL_API_PORT || 5182)
  if (![webPort, apiPort].every((port) => Number.isInteger(port) && port >= 1024 && port <= 65535))
    throw new Error('Invalid local ports.')
  try {
    await access(binary)
    const response = await fetch(`http://127.0.0.1:${apiPort}/health`, {
      signal: AbortSignal.timeout(5000),
    })
    const health = await response.json()
    if (!response.ok || health.status !== 'ok' || health.protocol !== 1)
      throw new Error('not-ready')
  } catch {
    console.error(
      'Start.cmd must be running first. Check the local server and bundled cloudflared runtime.',
    )
    process.exit(1)
  }
  const temporary = await mkdtemp(join(tmpdir(), 'ieum-mobile-link-'))
  const config = join(temporary, 'config.yml')
  await writeFile(config, '{}\n', { mode: 0o600 })
  loadEnvFile(join(root, '.env.cloud.local'))
  const agentToken = process.env.GENOFFICE_CLOUD_AGENT_TOKEN
  const ownerToken = process.env.GENOFFICE_CLOUD_OWNER_TOKEN
  if (!agentToken || agentToken.length < 32 || !ownerToken || ownerToken.length < 32)
    throw new Error('Document connections are not configured.')
  let publicOrigin, oauth
  const pairing = createMobilePairing()
  const gateway = makeMobileGateway({
    webPort,
    apiPort,
    getPublicOrigin: () => publicOrigin,
    getOAuth: () => oauth,
    agentToken,
    ownerToken,
    pairing,
  })
  await new Promise((done, fail) => {
    gateway.once('error', fail)
    gateway.listen(0, '127.0.0.1', done)
  })
  const gatewayPort = gateway.address().port
  const child = spawn(
    binary,
    [
      'tunnel',
      '--config',
      config,
      '--no-autoupdate',
      '--protocol',
      'http2',
      '--url',
      `http://127.0.0.1:${gatewayPort}`,
      '--http-host-header',
      `127.0.0.1:${gatewayPort}`,
      '--output',
      'json',
    ],
    { shell: false, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
  )
  let announced = false,
    stopping = false,
    buffer = ''
  function log(data) {
    // Do not echo the external process's logs or retain document/key material.
    buffer = (buffer + String(data)).slice(-12000)
    const match = buffer.match(/https:\/\/[a-z0-9]+(?:-[a-z0-9]+)*\.trycloudflare\.com/)
    if (!match || announced) return
    publicOrigin = match[0]
    oauth = createRemoteOAuth({
      origin: publicOrigin,
      onApprovalCode: (code) => console.log(`PC approval code (3 minutes): ${code}`),
    })
    announced = true
    console.log(`Mobile server address: ${publicOrigin}`)
    console.log(`Phone pairing code (3 minutes, one use): ${pairing.issue()}`)
    console.log(
      'Type P then Enter here for a new phone code; existing phone and ChatGPT sessions stay connected.',
    )
    console.log(
      'Open this address on your phone and enter the PHONE pairing code. Updated Android apps also support pairing. Older apps can still use their OWNER key.',
    )
    console.log(
      'Or open this HTTPS address in the phone browser. Keep this window and Start.cmd running. The address changes after restart.',
    )
    console.log(
      'ChatGPT plugin URL: ' +
        publicOrigin +
        '/mcp | Authentication: OAuth | Client registration: Dynamic (DCR).',
    )
    console.log(
      'When linking, enter the temporary approval code shown in THIS window on the document approval page. Never enter an owner key or a ChatGPT password there.',
    )
    console.log(
      'Cloudflare carries this connection. Never paste either connection key or private settings into a chat.',
    )
  }
  child.stdout.on('data', log)
  child.stderr.on('data', log)
  const terminal = process.stdin.isTTY ? createInterface({ input: process.stdin }) : undefined
  terminal?.on('line', (line) => {
    if (announced && line.trim().toLowerCase() === 'p')
      console.log(`Phone pairing code (3 minutes, one use): ${pairing.issue()}`)
  })
  const timeout = setTimeout(() => {
    if (!announced) {
      console.error(
        'HTTPS connection did not start. Check network access; the local editor is unchanged.',
      )
      void stop()
    }
  }, 60000)
  async function stop() {
    if (stopping) return
    stopping = true
    terminal?.close()
    clearTimeout(timeout)
    child.kill('SIGTERM')
    const closed = new Promise((done) => gateway.close(done))
    gateway.closeAllConnections()
    await closed
    await rm(temporary, { recursive: true, force: true })
    if (process.connected) process.disconnect()
  }
  if (process.connected)
    process.once('message', (message) => {
      if (message === 'stop-mobile-link') void stop()
    })
  child.once('error', () => {
    console.error('Could not start the bundled HTTPS connector.')
    void stop()
  })
  child.once('exit', () => {
    if (!stopping)
      console.log('Mobile HTTPS connection closed. Start.cmd and local documents are unchanged.')
    void stop()
  })
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'])
    process.once(signal, () => {
      void stop()
    })
  if (process.platform === 'win32')
    process.once('SIGBREAK', () => {
      void stop()
    })
}
