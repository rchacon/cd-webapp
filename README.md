# CivicDog Webapp

Customer portal for managing API keys and tracking usage.

Currently a placeholder "coming soon" page — no API integration yet
(the backend GraphQL service, `cd-server`, doesn't exist yet either — it will
live in the `cd-platform` monorepo).

## Stack

- React 19 + TypeScript, built with Vite
- Tailwind CSS v4 (CSS-first `@theme` config, no `tailwind.config.js`)
- Brand palette/assets mirrored from `cd-website` for visual consistency

## Development

Requires Node >= 22.12.0.

```bash
npm install
npm run dev      # start dev server
npm run build     # type-check and build for production
npm run preview   # preview the production build locally
npm run lint       # run oxlint
```
