import { describe, it, expect } from 'vitest'
import { displayUrl, formatMemberName, formatParty, isHttpUrl } from '../../src/lib/format'

const NAME_PARTS = {
  firstName: 'Jane',
  middleName: null,
  lastName: 'Doe',
  nickname: null,
  suffix: null,
}

describe('formatMemberName', () => {
  it('joins the present name parts in order', () => {
    expect(
      formatMemberName({ ...NAME_PARTS, middleName: 'Q', suffix: 'Jr.' }),
    ).toBe('Jane Q Doe Jr.')
  })

  it('prefers the nickname over the first name when set', () => {
    expect(formatMemberName({ ...NAME_PARTS, nickname: 'Janie' })).toBe('Janie Doe')
  })

  it('falls back to firstName when nickname is an empty string, not just null', () => {
    expect(formatMemberName({ ...NAME_PARTS, nickname: '' })).toBe('Jane Doe')
  })

  it('returns an empty string when every part is missing', () => {
    expect(
      formatMemberName({
        firstName: null,
        middleName: null,
        lastName: null,
        nickname: null,
        suffix: null,
      }),
    ).toBe('')
  })
})

describe('isHttpUrl', () => {
  it('accepts http and https URLs', () => {
    expect(isHttpUrl('http://example.gov')).toBe(true)
    expect(isHttpUrl('https://example.gov/path')).toBe(true)
  })

  it('rejects non-http(s) schemes', () => {
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpUrl('mailto:rep@example.gov')).toBe(false)
  })

  it('rejects strings that are not URLs', () => {
    expect(isHttpUrl('not a url')).toBe(false)
    expect(isHttpUrl('')).toBe(false)
  })
})

describe('formatParty', () => {
  it('title-cases the SHOUTING party names cd-server relays', () => {
    expect(formatParty('DEMOCRATIC')).toBe('Democratic')
    expect(formatParty('REPUBLICAN')).toBe('Republican')
    expect(formatParty('INDEPENDENT')).toBe('Independent')
  })

  it('title-cases each word of a hyphenated or multi-word name', () => {
    expect(formatParty('DEMOCRATIC-FARMER-LABOR')).toBe('Democratic-Farmer-Labor')
  })

  it('leaves an already mixed-case value alone', () => {
    expect(formatParty('Democratic')).toBe('Democratic')
  })
})

describe('displayUrl', () => {
  it('drops the scheme and any trailing slash', () => {
    expect(displayUrl('https://ocasio-cortez.house.gov/')).toBe('ocasio-cortez.house.gov')
    expect(displayUrl('http://example.gov')).toBe('example.gov')
  })

  it('keeps a path but still trims a trailing slash', () => {
    expect(displayUrl('https://example.gov/members/smith/')).toBe('example.gov/members/smith')
  })
})
