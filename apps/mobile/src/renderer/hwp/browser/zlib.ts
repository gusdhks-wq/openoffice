import { Buffer } from 'buffer'
import { Inflate, deflateRaw } from 'pako'
import CRC32 from 'crc-32'

export function inflateRawSync(bytes: Uint8Array): Buffer {
  const inflater = new Inflate({ raw: true, chunkSize: 65536 })
  const chunks: Uint8Array[] = []
  let length = 0
  inflater.onData = (chunk: Uint8Array) => {
    length += chunk.length
    if (length > 64 * 1024 * 1024) throw new Error('HWP stream exceeds decompression budget')
    chunks.push(chunk)
  }
  inflater.push(bytes, true)
  if (inflater.err) throw new Error('Invalid compressed HWP stream')
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)))
}
export function deflateRawSync(bytes: Uint8Array): Buffer {
  return Buffer.from(deflateRaw(bytes))
}
export function crc32(bytes: Uint8Array): number {
  return CRC32.buf(bytes) >>> 0
}
