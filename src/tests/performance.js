import path from 'path'

import test from 'ava'

import { benchmark } from './benchmark'
import { readFile } from './tools'

const FIXTURES_FOLDER = path.join(__dirname, 'fixtures')

test('Performance tiny code', (assert) => {
  const result = benchmark('var a = 2;', 'tiny code')
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

test('Performance with everything', (assert) => {
  const result = benchmark(
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
