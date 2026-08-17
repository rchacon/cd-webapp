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
    },
  },
})
