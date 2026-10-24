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
for (const r of results)
  console.log(`${r.case}: ${r.reproductionAndExistingHelper}; raw export is not certified`)
process.exitCode = results.some((r) => r.reproductionAndExistingHelper === 'FAIL') ? 1 : 0
