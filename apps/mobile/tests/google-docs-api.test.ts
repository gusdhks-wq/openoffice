import { describe, expect, it, vi } from 'vitest'
import { createGoogleDocsRemote, readGoogleSource } from '../src/renderer/drive/google-docs'

function document(text = 'A😀\nB\n') {
  let index = 1
  const content: object[] = [{ startIndex: 0, endIndex: 1, sectionBreak: {} }]
  for (const line of (text + '\n').match(/[^\n]*\n/g) || []) {
    content.push({
      startIndex: index,
      endIndex: index + line.length,
      paragraph: {
        paragraphStyle: { namedStyleType: 'NORMAL_TEXT' },
        elements: [
          {
            startIndex: index,
            endIndex: index + line.length,
            textRun: { content: line, textStyle: {} },
          },
        ],
      },
    })
    index += line.length
  }
  return {
    documentId: 'doc-id',
    title: 'source.md',
    revisionId: 'revision-current',
    tabs: [
      {
        tabProperties: { tabId: 'tab-id' },
        documentTab: { body: { content } },
      },
    ],
  }
}
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status })
describe('native Google Docs API boundary', () => {
  it('keeps real paragraph breaks, UTF-16 indexes and one terminal Google newline distinct', () => {
    expect(readGoogleSource(document()).text).toBe('A😀\nB\n')
    expect(readGoogleSource(document('')).text).toBe('')
    const malformed = document() as any
    delete malformed.documentId
    expect(() => readGoogleSource(malformed)).toThrow('drive-structure')
  })
  it('refuses tables, images, formatted runs, headings, suggestions and extra tabs without flattening them', () => {
    const variants = [
      (doc: any) => {
        doc.tabs.push(doc.tabs[0])
      },
      (doc: any) => {
        doc.tabs[0].documentTab.body.content[1] = { table: {} }
      },
      (doc: any) => {
        doc.tabs[0].documentTab.body.content[1].paragraph.elements[0] = { inlineObjectElement: {} }
      },
      (doc: any) => {
        doc.tabs[0].documentTab.body.content[1].paragraph.elements[0].textRun.textStyle = {
          bold: true,
        }
      },
      (doc: any) => {
        doc.tabs[0].documentTab.body.content[1].paragraph.paragraphStyle.namedStyleType =
          'HEADING_1'
      },
      (doc: any) => {
        doc.tabs[0].documentTab.body.content[1].paragraph.elements[0].textRun.suggestedInsertionIds =
          ['suggestion']
      },
    ]
    for (const change of variants) {
      const doc = document()
      change(doc)
      expect(() => readGoogleSource(doc)).toThrow('drive-structure')
    }
  })
  it('guards native batch writes with requiredRevisionId and tab-specific UTF-16 ranges', async () => {
    const fetcher = vi.fn(async () => json({})),
      remote = createGoogleDocsRemote(
        () => 'synthetic',
        async () => 'account',
        fetcher,
      )
    const base = readGoogleSource(document())
    await remote.update(base, '새 문서\n')
    const [url, options] = fetcher.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://docs.googleapis.com/v1/documents/doc-id:batchUpdate')
    const body = JSON.parse(options.body as string)
    expect(body.writeControl).toEqual({ requiredRevisionId: 'revision-current' })
    expect(body.requests[0].deleteContentRange.range).toEqual({
      startIndex: 1,
      endIndex: base.text.length + 1,
      tabId: 'tab-id',
    })
    expect(body.requests[1].insertText.location).toEqual({ index: 1, tabId: 'tab-id' })
    expect(options.redirect).toBe('error')
    expect(options.cache).toBe('no-store')
    expect(options.headers).toMatchObject({ Authorization: 'Bearer synthetic' })
  })
  it('treats Google revision rejection as a conflict and never retries a mutation itself', async () => {
    const fetcher = vi.fn(async () => json({ error: 'revision mismatch' }, 400)),
      remote = createGoogleDocsRemote(
        () => 'synthetic',
        async () => 'account',
        fetcher,
      )
    await expect(remote.update(readGoogleSource(document()), 'new')).rejects.toThrow(
      'drive-conflict',
    )
    expect(fetcher).toHaveBeenCalledTimes(1)
    await expect(remote.read('https://evil.example')).rejects.toThrow('drive-invalid')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
