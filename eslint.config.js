// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { importX, createNodeResolver } from 'eslint-plugin-import-x';
import prettier from 'eslint-config-prettier';

/** Layers that must stay free of HTTP concerns (DESIGN.md §5.3). */
const httpFreeLayers = [
  'services',
  'repositories',
  'search',
  'validators',
  'mappers',
  'auth',
  'loaders',
  'errors',
  'utils',
];

export default tseslint.config(
  { ignores: ['dist/', 'coverage/', 'node_modules/', 'assets/'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,

  {
    settings: {
      'import-x/resolver-next': [
        // Source imports use `.js` specifiers (NodeNext) that point at `.ts` files.
        createNodeResolver({ extensionAlias: { '.js': ['.ts', '.js'] } }),
      ],
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'import-x/no-cycle': 'error',

      // Layer dependency rules (DESIGN.md §5.3). Paths are relative to the repo root.
      'import-x/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/search',
              from: './src',
              except: ['./search', './types'],
              message: 'search/ is pure: it may only import from types/.',
            },
            {
              target: './src/types',
              from: './src',
              except: ['./types'],
              message: 'types/ is compile-time only and must not depend on other layers.',
            },
            {
              target: './src/controllers',
              from: './src/repositories',
              message: 'Controllers call services, never repositories directly.',
            },
            {
              target: httpFreeLayers.map((layer) => `./src/${layer}`),
              from: [
                './src/routes',
                './src/controllers',
                './src/middleware',
                './src/app.ts',
                './src/server.ts',
              ],
              message: 'Inner layers must not depend on the HTTP layer or the composition root.',
            },
            {
              target: './src/services',
              from: './src/repositories/in-memory-facility.repository.ts',
              message: 'Depend on the FacilityRepository interface; server.ts wires the concrete one.',
            },
          ],
        },
      ],
    },
  },

  {
    // Only routes/, controllers/, middleware/ (and app/server) may import express.
    files: httpFreeLayers.map((layer) => `src/${layer}/**/*.ts`),
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'express', message: 'Only the HTTP layer may import express.' }],
        },
      ],
    },
  },

  // Must be last: turns off rules that conflict with Prettier.
  prettier,
);
