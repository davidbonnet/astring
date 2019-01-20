/*
Before running benchmarks, install third parties by running:
npm install escodegen@1.8 uglify-js@2 babel-generator@6 buble@0.15
*/

const Benchmark = require('benchmark')
const acorn = require('acorn').parse
const uglify = require('uglify-js')
const escodegen = require('escodegen').generate
const astring = require('../dist/astring').generate
const babylon = require('babylon')
const babel = require('babel-generator').default
const prettier = require('prettier').format
const buble = require('buble').transform
const fs = require('fs')
const path = require('path')

function benchmarkWithCode(code, name) {
  // eslint-disable-next-line no-console
  console.log('\nTesting "%s" (code length: %d)', name, code.length)
  const acornOptions = {
    ecmaVersion: 8,
    sourceType: 'module',
  }
  const ast = acorn(code, acornOptions)
  let uglifyAst = null
  try {
    uglifyAst = uglify.parse(code)
  } catch (error) {
    // Ignore
  }
  const uglifyOptions = {
    beautify: true,
  }
  const babelAst = babylon.parse(code, {
    sourceType: 'module',
  })
  const bubleOptions = {
    transforms: {
      arrow: false,
      classes: false,
      collections: false,
      computedProperty: false,
      conciseMethodProperty: false,
      constLoop: false,
      constRedef: false,
      defaultParameter: false,
      destructuring: false,
      extendNatives: false,
      forOf: false,
      generator: false,
      letConst: false,
      letLoop: false,
      letLoopScope: false,
      moduleExport: false,
      moduleImport: false,
      numericLiteral: false,
      objectProto: false,
      objectSuper: false,
      oldOctalLiteral: false,
      parameterDestructuring: false,
      spreadRest: false,
      stickyRegExp: false,
      symbol: false,
      templateString: false,
      unicodeEscape: false,
      unicodeIdentifier: false,
      unicodeRegExp: false,
      exponentiation: false,
      reservedProperties: false,
    },
  }
  const returnBabelAst = () => babelAst
  new Benchmark.Suite()
    .add('escodegen', () => {
      escodegen(ast)
    })
    .add('astring', () => {
      astring(ast)
    })
    .add('uglify', () => {
      uglifyAst.print_to_string(uglifyOptions)
    })
    .add('babel', () => {
      babel(babelAst, {}, code).code
    })
    .add('prettier', () => {
      prettier(code, returnBabelAst)
    })
    .add('acorn + astring', () => {
      astring(acorn(code, acornOptions))
    })
    .add('acorn + buble', () => {
      buble(code, bubleOptions).code
    })
    // add listeners
    .on('cycle', event => {
      // eslint-disable-next-line no-console
      console.log(String(event.target))
    })
    .on('complete', function() {
      // eslint-disable-next-line no-console
      console.log('Fastest is ' + this.filter('fastest').map('name'))
    })
    .run()
}

benchmarkWithCode(
  fs.readFileSync(path.join(__dirname, '_benchmark.js'), 'utf8'),
  'benchmark file',
)

benchmarkWithCode(
  fs.readFileSync(path.join(__dirname, 'tree', 'es6.js'), 'utf8'),
  'everything',
)

benchmarkWithCode('var a = 2;', 'tiny instruction')
