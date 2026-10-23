import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

// Intercept every request. This test uses synthetic Google responses, not a live account.
const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist')
const origin = 'https://mobile.example'
const files = new Map()
let creates = 0,
  writes = 0
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
  await page.route('**/*', async (route) => {
    const req = route.request(),
      url = new URL(req.url())
    const reply = (body, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        headers: {
          'access-control-allow-origin': origin,
          'access-control-allow-headers': 'authorization,content-type',
          'access-control-allow-methods': 'GET,POST,OPTIONS',
        },
        body: JSON.stringify(body),
      })
    if (url.origin === origin) {
      assert.ok(
        url.pathname === '/' ||
          /^\/(?:assets\/[\w.-]+|index.html|sw.js|[A-Z-]+.txt)$/.test(url.pathname),
      )
      const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1)
      await route.fulfill({
        contentType: file.endsWith('.js')
          ? 'text/javascript'
          : file.endsWith('.css')
            ? 'text/css'
            : 'text/html',
        body: await readFile(join(dist, file)),
      })
      return
    }
    if (url.href === 'https://accounts.google.com/gsi/client') {
      await route.fulfill({
        contentType: 'text/javascript',
        body: `window.google={accounts:{oauth2:{initTokenClient:options=>({requestAccessToken:()=>options.callback({access_token:'synthetic-drive-token',expires_in:2700,scope:options.scope})})}}}`,
      })
      return
    }
    assert.ok(['https://www.googleapis.com', 'https://docs.googleapis.com'].includes(url.origin))
    if (req.method() === 'OPTIONS') return reply({})
    assert.equal((await req.allHeaders()).authorization, 'Bearer synthetic-drive-token')
    if (url.pathname === '/drive/v3/about')
      return reply({ user: { permissionId: 'synthetic-account' } })
    if (url.pathname === '/drive/v3/files') {
      if (req.method() === 'POST') {
        const body = req.postDataJSON(),
          id = 'native-source-' + ++creates
        assert.equal(body.mimeType, 'application/vnd.google-apps.document')
        assert.equal(body.appProperties.genofficeSourceDocs, '1')
        const file = { id, name: body.name, text: '', revision: 1, mimeType: body.mimeType }
        files.set(id, file)
        return reply(file)
      }
      return reply({ files: Array.from(files.values()) })
    }
    const match = /^\/v1\/documents\/([\w-]+)(:batchUpdate)?$/.exec(url.pathname)
    assert.ok(match)
    const file = files.get(match[1])
    assert.ok(file)
    if (match[2]) {
      const body = req.postDataJSON()
      if (body.writeControl.requiredRevisionId !== String(file.revision))
        return reply({ error: 'conflict' }, 400)
      for (const request of body.requests) {
        if (request.deleteContentRange) {
          const range = request.deleteContentRange.range
          assert.equal(range.tabId, 'body-tab')
          file.text = file.text.slice(0, range.startIndex - 1) + file.text.slice(range.endIndex - 1)
        } else {
          assert.equal(request.insertText.location.tabId, 'body-tab')
          const index = request.insertText.location.index - 1
          file.text = file.text.slice(0, index) + request.insertText.text + file.text.slice(index)
        }
      }
      file.revision++
      writes++
      return reply({ writeControl: { requiredRevisionId: String(file.revision) } })
    }
    let index = 1
    const content = [{ startIndex: 0, endIndex: 1, sectionBreak: {} }]
    for (const line of (file.text + '\n').match(/[^\n]*\n/g)) {
      content.push({
        startIndex: index,
        endIndex: index + line.length,
        paragraph: {
          elements: [
            {
              startIndex: index,
              endIndex: index + line.length,
              textRun: { content: line, textStyle: {} },
            },
          ],
          paragraphStyle: { namedStyleType: 'NORMAL_TEXT' },
        },
      })
      index += line.length
    }
    return reply({
      documentId: file.id,
      title: file.name,
      revisionId: String(file.revision),
      tabs: [{ tabProperties: { tabId: 'body-tab' }, documentTab: { body: { content } } }],
    })
  })
  await page.goto(origin)
  await page.getByRole('button', { name: 'New document', exact: true }).click()
  await page.locator('textarea').fill('phone source 😀\n')
  const panel = page.locator('.drive-panel')
  await panel.locator('summary').click()
  await panel.locator('input').fill('synthetic-client.apps.googleusercontent.com')
  await panel.getByRole('button', { name: 'Save login setup', exact: true }).click()
  await panel.getByRole('button', { name: 'Connect Drive', exact: true }).click()
  const docs = panel.locator('.google-docs-panel')
  await docs.getByRole('button', { name: 'Sync this document', exact: true }).click()
  await docs.getByRole('link', { name: 'Open Google document', exact: true }).waitFor()
  const remote = Array.from(files.values())[0]
  assert.equal(remote.text, 'phone source 😀\n')
  await page.locator('textarea').fill('phone changed')
  await docs.getByRole('button', { name: 'Sync this document', exact: true }).click()
  await docs.getByRole('status').filter({ hasText: 'Synchronization complete' }).waitFor()
  assert.equal(remote.text, 'phone changed')
  remote.text = 'external Google edit'
  remote.revision++
  await docs.getByRole('button', { name: 'Sync this document', exact: true }).click()
  await docs.getByRole('status').filter({ hasText: 'Synchronization complete' }).waitFor()
  assert.equal(await page.locator('textarea').inputValue(), 'external Google edit')
  const saved = await page.evaluate(() => JSON.stringify(localStorage))
  assert.ok(!saved.includes('synthetic-drive-token'))
  assert.equal(creates, 1)
  assert.equal(writes, 2)
  console.log(
    'PASS: built phone UI, public OAuth setup, native Google document create/edit/pull, stable ID and no persisted token. Synthetic Google only; no PC document server.',
  )
} finally {
  await browser.close()
}
