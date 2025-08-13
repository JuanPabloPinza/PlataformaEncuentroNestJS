import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import baseConfig from '../../eslint.config.mjs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  ...baseConfig,
  ...compat
    .config({
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: ['apps/realtime-service/tsconfig.*?.json'],
      },
      rules: {},
    })
    .map((config) => ({
      ...config,
      files: ['apps/realtime-service/**/*.ts', 'apps/realtime-service/**/*.js'],
      ignores: ['apps/realtime-service/**/*spec.ts'],
    })),
];
