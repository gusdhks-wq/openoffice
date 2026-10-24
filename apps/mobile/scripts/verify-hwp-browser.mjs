import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import init, { HwpDocument } from '@rhwp/core'
import * as CFB from 'cfb'
import { deflateRawSync, inflateRawSync } from 'node:zlib'

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const origin = 'https://mobile.example'
const allowed =
  /^\/(?:index\.html|LICENSE\.txt|NOTICE\.txt|THIRD-PARTY-NOTICES\.txt|assets\/[A-Za-z0-9_.-]+|studio\/(?:(?:assets|icons|images)\/)?[A-Za-z0-9_-][A-Za-z0-9_.-]*)$/
const worker = await readFile(resolve(app, 'dist/sw.js'), 'utf8')
for (const file of JSON.parse(/const FILES = (\[[^;]+\]);/.exec(worker)[1])) {
  assert.match(file.slice(1), allowed)
  await readFile(resolve(app, 'dist', file))
}
await init({ module_or_path: await readFile(resolve(app, '../../vendor/rhwp-core/rhwp_bg.wasm')) })
const fixture = HwpDocument.createEmpty()
fixture.createBlankDocument()
fixture.insertText(0, 0, 0, 'Original body')
fixture.splitParagraph(0, 0, fixture.getParagraphLength(0, 0))
fixture.pasteHtml(0, 1, 0, '<table><tr><td>Cell anchor</td><td>Keep this cell</td></tr></table>')
function record(tag, level, payload) {
  const header = Buffer.alloc(4)
  header.writeUInt32LE((tag | (level << 10) | (payload.length << 20)) >>> 0)
  return Buffer.concat([header, payload])
}
const masterHeader = Buffer.alloc(34)
masterHeader.writeUInt32LE(1, 0)
masterHeader.writeUInt32LE(67180, 8)
masterHeader.writeUInt32LE(51024, 12)
masterHeader.writeUInt8(4, 18)
const paragraph = Buffer.alloc(24)
paragraph.writeUInt32LE(0x80000001, 0)
paragraph.writeUInt16LE(1, 12)
paragraph.writeUInt16LE(1, 16)
const line = Buffer.alloc(36)
line.writeUInt32LE(1000, 8)
line.writeUInt32LE(1000, 12)
line.writeUInt32LE(850, 16)
const master = Buffer.concat([
  record(72, 1, masterHeader),
  record(66, 1, paragraph),
  record(68, 2, Buffer.alloc(8)),
  record(69, 2, line),
])
const container = CFB.read(Buffer.from(fixture.exportHwp()), { type: 'buffer' })
const section = CFB.find(container, '/BodyText/Section0')
CFB.utils.cfb_add(
  container,
  '/BodyText/Section0',
  deflateRawSync(Buffer.concat([inflateRawSync(Buffer.from(section.content)), master])),
)
const sources = {
  hwp: Buffer.from(CFB.write(container, { type: 'buffer' })),
  hwpx: Buffer.from(fixture.exportHwpx()),
}
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
    isMobile: true,
    hasTouch: true,
    serviceWorkers: 'block',
  })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    assert.equal(url.origin, origin, 'Editing must remain offline')
    assert.ok(url.pathname === '/' || allowed.test(url.pathname))
    const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1)
    const type = file.endsWith('.js')
      ? 'text/javascript'
      : file.endsWith('.css')
        ? 'text/css'
        : file.endsWith('.wasm')
          ? 'application/wasm'
          : file.endsWith('.svg')
            ? 'image/svg+xml'
            : file.endsWith('.png')
              ? 'image/png'
              : file.endsWith('.html')
                ? 'text/html'
                : 'application/octet-stream'
    await route.fulfill({ contentType: type, body: await readFile(resolve(app, 'dist', file)) })
  })
  await page.goto(origin)
  await page.waitForFunction(
    () => globalThis.document.querySelector('.hwp-panel button')?.disabled === false,
  )
  for (const format of ['hwp', 'hwpx']) {
    await page.locator('.hwp-panel input[type=file]').setInputFiles({
      name: `sample.${format}`,
      mimeType: format === 'hwp' ? 'application/x-hwp' : 'application/hwp+zip',
      buffer: sources[format],
    })
    await page
      .getByRole('heading', { name: `sample.${format}`, exact: true })
      .waitFor({ timeout: 30000 })
    const frame = page.frameLocator('.hwp-editor-instance iframe')
    const input = frame.locator('textarea[aria-label="문서 편집 입력"]')
    await page.getByRole('button', { name: 'Full screen', exact: true }).click()
    const full = await page.locator('.hwp-panel').boundingBox()
    assert.ok(full.width >= 400 && full.y === 0)
    await page.getByRole('button', { name: '100%', exact: true }).click()
    await frame.locator('#sb-zoom-display').filter({ hasText: '100%' }).waitFor()
    await input.focus()
    await input.press('Control+Home')
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Input.imeSetComposition', { text: '한', selectionStart: 1, selectionEnd: 1 })
    await cdp.send('Input.imeSetComposition', { text: '한글', selectionStart: 2, selectionEnd: 2 })
    await cdp.send('Input.insertText', { text: '한글 직접 입력 ' })
    await cdp.detach()
    await page.keyboard.insertText('Direct mobile edit ')
    await input.press('Enter')
    await page.keyboard.insertText('Second paragraph ')
    await input.press('Control+Home')
    await input.press('Control+Shift+ArrowRight')
    await input.press('Control+b')
    const downloadEvent = page.waitForEvent('download', { timeout: 30000 })
    await page.getByRole('button', { name: 'Save edited HWP/HWPX copy', exact: true }).click()
    let download
    try {
      download = await downloadEvent
    } catch (error) {
      console.log(await page.locator('.hwp-panel [role=alert]').allTextContents(), errors)
      throw error
    }
    assert.equal(download.suggestedFilename(), `sample.edited.${format}`)
    const bytes = await readFile(await download.path())
    if (format === 'hwp') {
      const saved = CFB.read(bytes, { type: 'buffer' })
      const section = inflateRawSync(Buffer.from(CFB.find(saved, '/BodyText/Section0').content))
      assert.ok(
        section.includes(master),
        'desktop master-page tail must survive the actual browser export',
      )
    }
    const reopened = new HwpDocument(bytes)
    try {
      const text = JSON.parse(reopened.getTextFileText())
      assert.ok(text.includes('Direct mobile edit'), text)
      assert.equal(text.split('한글 직접 입력').length - 1, 1, text)
      assert.equal(JSON.parse(reopened.getCharPropertiesAt(0, 0, 0)).bold, true)
      assert.ok(text.includes('Second paragraph'), text)
      assert.ok(text.includes('Original body'), text)
      assert.ok(text.includes('Keep this cell'), text)
    } finally {
      reopened.free()
    }
    assert.equal(await page.locator('.hwp-panel [role=alert]').count(), 0)
    await page.getByRole('button', { name: 'Exit full screen', exact: true }).click()
    const originalEvent = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export original · before edits', exact: true }).click()
    assert.deepEqual(await readFile(await (await originalEvent).path()), sources[format])
    await page.reload()
    await page.getByRole('button', { name: `sample.${format}`, exact: true }).click()
    await page.getByRole('heading', { name: `sample.${format}`, exact: true }).waitFor()
    const persistedEvent = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Save edited HWP/HWPX copy', exact: true }).click()
    const persisted = await readFile(await (await persistedEvent).path())
    const again = new HwpDocument(persisted)
    try {
      assert.ok(JSON.parse(again.getTextFileText()).includes('Second paragraph'))
    } finally {
      again.free()
    }
  }
  if (process.env.GENOFFICE_TEST_SCREENSHOT) {
    await page.getByRole('button', { name: 'Full screen', exact: true }).click()
    await page.getByRole('button', { name: '100%', exact: true }).click()
    await page
      .frameLocator('.hwp-editor-instance iframe')
      .locator('#sb-zoom-display')
      .filter({ hasText: '100%' })
      .waitFor()
    await page.screenshot({ path: process.env.GENOFFICE_TEST_SCREENSHOT, fullPage: true })
  }
  assert.deepEqual(errors, [])
  console.log(
    'PASS: built mobile HWP/HWPX editor, touch viewport, Korean IME, selected bold, fullscreen/zoom, native export/reopen with master-page tail, table text and original preservation, persisted reopen. No network, model or physical-device claim.',
  )
} finally {
  await browser.close()
}
