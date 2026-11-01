import { defineConfig } from 'vite';
export default defineConfig({
  root: '.',
  base: './',                                   // relative asset and data paths: the built viewer runs from any folder or upload location
  server: { port: 5173, host: '127.0.0.1' },
  test: { globals: true, include: ['tests/**/*.test.ts'] },
} as any);
