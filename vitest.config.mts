import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'src/renderer/questions/grading.ts',
        'src/renderer/progress/**/*.ts',
        'src/renderer/utils/**/*.ts',
        'src/renderer/data/equations.ts',
        'src/renderer/nameCompound/**/*.ts',
        'src/renderer/pages/practiceSet.ts',
      ],
    },
  },
});