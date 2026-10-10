import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';

// Flat config migrating the old apps/api/.eslintrc.json (which ESLint 9 ignored,
// leaving `bun run lint` broken). Formatting is owned by the separate `format`
// (prettier) script rather than `prettier/prettier` lint errors, so lint only
// reports real code issues.
export default [
  ...tsPlugin.configs['flat/recommended'],
  prettierConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'warn',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];
