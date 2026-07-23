// Flat config (ESLint 9). Rules here encode blueprint §10 and the project's
// non-negotiables — they are enforcement, not style preference.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/node_modules/**',
      '**/generated/**',
      'figma/pull.mjs',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      /* No `any` on trust boundaries — the single most load-bearing rule. */
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      /* Every async boundary needs an error state — no silent failures. */
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/require-await': 'error',

      /* Prefer explicit narrowing over assertion. */
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' },
      ],
      '@typescript-eslint/no-unnecessary-condition': 'warn',

      /* Unused code does not ship. */
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      /* console.log in prod is a P2 smell; warn/error are allowed for bootstrap
         paths that run before the logger exists. */
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-param-reassign': 'error',
    },
  },

  /* Config files and scripts sit outside the type-checked program. `extends`
     merges the disable-rules in; spreading the config would clobber them with
     the `rules` block below. */
  {
    files: ['**/*.config.{js,mjs,cjs,ts}', '**/scripts/**', 'figma/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      // Without type information, no-undef has no way to know these exist.
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    rules: { 'no-console': 'off' },
  },

  /* Tests may use non-null assertions and log freely. */
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  prettier
);
