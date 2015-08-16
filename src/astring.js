// Astring is a tiny and fast JavaScript code generator from an ESTree-compliant AST.
//
// Astring was written by David Bonnet and released under an MIT license.
//
// The Git repository for Astring is available at:
// https://github.com/davidbonnet/astring.git
//
// Please use the GitHub bug tracker to report issues:
// https://github.com/davidbonnet/astring/issues


// Polyfill for non-ES6 interpreters
if ( !String.prototype.repeat ) {
	String.prototype.repeat = function ( count ) {
		// Perfom some checks first
		if ( count < 0 ) {
			throw new RangeError( 'Repeat count must be non-negative' )
		} else if ( count === Infinity ) {
			throw new RangeError( 'Repeat count must be less than infinity' )
		}
		// Ensure it's an integer
		count = count | 0
		if ( this.length * count >= 1 << 28 ) {
			// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/repeat
			// Most current (August 2014) browsers can't handle strings 1 << 28 chars or longer
			throw new RangeError( 'Repeat count must not overflow maximum string size' )
		}
		var out = []
		while ( count-- ) {
			out.push( this )
		}
		return out.join( '' )
	}
}


function formatParameters( code, params, state, traveler ) {
	/*
	Formats function parameters provided in `params` into the `code` array.
	*/
	code.push( '(' )
	if ( params != null && params.length > 0 ) {
		traveler[ params[ 0 ].type ]( params[ 0 ], state )
		for ( let i = 1, { length } = params; i < length; i++ ) {
			let param = params[ i ]
			code.push( ', ' )
			traveler[ param.type ]( param, state )
		}
	}
	code.push( ') ' )
}


function formatBinarySideExpression( code, node, operator, state, traveler ) {
	/*
	Formats into the `code` array a left-hand or right-hand expression `node` from a binary expression applying the provided `operator`.
	*/
	const needed = PARENTHESIS_NEEDED[ node.type ]
	if ( needed === 0 ) {
		traveler[ node.type ]( node, state )
		return
	} else if ( needed === 1 ) {
		if ( OPERATORS_PRECEDENCE[ node.operator ] >= OPERATORS_PRECEDENCE[ operator ] ) {
			traveler[ node.type ]( node, state )
			return
		}
	}
	code.push( '(' )
	traveler[ node.type ]( node, state )
	code.push( ')' )
}


function reindent( text, indentation ) {
	/*
	Returns the `text` string reindented with the provided `indentation`.
	*/
	text = text.trimRight()
	let indents = '\n'
	let secondLine = false
	const { length } = text
	for ( let i = 0; i < length; i++ ) {
		let char = text[ i ]
		if ( secondLine ) {
			if ( char === ' ' || char === '\t' ) {
				indents += char
			} else {
				return indentation + text.trimLeft().split( indents ).join( '\n' + indentation )
			}
		} else {
			if ( char === '\n' ) {
				secondLine = true
			}
		}
	}
	return indentation + text.trimLeft()
}


function formatComments( code, comments, indent, lineEnd ) {
	/*
	Inserts into `code` the provided list of `comments`, with the given `indent` and `lineEnd` strings.
	Line comments will end with `"\n"` regardless of the value of `lineEnd`.
	Expects to start on a new unindented line.
	*/
	for ( let i = 0, { length } = comments; i < length; i++ ) {
		let comment = comments[ i ]
		code.push( indent )
		if ( comment.type[ 0 ] === 'L' )
			// Line comment
			code.push( '// ', comment.value.trim(), "\n" )
		else
			// Block comment
			code.push( '/*', lineEnd, reindent( comment.value, indent ), lineEnd, indent, '*/', lineEnd )
	}
}


const OPERATORS_PRECEDENCE = {
	'||': 3,
	'&&': 4,
	'|': 5,
	'^': 6,
	'&': 7,
	'==': 8,
	'!=': 8,
	'===': 8,
	'!==': 8,
	'<': 9,
	'>': 9,
	'<=': 9,
	'>=': 9,
	'in': 9,
	'instanceof': 9,
	'<<': 10,
	'>>': 10,
	'>>>': 10,
	'+': 11,
	'-': 11,
	'*': 12,
	'%': 12,
	'/': 12
}


const PARENTHESIS_NEEDED = {
	// Not needed
	Identifier: 0,
	Literal: 0,
	MemberExpression: 0,
	CallExpression: 0,
	Super: 0,
	ThisExpression: 0,
	// Check
	BinaryExpression: 1,
	LogicalExpression: 1
}


var ForInStatement, FunctionDeclaration, RestElement, BinaryExpression, ArrayExpression


let traveler = {
	Program( node, state ) {
		const indent = state.indent.repeat( state.indentLevel )
		const { lineEnd, code, writeComments } = state
		if ( writeComments && node.comments != null )
			formatComments( code, node.comments, indent, lineEnd )
		let statements = node.body
		for ( let i = 0, { length } = statements; i < length; i++ ) {
			let statement = statements[ i ]
			if ( writeComments && statement.comments != null )
				formatComments( code, statement.comments, indent, lineEnd )
			code.push( indent )
			this[ statement.type ]( statement, state )
			code.push( lineEnd )
		}
		if ( writeComments && node.trailingComments != null )
			formatComments( code, node.trailingComments, indent, lineEnd )
	},
	BlockStatement( node, state ) {
		const indent = state.indent.repeat( state.indentLevel++ )
		const { lineEnd, code, writeComments } = state
		const statementIndent = indent + state.indent
		code.push( '{' )
		let statements = node.body
		if ( statements != null && statements.length > 0 ) {
			code.push( lineEnd )
			if ( writeComments && node.comments != null ) {
				formatComments( code, node.comments, statementIndent, lineEnd )
			}
			for ( let i = 0, { length } = statements; i < length; i++ ) {
				let statement = statements[ i ]
				if ( writeComments && statement.comments != null )
					formatComments( code, statement.comments, statementIndent, lineEnd )
				code.push( statementIndent )
				this[ statement.type ]( statement, state )
				code.push( lineEnd )
			}
			code.push( indent )
		} else {
			if ( writeComments && node.comments != null ) {
				code.push( lineEnd )
				formatComments( code, node.comments, statementIndent, lineEnd )
				code.push( indent )
			}
		}
		if ( writeComments && node.trailingComments != null )
			formatComments( code, node.trailingComments, statementIndent, lineEnd )
		code.push( '}' )
		state.indentLevel--
	},
	EmptyStatement( node, state ) {
		state.code.push( ';' )
	},
	ExpressionStatement( node, state ) {
		this[ node.expression.type ]( node.expression, state )
		state.code.push( ';' )
	},
	IfStatement( node, state ) {
		const { code } = state
		code.push( 'if (' )
		this[ node.test.type ]( node.test, state )
		code.push( ') ' )
		this[ node.consequent.type ]( node.consequent, state )
		if ( node.alternate != null ) {
			code.push( ' else ' )
			this[ node.alternate.type ]( node.alternate, state )
		}
	},
	LabeledStatement( node, state ) {
		this[ node.label.type ]( node.label, state )
		state.code.push( ':', state.lineEnd )
		this[ node.body.type ]( node.body, state )
	},
	BreakStatement( node, state ) {
		const { code } = state
		code.push( 'break' )
		if ( node.label ) {
			code.push( ' ' )
			this[ node.label.type ]( node.label, state )
		}
		code.push( ';' )
	},
	ContinueStatement( node, state ) {
		const { code } = state
		code.push( 'continue' )
		if ( node.label ) {
			code.push( ' ' )
			this[ node.label.type ]( node.label, state )
		}
		code.push( ';' )
	},
	WithStatement( node, state ) {
		const { code } = state
		code.push( 'with (' )
		this[ node.object.type ]( node.object, state )
		code.push( ') ' )
		this[ node.body.type ]( node.body, state )
	},
	SwitchStatement( node, state ) {
		const indent = state.indent.repeat( state.indentLevel++ )
		const { lineEnd, code, writeComments } = state
		state.indentLevel++
		const caseIndent = indent + state.indent
		const statementIndent = caseIndent + state.indent
		code.push( 'switch (' )
		this[ node.discriminant.type ]( node.discriminant, state )
		code.push( ') {', lineEnd )
		const { cases: occurences } = node
		for ( let i = 0, { length } = occurences; i < length; i++ ) {
			let occurence = occurences[ i ];
			if ( writeComments && occurence.comments != null )
				formatComments( code, occurence.comments, caseIndent, lineEnd )
			if ( occurence.test ) {
				code.push( caseIndent, 'case ' )
				this[ occurence.test.type ]( occurence.test, state )
				code.push( ':', lineEnd )
			} else {
				code.push( caseIndent, 'default:', lineEnd )
			}
			let { consequent } = occurence
			for ( let i = 0, { length } = consequent; i < length; i++ ) {
				let statement = consequent[ i ]
				if ( writeComments && statement.comments != null )
					formatComments( code, statement.comments, statementIndent, lineEnd )
				code.push( statementIndent )
				this[ statement.type ]( statement, state )
				code.push( lineEnd )
			}
		}
		state.indentLevel -= 2
		code.push( indent, '}' )
	},
	ReturnStatement( node, state ) {
		const { code } = state
		code.push( 'return' )
		if ( node.argument ) {
			code.push( ' ' )
			this[ node.argument.type ]( node.argument, state )
		}
		code.push( ';' )
	},
	ThrowStatement( node, state ) {
		const { code } = state
		code.push( 'throw ' )
		this[ node.argument.type ]( node.argument, state )
		code.push( ';' )
	},
	TryStatement( node, state ) {
		const { code } = state
		code.push( 'try ' )
		this[ node.block.type ]( node.block, state )
		if ( node.handler ) {
			let { handler } = node
			code.push( ' catch (' )
			this[ handler.param.type ]( handler.param, state )
			code.push( ') ' )
			this[ handler.body.type ]( handler.body, state )
		}
		if ( node.finalizer ) {
			code.push( ' finally ' )
			this[ node.finalizer.type ]( node.finalizer, state )
		}
	},
	WhileStatement( node, state ) {
		const { code } = state
		code.push( 'while (' )
		this[ node.test.type ]( node.test, state )
		code.push( ') ' )
		this[ node.body.type ]( node.body, state )
	},
	DoWhileStatement( node, state ) {
		const { code } = state
		code.push( 'do ' )
		this[ node.body.type ]( node.body, state )
		code.push( ' while (' )
		this[ node.test.type ]( node.test, state )
		code.push( ');' )
	},
	ForStatement( node, state ) {
		const { code } = state
		code.push( 'for (' )
		if ( node.init != null ) {
			const { init } = node, { type } = init
			this[ type ]( init, state )
			if ( type[ 0 ] === 'V' && type.length === 19 ) {
				// Remove inserted semicolon if VariableDeclaration
				state.code.pop()
			}
		}
		code.push( '; ' )
		if ( node.test )
			this[ node.test.type ]( node.test, state )
		code.push( '; ' )
		if ( node.update )
			this[ node.update.type ]( node.update, state )
		code.push( ') ' )
		this[ node.body.type ]( node.body, state )
	},
	ForInStatement: ForInStatement = function( node, state ) {
		const { code } = state
		code.push( 'for (' )
		const { left } = node, { type } = left
		this[ type ]( left, state )
		if ( type[ 0 ] === 'V' && type.length === 19 ) {
			// Remove inserted semicolon if VariableDeclaration
			state.code.pop()
		}
		code.push( node.type[ 3 ] === 'I' ? ' in ' : ' of ' )
		this[ node.right.type ]( node.right, state )
		code.push( ') ' )
		this[ node.body.type ]( node.body, state )
	},
	ForOfStatement: ForInStatement,
	DebuggerStatement( node, state ) {
		state.code.push( 'debugger;', state.lineEnd )
	},
	FunctionDeclaration: FunctionDeclaration = function( node, state ) {
		const { code } = state
		code.push( node.generator ? 'function* ' : 'function ' )
		if ( node.id )
			code.push( node.id.name )
		formatParameters( code, node.params, state, this )
		this[ node.body.type ]( node.body, state )
	},
	VariableDeclaration( node, state ) {
		const { code } = state
		const { declarations } = node
		code.push( node.kind, ' ' )
		const { length } = declarations
		if ( length > 0 ) {
			this.VariableDeclarator( declarations[ 0 ], state )
			for ( let i = 1; i < length; i++ ) {
				code.push( ', ' )
				this.VariableDeclarator( declarations[ i ], state )
			}
		}
		code.push( ';' )
	},
	VariableDeclarator( node, state ) {
		this[ node.id.type ]( node.id, state )
		if ( node.init != null ) {
			state.code.push( ' = ' )
			this[ node.init.type ]( node.init, state )
		}
	},
	ClassDeclaration( node, state ) {
		const { code } = state
		code.push( 'class ' )
		if ( node.id ) {
			code.push( node.id.name + ' ' )
		}
		if ( node.superClass ) {
			code.push( 'extends ' )
			this[ node.superClass.type ]( node.superClass, state )
			code.push( ' ' )
		}
		this.BlockStatement( node.body, state )
	},
	ImportDeclaration( node, state ) {
		const { code } = state
		code.push( 'import ' )
		const { specifiers } = node
		const { length } = specifiers
		if ( length > 0 ) {
			let i = 0, specifier
			importSpecifiers: while ( i < length ) {
				specifier = specifiers[ i ]
				switch ( specifier.type ) {
					case 'ImportDefaultSpecifier':
						code.push( specifier.local.name )
						i++
						break
					case 'ImportNamespaceSpecifier':
						code.push( '* as ', specifier.local.name )
						i++
						break
					default:
						break importSpecifiers
				}
				code.push( ', ' )
			}
			if ( i < length ) {
				code.push( '{' )
				while ( i < length ) {
					specifier = specifiers[ i ]
					let { name } = specifier.imported
					code.push( name )
					if ( name !== specifier.local.name ) {
						code.push( ' as ', specifier.local.name )
					}
					code.push( ', ' )
					i++
				}
				// Remove trailing comma
				code.pop()
				code.push( '}' )
			} else {
				// Remove trailing comma
				code.pop()
			}
			code.push( ' from ' )
		}
		code.push( node.source.raw )
		code.push( ';' )
	},
	ExportDefaultDeclaration( node, state ) {
		const { code } = state
		code.push( 'export default ' )
		this[ node.declaration.type ]( node.declaration, state )
		if ( node.declaration.type.substr( -10 ) === 'Expression' )
			code.push( ';' )
	},
	ExportNamedDeclaration( node, state ) {
		const { code } = state
		code.push( 'export ' )
		if ( node.declaration ) {
			this[ node.declaration.type ]( node.declaration, state )
		} else {
			code.push( '{' )
			const { specifiers } = node, { length } = specifiers
			if ( length > 0 ) {
				for ( let i = 0; ; ) {
					let specifier = specifiers[ i ]
					let { name } = specifier.local
					code.push( name )
					if ( name !== specifier.exported.name )
						code.push( ' as ' + specifier.exported.name )
					if ( ++i < length )
						code.push( ', ' )
					else
						break
				}
			}
			code.push( '}' )
			if ( node.source ) {
				code.push( ' from ', node.source.raw )
			}
			code.push( ';' )
		}
	},
	ExportAllDeclaration( node, state ) {
		state.code.push( 'export * from ', node.source.raw, ';' )
	},
	MethodDefinition( node, state ) {
		const { code } = state
		if ( node.static )
			code.push( 'static ' )
		switch ( node.kind ) {
			case 'get':
			case 'set':
				code.push( node.kind, ' ' )
				break
			default:
				break
		}
		if ( node.computed ) {
			code.push( '[' )
			this[ node.key.type ]( node.key, state )
			code.push( ']' )
		} else {
			code.push( node.key.name )
		}
		formatParameters( code, node.value.params, state, this )
		this[ node.value.body.type ]( node.value.body, state )
	},
	ClassExpression( node, state ) {
		this.ClassDeclaration( node, state )
	},
	ArrowFunctionExpression( node, state ) {
		const { code } = state
		formatParameters( code, node.params, state, this )
		code.push( '=> ' )
		if ( node.body.type[ 0 ] === 'O' ) {
			code.push( '(' )
			this.ObjectExpression( node.body, state )	
			code.push( ')' )
		} else {
			this[ node.body.type ]( node.body, state )
		}
	},
	ThisExpression( node, state ) {
		state.code.push( 'this' )
	},
	Super( node, state ) {
		state.code.push( 'super' )
	},
	RestElement: RestElement = function( node, state ) {
		state.code.push( '...' )
		this[ node.argument.type ]( node.argument, state )
	},
	SpreadElement: RestElement,
	YieldExpression( node, state ) {
		const { code } = state
		code.push( 'yield' )
		if ( node.argument ) {
			code.push( ' ' )
			this[ node.argument.type ]( node.argument, state )
		}
	},
	TemplateLiteral( node, state ) {
		const { code } = state
		const { quasis, expressions } = node
		code.push( '`' )
		for ( let i = 0, { length } = expressions; i < length; i++ ) {
			let expression = expressions[ i ]
			code.push( quasis[ i ].value.raw )
			code.push( '${' )
			this[ expression.type ]( expression, state )
			code.push( '}' )
		}
		code.push( quasis[ quasis.length - 1 ].value.raw )
		code.push( '`' )
	},
	TaggedTemplateExpression( node, state ) {
		this[ node.tag.type ]( node.tag, state )
		this[ node.quasi.type ]( node.quasi, state )
	},
	ArrayExpression: ArrayExpression = function( node, state ) {
		const { code } = state
		code.push( '[' )
		if ( node.elements.length > 0 ) {
			const { elements } = node, { length } = elements
			for ( let i = 0; ; ) {
				let element = elements[ i ]
				this[ element.type ]( element, state )
				if ( ++i < length )
					code.push( ', ' )
				else
					break
			}
		}
		code.push( ']' )
	},
	ArrayPattern: ArrayExpression,
	ObjectExpression( node, state ) {
		const indent = state.indent.repeat( state.indentLevel++ )
		const { lineEnd, code, writeComments } = state
		const propertyIndent = indent + state.indent
		code.push( '{' )
		if ( node.properties.length > 0 ) {
			code.push( lineEnd )
			if ( writeComments && node.comments != null )
				formatComments( code, node.comments, propertyIndent, lineEnd )
			const comma = ',' + lineEnd, { properties } = node, { length } = properties
			for ( let i = 0; ; ) {
				let property = properties[ i ]
				if ( writeComments && property.comments != null )
					formatComments( code, property.comments, propertyIndent, lineEnd )
				code.push( propertyIndent )
				this.Property( property, state )
				if ( ++i < length )
					code.push( comma )
				else
					break
			}
			code.push( lineEnd )
			if ( writeComments && node.trailingComments != null )
				formatComments( code, node.trailingComments, propertyIndent, lineEnd )
			code.push( indent, '}' )
		} else if ( writeComments ) {
			if ( node.comments != null ) {
				code.push( lineEnd )
				formatComments( code, node.comments, propertyIndent, lineEnd )
				if ( node.trailingComments != null )
					formatComments( code, node.trailingComments, propertyIndent, lineEnd )
				code.push( indent, '}' )
			} else if ( node.trailingComments != null ) {
				code.push( lineEnd )
				formatComments( code, node.trailingComments, propertyIndent, lineEnd )
				code.push( indent, '}' )
			}
		} else {
			code.push( '}' )
		}
		state.indentLevel--
	},
	Property( node, state ) {
		const { code } = state
		if ( node.computed ) {
			code.push( '[' )
			this[ node.key.type ]( node.key, state )
			code.push( ']' )
		} else {
			this[ node.key.type ]( node.key, state )
		}
		if ( !node.shorthand ) {
			code.push( ': ' )
			this[ node.value.type ]( node.value, state )
		}
	},
	ObjectPattern( node, state ) {
		const { code } = state
		code.push( '{' )
		if ( node.properties.length > 0 ) {
			const { properties } = node, { length } = properties
			for ( let i = 0; ; ) {
				this.Property( properties[ i ], state )
				if ( ++i < length )
					code.push( ', ' )
				else
					break
			}
		}
		code.push( '}' )
	},
	FunctionExpression: FunctionDeclaration,
	SequenceExpression( node, state ) {
		const { code } = state
		const { expressions } = node
		if ( expressions.length > 0 ) {
			const { length } = expressions
			for ( let i = 0; ; ) {
				let expression = expressions[ i ]
				this[ expression.type ]( expression, state )
				if ( ++i < length )
					code.push( ', ' )
				else
					break
			}
		}
	},
	UnaryExpression( node, state ) {
		if ( node.prefix ) {
			state.code.push( node.operator, ' ' )
			this[ node.argument.type ]( node.argument, state )
		} else {
			this[ node.argument.type ]( node.argument, state )
			state.code.push( node.operator )
		}
	},
	UpdateExpression( node, state ) {
		if ( node.prefix ) {
			state.code.push( node.operator )
			this[ node.argument.type ]( node.argument, state )
		} else {
			this[ node.argument.type ]( node.argument, state )
			state.code.push( node.operator )	
		}
	},
	AssignmentExpression( node, state ) {
		this[ node.left.type ]( node.left, state )
		state.code.push( ' ', node.operator, ' ' )
		this[ node.right.type ]( node.right, state )
	},
	AssignmentPattern( node, state ) {
		this[ node.left.type ]( node.left, state )
		state.code.push( ' = ' )
		this[ node.right.type ]( node.right, state )
	},
	BinaryExpression: BinaryExpression = function( node, state ) {
		const { code } = state
		const { operator } = node
		formatBinarySideExpression( code, node.left, operator, state, this )
		code.push( ' ', node.operator, ' ' )
		formatBinarySideExpression( code, node.right, operator, state, this )
	},
	LogicalExpression: BinaryExpression,
	ConditionalExpression( node, state ) {
		const { code } = state
		this[ node.test.type ]( node.test, state )
		code.push( ' ? ' )
		this[ node.consequent.type ]( node.consequent, state )
		code.push( ' : ' )
		this[ node.alternate.type ]( node.alternate, state )
	},
	NewExpression( node, state ) {
		state.code.push( 'new ' )
		this.CallExpression( node, state )
	},
	CallExpression( node, state ) {
		const { code } = state
		if ( PARENTHESIS_NEEDED[ node.callee.type ] === 0 ) {
			this[ node.callee.type ]( node.callee, state )
		} else {
			code.push( '(' )
			this[ node.callee.type ]( node.callee, state )
			code.push( ')' )
		}
		code.push( '(' )
		const args = node[ 'arguments' ]
		if ( args.length > 0 ) {
			this[ args[ 0 ].type ]( args[ 0 ], state )
			const { length } = args
			for ( let i = 1; i < length; i++ ) {
				let arg = args[ i ]
				code.push( ', ' )
				this[ arg.type ]( arg, state )
			}
		}
		code.push( ')' )
	},
	MemberExpression( node, state ) {
		const { code } = state
		this[ node.object.type ]( node.object, state )
		if ( node.computed ) {
			code.push( '[' )
			this[ node.property.type ]( node.property, state )
			code.push( ']' )
		} else {
			code.push( '.' )
			this[ node.property.type ]( node.property, state )
		}
	},
	Identifier( node, state ) {
		state.code.push( node.name )
	},
	Literal( node, state ) {
		state.code.push( node.raw )
	}
}



export default function( node, options ) {
	/*
	Returns a string representing the rendered code of the provided AST `node`.
	The `options` are:

	- `indent`: string to use for indentation (defaults to `\t`)
	- `lineEnd`: string to use for line endings (defaults to `\n`)
	- `startingIndentLevel`: indent level to start from (default to `0`)
	- `comments`: generate comments if `true` (defaults to `false`)
	*/
	const state = (options == null) ? {
		code: [],
		indent: "\t",
		lineEnd: "\n",
		indentLevel: 0,
		writeComments: false
	} : {
		// Will contain the resulting code as an array of code strings
		code: [],
		// Formating options
		indent: options.indent != null ? options.indent : "\t",
		lineEnd: options.lineEnd != null ? options.lineEnd : "\n",
		indentLevel: options.startingIndentLevel != null ? options.startingIndentLevel : 0,
		writeComments: options.comments ? options.comments : false
	}
	// Travel through the AST node and generate the code
	traveler[ node.type ]( node, state )
	return state.code.join( '' )
}


