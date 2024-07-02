import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/connect-button.ts'],
  dts: true,
  format: ['esm', 'cjs'],
  noExternal: ['@radixdlt/connect-button', 'radix-connect-common'],
})
