#!/usr/bin/env node
/** Executes reviewed mobile TypeScript sources from a private snapshot; no product code is modified. */
import { readFileSync, writeFileSync, mkdirSync, realpathSync } from 'node:fs'
import { resolve, dirname, join, relative, isAbsolute } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const args = process.argv.slice(2)
const arg = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined)
if (args.includes('--help') || !arg('--source') || !arg('--out')) {
  console.log(
    'node tools/hwp-validation/verify-mobile-adapter.mjs --source /private/mobile-source.json --out /private/mobile-report [--runtime-root /built/checkout]',
  )
  process.exit(args.includes('--help') ? 0 : 2)
}
const runtime = realpathSync(resolve(arg('--runtime-root') ?? root))
const source = realpathSync(resolve(arg('--source')))
mkdirSync(resolve(arg('--out')), { recursive: true })
const out = realpathSync(resolve(arg('--out')))
for (const base of [root, runtime])
  for (const path of [source, out]) {
    const rel = relative(base, path)
    if (!(rel === '..' || rel.startsWith('../') || isAbsolute(rel)))
      throw Error('Use private paths outside both checkouts')
  }
const sources = JSON.parse(readFileSync(source))
const hash = (s) => createHash('sha256').update(s).digest('hex')
assert.equal(
  hash(sources.engine),
  '55dbaa510f552938d0b9f0dc6c18ed3ca2d345b6affb9d7e05f255b94bc62574',
)
assert.equal(
  hash(sources.workspace),
  'af54032dd600e1927794a2b3a9f7facb4495dbab17981610d846943f0b14c60f',
)
const require = createRequire(join(runtime, 'package.json'))
const ts = require('typescript')
const coreUrl = pathToFileURL(join(runtime, 'vendor/rhwp-core/rhwp.js')).href
const pluginUrl = pathToFileURL(join(runtime, 'apps/hwp/studio-plugin/agent-plugin.mjs')).href
const meta = JSON.parse(readFileSync(join(runtime, 'vendor/rhwp-core/package.json')))
const wasm = readFileSync(join(runtime, 'vendor/rhwp-core/rhwp_bg.wasm'))
assert.equal(meta.version, '0.8.7-ieum.4')
assert.equal(hash(wasm), meta.rhwp.wasmSha256)
const { default: init, HwpDocument } = await import(coreUrl)
await init({ module_or_path: wasm })
// Only imports change for Node loading. The mobile functions are not reimplemented.
const load = async (text) => {
  const compiled = ts
    .transpileModule(text, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    })
    .outputText.replaceAll("'@rhwp/core'", JSON.stringify(coreUrl))
    .replaceAll("'../../../../hwp/studio-plugin/agent-plugin.mjs'", JSON.stringify(pluginUrl))
  return import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'))
}
const mobile = await load(sources.engine)
const workspace = await load(sources.workspace)
const results = []
for (const format of ['hwp', 'hwpx']) {
  const checks = {}
  const check = (name, fn) => {
    try {
      fn()
      checks[name] = true
    } catch {
      checks[name] = false
    }
  }
  const d = HwpDocument.createEmpty()
  d.createBlankDocument()
  d.insertText(0, 0, 0, 'Unique body target.')
  d.splitParagraph(0, 0, d.getParagraphLength(0, 0))
  d.pasteHtml(0, 1, 0, '<table><tr><td>Unique cell target.</td><td>Keep cell.</td></tr></table>')
  const bytes = format === 'hwp' ? d.exportHwp() : d.exportHwpx()
  d.free()
  const originalHash = hash(bytes)
  const base = workspace.importHwp(`synthetic.${format}`, bytes)
  const read = (w) => {
    const e = mobile.openHwpEngine(w)
    try {
      return e.plugin.readText()
    } finally {
      e.close()
    }
  }
  const baseline = read(base)
  const body = workspace.replacement('Unique body target.', 'A longer body replacement.')
  const first = workspace.appendReplacement(base, body)
  const cell = workspace.replacement('Unique cell target.', 'A longer cell replacement.')
  const both = workspace.appendReplacement(first, cell)
  check('bodyReplay', () =>
    assert.equal(read(first), baseline.replace(body.find, body.replacement)),
  )
  check('tableReplay', () =>
    assert.equal(
      read(both),
      baseline.replace(body.find, body.replacement).replace(cell.find, cell.replacement),
    ),
  )
  check('undoByReplay', () =>
    assert.equal(read({ ...both, operations: both.operations.slice(0, -1) }), read(first)),
  )
  check('sourceImmutable', () => {
    assert.equal(hash(bytes), originalHash)
    assert.equal(hash(base.original), originalHash)
    assert.equal(base.operations.length, 0)
  })
  check('replayDeterministic', () => assert.equal(read(both), read(both)))
  check('duplicateOperationRejected', () =>
    assert.throws(() => workspace.appendReplacement(first, body), /duplicate-operation/),
  )
  check('staleTargetRejected', () =>
    assert.throws(
      () => read({ ...base, operations: [body, { ...body, id: 'another-id' }] }),
      /hwp-command/,
    ),
  )
  check('failedReplayLeavesPriorReadable', () =>
    assert.equal(read(first), baseline.replace(body.find, body.replacement)),
  )
  check('newlineRejected', () =>
    assert.throws(
      () => workspace.replacement('Unique body target.', 'bad\ntext'),
      /invalid-replacement/,
    ),
  )
  check('emptyTargetRejected', () =>
    assert.throws(() => workspace.replacement('', 'bad'), /invalid-replacement/),
  )
  const ambiguous = workspace.replacement('Unique body target.', 'Keep cell.')
  const refused = workspace.replacement('Keep cell.', 'must not appear')
  check('ambiguousTargetRejected', () =>
    assert.throws(() => read({ ...base, operations: [ambiguous, refused] }), /hwp-command/),
  )
  check('originalCopyIsIndependent', () => {
    const w = workspace.importHwp(`synthetic.${format}`, bytes)
    w.original[0] ^= 1
    assert.equal(hash(bytes), originalHash)
  })
  results.push({ format, checks, status: Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL' })
}
const report = {
  engineVersion: meta.version,
  reviewedMobileRef: 'd5024560505a088b4f651a2d287f052b73374900',
  sourceSha256: { engine: hash(sources.engine), workspace: hash(sources.workspace) },
  scope:
    'actual mobile adapter functions in Node; no Android, IndexedDB, native export, AI or Drive coverage',
  results,
}
writeFileSync(join(out, 'mobile-adapter-report.json'), JSON.stringify(report, null, 2) + '\n')
for (const r of results)
  console.log(`${r.format}: ${r.status} (${Object.keys(r.checks).length} checks)`)
process.exitCode = results.some((r) => r.status === 'FAIL') ? 1 : 0
