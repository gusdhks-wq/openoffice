#!/usr/bin/env node
import { layout, layoutEqual } from './layout.mjs'
/** Private document inputs/outputs never belong in the checkout. */
import { readFileSync, writeFileSync, mkdirSync, realpathSync, mkdtempSync } from 'node:fs'
import { resolve, dirname, extname, relative, isAbsolute, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'
import { createHash } from 'node:crypto'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const args = process.argv.slice(2)
const value = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined)
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const outside = (path) => {
  const rel = relative(realpathSync(root), realpathSync(path))
  return rel.startsWith('..' + '/') || rel === '..' || isAbsolute(rel)
}
if (args.includes('--help')) {
  console.log(
    'node tools/hwp-validation/run.mjs --synthetic --out /private/results\nnode tools/hwp-validation/run.mjs --manifest /private/cases.json --out /private/results [--artifacts]',
  )
  process.exit(0)
}
const outArg = value('--out')
if (!outArg || (!args.includes('--synthetic') && !value('--manifest'))) {
  console.error('SETUP_ERROR: specify --out and --synthetic or --manifest (see --help)')
  process.exit(2)
}
mkdirSync(resolve(outArg), { recursive: true })
const out = realpathSync(resolve(outArg))
if (!outside(out)) {
  console.error(
    'SETUP_ERROR: output must be outside the repository; documents and renders are private',
  )
  process.exit(2)
}
const manifestPath = value('--manifest') ? realpathSync(resolve(value('--manifest'))) : null
if (manifestPath && !outside(manifestPath)) {
  console.error('SETUP_ERROR: private manifest must be outside the repository')
  process.exit(2)
}
const meta = JSON.parse(readFileSync(join(root, 'vendor/rhwp-core/package.json')))
const wasm = readFileSync(join(root, 'vendor/rhwp-core/rhwp_bg.wasm'))
if (meta.version !== '0.8.7-ieum.4' || hash(wasm) !== meta.rhwp.wasmSha256) {
  console.error(
    'SETUP_ERROR: engine version/hash differ from the validated baseline; review before changing the gate',
  )
  process.exit(2)
}
const { default: init, HwpDocument } = await import(
  pathToFileURL(join(root, 'vendor/rhwp-core/rhwp.js'))
)
const { agentPlugin } = await import(
  pathToFileURL(join(root, 'apps/hwp/studio-plugin/agent-plugin.mjs'))
)
await init({ module_or_path: wasm })
function pluginFor(doc) {
  return agentPlugin.activate({
    read: (fn) => fn(doc),
    transaction: (_label, fn) => fn({ doc: () => doc, deferPagination: () => {} }),
    events: { on: () => () => {} },
    automation: { execute: () => null },
  })
}
function tables(plugin) {
  const list = plugin.listTables()
  if (list.partial) throw Error('TABLE_LIST_PARTIAL')
  return list.tables.map(({ table, rows, cols }) => {
    const cells = []
    let row = 1
    const visited = new Set()
    do {
      if (visited.has(row)) throw Error('TABLE_READ_LOOP')
      visited.add(row)
      const result = plugin.readTable(table, row)
      if (!result.ok) throw Error('TABLE_READ_FAILED')
      cells.push(...result.cells)
      row = result.nextRow
    } while (row !== undefined)
    return { table, rows, cols, cells }
  })
}
function snapshot(doc) {
  const plugin = pluginFor(doc)
  return { text: plugin.readText(), tables: tables(plugin), pages: doc.pageCount() }
}
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b)
function serialize(doc, format) {
  if (format === 'hwp') {
    const v = JSON.parse(doc.exportHwpVerify())
    if (!v.recovered || v.pageCountBefore !== v.pageCountAfter)
      throw Error('HWP_EXPORT_VERIFY_FAILED')
    return doc.exportHwp()
  }
  return doc.exportHwpx()
}
const signatureOK = (bytes, format) =>
  format === 'hwp'
    ? Buffer.from(bytes).subarray(0, 8).toString('hex') === 'd0cf11e0a1b11ae1'
    : Buffer.from(bytes).subarray(0, 4).toString('hex') === '504b0304'
function issues(doc) {
  const pua = new Set()
  let renderedPages = 0
  for (let i = 0; i < doc.pageCount(); i++) {
    const svg = doc.renderPageSvg(i)
    if (!svg.startsWith('<svg')) throw Error('RENDER_FAILED')
    renderedPages++
    // A private-use character is a coverage warning, not proof of a missing glyph.
    for (const char of svg.replace(/<[^>]*>/g, '')) {
      const cp = char.codePointAt(0)
      if (
        (cp >= 0xe000 && cp <= 0xf8ff) ||
        (cp >= 0xf0000 && cp <= 0xffffd) ||
        (cp >= 0x100000 && cp <= 0x10fffd)
      )
        pua.add(`U+${cp.toString(16).toUpperCase()}`)
    }
  }
  return { renderedPages, privateUseCodepoints: [...pua].sort() }
}
let cases = []
if (args.includes('--synthetic')) {
  const privateDir = mkdtempSync(join(tmpdir(), 'hwp-validation-'))
  const doc = HwpDocument.createEmpty()
  doc.createBlankDocument()
  doc.insertText(0, 0, 0, 'Synthetic heading')
  doc.splitParagraph(0, 0, doc.getParagraphLength(0, 0))
  doc.insertText(0, 1, 0, 'Original paragraph.')
  doc.splitParagraph(0, 1, doc.getParagraphLength(0, 1))
  doc.pasteHtml(
    0,
    2,
    0,
    '<table><tr><td>Kind</td><td>Value</td></tr><tr><td>Target</td><td>Old value</td></tr></table>',
  )
  for (const format of ['hwp', 'hwpx']) {
    const path = join(privateDir, `synthetic.${format}`)
    writeFileSync(path, serialize(doc, format))
    cases.push({
      id: `synthetic-${format}`,
      path,
      find: 'Original paragraph.',
      replace: 'A longer replacement paragraph for round-trip testing.',
      tableEdit: { table: 1, row: 2, col: 2, text: 'Updated value' },
    })
  }
}
if (manifestPath) cases.push(...JSON.parse(readFileSync(manifestPath, 'utf8')).cases)
if (!cases.length) throw Error('NO_CASES')
const results = []
const ids = new Set()
for (const item of cases) {
  if (!/^[a-zA-Z0-9_-]+$/.test(item.id) || ids.has(item.id))
    throw Error('INVALID_OR_DUPLICATE_CASE_ID')
  ids.add(item.id)
  const result = { id: item.id, checks: {}, warnings: [] }
  let inputPath, sourceHash
  try {
    inputPath = realpathSync(resolve(manifestPath ? dirname(manifestPath) : root, item.path))
    if (!outside(inputPath)) throw Error('INPUT_MUST_BE_PRIVATE')
    const format = extname(inputPath).slice(1).toLowerCase()
    if (!['hwp', 'hwpx'].includes(format)) throw Error('UNSUPPORTED_FORMAT')
    result.format = format
    const source = readFileSync(inputPath)
    sourceHash = hash(source)
    result.checks.inputSignature = signatureOK(source, format)
    let doc = new HwpDocument(source)
    const before = snapshot(doc)
    const beforeLayout = layout(doc)
    // Unchanged export isolates serializer losses from requested edits.
    const unchangedBytes = serialize(doc, format)
    const unchangedDoc = new HwpDocument(unchangedBytes)
    const unchanged = snapshot(unchangedDoc)
    result.checks.unchangedResolvedLayout = layoutEqual(beforeLayout, layout(unchangedDoc))
    result.checks.unchangedText = unchanged.text === before.text
    result.checks.unchangedTables = equal(unchanged.tables, before.tables)
    result.checks.unchangedPages = unchanged.pages === before.pages
    doc = new HwpDocument(source)
    const plugin = pluginFor(doc)
    if (typeof item.find !== 'string' || !item.find || typeof item.replace !== 'string')
      throw Error('INVALID_REPLACEMENT')
    const matches = before.text.split(item.find).length - 1
    if (matches !== 1) throw Error('REPLACEMENT_MUST_MATCH_ONCE')
    const changed = plugin.replaceText(item.find, item.replace)
    result.checks.editAppliedOnce = changed.ok === true && changed.count === 1
    result.checks.requestedTextOnly =
      plugin.readText() === before.text.replace(item.find, item.replace)
    if (item.tableEdit) {
      const e = item.tableEdit
      const prior = snapshot(doc)
      const expectedTables = structuredClone(prior.tables)
      const targetCell = expectedTables
        .find((t) => t.table === e.table)
        ?.cells.find((c) => c.row === e.row && c.col === e.col)
      if (!targetCell || !targetCell.text) throw Error('TABLE_EDIT_REQUIRES_NONEMPTY_CELL')
      targetCell.text = e.text
      const denied = plugin.fillCells(e.table, [{ row: e.row, col: e.col, text: e.text }], false)
      result.checks.nonemptyCellProtected = !denied.ok && equal(snapshot(doc), prior)
      const applied = plugin.fillCells(e.table, [{ row: e.row, col: e.col, text: e.text }], true)
      result.checks.tableEditApplied = applied.ok === true
      const cell = tables(plugin)
        .find((t) => t.table === e.table)
        ?.cells.find((c) => c.row === e.row && c.col === e.col)
      result.checks.tableCellEqualsRequest = cell?.text === e.text
      result.checks.otherTableCellsUnchanged = equal(tables(plugin), expectedTables)
    }
    const expected = snapshot(doc)
    const expectedLayout = layout(doc)
    const bytes = serialize(doc, format)
    result.checks.outputSignature = signatureOK(bytes, format)
    const reopened = new HwpDocument(bytes)
    const after = snapshot(reopened)
    result.checks.reopenedText = after.text === expected.text
    result.checks.reopenedAllTableCellsAndSpans = equal(after.tables, expected.tables)
    result.checks.reopenedPages = after.pages === expected.pages
    result.checks.reopenedResolvedLayout = layoutEqual(expectedLayout, layout(reopened))
    result.pages = { input: before.pages, edited: expected.pages, reopened: after.pages }
    result.tableCount = after.tables.length
    result.render = issues(reopened)
    if (result.render.privateUseCodepoints.length)
      result.warnings.push('PRIVATE_USE_FONT_COVERAGE_REQUIRES_VISUAL_REVIEW')
    if (before.pages !== expected.pages)
      result.warnings.push('EDIT_CHANGED_PAGINATION_REQUIRES_VISUAL_REVIEW')
    // Refuse a missing target and verify that rejection leaves the document unchanged.
    const missing = '__absent_' + hash(source).slice(0, 16) + '__'
    if (after.text.includes(missing)) throw Error('NEGATIVE_TEST_COLLISION')
    const rejected = pluginFor(reopened).replaceText(missing, 'must not appear')
    result.checks.missingTargetRejectedWithoutMutation =
      !rejected.ok && equal(snapshot(reopened), after)
    if (args.includes('--artifacts')) {
      const dir = join(out, item.id)
      mkdirSync(dir, { recursive: true })
      writeFileSync(join(dir, `edited.${format}`), bytes)
      for (let i = 0; i < reopened.pageCount(); i++)
        writeFileSync(join(dir, `page-${i + 1}.svg`), reopened.renderPageSvg(i))
    }
  } catch (error) {
    // Engine error messages can quote private document text; don't publish them.
    result.error = /^[A-Z_]+$/.test(error.message) ? error.message : 'ENGINE_OR_IO_ERROR'
  } finally {
    if (inputPath && sourceHash)
      result.checks.sourceUnchanged = hash(readFileSync(inputPath)) === sourceHash
  }
  result.status =
    result.error || Object.values(result.checks).some((v) => v !== true) ? 'FAIL' : 'PASS'
  results.push(result)
}
const report = {
  schemaVersion: 1,
  engineVersion: meta.version,
  wasmSha256: hash(wasm),
  node: process.version,
  scope: 'engine round-trip, not Android/Hancom/visual fidelity certification',
  results,
}
writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n')
for (const r of results)
  console.log(`${r.id}: ${r.status}${r.warnings.length ? ' (visual review required)' : ''}`)
process.exitCode = results.some((r) => r.status === 'FAIL') ? 1 : 0
