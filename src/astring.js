// Astring is a tiny and fast JavaScript code generator from an ESTree-compliant AST.
//
// Astring was written by David Bonnet and released under an MIT license.
//
// The Git repository for Astring is available at:
// https://github.com/davidbonnet/astring.git
//
// Please use the GitHub bug tracker to report issues:
// https://github.com/davidbonnet/astring/issues


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
	'/': 12,
	'**': 12
}


const EXPRESSIONS_PRECEDENCE = {
	// Definitions
	ArrayExpression: 20,
	TaggedTemplateExpression: 20,
	ThisExpression: 20,
	Identifier: 20,
	Literal: 18,
	TemplateLiteral: 20,
	Super: 20,
	SequenceExpression: 20,
	// Operations
	MemberExpression: 19,
	CallExpression: 19,
	NewExpression: 19,
	ArrowFunctionExpression: 18,
	// Other definitions
	// Value 17 enables parenthesis in an `ExpressionStatement` node
	ClassExpression: 17,
	FunctionExpression: 17,
	ObjectExpression: 17,
	// Other operations
	UpdateExpression: 16,
	UnaryExpression: 15,
	BinaryExpression: 14,
	LogicalExpression: 13,
	ConditionalExpression: 4,
	AssignmentExpression: 3,
	YieldExpression: 2,
	RestElement: 1
}


function formatSequence( nodes, state, traveler ) {
	/*
	Formats a sequence of `nodes` into the `code` array.
	*/
	const { code } = state
	code.write( '(' )
	if ( nodes != null && nodes.length > 0 ) {
		traveler[ nodes[ 0 ].type ]( nodes[ 0 ], state )
		const { length } = nodes
		for ( let i = 1; i < length; i++ ) {
			let param = nodes[ i ]
			code.write( ', ' )
			traveler[ param.type ]( param, state )
		}
	}
	code.write( ')' )
}


function formatBinaryExpressionPart( node, parentNode, isRightHand, state, traveler ) {
	/*
	Formats into the `code` array a left-hand or right-hand expression `node` from a binary expression applying the provided `operator`.
	The `isRightHand` parameter should be `true` if the `node` is a right-hand argument.
	*/
	const nodePrecedence = EXPRESSIONS_PRECEDENCE[ node.type ]
	const parentNodePrecedence = EXPRESSIONS_PRECEDENCE[ parentNode.type ]
	if ( nodePrecedence > parentNodePrecedence ) {
		traveler[ node.type ]( node, state )
		return
	} else if ( nodePrecedence === parentNodePrecedence ) {
		if ( nodePrecedence === 13 || nodePrecedence === 14 ) {
			// Either `LogicalExpression` or `BinaryExpression`
			if ( isRightHand ) {
				if ( OPERATORS_PRECEDENCE[ node.operator ] > OPERATORS_PRECEDENCE[ parentNode.operator ] ) {
					traveler[ node.type ]( node, state )
					return
				}
			} else {
				if ( OPERATORS_PRECEDENCE[ node.operator ] >= OPERATORS_PRECEDENCE[ parentNode.operator ] ) {
					traveler[ node.type ]( node, state )
					return
				}
			}
		} else {
			traveler[ node.type ]( node, state )
			return
		}
	}
	state.code.write( '(' )
	traveler[ node.type ]( node, state )
	state.code.write( ')' )
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


function formatComments( comments, code, indent, lineEnd ) {
	/*
	Inserts into `code` the provided list of `comments`, with the given `indent` and `lineEnd` strings.
	Line comments will end with `"\n"` regardless of the value of `lineEnd`.
	Expects to start on a new unindented line.
	*/
	const { length } = comments
	for ( let i = 0; i < length; i++ ) {
		let comment = comments[ i ]
		code.write( indent )
		if ( comment.type[ 0 ] === 'L' )
			// Line comment
			code.write( '// ' + comment.value.trim() + '\n' )
		else
			// Block comment
			code.write( '/*' + lineEnd + reindent( comment.value, indent ) + lineEnd + indent + '*/' + lineEnd )
	}
}


function hasCallExpression( node ) {
	/*
	Returns `true` if the provided `node` contains a call expression and `false` otherwise.
	*/
	while ( node != null ) {
		let { type } = node
		if ( type[ 0 ] === 'C' && type[ 1 ] === 'a' ) {
			// Is CallExpression
			return true
		} else if ( type[ 0 ] === 'M' && type[ 1 ] === 'e' && type[ 2 ] === 'm' ) {
			// Is MemberExpression
			node = node.object
		} else {
			return false
		}
	}
}


var ForInStatement, FunctionDeclaration, RestElement, BinaryExpression, ArrayExpression


let traveler = {
	Program( node, state ) {
		const indent = state.indent.repeat( state.indentLevel )
		const { lineEnd, code, writeComments } = state
		if ( writeComments && node.comments != null )
			formatComments( node.comments, code, indent, lineEnd )
		let statements = node.body
		const { length } = statements
		for ( let i = 0; i < length; i++ ) {
			let statement = statements[ i ]
			if ( writeComments && statement.comments != null )
				formatComments( statement.comments, code, indent, lineEnd )
			code.write( indent )
			this[ statement.type ]( statement, state )
			code.write( lineEnd )
		}
		if ( writeComments && node.trailingComments != null )
			formatComments( node.trailingComments, code, indent, lineEnd )
	},
	BlockStatement( node, state ) {
		const indent = state.indent.repeat( state.indentLevel++ )
		const { lineEnd, code, writeComments } = state
		const statementIndent = indent + state.indent
		code.write( '{' )
		let statements = node.body
		if ( statements != null && statements.length > 0 ) {
			code.write( lineEnd )
			if ( writeComments && node.comments != null ) {
				formatComments( node.comments, code, statementIndent, lineEnd )
			}
			const { length } = statements
			for ( let i = 0; i < length; i++ ) {
				let statement = statements[ i ]
				if ( writeComments && statement.comments != null )
					formatComments( statement.comments, code, statementIndent, lineEnd )
				code.write( statementIndent )
				this[ statement.type ]( statement, state )
				code.write( lineEnd )
			}
			code.write( indent )
		} else {
			if ( writeComments && node.comments != null ) {
				code.write( lineEnd )
				formatComments( node.comments, code, statementIndent, lineEnd )
				code.write( indent )
			}
		}
		if ( writeComments && node.trailingComments != null )
			formatComments( node.trailingComments, code, statementIndent, lineEnd )
		code.write( '}' )
		state.indentLevel--
	},
	EmptyStatement( node, state ) {
		state.code.write( ';' )
	},
	ExpressionStatement( node, state ) {
		const precedence = EXPRESSIONS_PRECEDENCE[ node.expression.type ]
		if ( precedence === 17 || ( precedence === 3 && node.expression.left.type[ 0 ] === 'O' ) ) {
			// Should always have parentheses or is an AssignmentExpression to an ObjectPattern
			state.code.write( '(' )
			this[ node.expression.type ]( node.expression, state )
			state.code.write( ')' )
		} else {
			this[ node.expression.type ]( node.expression, state )
		}
		state.code.write( ';' )
	},
	IfStatement( node, state ) {
		const { code } = state
		code.write( 'if (' )
		this[ node.test.type ]( node.test, state )
		code.write( ') ' )
		this[ node.consequent.type ]( node.consequent, state )
		if ( node.alternate != null ) {
			code.write( ' else ' )
			this[ node.alternate.type ]( node.alternate, state )
		}
	},
	LabeledStatement( node, state ) {
		this[ node.label.type ]( node.label, state )
		state.code.write( ': ' )
		this[ node.body.type ]( node.body, state )
	},
	BreakStatement( node, state ) {
		const { code } = state
		code.write( 'break' )
		if ( node.label ) {
			code.write( ' ' )
			this[ node.label.type ]( node.label, state )
		}
		code.write( ';' )
	},
	ContinueStatement( node, state ) {
		const { code } = state
		code.write( 'continue' )
		if ( node.label ) {
			code.write( ' ' )
			this[ node.label.type ]( node.label, state )
		}
		code.write( ';' )
	},
	WithStatement( node, state ) {
		const { code } = state
		code.write( 'with (' )
		this[ node.object.type ]( node.object, state )
		code.write( ') ' )
		this[ node.body.type ]( node.body, state )
	},
	SwitchStatement( node, state ) {
		const indent = state.indent.repeat( state.indentLevel++ )
		const { lineEnd, code, writeComments } = state
		state.indentLevel++
		const caseIndent = indent + state.indent
		const statementIndent = caseIndent + state.indent
		code.write( 'switch (' )
		this[ node.discriminant.type ]( node.discriminant, state )
		code.write( ') \{' + lineEnd )
		const { cases: occurences } = node
		const { length: occurencesCount } = occurences
		for ( let i = 0; i < occurencesCount; i++ ) {
			let occurence = occurences[ i ]
			if ( writeComments && occurence.comments != null )
				formatComments( occurence.comments, code, caseIndent, lineEnd )
			if ( occurence.test ) {
				code.write( caseIndent + 'case ' )
				this[ occurence.test.type ]( occurence.test, state )
				code.write( ':' + lineEnd )
			} else {
				code.write( caseIndent + 'default:' + lineEnd )
			}
			let { consequent } = occurence
			const { length: consequentCount } = consequent
			for ( let i = 0; i < consequentCount; i++ ) {
				let statement = consequent[ i ]
				if ( writeComments && statement.comments != null )
					formatComments( statement.comments, code, statementIndent, lineEnd )
				code.write( statementIndent )
				this[ statement.type ]( statement, state )
				code.write( lineEnd )
			}
		}
		state.indentLevel -= 2
		code.write( indent + '}' )
	},
	ReturnStatement( node, state ) {
		const { code } = state
		code.write( 'return' )
		if ( node.argument ) {
			code.write( ' ' )
			this[ node.argument.type ]( node.argument, state )
		}
		code.write( ';' )
	},
	ThrowStatement( node, state ) {
		const { code } = state
		code.write( 'throw ' )
		this[ node.argument.type ]( node.argument, state )
		code.write( ';' )
	},
	TryStatement( node, state ) {
		const { code } = state
		code.write( 'try ' )
		this[ node.block.type ]( node.block, state )
		if ( node.handler ) {
			let { handler } = node
			code.write( ' catch (' )
			this[ handler.param.type ]( handler.param, state )
			code.write( ') ' )
			this[ handler.body.type ]( handler.body, state )
		}
		if ( node.finalizer ) {
			code.write( ' finally ' )
			this[ node.finalizer.type ]( node.finalizer, state )
		}
	},
	WhileStatement( node, state ) {
		const { code } = state
		code.write( 'while (' )
		this[ node.test.type ]( node.test, state )
		code.write( ') ' )
		this[ node.body.type ]( node.body, state )
	},
	DoWhileStatement( node, state ) {
		const { code } = state
		code.write( 'do ' )
		this[ node.body.type ]( node.body, state )
		code.write( ' while (' )
		this[ node.test.type ]( node.test, state )
		code.write( ');' )
	},
	ForStatement( node, state ) {
		const { code } = state
		code.write( 'for (' )
		if ( node.init != null ) {
			const { init } = node
			state.noTrailingSemicolon = true
			this[ node.init.type ]( node.init, state )
			state.noTrailingSemicolon = false
		}
		code.write( '; ' )
		if ( node.test )
			this[ node.test.type ]( node.test, state )
		code.write( '; ' )
		if ( node.update )
			this[ node.update.type ]( node.update, state )
		code.write( ') ' )
		this[ node.body.type ]( node.body, state )
	},
	ForInStatement: ForInStatement = function( node, state ) {
		const { code } = state
		code.write( 'for (' )
		const { left } = node, { type } = left
		state.noTrailingSemicolon = true
		this[ type ]( left, state )
		state.noTrailingSemicolon = false
		// Identifying whether node.type is `ForInStatement` or `ForOfStatement`
		code.write( node.type[ 3 ] === 'I' ? ' in ' : ' of ' )
		this[ node.right.type ]( node.right, state )
		code.write( ') ' )
		this[ node.body.type ]( node.body, state )
	},
	ForOfStatement: ForInStatement,
	DebuggerStatement( node, state ) {
		state.code.write( 'debugger;' + state.lineEnd )
	},
	FunctionDeclaration: FunctionDeclaration = function( node, state ) {
		const { code } = state
		code.write( node.generator ? 'function* ' : 'function ' )
		if ( node.id )
			code.write( node.id.name )
		formatSequence( node.params, state, this )
		code.write( ' ' )
		this[ node.body.type ]( node.body, state )
	},
	FunctionExpression: FunctionDeclaration,
	VariableDeclaration( node, state ) {
		const { code } = state
		const { declarations } = node
		code.write( node.kind + ' ' )
		const { length } = declarations
		if ( length > 0 ) {
			this.VariableDeclarator( declarations[ 0 ], state )
			for ( let i = 1; i < length; i++ ) {
				code.write( ', ' )
				this.VariableDeclarator( declarations[ i ], state )
			}
		}
		if ( state.noTrailingSemicolon !== true )
			code.write( ';' )
	},
	VariableDeclarator( node, state ) {
		this[ node.id.type ]( node.id, state )
		if ( node.init != null ) {
			state.code.write( ' = ' )
			this[ node.init.type ]( node.init, state )
		}
	},
	ClassDeclaration( node, state ) {
		const { code } = state
		code.write( 'class ' )
		if ( node.id ) {
			code.write( node.id.name + ' ' )
		}
		if ( node.superClass ) {
			code.write( 'extends ' )
			this[ node.superClass.type ]( node.superClass, state )
			code.write( ' ' )
		}
		this.BlockStatement( node.body, state )
	},
	ImportDeclaration( node, state ) {
		const { code } = state
		code.write( 'import ' )
		const { specifiers } = node
		const { length } = specifiers
		if ( length > 0 ) {
			let i = 0, specifier
			while ( i < length ) {
				if ( i > 0 )
					code.write( ', ' )
				specifier = specifiers[ i ]
				const type = specifier.type[ 6 ]
				if (type === 'D') {
					// ImportDefaultSpecifier
					code.write( specifier.local.name )
					i++
				} else if (type === 'N') {
					// ImportNamespaceSpecifier
					code.write( '* as ' + specifier.local.name )
					i++
				} else {
					// ImportSpecifier
					break
				}
			}
			if ( i < length ) {
				code.write( '{' )
				for ( ; ; ) {
					specifier = specifiers[ i ]
					let { name } = specifier.imported
					code.write( name )
					if ( name !== specifier.local.name ) {
						code.write( ' as ' + specifier.local.name )
					}
					if ( ++i < length )
						code.write( ', ' )
					else
						break
				}
				code.write( '}' )
			}
			code.write( ' from ' )
		}
		code.write( node.source.raw )
		code.write( ';' )
	},
	ExportDefaultDeclaration( node, state ) {
		const { code } = state
		code.write( 'export default ' )
		this[ node.declaration.type ]( node.declaration, state )
		if ( EXPRESSIONS_PRECEDENCE[ node.declaration.type ] && node.declaration.type[ 0 ] !== 'F' )
			// All expression nodes except `FunctionExpression`
			code.write( ';' )
	},
	ExportNamedDeclaration( node, state ) {
		const { code } = state
		code.write( 'export ' )
		if ( node.declaration ) {
			this[ node.declaration.type ]( node.declaration, state )
		} else {
			code.write( '{' )
			const { specifiers } = node, { length } = specifiers
			if ( length > 0 ) {
				for ( let i = 0; ; ) {
					let specifier = specifiers[ i ]
					let { name } = specifier.local
					code.write( name )
					if ( name !== specifier.exported.name )
						code.write( ' as ' + specifier.exported.name )
					if ( ++i < length )
						code.write( ', ' )
					else
						break
				}
			}
			code.write( '}' )
			if ( node.source ) {
				code.write( ' from ' + node.source.raw )
			}
			code.write( ';' )
		}
	},
	ExportAllDeclaration( node, state ) {
		state.code.write( 'export * from ' + node.source.raw + ';' )
	},
	MethodDefinition( node, state ) {
		const { code } = state
		if ( node.static )
			code.write( 'static ' )
		switch ( node.kind[ 0 ] ) {
			case 'g': // `get`
			case 's': // `set`
				code.write( node.kind + ' ' )
				break
			default:
				break
		}
		if ( node.value.generator )
			code.write( '*' )
		if ( node.computed ) {
			code.write( '[' )
			this[ node.key.type ]( node.key, state )
			code.write( ']' )
		} else {
			this[ node.key.type ]( node.key, state )
		}
		formatSequence( node.value.params, state, this )
		code.write( ' ' )
		this[ node.value.body.type ]( node.value.body, state )
	},
	ClassExpression( node, state ) {
		this.ClassDeclaration( node, state )
	},
	ArrowFunctionExpression( node, state ) {
		const { code } = state
		const { params } = node
		if ( params != null ) {
			if ( params.length === 1 && params[ 0 ].type[ 0 ] === 'I' ) {
				// If params[0].type[0] starts with 'I', it can't be `ImportDeclaration` nor `IfStatement` and thus is `Identifier`
				code.write( params[ 0 ].name )
			} else {
				formatSequence( node.params, state, this )
			}
		}
		code.write( ' => ' )
		if ( node.body.type[ 0 ] === 'O' ) {
			code.write( '(' )
			this.ObjectExpression( node.body, state )
			code.write( ')' )
		} else {
			this[ node.body.type ]( node.body, state )
		}
	},
	ThisExpression( node, state ) {
		state.code.write( 'this' )
	},
	Super( node, state ) {
		state.code.write( 'super' )
	},
	RestElement: RestElement = function( node, state ) {
		state.code.write( '...' )
		this[ node.argument.type ]( node.argument, state )
	},
	SpreadElement: RestElement,
	YieldExpression( node, state ) {
		const { code } = state
		code.write( node.delegate ? 'yield*' : 'yield' )
		if ( node.argument ) {
			code.write( ' ' )
			this[ node.argument.type ]( node.argument, state )
		}
	},
	TemplateLiteral( node, state ) {
		const { code } = state
		const { quasis, expressions } = node
		code.write( '`' )
		const { length } = expressions
		for ( let i = 0; i < length; i++ ) {
			let expression = expressions[ i ]
			code.write( quasis[ i ].value.raw )
			code.write( '${' )
			this[ expression.type ]( expression, state )
			code.write( '}' )
		}
		code.write( quasis[ quasis.length - 1 ].value.raw )
		code.write( '`' )
	},
	TaggedTemplateExpression( node, state ) {
		this[ node.tag.type ]( node.tag, state )
		this[ node.quasi.type ]( node.quasi, state )
	},
	ArrayExpression: ArrayExpression = function( node, state ) {
		const { code } = state
		code.write( '[' )
		if ( node.elements.length > 0 ) {
			const { elements } = node, { length } = elements
			for ( let i = 0; ; ) {
				let element = elements[ i ]
				if ( element != null )
					this[ element.type ]( element, state )
				if ( ++i < length ) {
					code.write( ', ' )
				} else {
					if ( element == null )
						code.write( ', ' )
					break
				}
			}
		}
		code.write( ']' )
	},
	ArrayPattern: ArrayExpression,
	ObjectExpression( node, state ) {
		const indent = state.indent.repeat( state.indentLevel++ )
		const { lineEnd, code, writeComments } = state
		const propertyIndent = indent + state.indent
		code.write( '{' )
		if ( node.properties.length > 0 ) {
			code.write( lineEnd )
			if ( writeComments && node.comments != null )
				formatComments( node.comments, code, propertyIndent, lineEnd )
			const comma = ',' + lineEnd, { properties } = node, { length } = properties
			for ( let i = 0; ; ) {
				let property = properties[ i ]
				if ( writeComments && property.comments != null )
					formatComments( property.comments, code, propertyIndent, lineEnd )
				code.write( propertyIndent )
				this.Property( property, state )
				if ( ++i < length )
					code.write( comma )
				else
					break
			}
			code.write( lineEnd )
			if ( writeComments && node.trailingComments != null )
				formatComments( node.trailingComments, code, propertyIndent, lineEnd )
			code.write( indent + '}' )
		} else if ( writeComments ) {
			if ( node.comments != null ) {
				code.write( lineEnd )
				formatComments( node.comments, code, propertyIndent, lineEnd )
				if ( node.trailingComments != null )
					formatComments( node.trailingComments, code, propertyIndent, lineEnd )
				code.write( indent + '}' )
			} else if ( node.trailingComments != null ) {
				code.write( lineEnd )
				formatComments( node.trailingComments, code, propertyIndent, lineEnd )
				code.write( indent + '}' )
			} else {
				code.write( '}' )
			}
		} else {
			code.write( '}' )
		}
		state.indentLevel--
	},
	Property( node, state ) {
		if ( node.method || node.kind[ 0 ] !== 'i' ) {
			// Either a method or of kind `set` or `get` (not `init`)
			this.MethodDefinition( node, state )
		} else {
			const { code } = state
			if ( !node.shorthand ) {
				if ( node.computed ) {
					code.write( '[' )
					this[ node.key.type ]( node.key, state )
					code.write( ']' )
				} else {
					this[ node.key.type ]( node.key, state )
				}
				code.write( ': ' )
			}
			this[ node.value.type ]( node.value, state )
		}
	},
	ObjectPattern( node, state ) {
		const { code } = state
		code.write( '{' )
		if ( node.properties.length > 0 ) {
			const { properties } = node, { length } = properties
			for ( let i = 0; ; ) {
				this.Property( properties[ i ], state )
				if ( ++i < length )
					code.write( ', ' )
				else
					break
			}
		}
		code.write( '}' )
	},
	SequenceExpression( node, state ) {
		formatSequence( node.expressions, state, this )
	},
	UnaryExpression( node, state ) {
		const { code } = state
		if ( node.prefix ) {
			code.write( node.operator )
			if ( node.operator.length > 1 )
				state.code.write( ' ' )
			if ( EXPRESSIONS_PRECEDENCE[ node.argument.type ] < EXPRESSIONS_PRECEDENCE.UnaryExpression ) {
				code.write( '(' )
				this[ node.argument.type ]( node.argument, state )
				code.write( ')' )
			} else {
				this[ node.argument.type ]( node.argument, state )
			}
		} else {
			// FIXME: This case never occurs
			this[ node.argument.type ]( node.argument, state )
			state.code.write( node.operator )
		}
	},
	UpdateExpression( node, state ) {
		// Always applied to identifiers or members, no parenthesis check needed
		if ( node.prefix ) {
			state.code.write( node.operator )
			this[ node.argument.type ]( node.argument, state )
		} else {
			this[ node.argument.type ]( node.argument, state )
			state.code.write( node.operator )
		}
	},
	AssignmentExpression( node, state ) {
		this[ node.left.type ]( node.left, state )
		state.code.write( ' ' + node.operator + ' ' )
		this[ node.right.type ]( node.right, state )
	},
	AssignmentPattern( node, state ) {
		this[ node.left.type ]( node.left, state )
		state.code.write( ' = ' )
		this[ node.right.type ]( node.right, state )
	},
	BinaryExpression: BinaryExpression = function( node, state ) {
		const { code } = state
		if ( node.operator === 'in' ) {
			// Avoids confusion in `for` loops initializers
			code.write( '(' )
			formatBinaryExpressionPart( node.left, node, false, state, this )
			code.write( ' ' + node.operator + ' ' )
			formatBinaryExpressionPart( node.right, node, true, state, this )
			code.write( ')' )
		} else {
			formatBinaryExpressionPart( node.left, node, false, state, this )
			code.write( ' ' + node.operator + ' ' )
			formatBinaryExpressionPart( node.right, node, true, state, this )
		}
	},
	LogicalExpression: BinaryExpression,
	ConditionalExpression( node, state ) {
		const { code } = state
		if ( EXPRESSIONS_PRECEDENCE[ node.test.type ] > EXPRESSIONS_PRECEDENCE.ConditionalExpression ) {
			this[ node.test.type ]( node.test, state )
		} else {
			code.write( '(' )
			this[ node.test.type ]( node.test, state )
			code.write( ')' )
		}
		code.write( ' ? ' )
		this[ node.consequent.type ]( node.consequent, state )
		code.write( ' : ' )
		this[ node.alternate.type ]( node.alternate, state )
	},
	NewExpression( node, state ) {
		state.code.write( 'new ' )
		const { code } = state
		if ( EXPRESSIONS_PRECEDENCE[ node.callee.type ] < EXPRESSIONS_PRECEDENCE.CallExpression
				|| hasCallExpression( node.callee ) ) {
			code.write( '(' )
			this[ node.callee.type ]( node.callee, state )
			code.write( ')' )
		} else {
			this[ node.callee.type ]( node.callee, state )
		}
		formatSequence( node[ 'arguments' ], state, this )
	},
	CallExpression( node, state ) {
		const { code } = state
		if ( EXPRESSIONS_PRECEDENCE[ node.callee.type ] < EXPRESSIONS_PRECEDENCE.CallExpression ) {
			code.write( '(' )
			this[ node.callee.type ]( node.callee, state )
			code.write( ')' )
		} else {
			this[ node.callee.type ]( node.callee, state )
		}
		formatSequence( node[ 'arguments' ], state, this )
	},
	MemberExpression( node, state ) {
		const { code } = state
		if ( EXPRESSIONS_PRECEDENCE[ node.object.type ] < EXPRESSIONS_PRECEDENCE.MemberExpression ) {
			code.write( '(' )
			this[ node.object.type ]( node.object, state )
			code.write( ')' )
		} else {
			this[ node.object.type ]( node.object, state )
		}
		if ( node.computed ) {
			code.write( '[' )
			this[ node.property.type ]( node.property, state )
			code.write( ']' )
		} else {
			code.write( '.' )
			this[ node.property.type ]( node.property, state )
		}
	},
	MetaProperty( node, state ) {
		state.code.write( node.meta.name + '.' + node.property.name )
	},
	Identifier( node, state ) {
		state.code.write( node.name )
	},
	Literal( node, state ) {
		state.code.write( node.raw )
	}
}


class Stream {

	constructor() {
		this.data = ''
	}
	
	write( string ) {
		this.data += string;
	}

	toString() {
		return this.data
	}

}


export default function astring( node, options ) {
	/*
	Returns a string representing the rendered code of the provided AST `node`.
	The `options` are:

	- `indent`: string to use for indentation (defaults to `\t`)
	- `lineEnd`: string to use for line endings (defaults to `\n`)
	- `startingIndentLevel`: indent level to start from (default to `0`)
	- `comments`: generate comments if `true` (defaults to `false`)
	- `output`: output stream to write the rendered code to (defaults to `null`)
	*/
	const state = ( options == null ) ? {
		code: new Stream(),
		indent: '\t',
		lineEnd: '\n',
		indentLevel: 0,
		writeComments: false,
		noTrailingSemicolon: false
	} : {
		// Will contain the resulting code as an array of code strings
		code: options.output ? options.output : new Stream(),
		// Formating options
		indent: options.indent != null ? options.indent : '\t',
		lineEnd: options.lineEnd != null ? options.lineEnd : '\n',
		indentLevel: options.startingIndentLevel != null ? options.startingIndentLevel : 0,
		writeComments: options.comments ? options.comments : false,
		noTrailingSemicolon: false
	}
	// Travel through the AST node and generate the code
	traveler[ node.type ]( node, state )
	const { code } = state
	return code.data ? code.data : code
}
