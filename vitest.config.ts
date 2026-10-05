import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': rootDir,
    },
  },
  test: {
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**', '.kilo/**', 'proyecto viejo/**', 'Mockups/**'],
    environmentMatchGlobs: [
      ['**/*.test.tsx', 'jsdom'],
      ['components/**', 'jsdom'],
      ['features/**', 'jsdom'],
      ['hooks/**', 'jsdom'],
      ['app/**', 'jsdom'],
      ['**/*.test.ts', 'node'],
      ['services/**', 'node'],
      ['lib/**', 'node'],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['node_modules/', '.next/', '**/*.d.ts'],
    },
  },
});
