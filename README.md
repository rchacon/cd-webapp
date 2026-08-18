# CivicDog Webapp

The CivicDog web application: look up your U.S. representatives and
senators by state and district, or by address, with Cognito-based
sign-in.

## Stack

- React 19 + TypeScript, built with Vite
- Tailwind CSS v4 (CSS-first `@theme` config, no `tailwind.config.js`)
- Brand palette/assets mirrored from `cd-website` for visual consistency
- Vitest + React Testing Library for tests

## Development

Requires Node >= 22.12.0.

```bash
npm install
npm run dev      # start dev server
npm run build    # type-check and build for production
npm test         # run the test suite
npm run preview  # preview the production build locally
npm run lint     # run oxlint
```
