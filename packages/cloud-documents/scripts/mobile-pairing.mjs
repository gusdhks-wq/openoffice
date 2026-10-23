import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'

const hash = (value) => createHash('sha256').update(value).digest()

/** One-use PC code and temporary phone sessions; neither owner keys nor tokens are persisted. */
export function createMobilePairing({ now = () => Date.now() } = {}) {
  let pending
  const sessions = new Map()
  function clean() {
    for (const [id, expires] of sessions) if (expires <= now()) sessions.delete(id)
  }
  return {
    issue() {
      const code = String(randomInt(10000000, 100000000))
      pending = { hash: hash(code), expires: now() + 180000, attempts: 0 }
      return code
    },
    redeem(code) {
      clean()
      if (!pending || pending.expires <= now() || pending.attempts >= 5) return null
      pending.attempts++
      if (
        typeof code !== 'string' ||
        !/^[0-9]{8}$/.test(code) ||
        !timingSafeEqual(hash(code), pending.hash) ||
        sessions.size >= 8
      )
        return null
      pending = undefined
      const token = 'phone_' + randomBytes(32).toString('hex')
      sessions.set(hash(token).toString('hex'), now() + 8 * 60 * 60 * 1000)
      return token
    },
    verify(token) {
      clean()
      return typeof token === 'string' && sessions.has(hash(token).toString('hex'))
    },
    revoke(token) {
      if (typeof token === 'string') sessions.delete(hash(token).toString('hex'))
    },
  }
}
