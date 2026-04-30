import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
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
    },
    typecheck: {
      enabled: true,
      checker: 'tsc',
      include: ['test/**/*.ts'],
      tsconfig: './tsconfig.json',
    },
  },
})
