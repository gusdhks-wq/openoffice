import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { access, realpath, stat } from 'node:fs/promises'
import { resolve, dirname, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn, spawnSync } from 'node:child_process'
import { loadEnvFile } from 'node:process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
process.chdir(root)
const settings = resolve(root, '.env.cloud.local')
const assets = resolve(root, 'apps/mobile/dist')
const webPort = Number(process.env.GENOFFICE_LOCAL_WEB_PORT || 5181)
const apiPort = Number(process.env.GENOFFICE_LOCAL_API_PORT || 5182)
if (
  ![webPort, apiPort].every((port) => Number.isInteger(port) && port >= 1024 && port <= 65535) ||
  webPort === apiPort
) {
  console.error('Choose two distinct local ports between 1024 and 65535.')
  process.exit(1)
}
try {
  await Promise.all([
    access(resolve(root, 'packages/cloud-documents/dist/server.mjs')),
    access(resolve(assets, 'index.html')),
  ])
} catch {
  console.error('Build first: npm run build:cloud && npm run build:mobile')
  process.exit(1)
}
try {
  await access(settings)
} catch (error) {
  if (error.code !== 'ENOENT') throw error
  const result = spawnSync(process.execPath, ['packages/cloud-documents/scripts/setup.mjs'], {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  })
  if (result.status !== 0) process.exit(1)
}
loadEnvFile(settings)
const { startDocumentServer } = await import('../dist/server.mjs')
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
}
const web = createServer((request, response) => {
  void (async () => {
    if (
      ![`localhost:${webPort}`, `127.0.0.1:${webPort}`].includes(request.headers.host) ||
      !['GET', 'HEAD'].includes(request.method)
    ) {
      response.writeHead(403).end()
      return
    }
    const url = new URL(request.url, `http://127.0.0.1:${webPort}`)
    const relative =
      decodeURIComponent(url.pathname) === '/'
        ? 'index.html'
        : decodeURIComponent(url.pathname).slice(1)
    const filename = await realpath(resolve(assets, relative))
    if (!filename.startsWith(assets + sep) || !(await stat(filename)).isFile()) {
      response.writeHead(404).end()
      return
    }
    response.writeHead(200, {
      'Content-Type': types[extname(filename)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    })
    if (request.method === 'HEAD') response.end()
    else
      createReadStream(filename)
        .on('error', () => response.destroy())
        .pipe(response)
  })().catch(() => {
    if (!response.headersSent) response.writeHead(404)
    response.end()
  })
})
let service
try {
  service = await startDocumentServer({
    directory: resolve(process.env.GENOFFICE_CLOUD_DATA_DIR || './.ieumoffice-cloud-data'),
    ownerToken: process.env.GENOFFICE_CLOUD_OWNER_TOKEN || '',
    agentToken: process.env.GENOFFICE_CLOUD_AGENT_TOKEN,
    host: '127.0.0.1',
    port: apiPort,
    allowedOrigins: [`http://127.0.0.1:${webPort}`, `http://localhost:${webPort}`],
  })
  await new Promise((done, fail) => {
    web.once('error', fail)
    web.listen(webPort, '127.0.0.1', done)
  })
} catch {
  if (service) await service.close()
  console.error(
    'Local startup failed. Check the selected local ports, private settings and the document-store lock. Existing data was not reset.',
  )
  process.exit(1)
}
console.log(`Mobile editor: http://127.0.0.1:${webPort}`)
console.log(`Document server: http://127.0.0.1:${apiPort} | MCP: http://127.0.0.1:${apiPort}/mcp`)
console.log(
  'Enter the owner key from .env.cloud.local in the editor. Use only the separate agent key for external tools.',
)
console.log(
  'Loopback only. Keep this process running; Ctrl+C stops both services. Never share the settings file.',
)
if (process.argv.includes('--open') && process.platform === 'win32') {
  const browser = spawn(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', `Start-Process 'http://127.0.0.1:${webPort}'`],
    { shell: false, windowsHide: true, stdio: 'ignore' },
  )
  browser.on('error', () => console.log('Open the mobile editor address above in your browser.'))
  browser.unref()
}
let stopping = false
const stop = async () => {
  if (stopping) return
  stopping = true
  const closed = new Promise((done) => web.close(done))
  web.closeAllConnections()
  await Promise.all([closed, service.close()])
}
process.once('SIGINT', () => {
  void stop()
})
process.once('SIGTERM', () => {
  void stop()
})
