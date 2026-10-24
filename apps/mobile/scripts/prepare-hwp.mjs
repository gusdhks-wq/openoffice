import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
execFileSync(process.execPath, ['apps/hwp/scripts/build-studio.mjs'], {
  cwd: root,
  stdio: 'inherit',
})
