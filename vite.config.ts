import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative paths so the same build works on localhost, on a custom domain,
  // and under https://<user>.github.io/<repo>/ without extra configuration.
  base: './',
  server: {
    // Lets you open the dev server on your phone over the LAN.
    host: true,
  },
})
