#!/usr/bin/env -S npx tsx
/** Execute the pinned mobile save function; Node preservation helpers are not browser-adapter evidence. */
import { readFileSync, writeFileSync, mkdirSync, realpathSync } from 'node:fs'
import { resolve, dirname, join, relative, isAbsolute, extname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { layout, layoutEqual } from './layout.mjs'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const args = process.argv.slice(2)
const arg = (n: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined)
if (args.includes('--help') || !arg('--source') || !arg('--out')) {
  console.log(
    'node --import tsx tools/hwp-validation/verify-native-save.mts --source /private/native-source.json --out /private/native-results [--manifest /private/cases.json] [--runtime-root /checkout]',
  )
  process.exit(args.includes('--help') ? 0 : 2)
}
const runtime = realpathSync(resolve(arg('--runtime-root') ?? root))
mkdirSync(resolve(arg('--out')!), { recursive: true })
const out = realpathSync(resolve(arg('--out')!))
function privatePath(path: string) {
  const p = realpathSync(resolve(path))
  for (const base of [root, runtime]) {
    const r = relative(base, p)
    if (!(r === '..' || r.startsWith('../') || isAbsolute(r)))
      throw Error('Use paths outside checkouts')
  }
  return p
}
privatePath(out)
const source = JSON.parse(readFileSync(privatePath(arg('--source')!), 'utf8'))
const digest = (data: any) => createHash('sha256').update(data).digest('hex')
const expected = {
  engine: 'f8f883bf5bacf4027db54425669dd30a93da867a946a9aaafad377fd39f66efa',
  workspace: 'dc1dde7e5d57103a4ada7dbc9c57d1dfcb304f4de32e09ec6c52ab2bf708aff5',
  native: '0d8a41baf0fdbd9a7d0b428f9bb8a26a18f2e49c989d3b847696dca85cb8738c',
}
for (const [key, hash] of Object.entries(expected)) assert.equal(digest(source[key]), hash)
const require = createRequire(join(runtime, 'package.json'))
const ts = require('typescript')
const url = (path: string) => pathToFileURL(join(runtime, path)).href
const meta = JSON.parse(readFileSync(join(runtime, 'vendor/rhwp-core/package.json'), 'utf8'))
const wasm = readFileSync(join(runtime, 'vendor/rhwp-core/rhwp_bg.wasm'))
assert.equal(meta.version, '0.8.7-ieum.4')
assert.equal(digest(wasm), meta.rhwp.wasmSha256)
const { default: init, HwpDocument } = await import(url('vendor/rhwp-core/rhwp.js'))
const { agentPlugin } = await import(url('apps/hwp/studio-plugin/agent-plugin.mjs'))
await init({ module_or_path: wasm })
function compiled(text: string, imports: Record<string, string>) {
  let js = ts.transpileModule(text, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText
  for (const [from, to] of Object.entries(imports))
    js = js.replaceAll(`'${from}'`, JSON.stringify(to))
  return 'data:text/javascript;base64,' + Buffer.from(js).toString('base64')
}
const engineUrl = compiled(source.engine, {
  '@rhwp/core': url('vendor/rhwp-core/rhwp.js'),
  '../../../../hwp/studio-plugin/agent-plugin.mjs': url('apps/hwp/studio-plugin/agent-plugin.mjs'),
})
const workspaceUrl = compiled(source.workspace, {})
const imports: Record<string, string> = {
  './engine': engineUrl,
  './workspace': workspaceUrl,
  '../../../../hwp/src/renderer/ai/agent-bridge': url('apps/hwp/src/renderer/ai/agent-bridge.ts'),
}
for (const module of ['hwp5-file', 'field-kinds', 'section-tails', 'tab-widths', 'tracked-changes'])
  imports['virtual:mobile-hwp/' + module] = url(`apps/hwp/src/main/${module}.ts`)
const { exportNativeHwp } = await import(compiled(source.native, imports))
const { importHwp } = await import(workspaceUrl)
const pluginFor = (doc: any) =>
  agentPlugin.activate({
    read: (fn: any) => fn(doc),
    transaction: (_: any, fn: any) => fn({ doc: () => doc, deferPagination: () => {} }),
    events: { on: () => {} },
    automation: { execute: () => null },
  })
function allTables(plugin: any) {
  return plugin.listTables().tables.map((t: any) => {
    const cells = []
    let row: any = 1
    const seen = new Set()
    while (row !== undefined) {
      if (seen.has(row)) throw Error('TABLE_LOOP')
      seen.add(row)
      const r = plugin.readTable(t.table, row)
      if (!r.ok) throw Error('TABLE_READ')
      cells.push(...r.cells)
      row = r.nextRow
    }
    return { table: t.table, rows: t.rows, cols: t.cols, cells }
  })
}
function port(doc: any, options: any = {}) {
  const plugin = pluginFor(doc)
  let reads = 0
  return {
    plugins: {
      load: async () => {},
      invoke: async (_: any, method: string, argv: any[]) =>
        method === 'measureTabs' && options.noTabMeasurement
          ? { tabs: [] }
          : plugin[method](...argv),
    },
    commands: {
      context: async () =>
        options.unknownProtection ? {} : { passwordProtected: options.protected ?? false },
    },
    getDocumentState: async () => ({
      pageCount: doc.pageCount(),
      documentEpoch: 1,
      changeSeq: options.changed ? reads++ : 1,
      documentSha256: 'synthetic-stable-fence',
    }),
    exportHwpVerify: async () =>
      options.badVerify
        ? { recovered: false, pageCountBefore: 1, pageCountAfter: 1 }
        : JSON.parse(doc.exportHwpVerify()),
    exportHwp: async () => doc.exportHwp(),
    exportHwpx: async () => doc.exportHwpx(),
  }
}
const cases: any[] = []
for (const format of ['hwp', 'hwpx']) {
  const d = HwpDocument.createEmpty()
  d.createBlankDocument()
  d.insertText(0, 0, 0, 'Unique body target.')
  d.splitParagraph(0, 0, d.getParagraphLength(0, 0))
  d.pasteHtml(0, 1, 0, '<table><tr><td>Keep table cell.</td></tr></table>')
  cases.push({
    id: `synthetic-${format}`,
    bytes: format === 'hwp' ? d.exportHwp() : d.exportHwpx(),
    format,
    find: 'Unique body target.',
    replace: 'A longer native-save validation paragraph.',
  })
  d.free()
}
if (arg('--manifest')) {
  const path = privatePath(arg('--manifest')!)
  for (const c of JSON.parse(readFileSync(path, 'utf8')).cases) {
    const input = privatePath(resolve(dirname(path), c.path))
    cases.push({
      ...c,
      bytes: readFileSync(input),
      format: extname(input).slice(1).toLowerCase(),
      input,
    })
  }
}
const results: any[] = []
for (const c of cases) {
  const checks: any = {}
  let doc: any, reopened: any
  try {
    assert.match(c.id, /^[a-zA-Z0-9_-]+$/)
    const initialHash = digest(c.bytes)
    const workspace = importHwp(`document.${c.format}`, c.bytes)
    doc = new HwpDocument(c.bytes)
    const plugin = pluginFor(doc)
    const before = plugin.readText()
    assert.equal(before.split(c.find).length, 2)
    const edit = plugin.replaceText(c.find, c.replace)
    assert.equal(edit.ok, true)
    const tables = allTables(plugin)
    const expectedLayout = layout(doc)
    const saved = await exportNativeHwp(port(doc), workspace)
    reopened = new HwpDocument(saved)
    const again = pluginFor(reopened)
    checks.text = again.readText() === before.replace(c.find, c.replace)
    checks.fullTableCellsAndSpans = JSON.stringify(allTables(again)) === JSON.stringify(tables)
    checks.resolvedLayout = layoutEqual(expectedLayout, layout(reopened))
    checks.originalUnchanged =
      digest(workspace.original) === initialHash &&
      (!c.input || digest(readFileSync(c.input)) === initialHash)
    if (args.includes('--artifacts')) {
      const dir = join(out, c.id)
      mkdirSync(dir, { recursive: true })
      writeFileSync(join(dir, `edited.${c.format}`), saved)
    }
    results.push({
      id: c.id,
      checks,
      status: Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL',
    })
  } catch {
    results.push({ id: c.id, status: 'FAIL', error: 'NATIVE_SAVE_OR_COMPARISON_FAILED' })
  } finally {
    doc?.free()
    reopened?.free()
  }
}
for (const [name, options, message] of [
  ['unknown-protection', { unknownProtection: true }, 'hwp-protected-source'],
  ['password-protected', { protected: true }, 'hwp-protected-source'],
  ['changed-during-save', { changed: true }, 'hwp-changed-during-save'],
  ['verification-failed', { badVerify: true }, 'hwp-export-verification'],
] as any[]) {
  const c = cases[0]
  const doc = new HwpDocument(c.bytes)
  try {
    await assert.rejects(
      () => exportNativeHwp(port(doc, options), importHwp('document.hwp', c.bytes)),
      new RegExp(message),
    )
    results.push({ id: name, status: 'PASS' })
  } catch {
    results.push({ id: name, status: 'FAIL' })
  } finally {
    doc.free()
  }
}
for (const format of ['hwp', 'hwpx']) {
  const doc = HwpDocument.createEmpty()
  doc.createBlankDocument()
  doc.insertText(0, 0, 0, 'A\tB')
  const bytes = format === 'hwp' ? doc.exportHwp() : doc.exportHwpx()
  try {
    await assert.rejects(
      () =>
        exportNativeHwp(port(doc, { noTabMeasurement: true }), importHwp('tab.' + format, bytes)),
      /hwp-tab-measurement/,
    )
    results.push({ id: `${format}-missing-tab-measurement`, status: 'PASS' })
  } catch {
    results.push({ id: `${format}-missing-tab-measurement`, status: 'FAIL' })
  } finally {
    doc.free()
  }
}
writeFileSync(
  join(out, 'native-save-report.json'),
  JSON.stringify(
    {
      reviewedRef: '8fcc0505930c168b92baef404be0bdeed185e49a',
      engineVersion: meta.version,
      sourceSha256: expected,
      scope:
        'Actual mobile native-save logic, Node PC helpers and simulated editor port; not browser polyfills, IndexedDB, Android or Hancom',
      results,
    },
    null,
    2,
  ) + '\n',
)
for (const r of results) console.log(`${r.id}: ${r.status}`)
process.exitCode = results.some((r) => r.status === 'FAIL') ? 1 : 0
