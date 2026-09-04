import { useAuth } from './auth/session'
import { LookupForm } from './components/LookupForm'
import { MemberDetailPage } from './components/MemberDetailPage'
import { useRoute } from './lib/router'

function App() {
  const { displayName, isLoading, login, logout } = useAuth()
  const route = useRoute()

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-navy-900 to-navy-950">
      <header className="flex items-center justify-between gap-4 px-6 py-4">
        <a href="https://civicdog.com" className="flex items-center gap-3">
          <picture>
            <source srcSet="/logo/civicdog-mark-white-bg.webp" type="image/webp" />
            <img
              src="/logo/civicdog-mark-white-bg.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8"
            />
          </picture>
          <span className="text-lg font-bold tracking-tight">
            <span className="text-white">Civic</span>
            <span className="text-blue-400">Dog</span>
          </span>
        </a>

        {!isLoading &&
          (displayName ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-white">Hi, {displayName}</span>
              <span className="text-blue-300/50" aria-hidden="true">
                ·
              </span>
              <button
                type="button"
                onClick={logout}
                className="text-sm font-medium text-blue-300 underline decoration-blue-300/40 underline-offset-4 transition-colors hover:text-blue-200"
              >
                Log out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={login}
              className="rounded-full bg-blue-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-400"
            >
              Log in / Sign up
            </button>
          ))}
      </header>

      <main className="flex-1 px-6 pb-16">
        {/* LookupForm stays mounted (just hidden) across the member route,
            rather than unmounting on navigate, so its search results and
            in-progress query survive a visit to a member's detail page --
            Back restores the list instead of re-fetching getStates() and
            resetting chamber/state/district to defaults. */}
        <div hidden={route.name === 'member'}>
          <LookupForm />
        </div>
        {route.name === 'member' && (
          <MemberDetailPage key={route.bioguideId} bioguideId={route.bioguideId} />
        )}
      </main>

      <footer className="border-t border-white/10 px-6 py-6 text-xs text-blue-300">
        &copy; {new Date().getFullYear()} CivicDog. All rights reserved.
      </footer>
    </div>
  )
}

export default App
