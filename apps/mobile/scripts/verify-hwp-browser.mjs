import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import init, { HwpDocument } from '@rhwp/core'

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const origin = 'https://mobile.example'
// Every precached asset must also pass the optional public gateway's static allowlist.
const worker = await readFile(resolve(app, 'dist/sw.js'), 'utf8')
const precache = JSON.parse(/const FILES = (\[[^;]+\]);/.exec(worker)[1])
for (const file of precache) {
  assert.match(
    file,
    /^\.\/(?:index\.html|LICENSE\.txt|NOTICE\.txt|THIRD-PARTY-NOTICES\.txt|assets\/[A-Za-z0-9_.-]+)$/,
  )
  await readFile(resolve(app, 'dist', file))
}
await init({ module_or_path: await readFile(resolve(app, '../../vendor/rhwp-core/rhwp_bg.wasm')) })
const fixture = HwpDocument.createEmpty()
fixture.createBlankDocument()
fixture.insertText(0, 0, 0, 'Original body')
fixture.splitParagraph(0, 0, fixture.getParagraphLength(0, 0))
fixture.pasteHtml(0, 1, 0, '<table><tr><td>Cell anchor</td><td>Keep this cell</td></tr></table>')
const sourceBytes = Buffer.from(fixture.exportHwp())
const sourceHwpx = Buffer.from(fixture.exportHwpx())
fixture.free()
const browser = await chromium.launch(
  process.env.GENOFFICE_TEST_CHROMIUM
    ? { executablePath: process.env.GENOFFICE_TEST_CHROMIUM, args: ['--no-sandbox'] }
    : { channel: 'chrome' },
)
try {
  const page = await browser.newPage({
    locale: 'en-US',
    viewport: { width: 412, height: 915 },
    serviceWorkers: 'block',
  })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    assert.equal(url.origin, origin, 'HWP editing must not make an external request')
    assert.ok(url.pathname === '/' || /^\/(?:assets\/[\w.-]+|index.html)$/.test(url.pathname))
    const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1)
    await route.fulfill({
      contentType: file.endsWith('.js')
        ? 'text/javascript'
        : file.endsWith('.css')
          ? 'text/css'
          : file.endsWith('.wasm')
            ? 'application/wasm'
            : 'text/html',
      body: await readFile(resolve(app, 'dist', file)),
    })
  })
  await page.goto(origin)
  await page.waitForFunction(
    () => globalThis.document.querySelector('.hwp-panel button')?.disabled === false,
  )
  await page
    .locator('.hwp-panel input[type=file]')
    .setInputFiles({ name: 'sample.hwp', mimeType: 'application/x-hwp', buffer: sourceBytes })
  await page
    .locator('.hwp-panel h2')
    .waitFor({ timeout: 10000 })
    .catch(async (error) => {
      console.log(await page.locator('.hwp-panel').innerText(), errors)
      throw error
    })
  assert.equal(await page.locator('.hwp-panel [role=alert]').count(), 0)
  const dimensions = await page
    .locator('.hwp-panel canvas')
    .evaluate((canvas) => ({ width: canvas.width, height: canvas.height }))
  assert.ok(dimensions.width > 300 && dimensions.height > 300, JSON.stringify(dimensions))
  const before = await page.locator('.hwp-panel canvas').evaluate((canvas) => canvas.toDataURL())
  await page.getByLabel('Text to replace · unique phrase', { exact: true }).fill('Cell anchor')
  await page.getByLabel('Replacement text', { exact: true }).fill('Edited table cell')
  await page.getByRole('button', { name: 'Replace and save locally', exact: true }).click()
  await page.waitForFunction(
    () => !globalThis.document.querySelector('.hwp-panel button')?.disabled,
  )
  assert.equal(await page.locator('.hwp-panel [role=alert]').count(), 0)
  const after = await page.locator('.hwp-panel canvas').evaluate((canvas) => canvas.toDataURL())
  assert.notEqual(after, before, 'the edited table must be redrawn')
  const backupDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export workspace backup', exact: true }).click()
  const backup = JSON.parse(await readFile(await (await backupDownload).path(), 'utf8'))
  assert.equal(backup.operations.length, 1)
  assert.equal(backup.operations[0].replacement, 'Edited table cell')
  assert.deepEqual(Buffer.from(backup.original, 'base64'), sourceBytes)
  const originalDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export original · before edits', exact: true }).click()
  const download = await originalDownload
  assert.equal(download.suggestedFilename(), 'sample.hwp')
  const content = await readFile(await download.path())
  assert.deepEqual(content, sourceBytes)
  await page.reload()
  await page.getByRole('button', { name: 'sample.hwp', exact: true }).click()
  await page.locator('.hwp-panel h2').waitFor()
  assert.equal(await page.locator('.hwp-panel [role=alert]').count(), 0)
  assert.equal(
    await page.locator('.hwp-panel canvas').evaluate((canvas) => canvas.toDataURL()),
    after,
  )
  await page.getByRole('button', { name: 'Undo last edit', exact: true }).click()
  await page.waitForFunction(
    () => !globalThis.document.querySelector('.hwp-panel button')?.disabled,
  )
  assert.equal(
    await page.locator('.hwp-panel canvas').evaluate((canvas) => canvas.toDataURL()),
    before,
  )
  await page
    .locator('.hwp-panel input[type=file]')
    .setInputFiles({ name: 'sample.hwpx', mimeType: 'application/hwp+zip', buffer: sourceHwpx })
  await page.getByRole('heading', { name: 'sample.hwpx', exact: true }).waitFor()
  await page.getByLabel('Text to replace · unique phrase', { exact: true }).fill('Original body')
  await page.getByLabel('Replacement text', { exact: true }).fill('Edited HWPX body')
  await page.getByRole('button', { name: 'Replace and save locally', exact: true }).click()
  await page.waitForFunction(
    () => !globalThis.document.querySelector('.hwp-panel button')?.disabled,
  )
  assert.equal(await page.locator('.hwp-panel [role=alert]').count(), 0)
  assert.deepEqual(errors, [])
  console.log(
    'PASS: production mobile HWP/HWPX WASM loads offline, renders a table, edits cells, backs up, exports exact original bytes, recovers after reload and undoes edits. No external network and no native-save claim.',
  )
} finally {
  await browser.close()
}
