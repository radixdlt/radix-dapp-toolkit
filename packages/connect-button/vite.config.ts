import { defineConfig } from 'vite'
import minifyHTML from 'rollup-plugin-minify-html-literals'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'connect-button',
    },
    rollupOptions: {
      external: /^lit/,
    },
  },
  // @ts-ignore
  plugins: [minifyHTML.default()],
})
