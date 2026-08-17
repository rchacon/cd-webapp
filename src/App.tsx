import { useAuth } from './auth/session'
import { LookupForm } from './components/LookupForm'

function App() {
  const { displayName, isLoading, login, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-900 to-navy-950">
      <header className="flex items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
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
        </div>

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

      <main className="px-6 pb-16">
        <LookupForm />
      </main>
    </div>
  )
}

export default App
