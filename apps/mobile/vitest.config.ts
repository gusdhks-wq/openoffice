import { defineConfig } from 'vitest/config'
import { hwpBrowserPreservation } from './scripts/hwp-browser'

export default defineConfig({
  plugins: [
    {
      name: 'desktop-preservation-tests-in-browser-adapter',
      enforce: 'pre',
      resolveId(id, importer) {
        if (!importer?.replaceAll('\\', '/').includes('/hwp/tests/')) return
        const match =
          /^\.\.\/src\/main\/(hwp5-file|section-tails|field-kinds|tab-widths|tracked-changes)$/.exec(
            id,
          )
        if (match) return '\0virtual:mobile-hwp/' + match[1]
      },
    },
    hwpBrowserPreservation(),
  ],
  test: {
    environment: 'node',
    include: [
      'tests/**/*.test.ts',
      '../hwp/tests/section-tails.test.ts',
      '../hwp/tests/field-kinds.test.ts',
      '../hwp/tests/tab-widths.test.ts',
      '../hwp/tests/tracked-changes.test.ts',
    ],
  },
})
