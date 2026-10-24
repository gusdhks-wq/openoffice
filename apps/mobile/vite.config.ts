import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve, relative } from 'node:path'
import react from '@vitejs/plugin-react'
import { hwpBrowserPreservation } from './scripts/hwp-browser'
import { defineConfig, type Plugin } from 'vite'

/** Cache the complete built application so a browser launch can also work offline. */
function offlineShell(): Plugin {
  return {
    name: 'mobile-offline-shell',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      // These are the runtime libraries in this prototype, including the lazy native bridges.
      const runtime = [
        'react',
        'react-dom',
        'scheduler',
        '@capacitor/core',
        '@capacitor/filesystem',
        '@capacitor/share',
        'tslib',
        '@rhwp/core',
        '@rhwp/editor',
        '@noble/hashes',
        'buffer',
        'base64-js',
        'ieee754',
        'pako',
        'cfb',
        'crc-32',
        'adler-32',
        'canvaskit-wasm',
      ]
      const notices = runtime
        .map((name) => {
          const require = createRequire(resolve(import.meta.dirname, 'package.json'))
          const directory = resolve(
            require.resolve(
              name === '@noble/hashes' ? name + '/legacy.js' : name + '/package.json',
            ),
            '..',
          )
          const metadata = JSON.parse(readFileSync(resolve(directory, 'package.json'), 'utf8')) as {
            version: string
          }
          let license = ''
          for (const filename of ['LICENSE', 'LICENSE.txt', 'LICENSE.md', 'CopyrightNotice.txt']) {
            try {
              license = readFileSync(resolve(directory, filename), 'utf8')
              break
            } catch {
              /* Try the next published license filename. */
            }
          }
          if (!license && name === '@rhwp/editor')
            license = readFileSync(
              resolve(import.meta.dirname, '../hwp/public/studio/LICENSE-rhwp.txt'),
              'utf8',
            )
          if (!license) throw new Error(`Missing runtime license: ${name}`)
          return `${name}@${metadata.version}\n${license}`
        })
        .join('\n\n')
      for (const filename of ['LICENSE', 'NOTICE']) {
        this.emitFile({
          type: 'asset',
          fileName: `${filename}.txt`,
          source: readFileSync(resolve(import.meta.dirname, '../..', filename), 'utf8'),
        })
      }
      this.emitFile({
        type: 'asset',
        fileName: 'THIRD-PARTY-NOTICES.txt',
        source:
          notices +
          '\n\n' +
          readFileSync(
            resolve(import.meta.dirname, '../../vendor/rhwp-core/THIRD_PARTY_LICENSES.md'),
            'utf8',
          ),
      })
      const studio = resolve(import.meta.dirname, '../hwp/public/studio')
      const emitStudio = (directory: string) => {
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
          const path = resolve(directory, entry.name)
          if (entry.isDirectory()) emitStudio(path)
          else if (!entry.name.startsWith('.') && !entry.name.endsWith('.d.ts')) {
            this.emitFile({
              type: 'asset',
              fileName: 'studio/' + relative(studio, path).replaceAll('\\', '/'),
              source: readFileSync(path),
            })
          }
        }
      }
      emitStudio(studio)
      const files = Object.keys(bundle)
      const fingerprint = Object.values(bundle).map((item) =>
        item.type === 'chunk' ? item.code : String(item.source),
      )
      const version = createHash('sha256')
        .update(JSON.stringify(fingerprint))
        .digest('hex')
        .slice(0, 16)
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `const CACHE = 'genoffice-mobile-${version}';
const FILES = ${JSON.stringify(files.map((file) => './' + file))};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('genoffice-mobile-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(event.request, { ignoreVary: true });
    if (hit) return hit;
    if (event.request.mode === 'navigate') return (await cache.match('./index.html')) || fetch(event.request);
    return fetch(event.request);
  }));
});`,
      })
    },
  }
}

export default defineConfig({
  root: 'src/renderer',
  build: { outDir: '../../dist', emptyOutDir: true },
  plugins: [hwpBrowserPreservation(), react(), offlineShell()],
  base: './',
  server: { port: 5181, strictPort: true },
})
