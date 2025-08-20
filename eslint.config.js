const js = require('@eslint/js');
const tsEslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const prettierConfig = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');
const securityPlugin = require('eslint-plugin-security');
const globals = require('globals');

module.exports = [
  // Base JavaScript recommendations
  js.configs.recommended,

  // Global ignores
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.d.ts',
      '.less-build-script.js',
      '.prettierrc.js',
      'eslint.config.js',
    ],
  },

  // TypeScript files configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      '@typescript-eslint': tsEslint,
      prettier: prettierPlugin,
      security: securityPlugin,
    },
    rules: {
      // TypeScript-specific rules
      ...tsEslint.configs.recommended.rules,
      // '@typescript-eslint/no-unused-vars': [
      //   'error',
      //   {
      //     argsIgnorePattern: '^_',
      //     varsIgnorePattern: '^_',
      //   },
      // ],
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // General code quality rules
      'no-console': 'off', // Allow console for server logging
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-expressions': 'error',
      'prefer-const': 'error',
      'no-var': 'error',

      // Node.js specific rules - handled by TypeScript
      'no-undef': 'off', // TypeScript handles this

      // Security rules
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',

      // Prettier integration
      'prettier/prettier': 'error',
    },
  },

  // JavaScript files configuration
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      prettier: prettierPlugin,
      security: securityPlugin,
    },
    rules: {
      // JavaScript rules
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-console': 'off',
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'prefer-const': 'error',
      'no-var': 'error',

      // Node.js rules - basic checks
      'no-undef': 'error',

      // Security rules
      'security/detect-object-injection': 'warn',
      'security/detect-unsafe-regex': 'error',

      // Prettier integration
      'prettier/prettier': 'error',
    },
  },

  // Prettier config (disables conflicting rules)
  prettierConfig,
];
