import { describe, it, expect } from 'vitest'
import { createPkcePair, generateState } from '../../src/auth/pkce'

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

describe('createPkcePair', () => {
  it('produces a verifier matching the base64url charset at RFC 7636 length', async () => {
    const { verifier } = await createPkcePair()

    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(verifier).toHaveLength(43)
  })

  it('produces a challenge equal to the SHA-256 + base64url of the verifier', async () => {
    const { verifier, challenge } = await createPkcePair()

    const expectedDigest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
    expect(challenge).toBe(base64UrlEncode(expectedDigest))
  })

  it('produces a different verifier on each call', async () => {
    const first = await createPkcePair()
    const second = await createPkcePair()

    expect(first.verifier).not.toBe(second.verifier)
  })
})

describe('generateState', () => {
  it('matches the base64url charset', () => {
    expect(generateState()).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('produces distinct values across repeated calls', () => {
    const values = new Set(Array.from({ length: 20 }, () => generateState()))

    expect(values.size).toBe(20)
  })
})
