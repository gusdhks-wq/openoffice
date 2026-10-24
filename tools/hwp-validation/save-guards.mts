#!/usr/bin/env -S npx tsx
/** Test the actual PC save-flow using simulated editor/IPC ports; no disk-save or encrypted-file claim. */
import { readFileSync, writeFileSync, mkdirSync, realpathSync } from 'node:fs'
import { dirname, resolve, join, relative, isAbsolute } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const args = process.argv.slice(2)
const arg = (n: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined)
if (args.includes('--help') || !arg('--out')) {
  console.log(
    'node --import tsx tools/hwp-validation/save-guards.mts --out /private/save-guards [--runtime-root /checkout]',
  )
  process.exit(args.includes('--help') ? 0 : 2)
}
const runtime = realpathSync(resolve(arg('--runtime-root') ?? root))
mkdirSync(resolve(arg('--out')!), { recursive: true })
const out = realpathSync(resolve(arg('--out')!))
for (const base of [root, runtime]) {
  const rel = relative(base, out)
  if (!(rel === '..' || rel.startsWith('../') || isAbsolute(rel)))
    throw Error('Use output outside checkouts')
}
const { runSave } = await import(
  pathToFileURL(join(runtime, 'apps/hwp/src/renderer/save-flow.ts')).href
)
const meta = JSON.parse(readFileSync(join(runtime, 'vendor/rhwp-core/package.json'), 'utf8'))
assert.equal(meta.version, '0.8.7-ieum.4')
const results: any[] = []
function ports(options: any = {}) {
  const calls: string[] = []
  let measured: any[] = []
  const bytes = new Uint8Array([1, 2, 3]) // A port sentinel, not a native document.
  const editor = {
    isPasswordProtected: async () => {
      calls.push('protected')
      return options.protected ?? false
    },
    exportHwpVerify: async () => {
      calls.push('verify')
      return options.verify ?? { recovered: true, pageCountBefore: 1, pageCountAfter: 1 }
    },
    exportHwp: async () => {
      calls.push('exportHwp')
      if (options.exportThrows) throw Error('synthetic export failure')
      return bytes
    },
    exportHwpx: async () => {
      calls.push('exportHwpx')
      return bytes
    },
    measureTabs: async () => {
      calls.push('measure')
      if (options.measureThrows) throw Error('synthetic measurement failure')
      return options.measure ?? [{ width: 6000, type: 0, fill: 0 }]
    },
    notifySaved: async () => {
      calls.push('notify')
      if (options.notifyThrows) throw Error('synthetic notice failure')
    },
  }
  const api = {
    beginSave: async () => {
      calls.push('begin')
      return options.begin ?? { ok: true, path: 'synthetic.hwp', format: 'hwp' }
    },
    abortSave: () => {
      calls.push('abort')
    },
    newTabs: async () => options.tabs ?? [],
    commitSave: async (_bytes: Uint8Array, tabs: any[]) => {
      calls.push('commit')
      measured = tabs
      return options.commit ?? { ok: true, path: 'synthetic.hwp' }
    },
  }
  return {
    editor,
    api,
    calls,
    get measured() {
      return measured
    },
  }
}
async function check(
  name: string,
  options: any,
  expected: any,
  forbidden: string[],
  inspect?: (p: ReturnType<typeof ports>) => void,
) {
  const p = ports(options)
  try {
    const outcome = await runSave(p.editor, p.api, 'save')
    for (const [key, value] of Object.entries(expected)) assert.equal(outcome[key], value)
    for (const call of forbidden) assert.equal(p.calls.includes(call), false)
    inspect?.(p)
    results.push({
      case: name,
      status: 'PASS',
      outcome: outcome.kind,
      commitReached: p.calls.includes('commit'),
    })
  } catch {
    results.push({ case: name, status: 'FAIL' })
  }
}
await check('password-protected', { protected: true }, { kind: 'failed', reason: 'protected' }, [
  'begin',
  'verify',
  'exportHwp',
  'exportHwpx',
  'commit',
  'notify',
])
await check(
  'tracked-refused-by-main',
  { begin: { ok: false, reason: 'tracked' } },
  { kind: 'failed', reason: 'tracked' },
  ['verify', 'exportHwp', 'exportHwpx', 'commit', 'notify'],
)
await check(
  'verification-recovery-failed',
  { verify: { recovered: false, pageCountBefore: 1, pageCountAfter: 1 } },
  { kind: 'failed', reason: 'verify' },
  ['exportHwp', 'commit', 'notify'],
)
await check(
  'verification-page-count-changed',
  { verify: { recovered: true, pageCountBefore: 1, pageCountAfter: 2 } },
  { kind: 'failed', reason: 'verify' },
  ['exportHwp', 'commit', 'notify'],
)
await check('export-exception', { exportThrows: true }, { kind: 'failed', reason: 'export' }, [
  'commit',
  'notify',
])
await check('save-dialog-cancel', { begin: { ok: true, canceled: true } }, { kind: 'canceled' }, [
  'verify',
  'exportHwp',
  'exportHwpx',
  'commit',
  'notify',
])
await check(
  'commit-error-no-saved-notice',
  { commit: { ok: false, error: 'synthetic host failure' } },
  { kind: 'failed', reason: 'write' },
  ['notify'],
)
await check(
  'external-modification-cancel',
  { commit: { ok: false, error: 'hwp: external-modified' } },
  { kind: 'canceled' },
  ['notify'],
)
await check(
  'saved-notice-failure-does-not-rewrite',
  { notifyThrows: true },
  { kind: 'saved' },
  [],
  (p) => assert.equal(p.calls.filter((x) => x === 'commit').length, 1),
)
await check(
  'hwp-verify-before-export-before-commit',
  {},
  { kind: 'saved' },
  ['exportHwpx'],
  (p) => {
    assert.ok(p.calls.indexOf('verify') < p.calls.indexOf('exportHwp'))
    assert.ok(p.calls.indexOf('exportHwp') < p.calls.indexOf('commit'))
  },
)
const spots = [{ sec: 0, para: 0, cells: [], tab: 0, tabs: 1 }]
const risk = ports({ tabs: spots, measureThrows: true })
const riskOutcome = await runSave(risk.editor, risk.api, 'save')
const riskObserved =
  riskOutcome.kind === 'saved' && risk.calls.includes('commit') && risk.measured.length === 0
results.push({
  case: 'tab-measurement-failure-still-saves',
  status: riskObserved ? 'KNOWN_RISK' : 'REVIEW_BEHAVIOR_CHANGED',
  outcome: riskOutcome.kind,
  commitReached: risk.calls.includes('commit'),
  omittedMeasurements: spots.length - risk.measured.length,
})
const tailRisk = ports({ commit: { ok: true, path: 'synthetic.hwp', tailsLost: true } })
const tailOutcome = await runSave(tailRisk.editor, tailRisk.api, 'save')
results.push({
  case: 'tail-loss-notice-still-saved',
  status:
    tailOutcome.kind === 'saved' && tailOutcome.tailsLost === true
      ? 'KNOWN_RISK'
      : 'REVIEW_BEHAVIOR_CHANGED',
  outcome: tailOutcome.kind,
  commitReached: tailRisk.calls.includes('commit'),
})
writeFileSync(
  join(out, 'save-guards-report.json'),
  JSON.stringify(
    {
      engineVersion: meta.version,
      nativeExportReleaseEligible: false,
      scope:
        'Actual PC runSave with simulated ports; no Android, encrypted-file, backup I/O, crash or disk atomicity coverage',
      results,
    },
    null,
    2,
  ) + '\n',
)
for (const r of results) console.log(`${r.case}: ${r.status}`)
process.exitCode = results.some(
  (r) => r.status === 'FAIL' || r.status === 'REVIEW_BEHAVIOR_CHANGED',
)
  ? 1
  : 0
