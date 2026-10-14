import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    passWithNoTests: true,
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts', 'src/types/**'],
    },
  },
});
