import { describe, expect, it } from 'vitest'
import { createMobilePairing } from '../scripts/mobile-pairing.mjs'

describe('temporary phone pairing', () => {
  it('consumes a PC code once and revokes the independently minted phone credential', () => {
    const pairing = createMobilePairing(),
      code = pairing.issue()
    expect(code).toMatch(/^[0-9]{8}$/)
    expect(pairing.redeem('bad')).toBeNull()
    const token = pairing.redeem(code)
    expect(token).toMatch(/^phone_[a-f0-9]{64}$/)
    expect(pairing.verify(token)).toBe(true)
    expect(pairing.redeem(code)).toBeNull()
    pairing.revoke(token)
    expect(pairing.verify(token)).toBe(false)
  })
  it('expires codes, limits attempts, rotates codes without revoking sessions, and expires sessions', () => {
    let time = 0
    const pairing = createMobilePairing({ now: () => time }),
      old = pairing.issue()
    time = 180000
    expect(pairing.redeem(old)).toBeNull()
    const code = pairing.issue()
    for (let i = 0; i < 5; i++) expect(pairing.redeem('invalid')).toBeNull()
    expect(pairing.redeem(code)).toBeNull()
    const token = pairing.redeem(pairing.issue())
    pairing.issue()
    expect(pairing.verify(token)).toBe(true)
    time += 8 * 60 * 60 * 1000
    expect(pairing.verify(token)).toBe(false)
  })
  it('bounds active sessions and never accepts a token in a new connector instance', () => {
    const pairing = createMobilePairing()
    const tokens = Array.from({ length: 8 }, () => pairing.redeem(pairing.issue()))
    expect(tokens.every((token) => pairing.verify(token))).toBe(true)
    const next = pairing.issue()
    expect(pairing.redeem(next)).toBeNull()
    pairing.revoke(tokens[0])
    const replacement = pairing.redeem(next)
    expect(replacement).toBeTruthy()
    expect(createMobilePairing().verify(replacement)).toBe(false)
  })
})
