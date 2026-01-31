import nextTypescript from 'eslint-config-next/typescript'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

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
    // TODO: add linting for tests
    // Test files - lint without type-checking (not in tsconfig.json project)
    // TODO: add type checking for tests
    // files: ['test/**/*.{ts,tsx}'],
    // languageOptions: {
    //   parser: tsParser,
    //   globals: jestPlugin.environments.globals.globals,
    // },
    // plugins: {
    //   '@typescript-eslint': tsPlugin,
    //   jest: jestPlugin,
    // },
    // rules: {
    //   ...tsPlugin.configs['recommended'].rules,
    //   ...jestPlugin.configs['recommended'].rules,
    //   '@typescript-eslint/no-unused-vars': [
    //     'error',
    //     { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    //   ],
    //   // TODO: clean up conditional tests
    //   'jest/no-conditional-expect': 'off',
    // },
  },
  {
    // TODO: lint tests
    ignores: ['node_modules/', '.next/', 'build/', 'test/', '*.mjs', '*.js'],
  },
]
