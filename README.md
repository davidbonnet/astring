# Astring

[![Build Status](https://travis-ci.org/davidbonnet/astring.svg?branch=master)](https://travis-ci.org/davidbonnet/astring)

A tiny and fast JavaScript code generator from an [ESTree](https://github.com/estree/estree)-formatted AST.

Key features:

- Supports ECMAScript versions 5 and 6.
- Considerably faster than [Escodegen](https://github.com/estools/escodegen) and smaller than [Esotope](https://github.com/inikulin/esotope).
- No dependencies and small footprint (11 KB minified, 3 KB gziped).
- Output code is readable and executable.
- Reduced formatting options.


## Installation

If you haven't already, install the [Node Package Manager](https://www.npmjs.com).

The easiest way is to install it with the Node Package Manager:

```bash
npm install astring
```

Alternatively, checkout this repository and install the development dependencies:

```bash
git clone https://github.com/davidbonnet/astring.git
cd astring
npm install
```



## Usage

The path to the module file is `dist/astring.min.js` and works both in a browser or Node environment. When run in a browser, it creates a global variable `astring`.

The `astring` module consists of a function that takes two arguments `node` and `options`. It returns a string representing the rendered code of the provided AST `node`.
The `options` are:

- `indent`: string to use for indentation (defaults to `\t`)
- `lineEnd`: string to use for line endings (defaults to `\n`)
- `startingIndentLevel`: indent level to start from (defaults to `0`)



### Example

This example uses [Acorn](https://github.com/marijnh/acorn), a blazingly fast JavaScript parser and AST producer. It is the perfect companion of Astring.

```javascript
// Import modules (unecessary when run in a browser)
acorn = require( 'acorn' );
astring = require( 'astring' );

// Example code
var code = "let answer = 4 + 7 * 5 + 3;\n";

// Parse it into an AST
var ast = acorn.parse( code, { ecmaVersion: 6 } );

// Set formatting options
var options = {
	indent: '   ',
	lineEnd: '\n'
};

// Format it
result = astring( ast, options );

// Check it
if ( code === result ) {
	console.log( 'It works !' );
} else {
	console.log( 'Something went wrong…' );
}
```



## TODO

- Comments generation
- More tests

