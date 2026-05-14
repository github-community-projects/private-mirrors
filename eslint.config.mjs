import nextTypescript from 'eslint-config-next/typescript'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import vitestPlugin from '@vitest/eslint-plugin'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default [
  ...nextTypescript,
  js.configs.recommended,
  ...nextCoreWebVitals,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        React: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs['recommended'].rules,
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // TypeScript handles redeclaration checks - allows type + value with same name
      'no-redeclare': 'off',
      // TODO: Refactor hooks to use React Query instead of useEffect + setState pattern
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    // TypeScript declaration files - disable no-undef as types are ambient
    files: ['src/**/*.d.ts'],
    rules: {
      'no-undef': 'off',
    },
  },
  {
    files: ['test/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: vitestPlugin.environments.env.globals,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      vitest: vitestPlugin,
    },
    rules: {
      ...tsPlugin.configs['recommended'].rules,
      ...vitestPlugin.configs['recommended'].rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'vitest/consistent-test-it': [
        'error',
        {
          fn: 'test',
          withinDescribe: 'it',
        },
      ],
      // TODO: clean up conditional tests
      'vitest/no-conditional-expect': 'off',
    },
  },
  {
    ignores: ['node_modules/', '.next/', 'build/', '*.mjs', '*.js', '*.cjs'],
  },
]
