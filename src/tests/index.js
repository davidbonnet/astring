import fs from 'fs'
import test from 'ava'
import path from 'path'
import { parse } from 'acorn'
import * as astravel from 'astravel'

import { generate } from '../astring'
import { readFile } from './tools'
import benchmarkWithCode from './benchmark'

const FIXTURES_FOLDER = path.join(__dirname, 'fixtures')

const ecmaVersion = 10

const stripLocation = astravel.makeTraveler({
  go(node, state) {
    delete node.start
    delete node.end
    delete node.raw
    if (node.directive) {
      delete node.directive
    }
    this[node.type](node, state)
  },
  Property(node, state) {
    this.go(node.key, state)
    // Always walk through value, regardless of `node.shorthand` flag
    this.go(node.value, state)
  },
})

test('Syntax check', assert => {
  const dirname = path.join(FIXTURES_FOLDER, 'syntax')
  const files = fs.readdirSync(dirname).sort()
  const options = {
    ecmaVersion,
    sourceType: 'module',
  }
  files.forEach(filename => {
    const code = readFile(path.join(dirname, filename))
    const ast = parse(code, options)
    assert.is(
      generate(ast),
      code,
      filename.substring(0, filename.length - 3),
      'Generates code with the expected format',
    )
  })
})

test('Tree comparison', assert => {
  const dirname = path.join(FIXTURES_FOLDER, 'tree')
  const files = fs.readdirSync(dirname).sort()
  const options = {
    ecmaVersion,
    sourceType: 'module',
  }
  files.forEach(filename => {
    const code = readFile(path.join(dirname, filename))
    const ast = parse(code, options)
    stripLocation.go(ast)
    const formattedAst = parse(generate(ast), options)
    stripLocation.go(formattedAst)
    assert.deepEqual(
      formattedAst,
      ast,
      filename.substring(0, filename.length - 3),
      'Generates code with the same meaning',
    )
  })
})

test('Deprecated syntax check', assert => {
  const dirname = path.join(FIXTURES_FOLDER, 'deprecated')
  const files = fs.readdirSync(dirname).sort()
  files.forEach(filename => {
    const code = readFile(path.join(dirname, filename))
    const version = parseInt(filename.substring(2, filename.length - 3))
    const ast = parse(code, { ecmaVersion: version })
    assert.is(generate(ast), code, 'es' + version)
  })
})

test('Output stream', assert => {
  const code = 'const a = 42;\n'
  const output = {
    buffer: '',
    write(code) {
      this.buffer += code
    },
  }
  const ast = parse(code, {
    ecmaVersion,
  })
  const result = generate(ast, {
    output,
  })
  assert.is(result, output)
  assert.is(result.buffer, code)
})

test('Comment generation', assert => {
  const dirname = path.join(FIXTURES_FOLDER, 'comment')
  const files = fs.readdirSync(dirname).sort()
  const options = {
    comments: true,
  }
  files.forEach(filename => {
    const code = readFile(path.join(dirname, filename))
    const comments = []
    const ast = parse(code, {
      ecmaVersion,
      locations: true,
      onComment: comments,
    })
    astravel.attachComments(ast, comments)
    assert.is(
      generate(ast, options),
      code,
      filename.substring(0, filename.length - 3),
    )
  })
})

test('Source map generation', assert => {
  const files = ['comment', 'syntax', 'sourcemap-cases']
    .map(fixture =>
      fs
        .readdirSync(path.join(FIXTURES_FOLDER, fixture))
        .map(file => path.join(FIXTURES_FOLDER, fixture, file)),
    )
    .reduce((acc, files) => [...acc, ...files], [])
    .map(file => ({ file, contents: readFile(file) }))

  const mangle = code =>
    code
      .split(/\r?\n/g)
      .map(l => '  ' + l + (l.endsWith('\\') ? '' : '\n'))
      .join('\n')

  for (const { file, contents } of files) {
    const mangled = mangle(contents)
    const mangledLines = mangled.split('\n')

    const sourceMap = {
      mappings: [],
      _file: path.basename(file),
      addMapping({ original, generated }) {
        this.mappings.push({
          original: { ...original },
          generated: { ...generated },
        })
      },
    }

    const ast = parse(mangled, {
      ecmaVersion,
      sourceType: 'module',
      locations: true,
    })

    const generatedLines = generate(ast, {
      sourceMap,
    }).split('\n')

    assert.true(
      sourceMap.mappings.length > 0,
      `expected to have generated positions in ${file}`,
    )

    for (const { original, generated } of sourceMap.mappings) {
      assert.is(
        mangledLines[original.line - 1].slice(original.column),
        generatedLines[generated.line - 1].slice(generated.column),
        `expected line ${generated.line} col ${generated.column} of ${file} to match`,
      )
    }
  }
})

if (!process.env.NO_BENCHMARK) {
  test('Performance tiny code', assert => {
    const result = benchmarkWithCode('var a = 2;', 'tiny code')
    assert.true(
      result['astring'].speed > result['escodegen'].speed,
      'astring is faster than escodegen',
    )
    assert.true(
      result['astring'].speed > 10 * result['babel'].speed,
      'astring is at least 10x faster than babel',
    )
    assert.true(
      result['astring'].speed > 10 * result['prettier'].speed,
      'astring is at least 10x faster than prettier',
    )
    assert.true(
      result['acorn + astring'].speed > result['buble'].speed,
      'astring is faster than buble',
    )
  })

  test('Performance with everything', assert => {
    const result = benchmarkWithCode(
      readFile(path.join(FIXTURES_FOLDER, 'tree', 'es6.js')),
      'everything',
    )
    assert.true(
      result['astring'].speed > result['escodegen'].speed,
      'astring is faster than escodegen',
    )
    assert.true(
      result['astring'].speed > 10 * result['babel'].speed,
      'astring is at least 10x faster than babel',
    )
    assert.true(
      result['astring'].speed > 10 * result['prettier'].speed,
      'astring is at least 10x faster than prettier',
    )
    assert.true(
      result['acorn + astring'].speed > result['buble'].speed,
      'astring is faster than buble',
    )
  })
}
