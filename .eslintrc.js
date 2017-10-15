module.exports = {
  extends: ['eslint:recommended', 'plugin:import/errors'],
  plugins: ['import'],
  settings: {
    'import/ignore': ['node_modules'],
  },
  globals: {
    window: true,
    document: true,
    clearTimeout: true,
    setTimeout: true,
    setInterval: true,
    clearInterval: true,
    module: true,
    global: true,
    require: true,
    console: true,
    process: true,
    __dirname: true,
    __filename: true,
  },
  env: {
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 8,
    sourceType: 'module',
  },
  overrides: {
    files: [
      'test/comment/*.js',
      'test/deprecated/*.js',
      'test/syntax/*.js',
      'test/tree/*.js',
    ],
    rules: {
      'no-unused-vars': false,
      'no-undef': false,
      'no-var': false,
      'no-empty': false,
      'no-unused-labels': false,
      'no-cond-assign': false,
      'no-constant-condition': false,
      'constructor-super': false,
      'no-unreachable': false,
      'no-unsafe-negation': false,
    },
  },
  rules: {
    'eol-last': 'error',
    'linebreak-style': ['error', 'unix'],
    'max-len': false,
    'max-statements-per-line': [
      'error',
      {
        max: 2,
      },
    ],
    'no-duplicate-imports': 'error',
    'no-irregular-whitespace': [
      'error',
      { skipStrings: true, skipComments: true, skipTemplates: true },
    ],
    'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0 }],
    'no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'after-used',
      },
    ],
    'no-var': 'error',
  },
}
