import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    reporters: ['dot', 'verbose'],
    silent: true,
    logHeapUsage: true,
    globals: true,
    globalSetup: ['./tests/globalSetup.ts'],
    // Automatically clean up after each test to ensure isolation
    clearMocks: true,
    restoreMocks: true,
    // Ensure tests run sequentially to avoid database conflicts
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
  plugins: [],
})
