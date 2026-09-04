import { describe, it, expect, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { parseRoute, memberPath, navigate, useRoute } from '../../src/lib/router'

afterEach(() => {
  window.history.pushState({}, '', '/')
})

describe('parseRoute', () => {
  it('maps / to the home route', () => {
    expect(parseRoute('/')).toEqual({ name: 'home' })
  })

  it('maps /member/:bioguideId to the member route', () => {
    expect(parseRoute('/member/K000401')).toEqual({ name: 'member', bioguideId: 'K000401' })
  })

  it('decodes a percent-encoded id', () => {
    expect(parseRoute('/member/K%20401')).toEqual({ name: 'member', bioguideId: 'K 401' })
  })

  it('falls back to home for an empty id or extra path segments', () => {
    expect(parseRoute('/member/')).toEqual({ name: 'home' })
    expect(parseRoute('/member/K000401/votes')).toEqual({ name: 'home' })
    expect(parseRoute('/something-else')).toEqual({ name: 'home' })
  })
})

describe('memberPath', () => {
  it('round-trips through parseRoute', () => {
    expect(parseRoute(memberPath('K000401'))).toEqual({ name: 'member', bioguideId: 'K000401' })
  })

  it('percent-encodes the id', () => {
    expect(memberPath('a/b')).toBe('/member/a%2Fb')
  })
})

describe('useRoute', () => {
  it('reflects the current path and updates on navigate() and popstate', () => {
    const { result } = renderHook(() => useRoute())
    expect(result.current).toEqual({ name: 'home' })

    act(() => navigate('/member/K000401'))
    expect(result.current).toEqual({ name: 'member', bioguideId: 'K000401' })

    // A back/forward navigation: the browser changes the URL first, then
    // fires popstate.
    act(() => {
      window.history.pushState({}, '', '/')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(result.current).toEqual({ name: 'home' })
  })
})

describe('navigate', () => {
  it('pushes a new history entry', () => {
    navigate('/member/K000401')
    expect(window.location.pathname).toBe('/member/K000401')
  })

  it('is a no-op when the target equals the current path', () => {
    navigate('/member/K000401')
    const spy = vi.spyOn(window.history, 'pushState')
    navigate('/member/K000401')
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
