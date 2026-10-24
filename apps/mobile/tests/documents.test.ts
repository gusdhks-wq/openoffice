import { describe, expect, it } from 'vitest'
import {
  exportDocument,
  importDocument,
  MAX_IMPORT_BYTES,
  updateDocument,
} from '../src/renderer/documents'

const bytes = (raw: string) => new TextEncoder().encode(raw)
describe('mobile source file fidelity', () => {
  for (const raw of [
    '\uFEFF# 제목\r\n\r\n내용\r\n',
    'first\r\nsecond\nthird\r',
    'no final newline',
    '',
    '[link][ref]\n\n[ref]: https://example.org\n\n<!-- retained -->\n',
  ]) {
    it(`preserves an untouched file ${JSON.stringify(raw)}`, () => {
      expect(bytes(exportDocument(importDocument('note.md', bytes(raw))))).toEqual(bytes(raw))
    })
  }
  it('retains BOM, CRLF and final newline after a Korean edit', () => {
    const doc = importDocument('note.md', bytes('\uFEFF# 제목\r\n본문\r\n'))
    expect(exportDocument(updateDocument(doc, doc.text.replace('본문', '수정')))).toBe(
      '\uFEFF# 제목\r\n수정\r\n',
    )
  })
  it('keeps plain text literal and advances the revision', () => {
    const doc = importDocument('literal.txt', bytes('---\n*x*\n1. raw'))
    expect(doc.text).toBe('---\n*x*\n1. raw')
    expect(updateDocument(doc, 'changed').revision).toBe(2)
  })
  it('rejects unsupported, oversized, binary and non UTF-8 imports', () => {
    for (const [name, data] of [
      ['file.docx', bytes('x')],
      ['file.md', new Uint8Array(MAX_IMPORT_BYTES + 1)],
      ['file.txt', bytes('\0')],
      ['file.md', new Uint8Array([0xff])],
    ] as const) {
      expect(() => importDocument(name, data)).toThrow()
    }
  })
})
