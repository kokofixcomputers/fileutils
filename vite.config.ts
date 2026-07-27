import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths so the build works whether it's served from the
  // domain root or a subpath (e.g. GitHub Pages project sites).
  base: './',
  plugins: [react(), tailwindcss()],
})
