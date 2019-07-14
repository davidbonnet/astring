import path from 'path'

import Benchmark from 'benchmark'
import { join, keys, fill, map } from 'lodash'

import { parse as acorn } from 'acorn'
import uglify from 'uglify-js'
import { generate as escodegen } from 'escodegen'
import { generate as astring } from '../astring'
import { parse as babelParser } from '@babel/parser'
import babelGenerator from '@babel/generator'
import { format as prettier } from 'prettier'
import { transform as buble } from 'buble'
import { transform as sucrase } from 'sucrase'

import { readFile } from './tools'

export default function benchmarkWithCode(code) {
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
  const babelAst = babelParser(code, {
    sourceType: 'module',
  })
  const bubleOptions = {
    transforms: {
      getterSetter: false,
      arrow: false,
      classes: false,
      computedProperty: false,
      conciseMethodProperty: false,
      defaultParameter: false,
      destructuring: false,
      forOf: false,
      generator: false,
      letConst: false,
      moduleExport: false,
      moduleImport: false,
      numericLiteral: false,
      parameterDestructuring: false,
      spreadRest: false,
      stickyRegExp: false,
      templateString: false,
      unicodeRegExp: false,
      exponentiation: false,
      reservedProperties: false,
      trailingFunctionCommas: false,
      asyncAwait: false,
      objectRestSpread: false,
    },
  }
  const babelOptions = {}
  const prettierOptions = { parser: () => babelAst }
  const sucraseOptions = { transforms: [] }
  let results = {}
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
      babelGenerator(babelAst, babelOptions, code).code
    })
    .add('prettier', () => {
      prettier(code, prettierOptions)
    })
    .add('acorn + astring', () => {
      astring(acorn(code, acornOptions))
    })
    .add('buble', () => {
      buble(code, bubleOptions).code
    })
    .add('sucrase', () => {
      sucrase(code, sucraseOptions).code
    })
    .on('cycle', event => {
      const { target: bench } = event
      results[bench.name] = {
        speed: bench.hz || 0,
        stats: bench.stats.rme,
        size: bench.stats.sample.length,
      }
    })
    .run()
  return results
}

function resultsToMarkdown(results) {
  const categories = keys(results[0].results)
  const { format } = global.Intl.NumberFormat('en', {
    maximumFractionDigits: 0,
  })
  let output = `| code sample (length) | ${join(categories, ' | ')} |\n`
  output += `|:---|${join(fill(Array(categories.length), '---:'), '|')}|\n`
  const { length } = results
  for (let i = 0; i < length; i++) {
    const result = results[i]
    output += `| ${result.name} (${result.length}) | ${join(
      map(categories, key => format(result.results[key].speed)),
      ' | ',
    )} |\n`
  }
  return output
}

if (process.argv[1].indexOf('benchmark.js') !== -1) {
  const results = []
  results.push({
    name: 'tiny code',
    length: 'var a = 42;'.length,
    results: benchmarkWithCode('var a = 42;'),
  })
  const code = readFile(path.join(__dirname, 'fixtures', 'tree', 'es6.js'))
  results.push({
    name: 'everything',
    length: code.length,
    results: benchmarkWithCode(code),
  })
  console.log(resultsToMarkdown(results))
}
