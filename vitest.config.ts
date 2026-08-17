import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    globals: false,
    env: {
      VITE_COGNITO_DOMAIN: 'auth.test.civicdog.com',
      VITE_COGNITO_CLIENT_ID: 'test-client-id',
      // Pinned so the suite doesn't depend on whatever .env.local happens to
      // be set to on a given machine (e.g. pointed at a live deployment).
      VITE_CD_SERVER_URL: 'http://localhost:8000/graphql',
    },
  },
})
