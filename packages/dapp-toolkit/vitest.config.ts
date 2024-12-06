/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.testing-module.ts'],
      reporter: ['lcov', 'text', 'html'],
    },
    include: ['src/**/*.spec.ts'],
  },
})
