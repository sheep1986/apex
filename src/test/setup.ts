import { beforeAll, vi } from 'vitest'

// Mock environment variables
beforeAll(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:3001')
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key')
})

// Mock console to reduce noise in tests
beforeAll(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})