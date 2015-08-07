# Astring

[![Build Status](https://travis-ci.org/davidbonnet/astring.svg?branch=master)](https://travis-ci.org/davidbonnet/astring)
[![NPM Version](https://img.shields.io/npm/v/astring.svg)](https://www.npmjs.org/package/astring)
[![Dependency Status](https://david-dm.org/davidbonnet/astring.svg)](https://david-dm.org/davidbonnet/astring)
[![devDependency Status](https://david-dm.org/davidbonnet/astring/dev-status.svg)](https://david-dm.org/davidbonnet/astring#info=devDependencies)

A tiny and fast JavaScript code generator from an [ESTree](https://github.com/estree/estree)-compliant AST.

Key features:

- Supports ECMAScript versions 5 and 6.
- Works on [ESTree](https://github.com/estree/estree)-compliant ASTs such as the ones produced by [Acorn](https://github.com/marijnh/acorn).
- Runs both in a browser and in [Node](http://nodejs.org).
- Considerably faster than [Escodegen](https://github.com/estools/escodegen).
- Smaller than [Esotope](https://github.com/inikulin/esotope) and faster for small ASTs.
- No dependencies and small footprint (~12 KB minified, ~3 KB gziped).
- Output code is readable and executable.



## Installation

The easiest way is to install it with the [Node Package Manager](https://www.npmjs.com):

```bash
npm install astring
```

Alternatively, checkout this repository and install the development dependencies:

```bash
git clone https://github.com/davidbonnet/astring.git
cd astring
npm install
```

The path to the module file is `dist/astring.min.js` and can be linked to from an HTML webpage. When used in a browser environment, the module exposes a global variable `astring`:

```html
<script src="astring.min.js" type="text/javascript"></script>
```



## Usage

The `astring` module consists of a function that takes two arguments: `node` and `options`. It returns a string representing the rendered code of the provided AST `node`.
The `options` are:

- `indent`: string to use for indentation (defaults to `"\t"`)
- `lineEnd`: string to use for line endings (defaults to `"\n"`)
- `startingIndentLevel`: indent level to start from (defaults to `0`)


### Example

This example uses [Acorn](https://github.com/marijnh/acorn), a blazingly fast JavaScript parser and AST producer. It is the perfect companion of Astring.

```javascript
// Import modules (unnecessary when run in a browser)
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
var result = astring( ast, options );

// Check it
if ( code === result ) {
	console.log( 'It works !' );
} else {
	console.log( 'Something went wrong…' );
}
```


## Command line interface

The `bin/astring` utility can be used to convert a JSON-formatted ESTree compliant AST of a JavaScript code. It accepts the following arguments:

- `--indent`: string to use as indentation (defaults to `"\t"`)
- `--lineEnd`: string to use for line endings (defaults to `"\n"`)
- `--startingIndentLevel`: indent level to start from (defaults to `0`)

The utility reads the AST from `stdin` or from a provided list of files, and prints out the resulting code.


### Example

As in the previous example, these examples use [Acorn](https://github.com/marijnh/acorn) to get the JSON-formatted AST. This command pipes the AST output by Acorn from a `script.js` file to Astring and writes the formatted JavaScript code into a `result.js` file:

```bash
acorn --ecma6 script.js | astring --indent "  " > result.js
```

This command does the same, but reads the AST from an intermediary file:
```bash
acorn --ecma6 script.js > ast.json
astring --indent "  " ast.json > result.js
```



## Benchmark

From the repository, you can run benchmarks that compare Astring against Escodegen and Esotope:

```bash
npm run benchmark
```



## TODO

- Comments generation (version 0.3.x)
- More tests (patches)

