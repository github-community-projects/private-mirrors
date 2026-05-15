import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'test/**/*.{test,spec}.{ts,tsx}',
      'src/**/*.{test,spec}.{ts,tsx}',
      'test/**/__tests__/**/*.{ts,tsx}',
      'src/**/__tests__/**/*.{ts,tsx}',
    ],
    coverage: {
      provider: 'v8',
      exclude: [
        'node_modules/**',
        'test/**',
        'src/utils/**',
        '**/*.config.{ts,js,mjs}',
        '.next/**',
        'build/**',
      ],
      thresholds: {
        statements: 50,
        branches: 40,
        functions: 45,
        lines: 50,
      },
    },
    typecheck: {
      enabled: true,
      checker: 'tsc',
      include: ['test/**/*.ts'],
      tsconfig: './tsconfig.json',
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
})
