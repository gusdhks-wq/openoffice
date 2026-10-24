#!/usr/bin/env -S npx tsx
/** Reproduce native-export loss using synthetic fixtures and the EXISTING PC preservation helpers. */
import { readFileSync, writeFileSync, mkdirSync, realpathSync } from 'node:fs'
import { dirname, resolve, join, relative, isAbsolute } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { inflateRawSync, deflateRawSync } from 'node:zlib'
import assert from 'node:assert/strict'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const args = process.argv.slice(2)
const arg = (n: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined)
if (!arg('--out') || args.includes('--help')) {
  console.log(
    'tsx tools/hwp-validation/preservation.mts --out /private/preservation [--runtime-root /checkout]',
  )
  process.exit(args.includes('--help') ? 0 : 2)
}
const runtime = realpathSync(resolve(arg('--runtime-root') ?? root))
mkdirSync(resolve(arg('--out')!), { recursive: true })
const out = realpathSync(resolve(arg('--out')!))
for (const base of [root, runtime]) {
  const rel = relative(base, out)
  if (!(rel === '..' || rel.startsWith('../') || isAbsolute(rel)))
    throw Error('Output must be outside checkouts')
}
const require = createRequire(join(runtime, 'apps/hwp/package.json'))
const CFB = require('cfb')
const meta = JSON.parse(readFileSync(join(runtime, 'vendor/rhwp-core/package.json'), 'utf8'))
const wasm = readFileSync(join(runtime, 'vendor/rhwp-core/rhwp_bg.wasm'))
assert.equal(meta.version, '0.8.7-ieum.4')
assert.equal(createHash('sha256').update(wasm).digest('hex'), meta.rhwp.wasmSha256)
const { default: init, HwpDocument } = await import(
  pathToFileURL(join(runtime, 'vendor/rhwp-core/rhwp.js')).href
)
await init({ module_or_path: wasm })
const { sectionTailsOf, restoreSectionTails } = await import(
  pathToFileURL(join(runtime, 'apps/hwp/src/main/section-tails.ts')).href
)
const { newTabsOf, writeTabWidths } = await import(
  pathToFileURL(join(runtime, 'apps/hwp/src/main/tab-widths.ts')).href
)
const results: any[] = []
const browserCases: any[] = []
function browserCase(
  id: string,
  method: string,
  original: Uint8Array,
  saved: Uint8Array,
  expected: Uint8Array,
  measures: any[] = [],
) {
  browserCases.push({
    id,
    method,
    original: Buffer.from(original).toString('base64'),
    saved: Buffer.from(saved).toString('base64'),
    expected: Buffer.from(expected).toString('base64'),
    measures,
  })
}
function record(tag: number, level: number, payload: Buffer) {
  const header = Buffer.alloc(4)
  header.writeUInt32LE((tag | (level << 10) | (payload.length << 20)) >>> 0)
  return Buffer.concat([header, payload])
}
// Same synthetic HWP5 record fixture structure as the existing section-tails regression.
function masterPage() {
  const list = Buffer.alloc(34)
  list.writeUInt32LE(1)
  list.writeUInt32LE(67180, 8)
  list.writeUInt32LE(51024, 12)
  list.writeUInt8(4, 18)
  const para = Buffer.alloc(24)
  para.writeUInt32LE(0x80000001)
  para.writeUInt16LE(1, 12)
  para.writeUInt16LE(1, 16)
  const line = Buffer.alloc(36)
  line.writeUInt32LE(1000, 8)
  line.writeUInt32LE(1000, 12)
  line.writeUInt32LE(850, 16)
  return Buffer.concat([
    record(72, 1, list),
    record(66, 1, para),
    record(68, 2, Buffer.alloc(8)),
    record(69, 2, line),
  ])
}
try {
  const seed = HwpDocument.createEmpty()
  seed.createBlankDocument()
  seed.insertText(0, 0, 0, 'Synthetic body')
  const first = seed.exportHwp()
  seed.free()
  const cfb = CFB.read(Buffer.from(first), { type: 'buffer' })
  const entry = CFB.find(cfb, '/BodyText/Section0')
  CFB.utils.cfb_add(
    cfb,
    '/BodyText/Section0',
    deflateRawSync(Buffer.concat([inflateRawSync(entry.content), masterPage()])),
  )
  const fixture = new Uint8Array(CFB.write(cfb, { type: 'buffer' }))
  const kept = sectionTailsOf(fixture)
  assert.ok(kept)
  // Normalize the synthetic fixture through the already approved PC helper, as the existing test does.
  const opened = restoreSectionTails(first, kept).bytes
  const originalTail = sectionTailsOf(opened)
  assert.ok(originalTail)
  const d = new HwpDocument(opened)
  d.insertText(0, 0, 0, 'Edited ')
  const raw = d.exportHwp()
  const pages = d.pageCount()
  d.free()
  const rawTailCount = sectionTailsOf(raw)?.tails.get(0)?.length ?? 0
  const repaired = restoreSectionTails(raw, originalTail)
  const repairedTail = sectionTailsOf(repaired.bytes)
  const repairedCount = repairedTail?.tails.get(0)?.length ?? 0
  assert.equal(originalTail.tails.get(0).length, 1)
  assert.equal(rawTailCount, 0) // Reproduction gate: update when upstream fixes the loss.
  assert.equal(repairedCount, 1)
  assert.equal(repaired.skipped, undefined)
  assert.equal(repaired.restored, 1)
  browserCase('master-page', 'tails', opened, raw, repaired.bytes)
  const reopened = new HwpDocument(repaired.bytes)
  assert.equal(reopened.pageCount(), pages)
  assert.ok(reopened.getTextRange(0, 0, 0, reopened.getParagraphLength(0, 0)).startsWith('Edited '))
  reopened.free()
  results.push({
    case: 'hwp-master-page',
    rawExportSafe: false,
    originalTailCount: 1,
    rawTailCount,
    preservedTailCount: repairedCount,
    reproductionAndExistingHelper: 'PASS',
  })
} catch {
  results.push({ case: 'hwp-master-page', reproductionAndExistingHelper: 'FAIL' })
}
for (const format of ['hwp', 'hwpx']) {
  try {
    const d = HwpDocument.createEmpty()
    d.createBlankDocument()
    d.insertText(0, 0, 0, 'A\tB')
    const raw = format === 'hwp' ? d.exportHwp() : d.exportHwpx()
    const spots = newTabsOf(raw, format)
    assert.equal(spots.length, 1)
    // Deliberate fixture measurement. Production must measure from the editor; never use this constant there.
    const measured = spots.map((spot: any) => ({ ...spot, width: 6000, type: 0, fill: 3 }))
    const result = writeTabWidths(raw, format, measured)
    assert.equal(result.written, 1)
    browserCase(format + '-tab', format + '-tabs', raw, raw, result.bytes, measured)
    assert.equal(newTabsOf(result.bytes, format).length, 0)
    const back = new HwpDocument(result.bytes)
    assert.equal(
      back.getTextRange(0, 0, 0, back.getParagraphLength(0, 0)),
      d.getTextRange(0, 0, 0, d.getParagraphLength(0, 0)),
    )
    const x1 = JSON.parse(back.getCursorRect(0, 0, 1)).x
    const x2 = JSON.parse(back.getCursorRect(0, 0, 2)).x
    assert.equal(Math.round((x2 - x1) * 75), 6000)
    back.free()
    d.free()
    results.push({
      case: `${format}-new-tab`,
      rawExportSafe: false,
      rawTabsWithoutWidth: 1,
      preservedTabsWithoutWidth: 0,
      measurement: 'synthetic fixture: 6000 HWPUNIT, not a production font measurement',
      reproductionAndExistingHelper: 'PASS',
    })
  } catch {
    results.push({ case: `${format}-new-tab`, reproductionAndExistingHelper: 'FAIL' })
  }
}
// These fixtures model the saved record states from the existing PC regressions.
// Unlike the first three cases, they do not claim a fresh engine-loss reproduction.
const { fieldKindsOf, restoreFieldKinds } = await import(
  pathToFileURL(join(runtime, 'apps/hwp/src/main/field-kinds.ts')).href
)
function exported(text: string) {
  const d = HwpDocument.createEmpty()
  d.createBlankDocument()
  d.insertText(0, 0, 0, text)
  const bytes = d.exportHwp()
  d.free()
  return bytes
}
function section(file: Uint8Array) {
  const cfb = CFB.read(Buffer.from(file), { type: 'buffer' })
  return inflateRawSync(Buffer.from(CFB.find(cfb, '/BodyText/Section0').content))
}
function append(file: Uint8Array, ...records: Buffer[]) {
  const cfb = CFB.read(Buffer.from(file), { type: 'buffer' })
  CFB.utils.cfb_add(
    cfb,
    '/BodyText/Section0',
    deflateRawSync(Buffer.concat([section(file), ...records])),
  )
  return new Uint8Array(CFB.write(cfb, { type: 'buffer' }))
}
function paragraph(level: number) {
  const h = Buffer.alloc(24)
  h.writeUInt32LE(0x80000001)
  h.writeUInt16LE(1, 12)
  h.writeUInt16LE(1, 16)
  const line = Buffer.alloc(36)
  line.writeUInt32LE(1000, 8)
  line.writeUInt32LE(1000, 12)
  line.writeUInt32LE(850, 16)
  return Buffer.concat([
    record(66, level, h),
    record(68, level + 1, Buffer.alloc(8)),
    record(69, level + 1, line),
  ])
}
function memo(number: number) {
  const id = Buffer.alloc(4)
  id.writeUInt32LE(number)
  const list = Buffer.alloc(16)
  list.writeUInt32LE(1)
  return Buffer.concat([record(93, 1, id), record(72, 1, list), paragraph(1)])
}
function fieldChar(code: number, kind: string) {
  const c = Buffer.alloc(16)
  c.writeUInt16LE(code)
  c.write(kind, 2, 'latin1')
  c.writeUInt16LE(code, 14)
  return c
}
function field(kind: string, id: string) {
  const text = Buffer.concat([
    fieldChar(3, kind),
    Buffer.from('X', 'utf16le'),
    fieldChar(4, 'em%\0'),
    Buffer.from('\r', 'utf16le'),
  ])
  const h = Buffer.alloc(24)
  h.writeUInt32LE(text.length / 2)
  const c = Buffer.concat([
    Buffer.from('knu%', 'latin1'),
    Buffer.alloc(5),
    Buffer.from(id, 'utf16le'),
  ])
  return Buffer.concat([record(66, 0, h), record(67, 1, text), record(71, 1, c)])
}
function equation(id: number, caption: boolean) {
  const text = Buffer.alloc(18)
  text.writeUInt16LE(11)
  text.write('deqe', 2, 'latin1')
  text.writeUInt16LE(11, 14)
  text.writeUInt16LE(13, 16)
  const h = Buffer.alloc(24)
  h.writeUInt32LE(9)
  const c = Buffer.alloc(46)
  c.write('deqe', 0, 'latin1')
  c.writeUInt32LE(id, 36)
  const list = Buffer.alloc(30)
  list.writeUInt32LE(1)
  return Buffer.concat([
    record(66, 0, h),
    record(67, 1, text),
    record(71, 1, c),
    ...(caption ? [record(72, 2, list), paragraph(2)] : []),
    record(88, 2, Buffer.concat([Buffer.alloc(4), Buffer.from('x^2', 'utf16le')])),
  ])
}
function fixtureCase(name: string, run: () => void) {
  try {
    run()
    results.push({
      case: name,
      evidence: 'synthetic-saved-state-fixture',
      reproductionAndExistingHelper: 'PASS',
    })
  } catch {
    results.push({
      case: name,
      evidence: 'synthetic-saved-state-fixture',
      reproductionAndExistingHelper: 'FAIL',
    })
  }
}
fixtureCase('hwp-memo-retained-anchor', () => {
  const original = append(exported('Body MEMO/65535/3/1769959632/2'), memo(3))
  const saved = exported('Changed body MEMO/65535/3/1769959632/2')
  const kept = sectionTailsOf(original)
  assert.ok(kept)
  const r = restoreSectionTails(saved, kept)
  assert.equal(r.restored, 1)
  assert.equal(r.skipped, undefined)
  assert.deepEqual(section(r.bytes), Buffer.concat([section(saved), memo(3)]))
  browserCase('memo-retained', 'tails', original, saved, r.bytes)
})
fixtureCase('hwp-memo-deleted-or-different-anchor', () => {
  const original = append(exported('Body MEMO/65535/3/1769959632/2'), memo(3))
  const kept = sectionTailsOf(original)
  assert.ok(kept)
  for (const text of ['Body without anchor', 'Body MEMO/65535/13/1/2']) {
    const saved = exported(text)
    const r = restoreSectionTails(saved, kept)
    assert.equal(r.restored, 0)
    assert.deepEqual(Buffer.from(r.bytes), Buffer.from(saved))
    browserCase('memo-rejected-' + browserCases.length, 'tails', original, saved, r.bytes)
  }
})
fixtureCase('hwp-equation-caption-identity', () => {
  const base = exported('Equation fixture')
  const opened = append(base, equation(7, false), equation(8, true))
  const saved = append(base, equation(7, false), equation(8, false))
  const kept = sectionTailsOf(opened)
  assert.equal(kept.captions.size, 1)
  const r = restoreSectionTails(saved, kept)
  assert.equal(r.restored, 1)
  assert.deepEqual(section(r.bytes), section(opened))
  browserCase('equation-caption', 'tails', opened, saved, r.bytes)
  const other = append(base, equation(9, false))
  const rejected = restoreSectionTails(other, kept)
  assert.equal(rejected.restored, 0)
  assert.deepEqual(Buffer.from(rejected.bytes), Buffer.from(other))
  browserCase('caption-rejected', 'tails', opened, other, rejected.bytes)
})
fixtureCase('hwp-field-kind-only', () => {
  const base = exported('Field fixture')
  const original = append(base, field('em%%', 'MEMO/1/1/'))
  const saved = append(base, field('knu%', 'MEMO/1/1/'))
  const kept = fieldKindsOf(original)
  assert.equal(kept.size, 1)
  const r = restoreFieldKinds(saved, kept)
  assert.equal(r.restored, 1)
  assert.deepEqual(section(r.bytes), section(original))
  browserCase('field-restored', 'fields', original, saved, r.bytes)
})
fixtureCase('hwp-field-wrong-identity-unchanged', () => {
  const base = exported('Field identity fixture')
  const original = append(base, field('em%%', 'MEMO/1/1/'))
  const other = append(base, field('knu%', 'MEMO/1/2/'))
  const r = restoreFieldKinds(other, fieldKindsOf(original))
  assert.equal(r.restored, 0)
  assert.deepEqual(Buffer.from(r.bytes), Buffer.from(other))
  browserCase('field-rejected', 'fields', original, other, r.bytes)
})

writeFileSync(
  join(out, 'preservation-report.json'),
  JSON.stringify(
    {
      engineVersion: meta.version,
      scope:
        'Synthetic reproductions; unchanged existing PC helpers, no new byte repair or mobile integration',
      results,
    },
    null,
    2,
  ) + '\n',
)
if (args.includes('--browser-fixtures'))
  writeFileSync(join(out, 'browser-fixtures.json'), JSON.stringify(browserCases))
for (const r of results)
  console.log(`${r.case}: ${r.reproductionAndExistingHelper}; raw export is not certified`)
process.exitCode = results.some((r) => r.reproductionAndExistingHelper === 'FAIL') ? 1 : 0
