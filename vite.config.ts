import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'radix-dapp-toolkit',
    },
    rollupOptions: {
      external: /^lit/,
    },
  },
  define: { 'process.env.NODE_ENV': '"production"' },
})
