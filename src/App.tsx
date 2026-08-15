function App() {
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
      </div>
    </div>
  )
}

export default App
