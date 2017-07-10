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
  rules: {
    'eol-last': 'error',
    'linebreak-style': ['error', 'unix'],
    'max-len': [
      'error',
      80,
      2,
      {
        ignoreUrls: true,
        ignoreComments: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
      },
    ],
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
