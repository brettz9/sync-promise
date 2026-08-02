import ashNazg from 'eslint-config-ash-nazg';
import {defineConfig} from 'eslint/config';

export default defineConfig([
  {
    ignores: [
      'dist',
      'coverage'
    ]
  },
  ...ashNazg(['sauron', 'node']),
  {
    files: ['**/*.md/*.js'],
    languageOptions: {
      globals: {
        assert: 'readonly',
        SyncPromise: 'readonly',
        getSomething: 'readonly',
        doSomething: 'readonly',
        doSomethingElse: 'readonly',
        anIDBStore: 'readonly',
        key: 'readonly',
        db: 'readonly'
      }
    },
    rules: {
      'no-shadow': 0,
      'jsdoc/require-jsdoc': 0,
      'unicorn/prefer-top-level-await': 0,
      'promise/always-return': 0,
      'promise/catch-or-return': 0,
      'no-unused-vars': 0,
      'import-x/no-unresolved': 0,
      'import-x/unambiguous': 0
    }
  },
  {
    rules: {
      'promise/prefer-await-to-then': 0,

      // Disable until ash-nazg does or fixes:
      'import-x/namespace': 0,
      'import-x/no-deprecated': 0,
      'import-x/default': 0,
      'import-x/no-named-as-default': 0,
      'import-x/no-named-as-default-member': 0
    }
  }
]);
