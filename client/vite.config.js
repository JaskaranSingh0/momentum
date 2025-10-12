import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Local dev
    host: true,
    port: 5173,
  },
  preview: {
    // Required on Render (bind to the assigned $PORT and 0.0.0.0)
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 4173,
    // Allow your Render hostname to access the preview server
    allowedHosts: ['momentum-x.onrender.com'],
  },
})
