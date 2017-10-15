const fs = require('fs')
const path = require('path')
const normalizeNewline = require('normalize-newline')
const { test } = require('tap')
const { parse } = require('acorn')
const astravel = require('astravel')

const { generate } = require('../dist/astring')
const { generate: generateMinified } = require('../dist/astring.min')

const stripLocation = astravel.makeTraveler({
  go(node, state) {
    delete node.start
    delete node.end
    delete node.raw
    this[node.type](node, state)
  },
  Property(node, state) {
    this.go(node.key, state)
    // Always walk through value, regardless of `node.shorthand` flag
    this.go(node.value, state)
  },
})

function check(callback) {
  /*
  Checks the non-minified (source) and minified version of the generator.
  */
  return assert => {
    assert.test('source', assert => callback(assert, generate))
    assert.test('minified', assert => callback(assert, generateMinified))
    assert.end()
  }
}

test('Syntax check', assert => {
  const dirname = path.join(__dirname, 'syntax')
  const files = fs.readdirSync(dirname).sort()
  const options = {
    ecmaVersion: 8,
    sourceType: 'module',
  }
  files.forEach(filename => {
    const code = normalizeNewline(
      fs.readFileSync(path.join(dirname, filename), 'utf8')
    )
    assert.test(
      filename.substring(0, filename.length - 3),
      check((assert, generate) => {
        const ast = parse(code, options)
        assert.equal(generate(ast), code)
        assert.end()
      })
    )
  })
  assert.end()
})

test('Tree comparison', assert => {
  const dirname = path.join(__dirname, 'tree')
  const files = fs.readdirSync(dirname).sort()
  const options = {
    ecmaVersion: 8,
    sourceType: 'module',
  }
  files.forEach(filename => {
    const code = normalizeNewline(
      fs.readFileSync(path.join(dirname, filename), 'utf8')
    )
    assert.test(
      filename.substring(0, filename.length - 3),
      check((assert, generate) => {
        const ast = parse(code, options)
        stripLocation.go(ast)
        const formattedAst = parse(generate(ast), options)
        stripLocation.go(formattedAst)
        assert.deepEqual(formattedAst, ast)
        assert.end()
      })
    )
  })
  assert.end()
})

test('Deprecated syntax check', assert => {
  const dirname = path.join(__dirname, 'deprecated')
  const files = fs.readdirSync(dirname).sort()
  files.forEach(filename => {
    const code = normalizeNewline(
      fs.readFileSync(path.join(dirname, filename), 'utf8')
    )
    const version = parseInt(filename.substring(2, filename.length - 3))
    assert.test(
      'es' + version,
      check((assert, generate) => {
        const ast = parse(code, { ecmaVersion: version })
        assert.equal(generate(ast), code)
        assert.end()
      })
    )
  })
  assert.end()
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
  assert.equal(result, output)
  assert.equal(result.buffer, code)
  assert.end()
})

test('Comment generation', assert => {
  const dirname = path.join(__dirname, 'comment')
  const files = fs.readdirSync(dirname).sort()
  const options = {
    comments: true,
  }
  files.forEach(filename => {
    const code = normalizeNewline(
      fs.readFileSync(path.join(dirname, filename), 'utf8')
    )
    assert.test(
      filename.substring(0, filename.length - 3),
      check((assert, generate) => {
        const comments = []
        const ast = parse(code, {
          ecmaVersion: 8,
          locations: true,
          onComment: comments,
        })
        astravel.attachComments(ast, comments)
        assert.equal(generate(ast, options), code)
        assert.end()
      })
    )
  })
  assert.end()
})

test('Source map generation', assert => {
  const code = 'function f(x) {\n  return x;\n}\n'
  const sourceMap = {
    mappings: [],
    _file: 'script.js',
    addMapping({ original, generated: { line, column }, name, source }) {
      const generated = { line, column }
      assert.same(generated, original)
      assert.equal(source, this._file)
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
  assert.equal(sourceMap.mappings.length, 3)
  assert.equal(formattedCode, code)
  assert.end()
})
