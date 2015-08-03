# Astring

A tiny and fast [ESTree](https://github.com/estree/estree) formatted AST to JavaScript code generator.

Key features:

- Supports ECMAScript versions 5 and 6.
- Considerably faster than [Escodegen](https://github.com/estools/escodegen) and [Esotope](https://github.com/inikulin/esotope).
- No dependencies and small footprint (11 KB minified, 3 KB gziped).
- Output code is readable and executable.
- Reduced formatting options.



## Installation

```bash
npm install astring
```


## Usage

Astring is the perfect companion of [Acorn](https://github.com/marijnh/acorn), a blazingly fast JavaScript parser.

```javascript
// Import modules
acorn = require( 'acorn' )
astring = require( 'astring' )

// Example code
code = "let answer = 4 + 7 * 5 + 3;"

// Parse it into an AST
node = acorn.parse( code, { ecmaVersion: 6 } )

// Set formatting options
options = {
	indent: '   ',
	lineEnd: 
}

// Format it
result = astring( node, options )

// Check it
if ( code === result )
	console.log( 'It works !' )
else
	console.log( 'Something went wrong…' )
```

The exported function returns a string representing the rendered code of the provided AST `node`.
The `options` are:

- `indent`: string to use for indentation (defaults to `\t`)
- `lineEnd`: string to use for line endings (defaults to `\n`)
- `startingIndentLevel`: indent level to start from (default to `0`)



## Caveats

Testing is not done yet (undergoing).