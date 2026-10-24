import { describe, expect, it, vi } from 'vitest'
const native = vi.hoisted(() => ({
  write: vi.fn(async () => ({ uri: 'file:///synthetic-export' })),
  share: vi.fn(async () => {}),
}))
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }))
vi.mock('@capacitor/filesystem', () => ({
  Directory: { Cache: 'CACHE' },
  Filesystem: { writeFile: native.write },
}))
vi.mock('@capacitor/share', () => ({ Share: { share: native.share } }))
import { downloadBytes, downloadDocument } from '../src/renderer/files'
import { importDocument } from '../src/renderer/documents'

describe('native byte-preserving export', () => {
  it('shares binary HWP bytes without applying UTF-8 encoding', async () => {
    await downloadBytes('../sample.hwp', new Uint8Array([0, 0xff, 0x80, 0x41]), 'application/x-hwp')
    expect(native.write).toHaveBeenLastCalledWith({
      path: '.._sample.hwp',
      directory: 'CACHE',
      data: 'AP+AQQ==',
    })
    expect(native.share).toHaveBeenLastCalledWith({ files: ['file:///synthetic-export'] })
  })
  it('keeps existing source exports including BOM and CRLF unchanged', async () => {
    const bytes = new TextEncoder().encode('\ufeff한글\r\n')
    await downloadDocument(importDocument('source.md', bytes))
    expect(native.write).toHaveBeenLastCalledWith({
      directory: 'CACHE',
      path: 'source.md',
      data: Buffer.from(bytes).toString('base64'),
    })
  })
})
