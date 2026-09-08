import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist/**',
      '.generated/**',
      'output/**',
      '.playwright-cli/**',
      'playwright-report/**',
      'test-results/**',
      'globe-land.js',
    ],
  },
  js.configs.recommended,
  { files: ['**/*.{js,mjs}'], languageOptions: { globals: globals.node } },
  {
    files: [
      'app.js',
      'water.js',
      'globe.js',
      'site/client.js',
      'tests/browser/**/*.js',
    ],
    languageOptions: {
      globals: { ...globals.browser, __PUBLIC_CONFIG__: 'readonly' },
    },
  },
];
