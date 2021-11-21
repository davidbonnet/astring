import path from 'path'

import test from 'ava'

import { benchmark } from './benchmark'
import { readFile } from './tools'

const FIXTURES_FOLDER = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  'fixtures',
)

test('Performance tiny code', (assert) => {
  const result = benchmark('var a = 2;', 'tiny code')
  assert.ok(
    result['astring'].speed > result['escodegen'].speed,
    'astring is faster than escodegen',
  )
  assert.ok(
    result['astring'].speed > 10 * result['babel'].speed,
    'astring is at least 10x faster than babel',
  )
  assert.ok(
    result['astring'].speed > 10 * result['prettier'].speed,
    'astring is at least 10x faster than prettier',
  )
  assert.ok(
    result['acorn + astring'].speed > result['buble'].speed,
    'astring is faster than buble',
  )
})

test('Performance with everything', (assert) => {
  const result = benchmark(
    readFile(path.join(FIXTURES_FOLDER, 'tree', 'es6.js')),
    'everything',
  )
  assert.ok(
    result['astring'].speed > result['escodegen'].speed,
    'astring is faster than escodegen',
  )
  assert.ok(
    result['astring'].speed > 10 * result['babel'].speed,
    'astring is at least 10x faster than babel',
  )
  assert.ok(
    result['astring'].speed > 10 * result['prettier'].speed,
    'astring is at least 10x faster than prettier',
  )
  assert.ok(
    result['acorn + astring'].speed > result['buble'].speed,
    'astring is faster than buble',
  )
})
