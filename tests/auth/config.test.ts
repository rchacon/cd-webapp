import { describe, it, expect } from 'vitest'
import { buildLoginUrl, buildLogoutUrl, tokenEndpoint, redirectUri, clientId } from '../../src/auth/config'

describe('config', () => {
  it('exposes clientId and tokenEndpoint from the env-configured domain', () => {
    expect(clientId).toBe('test-client-id')
    expect(tokenEndpoint).toBe('https://auth.test.civicdog.com/oauth2/token')
  })

  it('builds redirectUri from the current origin', () => {
    expect(redirectUri).toBe('http://localhost:3000/callback')
  })
})

describe('buildLoginUrl', () => {
  it('builds a login URL with all required PKCE query params', () => {
    const url = new URL(buildLoginUrl('the-challenge', 'the-state'))

    expect(url.origin + url.pathname).toBe('https://auth.test.civicdog.com/login')
    expect(url.searchParams.get('client_id')).toBe('test-client-id')
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('scope')).toBe('openid email profile')
    expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:3000/callback')
    expect(url.searchParams.get('code_challenge')).toBe('the-challenge')
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    expect(url.searchParams.get('state')).toBe('the-state')
  })
})

describe('buildLogoutUrl', () => {
  it('builds a logout URL pointing back at the app root', () => {
    const url = new URL(buildLogoutUrl())

    expect(url.origin + url.pathname).toBe('https://auth.test.civicdog.com/logout')
    expect(url.searchParams.get('client_id')).toBe('test-client-id')
    expect(url.searchParams.get('logout_uri')).toBe('http://localhost:3000/')
  })
})
