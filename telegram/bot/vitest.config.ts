import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    include: ['__tests__/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      TEST_DATA_DIR: path.join(process.cwd(), 'data-test'),
    },
    // Run tests sequentially to avoid file system race conditions
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
