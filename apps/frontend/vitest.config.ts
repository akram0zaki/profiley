import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// Vitest configuration is intentionally separate from vite.config.ts to keep
// the build pipeline lean. We mirror just the bits required by the SPA's
// imports (React plugin, `@/` alias, jsdom DOM).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    css: false,
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    env: {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'test-anon-key',
      VITE_SUPABASE_FUNCTIONS_URL: 'http://test.local/functions/v1',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**', 'src/app/contexts/**', 'src/app/components/ui/utils.ts'],
      exclude: ['**/*.test.*', '**/__tests__/**'],
    },
  },
});
