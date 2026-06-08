import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Server-side API handlers don't need a DOM environment
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
  },
})
