const fs = require('fs')
const path = require('path')
const glob = require('glob')
const acorn = require('acorn')
const astravel = require('astravel')
const normalizeNewline = require('normalize-newline')
const astring = require('../dist/astring').default
const { test } = require('tap')
const packageInfo = require('../package.json')

const dependencies = [
  ...Object.getOwnPropertyNames(packageInfo.devDependencies),
  ...Object.getOwnPropertyNames(packageInfo.optionalDependencies),
]
const pattern = path.join(
  __dirname,
  `../node_modules/{${dependencies.join(',')}}/**/*.js`
)
const options = {
  ecmaVersion: 8,
  sourceType: 'module',
  allowHashBang: true,
}

const stripLocation = astravel.makeTraveler({
  go: function(node, state) {
    delete node.start
    delete node.end
    this[node.type](node, state)
  },
})

const files = glob.sync(pattern, {
  nodir: true,
})

test('Test scripts', assert => {
  files.forEach(function(filename) {
    assert.test(filename, assert => {
      try {
        const code = normalizeNewline(fs.readFileSync(filename, 'utf8'))
        const ast = acorn.parse(code, options)
        stripLocation.go(ast)
        const formattedAst = acorn.parse(astring(ast), options)
        stripLocation.go(formattedAst)
        assert.deepEqual(formattedAst, ast)
      } catch (error) {
        assert.fail(error)
      }
      assert.end()
    })
  })
  assert.end()
})
