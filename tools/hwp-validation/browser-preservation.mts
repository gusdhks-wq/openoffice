#!/usr/bin/env -S npx tsx
/** Bundle the reviewed mobile Vite preservation adapter and execute it in a sandboxed Chromium renderer. */
import { readFileSync, writeFileSync, realpathSync, mkdirSync } from 'node:fs'
import { resolve, dirname, join, relative, isAbsolute } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { inflateRawSync } from 'node:zlib'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const args = process.argv.slice(2)
const arg = (n: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined)
if (args.includes('--help') || !arg('--stage') || !arg('--fixtures') || !arg('--out')) {
  console.log(
    'node --import tsx tools/hwp-validation/browser-preservation.mts --stage /private/mobile-stage --fixtures /private/browser-fixtures.json --out /private/browser-results --runtime-root /checkout',
  )
  process.exit(args.includes('--help') ? 0 : 2)
}
const runtime = realpathSync(resolve(arg('--runtime-root') ?? root))
const stage = realpathSync(resolve(arg('--stage')!))
const fixturePath = realpathSync(resolve(arg('--fixtures')!))
mkdirSync(resolve(arg('--out')!), { recursive: true })
const out = realpathSync(resolve(arg('--out')!))
for (const path of [stage, fixturePath, out])
  for (const base of [root, runtime]) {
    const r = relative(base, path)
    if (!(r === '..' || r.startsWith('../') || isAbsolute(r)))
      throw Error('Private stage and results must be outside checkouts')
  }
const req = createRequire(join(runtime, 'package.json'))
const hwpReq = createRequire(join(runtime, 'apps/hwp/package.json'))
const { build } = req('esbuild')
const CFB = hwpReq('cfb')
const fixtures = JSON.parse(readFileSync(fixturePath, 'utf8'))
if (!fixtures.length) throw Error('No fixtures')
function canonical(bytes: Buffer) {
  const c = CFB.read(bytes, { type: 'buffer' })
  return c.FullPaths.flatMap((path: string, index: number) => {
    const e = c.FileIndex[index]
    if (e.type !== 2 || /\u0001Sh33tJ5/.test(path)) return []
    let data = Buffer.from(e.content)
    if (
      bytes.subarray(0, 8).toString('hex') === 'd0cf11e0a1b11ae1' &&
      /(?:DocInfo|BodyText\/Section[0-9]+|BinData\/[^/]+)$/.test(path)
    ) {
      try {
        data = inflateRawSync(data)
      } catch {}
    }
    return [{ path, bytes: data.toString('base64') }]
  }).sort((a: any, b: any) => a.path.localeCompare(b.path))
}
for (const f of fixtures) {
  f.expectedStreams = canonical(Buffer.from(f.expected, 'base64'))
  if (!f.expectedStreams.length) throw Error('Empty expected container')
}
const script = join(stage, 'apps/mobile/scripts/hwp-browser.ts')
const { hwpBrowserPreservation } = await import(pathToFileURL(script).href)
const actual = hwpBrowserPreservation() as any
const browserDir = join(stage, 'apps/mobile/src/renderer/hwp/browser')
const pinned = {
  'hwp-browser.ts': 'eabb9f36eb4d68f3f147caa75c3f3573e0b9eb8f7d7d59000f3775919b913198',
  'crypto.ts': '63739afe2442366227df69a448e4719b344c573b0e9d9944162c620924dba66a',
  'zlib.ts': 'd073e4d458e5f145d0cda074d6e448880e30dcbe2919136a0da9405d6d9dcd0c',
  'cfb.ts': '248608a1d2f3f00441a3c97d2d859b7a68b7ca9561448bcb712ab4ea91c1e49d',
}
if (!args.includes('--candidate'))
  for (const path of [
    script,
    ...['crypto', 'zlib', 'cfb'].map((n) => join(browserDir, n + '.ts')),
  ]) {
    if (
      createHash('sha256').update(readFileSync(path)).digest('hex') !==
      pinned[path.split('/').pop()!]
    )
      throw Error('Adapter changed: review and update the pinned baseline')
  }
const entry = join(out, 'entry.ts')
writeFileSync(
  entry,
  `
import { Buffer } from ${JSON.stringify(join(stage, 'node_modules/buffer/index.js'))};
import * as CFB from ${JSON.stringify(join(browserDir, 'cfb.ts'))};
import { inflateRawSync, crc32 } from ${JSON.stringify(join(browserDir, 'zlib.ts'))};
import { createHash } from ${JSON.stringify(join(browserDir, 'crypto.ts'))};
import { sectionTailsOf, restoreSectionTails } from 'virtual:mobile-hwp/section-tails';
import { fieldKindsOf, restoreFieldKinds } from 'virtual:mobile-hwp/field-kinds';
import { writeTabWidths } from 'virtual:mobile-hwp/tab-widths';
const decode = value => Buffer.from(value, 'base64');
function canonical(bytes) {
 const c = CFB.read(bytes,{type:'buffer'});
 return c.FullPaths.flatMap((path,index)=>{
  const e=c.FileIndex[index];if(e.type!==2||/\\u0001Sh33tJ5/.test(path))return [];
  let data=Buffer.from(e.content);if(Buffer.from(bytes).subarray(0,8).toString('hex')==='d0cf11e0a1b11ae1'&&/(?:DocInfo|BodyText\\/Section[0-9]+|BinData\\/[^/]+)$/.test(path)){try{data=inflateRawSync(data)}catch{}}
  return [{path,bytes:data.toString('base64')}];
 }).sort((a,b)=>a.path.localeCompare(b.path));
}
window.runPreservation = cases => {
 const results=cases.map(c=>{try{
  const original=decode(c.original), saved=decode(c.saved);let result;
  if(c.method==='tails')result=restoreSectionTails(saved,sectionTailsOf(original));
  else if(c.method==='fields')result=restoreFieldKinds(saved,fieldKindsOf(original));
  else result=writeTabWidths(saved,c.method.startsWith('hwpx')?'hwpx':'hwp',c.measures);
  const streams=canonical(result.bytes);
  return {id:c.id,status:!result.skipped&&JSON.stringify(streams)===JSON.stringify(c.expectedStreams)?'PASS':'FAIL',streams:streams.length,differences:streams.filter(s=>!c.expectedStreams.some(e=>e.path===s.path&&e.bytes===s.bytes)).map(s=>s.path)};
 }catch{return {id:c.id,status:'FAIL'}}});
 let refused=false;try{inflateRawSync(Buffer.from([3]))}catch{refused=true}
 results.push({id:'incomplete-deflate-rejected',status:refused?'PASS':'FAIL'});
 let emptyOK=false;try{emptyOK=inflateRawSync(Buffer.from([3,0])).length===0}catch{}
 results.push({id:'complete-empty-deflate-accepted',status:emptyOK?'PASS':'FAIL'});
 let invalidRefused=false;try{inflateRawSync(Buffer.from([255]))}catch{invalidRefused=true}
 results.push({id:'invalid-deflate-rejected',status:invalidRefused?'PASS':'FAIL'});
 const vector=Buffer.from('123456789');
 results.push({id:'crc32-known-vector',status:crc32(vector)===0xcbf43926?'PASS':'FAIL'});
 results.push({id:'sha1-known-vector',status:createHash('sha1').update(Buffer.from('abc')).digest('hex')==='a9993e364706816aba3e25717850c26c9cd0d89d'?'PASS':'FAIL'});
 return {noNodeGlobal:typeof globalThis.process==='undefined'&&typeof globalThis.require==='undefined',results};
};`,
)
const bundle = join(out, 'bundle.js')
await build({
  entryPoints: [entry],
  outfile: bundle,
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: 'chrome120',
  plugins: [
    {
      name: 'actual-mobile-vite-adapter',
      setup(api: any) {
        api.onResolve({ filter: /^virtual:mobile-hwp\// }, (arg: any) => ({
          path: arg.path,
          namespace: 'mobile-preservation',
        }))
        api.onLoad({ filter: /.*/, namespace: 'mobile-preservation' }, async (arg: any) => {
          const r = await actual.load('\0' + arg.path)
          return { contents: r.code, loader: 'ts', resolveDir: join(stage, 'apps/mobile/scripts') }
        })
      },
    },
  ],
})
writeFileSync(
  join(out, 'index.html'),
  '<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'self\'"><script src="bundle.js"></script>',
)
const { _electron: electron } = req('playwright-core')
const electronMain = join(out, 'main.cjs')
writeFileSync(
  electronMain,
  `const {app,BrowserWindow}=require('electron');app.whenReady().then(()=>{const w=new BrowserWindow({show:false,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});w.loadFile(${JSON.stringify(join(out, 'index.html'))})});`,
)
const app = await electron.launch({
  executablePath: req('electron'),
  args: ['--no-sandbox', '--disable-gpu', electronMain],
  env: { ...process.env, DISPLAY: process.env.DISPLAY ?? ':99', ELECTRON_DISABLE_SANDBOX: '1' },
})
let report: any
try {
  const page = await app.firstWindow()
  let networkRequests = 0
  page.on('request', (r) => {
    if (/^https?:/.test(r.url())) networkRequests++
  })
  await page.waitForFunction(() => typeof (window as any).runPreservation === 'function')
  report = await page.evaluate((cases) => (window as any).runPreservation(cases), fixtures)
  report.networkRequests = networkRequests
  report.browserDependencies = Object.fromEntries(
    ['buffer', 'pako', 'crc-32', 'cfb', '@noble/hashes'].map((name) => [
      name,
      JSON.parse(readFileSync(join(stage, 'node_modules', name, 'package.json'), 'utf8')).version,
    ]),
  )
  report.scope =
    'Actual mobile Vite adapter + browser primitives in sandboxed Electron Chromium, not Android WebView or rhwp-studio UI'
  report.baselineMobileRef = '8fcc0505930c168b92baef404be0bdeed185e49a'
  report.variant = args.includes('--candidate')
    ? 'private candidate, not upstream implementation'
    : 'reviewed upstream adapter'
  report.adapterHashes = Object.fromEntries(
    [script, ...['crypto', 'zlib', 'cfb'].map((n) => join(browserDir, n + '.ts'))].map((p) => [
      p.split('/').pop(),
      createHash('sha256').update(readFileSync(p)).digest('hex'),
    ]),
  )
} finally {
  await app.close()
}
writeFileSync(join(out, 'browser-preservation-report.json'), JSON.stringify(report, null, 2) + '\n')
for (const r of report.results) console.log(r.id + ': ' + r.status)
console.log('No Node globals:', report.noNodeGlobal, 'HTTP requests:', report.networkRequests)
process.exitCode =
  report.noNodeGlobal &&
  report.networkRequests === 0 &&
  report.results.every((r: any) => r.status === 'PASS')
    ? 0
    : 1
