import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.e2e-spec.ts'],
    globals: true,
    testTimeout: 30000,
    server: {
      deps: {
        inline: ['supertest'],
      },
    },
  },
});
