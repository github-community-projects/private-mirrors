import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import jestPlugin from 'eslint-plugin-jest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

export default [
  js.configs.recommended,
  ...compat.extends('next/core-web-vitals'),
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
