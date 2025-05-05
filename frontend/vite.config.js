import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(),tailwindcss(),],
  server: {
    port: 5173,
    host: true, // Allow external access (e.g., for testing on other devices)
    hmr: {
      host: 'localhost',
      port: 5173,
      protocol: 'ws', // Use ws (not wss) for development
    },
  },
});