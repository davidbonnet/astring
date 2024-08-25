import fs from 'fs'
import test from 'ava'
import path from 'path'
import { Parser } from 'acorn'
import { importAttributesOrAssertions } from 'acorn-import-attributes'
import * as astravel from 'astravel'
import { pick } from 'lodash'

import { generate } from '../astring'
import { readFile } from './tools'

const FIXTURES_FOLDER = path.join(__dirname, 'fixtures')

const ecmaVersion = 13

const parser = Parser.extend(importAttributesOrAssertions)

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
  // astravel does not support import attributes yet
  ImportDeclaration(node, state) {
    const { specifiers } = node,
      { length } = specifiers
    for (let i = 0; i < length; i++) {
      this.go(specifiers[i], state)
    }
    const { attributes } = node
    if (attributes != null)
      for (let i = 0; i < attributes.length; i++) this.go(attributes[i], state)

    this.go(node.source, state)
  },
  ImportAttribute(node, state) {
    this.go(node.key, state)
    this.go(node.value, state)
  },
})

test('Syntax check', (assert) => {
  const dirname = path.join(FIXTURES_FOLDER, 'syntax')
  const files = fs.readdirSync(dirname).sort()
  const options = {
    ecmaVersion,
    sourceType: 'module',
  }
  files.forEach((filename) => {
    const code = readFile(path.join(dirname, filename))
    const ast = parser.parse(code, options)
    assert.is(
      generate(ast),
      code,
      filename.substring(0, filename.length - 3),
      'Generates code with the expected format',
    )
  })
})

test('Tree comparison', (assert) => {
  const dirname = path.join(FIXTURES_FOLDER, 'tree')
  const files = fs.readdirSync(dirname).sort()
  const options = {
    ecmaVersion,
    sourceType: 'module',
  }
  files.forEach((filename) => {
    const code = readFile(path.join(dirname, filename))
    const ast = parser.parse(code, options)
    stripLocation.go(ast)
    const formattedAst = parser.parse(generate(ast), options)
    stripLocation.go(formattedAst)
    assert.deepEqual(
      formattedAst,
      ast,
      filename.substring(0, filename.length - 3),
      'Generates code with the same meaning',
    )
  })
})

test('Deprecated syntax check', (assert) => {
  const dirname = path.join(FIXTURES_FOLDER, 'deprecated')
  const files = fs.readdirSync(dirname).sort()
  files.forEach((filename) => {
    const code = readFile(path.join(dirname, filename))
    const version = parseInt(filename.substring(2, filename.length - 3))
    const ast = parser.parse(code, { ecmaVersion: version })
    assert.is(generate(ast), code, 'es' + version)
  })
})

test('Output stream', (assert) => {
  const code = 'const a = 42;\n'
  const output = {
    buffer: '',
    write(code) {
      this.buffer += code
    },
  }
  const ast = parser.parse(code, {
    ecmaVersion,
  })
  const result = generate(ast, {
    output,
  })
  assert.is(result, output)
  assert.is(result.buffer, code)
})

test('Comment generation', (assert) => {
  const dirname = path.join(FIXTURES_FOLDER, 'comment')
  const files = fs.readdirSync(dirname).sort()
  const options = {
    comments: true,
  }
  files.forEach((filename) => {
    const code = readFile(path.join(dirname, filename))
    const comments = []
    const ast = parser.parse(code, {
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

test('Source map generation', (assert) => {
  const dirname = path.join(FIXTURES_FOLDER, 'syntax')
  const files = fs.readdirSync(dirname).sort()
  const options = {
    ecmaVersion,
    sourceType: 'module',
    locations: true,
  }
  files.forEach((filename) => {
    const code = readFile(path.join(dirname, filename))
    const sourceMap = {
      mappings: [],
      _file: filename,
      addMapping({ original, generated, name, source }) {
        assert.deepEqual(
          pick(generated, ['line', 'column']),
          pick(original, ['line', 'column']),
          `${source}:${name}`,
        )
        assert.is(source, this._file)
        this.mappings.push({
          original,
          generated,
          name,
          source,
        })
      },
    }
    const ast = parser.parse(code, options)
    generate(ast, {
      sourceMap,
    })
    assert.true(
      sourceMap.mappings.length > 0,
      `Expect ${path.basename(filename)} to have mappings`,
    )
  })
})

test('Source map generation with comments', (assert) => {
  const dirname = path.join(FIXTURES_FOLDER, 'comment')
  const files = fs.readdirSync(dirname).sort()
  files.forEach((filename) => {
    const code = readFile(path.join(dirname, filename))
    const sourceMap = {
      mappings: [],
      _file: filename,
      addMapping({ original, generated, name, source }) {
        assert.deepEqual(
          pick(generated, ['line', 'column']),
          pick(original, ['line', 'column']),
          `${source}:${name}`,
        )
        assert.is(source, this._file)
        this.mappings.push({
          original,
          generated,
          name,
          source,
        })
      },
    }
    const comments = []
    const ast = parser.parse(code, {
      ecmaVersion,
      comments: true,
      locations: true,
      onComment: comments,
    })
    astravel.attachComments(ast, comments)
    generate(ast, {
      sourceMap,
      comments: true,
    })
  })
})
