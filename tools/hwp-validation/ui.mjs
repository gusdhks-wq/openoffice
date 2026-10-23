#!/usr/bin/env node
// Run against a built Electron checkout; only a private copy may be overwritten.
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  realpathSync,
  existsSync,
  copyFileSync,
} from 'node:fs'
import { resolve, dirname, relative, isAbsolute, extname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const args = process.argv.slice(2)
const arg = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined)
if (args.includes('--help') || !arg('--manifest') || !arg('--out')) {
  console.log(
    'node tools/hwp-validation/ui.mjs --manifest /private/cases.json --case notice --out /private/ui [--runtime-root /built/checkout]',
  )
  process.exit(args.includes('--help') ? 0 : 2)
}
const runtime = realpathSync(resolve(arg('--runtime-root') ?? root))
const outside = (path, base) => {
  const r = relative(base, path)
  return r === '..' || r.startsWith('../') || isAbsolute(r)
}
const manifest = realpathSync(resolve(arg('--manifest')))
const outArg = resolve(arg('--out'))
mkdirSync(outArg, { recursive: true })
const out = realpathSync(outArg)
for (const p of [manifest, out])
  for (const base of [root, runtime])
    if (!outside(p, base)) throw Error('Private inputs/outputs must be outside both checkouts')
const item = JSON.parse(readFileSync(manifest)).cases.find((c) => c.id === arg('--case'))
if (
  !item ||
  !/^[a-zA-Z0-9_-]+$/.test(item.id) ||
  typeof item.find !== 'string' ||
  !item.find ||
  typeof item.replace !== 'string'
)
  throw Error('Invalid case')
const engineMeta = JSON.parse(readFileSync(join(runtime, 'vendor/rhwp-core/package.json')))
const engineHash = createHash('sha256')
  .update(readFileSync(join(runtime, 'vendor/rhwp-core/rhwp_bg.wasm')))
  .digest('hex')
if (engineMeta.version !== '0.8.7-ieum.4' || engineHash !== engineMeta.rhwp.wasmSha256)
  throw Error('Unexpected engine version/hash')
const source = realpathSync(resolve(dirname(manifest), item.path))
for (const base of [root, runtime])
  if (!outside(source, base)) throw Error('Input must be outside checkouts')
const format = extname(source).toLowerCase()
if (!['.hwp', '.hwpx'].includes(format)) throw Error('Unsupported format')
const copy = join(out, `editable-copy${format}`)
if (existsSync(copy))
  throw Error('Use a fresh output directory; refusing to replace a previous run')
copyFileSync(source, copy)
const profile = join(out, 'profile')
mkdirSync(profile)
writeFileSync(join(profile, 'app-settings.json'), JSON.stringify({ onboardingSeen: true }))
writeFileSync(
  join(profile, 'ai-settings.json'),
  JSON.stringify({ providers: {}, subscriptionNoticeSeen: true }),
)
const require = createRequire(join(runtime, 'package.json'))
const { _electron: electron } = require('playwright-core')
const executablePath = require('electron')
const app = await electron.launch({
  executablePath,
  args: ['--no-sandbox', '--disable-gpu', join(runtime, 'apps/shell'), copy],
  env: {
    ...process.env,
    DISPLAY: process.env.DISPLAY ?? ':99',
    GENOFFICE_USER_DATA: profile,
    GENOFFICE_AUTH_DIR: join(profile, 'auth-empty'),
    GENOFFICE_NO_SPARE_VIEW: '1',
    GENOFFICE_LANG: 'ko',
    ELECTRON_DISABLE_SANDBOX: '1',
  },
  timeout: 30000,
})
const result = {
  engineVersion: engineMeta.version,
  wasmSha256: engineHash,
  checks: {},
  scope: 'Electron desktop test; Android not covered',
}
try {
  await app.evaluate(({ BrowserWindow }) => {
    for (const w of BrowserWindow.getAllWindows())
      if (w.isVisible()) w.setBounds({ width: 1440, height: 1100 })
  })
  const page = await app
    .waitForEvent('window', { predicate: (p) => p.url().includes('://hwp/'), timeout: 15000 })
    .catch(() => app.windows().find((p) => p.url().includes('://hwp/')))
  if (!page) throw Error('No HWP tab')
  // Test-only access to the existing editor ref. No product debug endpoint is added.
  await page.waitForFunction(
    () => {
      const r = document.getElementById('root')
      if (!r) return false
      const stack = [r[Object.keys(r).find((x) => x.startsWith('__reactContainer'))]],
        seen = new Set()
      while (stack.length) {
        const f = stack.pop()
        if (!f || seen.has(f)) continue
        seen.add(f)
        stack.push(f.child, f.sibling)
        for (let h = f.memoizedState, i = 0; h && i < 100; h = h.next, i++) {
          const v = h.memoizedState?.current
          if (v?.plugins && v?.exportHwp) {
            window.__trialEditor = v
            return true
          }
        }
      }
      return false
    },
    {},
    { timeout: 90000 },
  )
  const before = await page.evaluate(async () => {
    const e = window.__trialEditor
    await e.plugins.load('ieum-agent')
    return e.plugins.invoke('ieum-agent', 'readText', [])
  })
  if (before.split(item.find).length !== 2) throw Error('Target must match once')
  await page.screenshot({ path: join(out, 'before.png') })
  const changed = await page.evaluate(
    async ({ find, replace }) =>
      window.__trialEditor.plugins.invoke('ieum-agent', 'replaceText', [find, replace]),
    item,
  )
  result.checks.editAppliedOnce = changed.ok === true && changed.count === 1
  await app.evaluate(({ webContents }) => {
    for (const w of webContents.getAllWebContents())
      if (w.getURL().includes('://hwp/')) w.send('hwp:save-request', 'save')
  })
  // A backup appears before the write: also require the copy's hash to change.
  const digest = (p) => createHash('sha256').update(readFileSync(p)).digest('hex')
  const originalHash = digest(source)
  for (let i = 0; i < 90 && (!existsSync(copy + '.bak') || digest(copy) === originalHash); i++)
    await page.waitForTimeout(500)
  result.checks.backupMatchesOriginal =
    existsSync(copy + '.bak') && digest(copy + '.bak') === originalHash
  result.checks.savedBytesChanged = digest(copy) !== originalHash
  result.checks.sourceUnchanged = digest(source) === originalHash
  // Reopen the actual app-saved bytes through the pinned engine, not the live editor.
  const { default: init, HwpDocument } = await import(
    pathToFileURL(join(runtime, 'vendor/rhwp-core/rhwp.js'))
  )
  const { agentPlugin } = await import(
    pathToFileURL(join(runtime, 'apps/hwp/studio-plugin/agent-plugin.mjs'))
  )
  await init({ module_or_path: readFileSync(join(runtime, 'vendor/rhwp-core/rhwp_bg.wasm')) })
  const d = new HwpDocument(readFileSync(copy))
  const p = agentPlugin.activate({
    read: (fn) => fn(d),
    transaction: (_, fn) => fn({ doc: () => d, deferPagination: () => {} }),
    events: { on: () => () => {} },
    automation: { execute: () => null },
  })
  result.checks.savedTextEqualsExpected = p.readText() === before.replace(item.find, item.replace)
  await page.screenshot({ path: join(out, 'after.png') })
  const pdf = join(out, 'edited.pdf')
  await app.evaluate(({ dialog }, path) => {
    dialog.showSaveDialog = async () => ({ canceled: false, filePath: path })
  }, pdf)
  await app.evaluate(({ webContents }) => {
    for (const w of webContents.getAllWebContents())
      if (w.getURL().includes('://hwp/')) w.send('hwp:print-request', 'pdf')
  })
  for (let i = 0; i < 120 && !existsSync(pdf); i++) await page.waitForTimeout(500)
  result.checks.pdfSignature =
    existsSync(pdf) && readFileSync(pdf).subarray(0, 5).toString() === '%PDF-'
  result.warnings = [
    'PDF signature is not a render/text check; inspect with an independent PDF reader',
    'Screenshots can include edit highlights; compare PDF separately',
  ]
} catch {
  result.error = 'UI_TEST_FAILED' // Never echo document text or arbitrary engine errors.
} finally {
  await app.close()
  result.status =
    result.error || Object.values(result.checks).some((v) => v !== true) ? 'FAIL' : 'PASS'
  writeFileSync(join(out, 'ui-report.json'), JSON.stringify(result, null, 2) + '\n')
}
console.log(result.status)
process.exitCode = result.status === 'PASS' ? 0 : 1
