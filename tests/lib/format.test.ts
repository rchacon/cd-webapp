import { describe, it, expect } from 'vitest'
import { formatMemberName, isHttpUrl } from '../../src/lib/format'

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
