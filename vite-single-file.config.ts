import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/single-file.js',
      name: 'RDT',
      fileName: 'radix-dapp-toolkit.bundle',
    },
  },
  define: { 'process.env.NODE_ENV': '"production"' },
})
