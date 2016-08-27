# Astring

[![Build Status](https://travis-ci.org/davidbonnet/astring.svg?branch=master)](https://travis-ci.org/davidbonnet/astring)
[![NPM Version](https://img.shields.io/npm/v/astring.svg)](https://www.npmjs.org/package/astring)
[![Dependency Status](https://david-dm.org/davidbonnet/astring.svg)](https://david-dm.org/davidbonnet/astring)
[![devDependency Status](https://david-dm.org/davidbonnet/astring/dev-status.svg)](https://david-dm.org/davidbonnet/astring#info=devDependencies)

A tiny and fast JavaScript code generator from an [ESTree](https://github.com/estree/estree)-compliant AST.

Key features:

- Generates JavaScript code up to [version 6](http://www.ecma-international.org/ecma-262/6.0/index.html).
- Works on [ESTree](https://github.com/estree/estree)-compliant ASTs such as the ones produced by [Acorn](https://github.com/marijnh/acorn).
- Considerably faster than [Esotope](https://github.com/inikulin/esotope) (up to 4×), [Escodegen](https://github.com/estools/escodegen) (up to 10×), and [UglifyJS](https://github.com/mishoo/UglifyJS2) (up to 125×).
- No dependencies and small footprint (≈ 16 KB minified, ≈ 4 KB gziped).
- Supports comment generation with [Astravel](https://github.com/davidbonnet/astravel).
- Extendable with custom AST node handlers.


## Installation

The easiest way is to install it with the [Node Package Manager](https://www.npmjs.com/package/astring):

```bash
npm install astring
```

Alternatively, checkout this repository and install the development dependencies to build the module file:

```bash
git clone https://github.com/davidbonnet/astring.git
cd astring
npm install
```

The path to the module file is `dist/astring.js` and can be linked to from an HTML webpage. When used in a browser environment, the module exposes a global variable `astring`:

```html
<script src="astring.js" type="text/javascript"></script>
```



## Usage

A [live demo](http://bonnet.cc/astring/demo.html) showing Astring in action is available.

The `astring` module consists of a function that takes two arguments: `node` and `options`. It returns a string representing the rendered code of the provided AST `node`. However, if an `output` stream is provided in the options, it writes to that stream and returns it.
The `options` are:

- `indent`: string to use for indentation (defaults to `"\t"`)
- `lineEnd`: string to use for line endings (defaults to `"\n"`)
- `startingIndentLevel`: indent level to start from (defaults to `0`)
- `comments`: generate comments if `true` (defaults to `false`)
- `output`: output stream to write the rendered code to (defaults to `null`)
- `generator`: custom code generator (defaults to `astring.defaultGenerator`)

### Example

This example uses [Acorn](https://github.com/marijnh/acorn), a blazingly fast JavaScript AST producer and therefore the perfect companion of Astring.

```javascript
// Make sure acorn and astring modules are imported
// Set example code
var code = "let answer = 4 + 7 * 5 + 3;\n";
// Parse it into an AST
var ast = acorn.parse(code, { ecmaVersion: 6 });
// Format it into a code string
var formattedCode = astring(ast, {
	indent: '   ',
	lineEnd: '\n'
});
// Check it
console.log((code === formattedCode) ? 'It works !' : 'Something went wrong…');
```

### Using writable streams

This example for [Node](http://nodejs.org) shows how to use writable streams to get the rendered code.

```javascript
// Make sure acorn and astring modules are imported
// Set example code
var code = "let answer = 4 + 7 * 5 + 3;\n";
// Parse it into an AST
var ast = acorn.parse(code, { ecmaVersion: 6 });
// Format it and write the result to stdout
var stream = astring(ast, {
	output: process.stdout
});
// The returned value is the output stream
console.log('stream is process.stdout?', stream === process.stdout);
```

### Generating comments

Astring supports comment generation, provided they are stored on the AST nodes. To do so, this example uses [Astravel](https://github.com/davidbonnet/astravel), a fast AST traveller and modifier.

```javascript
// Make sure acorn, astravel and astring modules are imported
// Set example code
var code = [
	"// Compute the answer to everything",
	"let answer = 4 + 7 * 5 + 3;",
	"// Display it",
	"console.log(answer);"
].join('\n') + '\n';
// Parse it into an AST and retrieve the list of comments
var comments = [];
var ast = acorn.parse(code, {
	ecmaVersion: 6,
	locations: true,
	onComment: comments
});
// Attach comments to AST nodes
astravel.attachComments(ast, comments);
// Format it into a code string
var formattedCode = astring(ast, {
	indent: '   ',
	lineEnd: '\n',
	comments: true
});
// Check it
console.log(code === formattedCode ? 'It works !' : 'Something went wrong…');
```

### Extending

Astring can easily be extended by updating or passing a custom code `generator`. A code `generator` consists of a mapping of node names and functions that take two arguments: `node` and `state`. The `node` points to the node from which to generate the code and the `state` holds various values and objects, the most important one being the `output` code stream.

This example shows how to support the `await` keyword which is part of the [asynchronous functions proposal](https://github.com/tc39/ecmascript-asyncawait). The corresponding `AwaitExpression` node is based on [this suggested definition](https://github.com/estree/estree/blob/master/experimental/async-functions.md).

```javascript
// Make sure the astring module is imported and that `Object.assign` is defined
// Create a custom generator that inherits from Astring's default generator
var customGenerator = Object.assign({}, astring.defaultGenerator, {
	AwaitExpression: function(node, state) {
		state.output.write('await ');
		var argument = node.argument;
		if (argument != null) {
			this[argument.type](argument, state);
		}
	}
});
// Obtain a custom AST somehow (note that this AST is not from obtained from a valid code)
var ast = {
	type: "Program",
	body: [{
		type: "ExpressionStatement",
		expression: {
			type: "AwaitExpression",
			argument: {
				type: "CallExpression",
				callee: {
					type: "Identifier",
					name: "callable"
				},
				arguments: []	
			}
		}
	}],
	sourceType: "module"
};
// Format it
var code = astring(ast, {
	generator: customGenerator
});
// Check it
console.log(code === 'await callable();\n' ? 'It works!' : 'Something went wrong…');
```



## Command line interface

The `bin/astring` utility can be used to convert a JSON-formatted ESTree compliant AST of a JavaScript code. It accepts the following arguments:

- `-i`, `--indent`: string to use as indentation (defaults to `"\t"`)
- `-l`, `--line-end`: string to use for line endings (defaults to `"\n"`)
- `-s`, `--starting-indent-level`: indent level to start from (defaults to `0`)
- `-h`, `--help`: print a usage message and exit
- `-v`, `--version`: print package version and exit

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



## Building

All building scripts are defined in the `package.json` file and rely on the [Node Package Manager](https://www.npmjs.com/). All commands must be run from within the root repository folder.


### Production

The source code of Astring is written in JavaScript 6 and located at `src/astring.js`. It is compiled down to a JavaScript 5 file located at `dist/astring.js` using [Browserify](http://browserify.org) and [Babel](http://babeljs.io/). This is achieved by running:

```bash
npm run build
```

If you are already using a JavaScript 6 to 5 compiler for your project, or a JavaScript 6 compliant interpreter, you can include the `src/astring.js` file directly.


### Development

If you are working on Astring, you can use [Watchify](https://github.com/substack/watchify) to build automatically at each update the bundle (along with a source map for easy debugging) located at `dist/astring.debug.js` by running:

```bash
npm start
```


#### Tests

While making changes to Astring, make sure it passes the tests by running the following watcher:

```bash
npm run test-live
```

You can also run tests on a large array of files:

```bash
npm run test-full
```


#### Benchmark

Also, make sure that the modifications don't alter the performance by running benchmarks that compare Astring against Escodegen and Esotope:

```bash
npm run benchmark
```


#### Code format

Finally, make sure that the code is well formatted:

```bash
eslint src/astring.js
```



## Roadmap

Planned features and releases are outlined on the [milestones page](https://github.com/davidbonnet/astring/milestones).
