import { useAuth } from './auth/session'

function App() {
  const { displayName, isLoading, login, logout } = useAuth()

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-navy-900 to-navy-950 px-6 text-center">
      <div className="max-w-xl">
        <picture>
          <source srcSet="/logo/civicdog-mark-white-bg.webp" type="image/webp" />
          <img
            src="/logo/civicdog-mark-white-bg.png"
            alt=""
            width={112}
            height={112}
            className="mx-auto h-28 w-28"
          />
        </picture>

        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-blue-300">
          Customer Portal
        </p>

        <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
          <span className="text-white">Civic</span>
          <span className="text-blue-400">Dog</span> Portal is coming soon.
        </h1>

        <p className="mt-6 text-lg text-blue-100">
          Manage your API keys and track usage — all in one place. We're building it now.
        </p>

        {!isLoading && (
          <div className="mt-8">
            {displayName ? (
              <div className="flex items-center justify-center gap-3">
                <span className="text-base font-medium text-white">Hi, {displayName}</span>
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
                className="rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-400"
              >
                Log in / Sign up
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
