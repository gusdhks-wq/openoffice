import { sha1 } from '@noble/hashes/legacy.js'
import { bytesToHex } from '@noble/hashes/utils.js'

/** SHA-1 is only the desktop helper's content identity key, never an authorization primitive. */
export function createHash(algorithm: string) {
  if (algorithm !== 'sha1') throw new Error('Unsupported digest')
  const hash = sha1.create()
  return {
    update(bytes: Uint8Array) {
      hash.update(bytes)
      return this
    },
    digest(encoding: string) {
      if (encoding !== 'hex') throw new Error('Unsupported encoding')
      return bytesToHex(hash.digest())
    },
  }
}
