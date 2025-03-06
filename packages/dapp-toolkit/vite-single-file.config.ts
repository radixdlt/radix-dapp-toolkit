import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  // @ts-expect-error
  plugins: [viteSingleFile()],

  build: {
    emptyOutDir: false,

    lib: {
      entry: 'src/single-file.js',
      name: 'RDT',
      fileName: 'radix-dapp-toolkit.bundle',
      formats: ['umd'],
    },
    rollupOptions: {
      output: {
        entryFileNames: `radix-dapp-toolkit.bundle.umd.js`,
      },
    },
  },
  define: { 'process.env.NODE_ENV': '"production"' },
})
