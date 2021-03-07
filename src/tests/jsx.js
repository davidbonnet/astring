import test from 'ava'
import { generate, GENERATOR, JSX } from '../astring'

const generator = { ...GENERATOR, ...JSX }

test('JSX', (assert) => {
  assert.is(
    generate(
      { type: 'JSXAttribute', name: { type: 'JSXIdentifier', name: 'a' } },
      { generator },
    ),
    'a',
    'should support an attribute',
  )

  assert.is(
    generate(
      {
        type: 'JSXAttribute',
        name: {
          type: 'JSXNamespacedName',
          namespace: { type: 'JSXIdentifier', name: 'a' },
          name: { type: 'JSXIdentifier', name: 'b' },
        },
      },
      { generator },
    ),
    'a:b',
    'should support an attribute w/ a namespaced name',
  )

  assert.is(
    generate(
      {
        type: 'JSXAttribute',
        name: { type: 'JSXIdentifier', name: 'a' },
        value: { type: 'Literal', value: 'b' },
      },
      { generator },
    ),
    'a="b"',
    'should support an attribute w/ value',
  )

  assert.is(
    generate(
      {
        type: 'JSXAttribute',
        name: { type: 'JSXIdentifier', name: 'a' },
        value: { type: 'Literal', value: 'b' },
      },
      { generator },
    ),
    'a="b"',
    'should support an attribute w/ a literal value',
  )

  assert.is(
    generate(
      {
        type: 'JSXAttribute',
        name: { type: 'JSXIdentifier', name: 'a' },
        value: { type: 'Literal', value: 'b"c' },
      },
      { generator },
    ),
    'a="b&quot;c"',
    'should support an attribute w/ quotes in a value',
  )

  assert.is(
    generate(
      {
        type: 'JSXAttribute',
        name: { type: 'JSXIdentifier', name: 'a' },
        value: { type: 'Literal', value: 'b & c' },
      },
      { generator },
    ),
    'a="b & c"',
    'should support an attribute w/ ampersands in a value (1)',
  )

  assert.is(
    generate(
      {
        type: 'JSXAttribute',
        name: { type: 'JSXIdentifier', name: 'a' },
        value: { type: 'Literal', value: 'b &amp; c' },
      },
      { generator },
    ),
    'a="b &amp;amp; c"',
    'should support an attribute w/ ampersands in a value (2)',
  )

  assert.is(
    generate(
      {
        type: 'JSXAttribute',
        name: { type: 'JSXIdentifier', name: 'a' },
        value: {
          type: 'JSXExpressionContainer',
          expression: { type: 'Literal', value: 1 },
        },
      },
      { generator },
    ),
    'a={1}',
    'should support an attribute w/ an expression value',
  )

  assert.is(
    generate(
      {
        type: 'JSXAttribute',
        name: { type: 'JSXIdentifier', name: 'a' },
        value: {
          type: 'JSXFragment',
          openingFragment: { type: 'JSXOpeningFragment' },
          closingFragment: { type: 'JSXClosingFragment' },
          children: [{ type: 'JSXText', value: '1' }],
        },
      },
      { generator },
    ),
    'a=<>1</>',
    'should support an attribute w/ a fragment value',
  )

  assert.is(
    generate(
      {
        type: 'JSXAttribute',
        name: { type: 'JSXIdentifier', name: 'a' },
        value: {
          type: 'JSXElement',
          openingElement: {
            type: 'JSXOpeningElement',
            name: { type: 'JSXIdentifier', name: 'b' },
            selfClosing: true,
          },
        },
      },
      { generator },
    ),
    'a=<b />',
    'should support an attribute w/ an element value',
  )

  assert.is(
    generate(
      {
        type: 'JSXClosingElement',
        name: { type: 'JSXIdentifier', name: 'a' },
      },
      { generator },
    ),
    '</a>',
    'should support a closing element',
  )

  assert.is(
    generate(
      {
        type: 'JSXClosingElement',
        name: {
          type: 'JSXMemberExpression',
          object: { type: 'JSXIdentifier', name: 'a' },
          property: { type: 'JSXIdentifier', name: 'b' },
        },
      },
      { generator },
    ),
    '</a.b>',
    'should support a closing element w/ a member name',
  )

  assert.is(
    generate(
      {
        type: 'JSXClosingElement',
        name: {
          type: 'JSXNamespacedName',
          namespace: { type: 'JSXIdentifier', name: 'a' },
          name: { type: 'JSXIdentifier', name: 'b' },
        },
      },
      { generator },
    ),
    '</a:b>',
    'should support a closing element w/ a namespace name',
  )

  assert.is(
    generate({ type: 'JSXClosingFragment' }, { generator }),
    '</>',
    'should support a closing fragment',
  )

  assert.is(
    generate(
      {
        type: 'JSXElement',
        openingElement: {
          type: 'JSXOpeningElement',
          name: { type: 'JSXIdentifier', name: 'a' },
          selfClosing: true,
        },
      },
      { generator },
    ),
    '<a />',
    'should support a JSX element w/ `selfClosing`',
  )

  assert.is(
    generate(
      {
        type: 'JSXElement',
        openingElement: {
          type: 'JSXOpeningElement',
          name: { type: 'JSXIdentifier', name: 'a' },
        },
        closingElement: {
          type: 'JSXClosingElement',
          name: { type: 'JSXIdentifier', name: 'a' },
        },
      },
      { generator },
    ),
    '<a></a>',
    'should support a JSX element w/ a closing element',
  )

  assert.is(
    generate(
      {
        type: 'JSXElement',
        openingElement: {
          type: 'JSXOpeningElement',
          name: { type: 'JSXIdentifier', name: 'a' },
        },
        closingElement: {
          type: 'JSXClosingElement',
          name: { type: 'JSXIdentifier', name: 'a' },
        },
        children: [{ type: 'JSXText', value: 'b' }],
      },
      { generator },
    ),
    '<a>b</a>',
    'should support a JSX element w/ children',
  )

  assert.is(
    generate({ type: 'JSXEmptyExpression' }, { generator }),
    '',
    'should support a JSX empty expression',
  )

  assert.is(
    generate(
      {
        type: 'JSXExpressionContainer',
        expression: { type: 'Literal', value: 1 },
      },
      { generator },
    ),
    '{1}',
    'should support a JSX expression container',
  )

  assert.is(
    generate(
      {
        type: 'JSXFragment',
        openingFragment: { type: 'JSXOpeningFragment' },
        closingFragment: { type: 'JSXClosingFragment' },
      },
      { generator },
    ),
    '<></>',
    'should support a JSX fragment',
  )

  assert.is(
    generate(
      {
        type: 'JSXFragment',
        openingFragment: { type: 'JSXOpeningFragment' },
        closingFragment: { type: 'JSXClosingFragment' },
        children: [{ type: 'JSXText', value: 'a' }],
      },
      { generator },
    ),
    '<>a</>',
    'should support a JSX fragment w/ children',
  )

  assert.is(
    generate({ type: 'JSXIdentifier', name: 'a' }, { generator }),
    'a',
    'should support a JSX identifier',
  )

  assert.is(
    generate(
      {
        type: 'JSXMemberExpression',
        object: { type: 'JSXIdentifier', name: 'a' },
        property: { type: 'JSXIdentifier', name: 'b' },
      },
      { generator },
    ),
    'a.b',
    'should support a JSX member expression',
  )

  assert.is(
    generate(
      {
        type: 'JSXMemberExpression',
        object: {
          type: 'JSXMemberExpression',
          object: { type: 'JSXIdentifier', name: 'a' },
          property: { type: 'JSXIdentifier', name: 'b' },
        },
        property: { type: 'JSXIdentifier', name: 'c' },
      },
      { generator },
    ),
    'a.b.c',
    'should support a JSX member expression w/ another member as `object`',
  )

  assert.is(
    generate(
      {
        type: 'JSXNamespacedName',
        namespace: { type: 'JSXIdentifier', name: 'a' },
        name: { type: 'JSXIdentifier', name: 'b' },
      },
      { generator },
    ),
    'a:b',
    'should support a JSX namespace name',
  )

  assert.is(
    generate(
      { type: 'JSXOpeningElement', name: { type: 'JSXIdentifier', name: 'a' } },
      { generator },
    ),
    '<a>',
    'should support a JSX opening element',
  )

  assert.is(
    generate(
      {
        type: 'JSXOpeningElement',
        name: { type: 'JSXIdentifier', name: 'a' },
        selfClosing: true,
      },
      { generator },
    ),
    '<a />',
    'should support a JSX opening element w/ selfClosing',
  )

  assert.is(
    generate(
      {
        type: 'JSXOpeningElement',
        name: { type: 'JSXIdentifier', name: 'a' },
        attributes: [
          { type: 'JSXAttribute', name: { type: 'JSXIdentifier', name: 'b' } },
          {
            type: 'JSXAttribute',
            name: { type: 'JSXIdentifier', name: 'c' },
            value: { type: 'Literal', value: 'd' },
          },
          {
            type: 'JSXAttribute',
            name: { type: 'JSXIdentifier', name: 'e' },
            value: {
              type: 'JSXExpressionContainer',
              expression: { type: 'Literal', value: 1 },
            },
          },
          {
            type: 'JSXSpreadAttribute',
            argument: { type: 'Identifier', name: 'f' },
          },
        ],
      },
      { generator },
    ),
    '<a b c="d" e={1} {...f}>',
    'should support a JSX opening element w/ attributes',
  )

  assert.is(
    generate({ type: 'JSXOpeningFragment' }, { generator }),
    '<>',
    'should support an opening fragment',
  )

  assert.is(
    generate(
      {
        type: 'JSXSpreadAttribute',
        argument: { type: 'Identifier', name: 'a' },
      },
      { generator },
    ),
    '{...a}',
    'should support a spread attribute',
  )

  assert.is(
    generate({ type: 'JSXText', value: 'a' }, { generator }),
    'a',
    'should support a JSX text',
  )

  assert.is(
    generate({ type: 'JSXText', value: 'a & b' }, { generator }),
    'a & b',
    'should support a JSX text w/ an ampersand (1)',
  )

  assert.is(
    generate({ type: 'JSXText', value: 'a&b' }, { generator }),
    'a&amp;b',
    'should support a JSX text w/ an ampersand (2)',
  )
})
