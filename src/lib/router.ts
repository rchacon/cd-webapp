import { useSyncExternalStore } from 'react'

// A deliberately tiny hand-rolled router, matching the same
// hand-rolled-over-library posture as src/auth/ and src/lib/cdServer.ts.
// The app has exactly two real screens -- the lookup form at `/` and a
// member detail page at `/member/:bioguideId` -- plus `/callback`, which
// src/auth/session.ts consumes and immediately rewrites to `/` before
// React renders, so it never reaches parseRoute(). Reach for a routing
// library only if a third screen with real nesting/params shows up.

export type Route = { name: 'home' } | { name: 'member'; bioguideId: string }

const MEMBER_PREFIX = '/member/'

export function parseRoute(pathname: string): Route {
  if (pathname.startsWith(MEMBER_PREFIX)) {
    const rest = pathname.slice(MEMBER_PREFIX.length)
    // Only a bare id -- no further path segments, no empty id.
    if (rest && !rest.includes('/')) {
      try {
        return { name: 'member', bioguideId: decodeURIComponent(rest) }
      } catch {
        // A malformed percent-sequence ("/member/%") makes
        // decodeURIComponent throw URIError. parseRoute runs during
        // render with no error boundary above it, so fall back to home
        // rather than white-screen the whole app.
        return { name: 'home' }
      }
    }
  }
  return { name: 'home' }
}

export function memberPath(bioguideId: string): string {
  return MEMBER_PREFIX + encodeURIComponent(bioguideId)
}

const listeners = new Set<() => void>()

export function navigate(path: string): void {
  if (path === window.location.pathname + window.location.search) return
  window.history.pushState(null, '', path)
  // history.pushState never scrolls; keep parity with index.html's
  // manual scroll-restoration (every fresh screen starts at the top).
  window.scrollTo(0, 0)
  for (const listener of listeners) listener()
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange)
  window.addEventListener('popstate', onChange)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener('popstate', onChange)
  }
}

export function useRoute(): Route {
  const pathname = useSyncExternalStore(
    subscribe,
    () => window.location.pathname,
    () => '/',
  )
  return parseRoute(pathname)
}
