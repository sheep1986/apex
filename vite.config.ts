import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5522,
    // Only apply proxy in development mode
    ...(mode === 'development' && {
      proxy: {
        '/api': {
          target: 'http://localhost:3333',
          changeOrigin: true,
          secure: false,
        },
      },
    }),
  },
}))

