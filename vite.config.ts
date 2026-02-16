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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
          'vendor-recharts': ['recharts'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
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

