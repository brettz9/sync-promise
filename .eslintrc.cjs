'use strict';

module.exports = {
  extends: ['ash-nazg/sauron-node-overrides'],
  overrides: [
    {
      files: '*.md/*.js',
      rules: {
        'import/no-unresolved': 0
      }
    }
  ],
  rules: {
    'promise/prefer-await-to-then': 0
  }
};
