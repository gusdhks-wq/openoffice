import { copyFile } from 'node:fs/promises'
import { build } from 'esbuild'
await build({
  entryPoints: ['src/server.ts', 'src/client.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outdir: 'dist',
  outExtension: { '.js': '.mjs' },
  external: ['@modelcontextprotocol/sdk/*', 'zod'],
})

await Promise.all(['LICENSE', 'NOTICE'].map((name) => copyFile(`../../${name}`, `dist/${name}`)))
