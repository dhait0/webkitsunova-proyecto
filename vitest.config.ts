import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/setupTests.ts', './tests/setup.ts'],
    include: [
      'src/**/*.test.{ts,tsx}',
      'tests/**/*.test.{ts,tsx}',
    ],
    environmentMatchGlobs: [
      ['src/**/*.test.{ts,tsx}', 'jsdom'],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['node_modules/', 'src/main.tsx', 'src/server/'],
    },
    // Allow TypeScript imports with .js extensions
    passThroughPatterns: [/\.ts$/],
    // Use tsconfig for resolution
    tsconfig: 'tsconfig.json',
  },
});
