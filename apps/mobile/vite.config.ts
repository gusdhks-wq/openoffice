import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
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
      ]
      const notices = runtime
        .map((name) => {
          const directory = resolve(import.meta.dirname, '../../node_modules', name)
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
      this.emitFile({ type: 'asset', fileName: 'THIRD-PARTY-NOTICES.txt', source: notices })
      this.emitFile({
        type: 'asset',
        fileName: 'THIRD-PARTY-LICENSES-rhwp.md',
        source: readFileSync(
          resolve(import.meta.dirname, '../../vendor/rhwp-core/THIRD_PARTY_LICENSES.md'),
          'utf8',
        ),
      })
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
  plugins: [react(), offlineShell()],
  base: './',
  server: { port: 5181, strictPort: true },
})
