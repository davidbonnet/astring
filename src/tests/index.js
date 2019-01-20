import test from 'ava'
import fs from 'fs'
import path from 'path'
import normalizeNewline from 'normalize-newline'
import { parse } from 'acorn'
import * as astravel from 'astravel'

import { generate } from '../astring'

const FIXTURES_FOLDER = path.join(__dirname, 'fixtures')

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
    ecmaVersion: 8,
    sourceType: 'module',
  }
  files.forEach(filename => {
    const code = normalizeNewline(
      fs.readFileSync(path.join(dirname, filename), 'utf8'),
    )
    const ast = parse(code, options)
    assert.is(generate(ast), code, filename.substring(0, filename.length - 3))
  })
})

test('Tree comparison', assert => {
  const dirname = path.join(FIXTURES_FOLDER, 'tree')
  const files = fs.readdirSync(dirname).sort()
  const options = {
    ecmaVersion: 8,
    sourceType: 'module',
  }
  files.forEach(filename => {
    const code = normalizeNewline(
      fs.readFileSync(path.join(dirname, filename), 'utf8'),
    )
    const ast = parse(code, options)
    stripLocation.go(ast)
    const formattedAst = parse(generate(ast), options)
    stripLocation.go(formattedAst)
    assert.deepEqual(
      formattedAst,
      ast,
      filename.substring(0, filename.length - 3),
    )
  })
})

test('Deprecated syntax check', assert => {
  const dirname = path.join(FIXTURES_FOLDER, 'deprecated')
  const files = fs.readdirSync(dirname).sort()
  files.forEach(filename => {
    const code = normalizeNewline(
      fs.readFileSync(path.join(dirname, filename), 'utf8'),
    )
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
    ecmaVersion: 8,
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
    const code = normalizeNewline(
      fs.readFileSync(path.join(dirname, filename), 'utf8'),
    )
    const comments = []
    const ast = parse(code, {
      ecmaVersion: 8,
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
  const code = 'function f(x) {\n  return x;\n}\n'
  const sourceMap = {
    mappings: [],
    _file: 'script.js',
    addMapping({ original, generated: { line, column }, name, source }) {
      const generated = { line, column }
      assert.deepEqual(generated, { ...original })
      assert.is(source, this._file)
      this.mappings.push({
        original,
        generated,
        name,
        source,
      })
    },
  }
  const ast = parse(code, {
    ecmaVersion: 8,
    locations: true,
  })
  const formattedCode = generate(ast, {
    sourceMap,
  })
  assert.is(sourceMap.mappings.length, 3)
  assert.is(formattedCode, code)
})
