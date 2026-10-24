import * as CFB from 'cfb'
import { Buffer } from 'buffer'

export const read = CFB.read
export const find = CFB.find
export const utils = CFB.utils

/** CFB intentionally returns Uint8Array in browsers; desktop helpers require Buffer methods. */
export function write(container: CFB.CFB$Container, options: { type: string }): Buffer {
  if (options.type !== 'buffer') throw new Error('Unsupported browser container output')
  const bytes = CFB.write(container, { type: 'array' }) as Uint8Array
  return Buffer.from(bytes)
}
