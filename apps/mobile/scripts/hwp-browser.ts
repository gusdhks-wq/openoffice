import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

const names = ['hwp5-file', 'field-kinds', 'section-tails', 'tab-widths', 'tracked-changes']
const prefix = 'virtual:mobile-hwp/'
/** Compile the unchanged desktop preservation helpers against explicit browser primitives. */
export function hwpBrowserPreservation(): Plugin {
  return {
    name: 'mobile-hwp-preservation',
    enforce: 'pre',
    resolveId(id) {
      if (id.startsWith(prefix)) return '\0' + id
    },
    load(id) {
      if (!id.startsWith('\0' + prefix)) return
      const name = id.slice(prefix.length + 1)
      if (!names.includes(name)) throw new Error('Unsupported HWP preservation module')
      let code = readFileSync(
        resolve(import.meta.dirname, '../../hwp/src/main', `${name}.ts`),
        'utf8',
      )
      code = code.replace(/from '\.\/([\w-]+)'/g, (_match, target) => `from '${prefix}${target}'`)
      code = code.replace(
        /from 'node:(crypto|zlib)'/g,
        (_match, target) =>
          'from ' +
          JSON.stringify(
            resolve(import.meta.dirname, '../src/renderer/hwp/browser', target + '.ts').replaceAll(
              '\\',
              '/',
            ),
          ),
      )
      code = code.replace(
        "from 'cfb'",
        'from ' +
          JSON.stringify(
            resolve(import.meta.dirname, '../src/renderer/hwp/browser/cfb.ts').replaceAll(
              '\\',
              '/',
            ),
          ),
      )
      return { code: `import { Buffer } from 'buffer';\n${code}`, map: null }
    },
    async transform(code, id) {
      if (!id.startsWith('\0' + prefix)) return
      const { transform } = await import('esbuild')
      const result = await transform(code, { loader: 'ts', format: 'esm', sourcemap: false })
      return { code: result.code, map: null }
    },
  }
}
