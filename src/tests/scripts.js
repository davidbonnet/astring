import test from 'ava'
import fs from 'fs'
import path from 'path'
import normalizeNewline from 'normalize-newline'
import { parse } from 'acorn'
import * as astravel from 'astravel'
import glob from 'glob'

import { generate } from '../astring'

const pattern = path.join(__dirname, '../../node_modules/@babel/**/*.js')
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
  // TODO: Remove once Astravel is updated
  Property(node, state) {
    this.go(node.key, state)
    if (node.value != null) {
      this.go(node.value, state)
    }
  },
})

const files = glob.sync(pattern, {
  nodir: true,
})

test('Script tests', assert => {
  files.forEach(function(fileName) {
    try {
      const code = normalizeNewline(fs.readFileSync(fileName, 'utf8'))
      let ast
      try {
        ast = parse(code, options)
      } catch (error) {
        return
      }
      stripLocation.go(ast)
      const formattedAst = parse(generate(ast), options)
      stripLocation.go(formattedAst)
      assert.deepEqual(formattedAst, ast, fileName)
    } catch (error) {
      assert.fail(error)
    }
  })
})
