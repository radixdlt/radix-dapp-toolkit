import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  dts: true,
  format: ['esm', 'cjs'],
  noExternal: ['@radixdlt/connect-button', 'radix-connect-common'],
})
