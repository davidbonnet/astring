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
	'**': 12,
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
	RestElement: 1,
}


function formatSequence( nodes, state, traveler ) {
	/*
	Formats a sequence of `nodes` into the `code` array.
	*/
	const { code } = state
	code.push( '(' )
	if ( nodes != null && nodes.length > 0 ) {
		traveler[ nodes[ 0 ].type ]( nodes[ 0 ], state )
		const { length } = nodes
		for ( let i = 1; i < length; i++ ) {
			let param = nodes[ i ]
			code.push( ', ' )
			traveler[ param.type ]( param, state )
		}
	}
	code.push( ')' )
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
	state.code.push( '(' )
	traveler[ node.type ]( node, state )
	state.code.push( ')' )
}


function reindent( text, indentation ) {
	/*
	Returns the `text` string reindented with the provided `indentation`.
	*/
	const trimmedText = text.trimRight()
	let indents = '\n'
	let secondLine = false
	const { length } = trimmedText
	for ( let i = 0; i < length; i++ ) {
		let char = trimmedText[ i ]
		if ( secondLine ) {
			if ( char === ' ' || char === '\t' ) {
				indents += char
			} else {
				return indentation + trimmedText.trimLeft().split( indents ).join( '\n' + indentation )
			}
		} else {
			if ( char === '\n' ) {
				secondLine = true
			}
		}
	}
	return indentation + trimmedText.trimLeft()
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
		code.push( indent )
		if ( comment.type[ 0 ] === 'L' )
			// Line comment
			code.push( '// ', comment.value.trim(), '\n' )
		else
			// Block comment
			code.push( '/*', lineEnd, reindent( comment.value, indent ), lineEnd, indent, '*/', lineEnd )
	}
}


function hasCallExpression( node ) {
	/*
	Returns `true` if the provided `node` contains a call expression and `false` otherwise.
	*/
	let currentNode = node
	while ( currentNode != null ) {
		let { type } = currentNode
		if ( type[ 0 ] === 'C' && type[ 1 ] === 'a' ) {
			// Is CallExpression
			return true
		} else if ( type[ 0 ] === 'M' && type[ 1 ] === 'e' && type[ 2 ] === 'm' ) {
			// Is MemberExpression
			currentNode = currentNode.object
		} else {
			return false
		}
	}
}


let ForInStatement, FunctionDeclaration, RestElement, BinaryExpression, ArrayExpression


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
			code.push( indent )
			this[ statement.type ]( statement, state )
			code.push( lineEnd )
		}
		if ( writeComments && node.trailingComments != null )
			formatComments( node.trailingComments, code, indent, lineEnd )
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
				formatComments( node.comments, code, statementIndent, lineEnd )
			}
			const { length } = statements
			for ( let i = 0; i < length; i++ ) {
				let statement = statements[ i ]
				if ( writeComments && statement.comments != null )
					formatComments( statement.comments, code, statementIndent, lineEnd )
				code.push( statementIndent )
				this[ statement.type ]( statement, state )
				code.push( lineEnd )
			}
			code.push( indent )
		} else {
			if ( writeComments && node.comments != null ) {
				code.push( lineEnd )
				formatComments( node.comments, code, statementIndent, lineEnd )
				code.push( indent )
			}
		}
		if ( writeComments && node.trailingComments != null )
			formatComments( node.trailingComments, code, statementIndent, lineEnd )
		code.push( '}' )
		state.indentLevel--
	},
	EmptyStatement( node, state ) {
		state.code.push( ';' )
	},
	ExpressionStatement( node, state ) {
		const precedence = EXPRESSIONS_PRECEDENCE[ node.expression.type ]
		if ( precedence === 17 || ( precedence === 3 && node.expression.left.type[ 0 ] === 'O' ) ) {
			// Should always have parentheses or is an AssignmentExpression to an ObjectPattern
			state.code.push( '(' )
			this[ node.expression.type ]( node.expression, state )
			state.code.push( ')' )
		} else {
			this[ node.expression.type ]( node.expression, state )
		}
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
		state.code.push( ': ' )
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
		code.push( ') \{', lineEnd )
		const { cases: occurences } = node
		const { length: occurencesCount } = occurences
		for ( let i = 0; i < occurencesCount; i++ ) {
			let occurence = occurences[ i ]
			if ( writeComments && occurence.comments != null )
				formatComments( occurence.comments, code, caseIndent, lineEnd )
			if ( occurence.test ) {
				code.push( caseIndent, 'case ' )
				this[ occurence.test.type ]( occurence.test, state )
				code.push( ':', lineEnd )
			} else {
				code.push( caseIndent, 'default:', lineEnd )
			}
			let { consequent } = occurence
			const { length: consequentCount } = consequent
			for ( let i = 0; i < consequentCount; i++ ) {
				let statement = consequent[ i ]
				if ( writeComments && statement.comments != null )
					formatComments( statement.comments, code, statementIndent, lineEnd )
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
		// Identifying whether node.type is `ForInStatement` or `ForOfStatement`
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
		formatSequence( node.params, state, this )
		code.push( ' ' )
		this[ node.body.type ]( node.body, state )
	},
	FunctionExpression: FunctionDeclaration,
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
		if ( EXPRESSIONS_PRECEDENCE[ node.declaration.type ] && node.declaration.type[ 0 ] !== 'F' )
			// All expression nodes except `FunctionExpression`
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
		switch ( node.kind[ 0 ] ) {
			case 'g': // `get`
			case 's': // `set`
				code.push( node.kind, ' ' )
				break
			default:
				break
		}
		if ( node.value.generator )
			code.push( '*' )
		if ( node.computed ) {
			code.push( '[' )
			this[ node.key.type ]( node.key, state )
			code.push( ']' )
		} else {
			this[ node.key.type ]( node.key, state )
		}
		formatSequence( node.value.params, state, this )
		code.push( ' ' )
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
				code.push( params[ 0 ].name )
			} else {
				formatSequence( node.params, state, this )
			}
		}
		code.push( ' => ' )
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
		code.push( node.delegate ? 'yield*' : 'yield' )
		if ( node.argument ) {
			code.push( ' ' )
			this[ node.argument.type ]( node.argument, state )
		}
	},
	TemplateLiteral( node, state ) {
		const { code } = state
		const { quasis, expressions } = node
		code.push( '`' )
		const { length } = expressions
		for ( let i = 0; i < length; i++ ) {
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
				if ( element != null )
					this[ element.type ]( element, state )
				if ( ++i < length ) {
					code.push( ', ' )
				} else {
					if ( element == null )
						code.push( ', ' )
					break
				}
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
				formatComments( node.comments, code, propertyIndent, lineEnd )
			const comma = ',' + lineEnd, { properties } = node, { length } = properties
			for ( let i = 0; ; ) {
				let property = properties[ i ]
				if ( writeComments && property.comments != null )
					formatComments( property.comments, code, propertyIndent, lineEnd )
				code.push( propertyIndent )
				this.Property( property, state )
				if ( ++i < length )
					code.push( comma )
				else
					break
			}
			code.push( lineEnd )
			if ( writeComments && node.trailingComments != null )
				formatComments( node.trailingComments, code, propertyIndent, lineEnd )
			code.push( indent, '}' )
		} else if ( writeComments ) {
			if ( node.comments != null ) {
				code.push( lineEnd )
				formatComments( node.comments, code, propertyIndent, lineEnd )
				if ( node.trailingComments != null )
					formatComments( node.trailingComments, code, propertyIndent, lineEnd )
				code.push( indent, '}' )
			} else if ( node.trailingComments != null ) {
				code.push( lineEnd )
				formatComments( node.trailingComments, code, propertyIndent, lineEnd )
				code.push( indent, '}' )
			} else {
				code.push( '}' )
			}
		} else {
			code.push( '}' )
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
					code.push( '[' )
					this[ node.key.type ]( node.key, state )
					code.push( ']' )
				} else {
					this[ node.key.type ]( node.key, state )
				}
				code.push( ': ' )
			}
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
	SequenceExpression( node, state ) {
		formatSequence( node.expressions, state, this )
	},
	UnaryExpression( node, state ) {
		const { code } = state
		if ( node.prefix ) {
			code.push( node.operator )
			if ( node.operator.length > 1 )
				state.code.push( ' ' )
			if ( EXPRESSIONS_PRECEDENCE[ node.argument.type ] < EXPRESSIONS_PRECEDENCE.UnaryExpression ) {
				code.push( '(' )
				this[ node.argument.type ]( node.argument, state )
				code.push( ')' )
			} else {
				this[ node.argument.type ]( node.argument, state )
			}
		} else {
			// FIXME: This case never occurs
			this[ node.argument.type ]( node.argument, state )
			state.code.push( node.operator )
		}
	},
	UpdateExpression( node, state ) {
		// Always applied to identifiers or members, no parenthesis check needed
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
		if ( node.operator === 'in' ) {
			// Avoids confusion in `for` loops initializers
			code.push( '(' )
			formatBinaryExpressionPart( node.left, node, false, state, this )
			code.push( ' ', node.operator, ' ' )
			formatBinaryExpressionPart( node.right, node, true, state, this )
			code.push( ')' )
		} else {
			formatBinaryExpressionPart( node.left, node, false, state, this )
			code.push( ' ', node.operator, ' ' )
			formatBinaryExpressionPart( node.right, node, true, state, this )
		}
	},
	LogicalExpression: BinaryExpression,
	ConditionalExpression( node, state ) {
		const { code } = state
		if ( EXPRESSIONS_PRECEDENCE[ node.test.type ] > EXPRESSIONS_PRECEDENCE.ConditionalExpression ) {
			this[ node.test.type ]( node.test, state )
		} else {
			code.push( '(' )
			this[ node.test.type ]( node.test, state )
			code.push( ')' )
		}
		code.push( ' ? ' )
		this[ node.consequent.type ]( node.consequent, state )
		code.push( ' : ' )
		this[ node.alternate.type ]( node.alternate, state )
	},
	NewExpression( node, state ) {
		state.code.push( 'new ' )
		const { code } = state
		if ( EXPRESSIONS_PRECEDENCE[ node.callee.type ] < EXPRESSIONS_PRECEDENCE.CallExpression
				|| hasCallExpression( node.callee ) ) {
			code.push( '(' )
			this[ node.callee.type ]( node.callee, state )
			code.push( ')' )
		} else {
			this[ node.callee.type ]( node.callee, state )
		}
		formatSequence( node[ 'arguments' ], state, this )
	},
	CallExpression( node, state ) {
		const { code } = state
		if ( EXPRESSIONS_PRECEDENCE[ node.callee.type ] < EXPRESSIONS_PRECEDENCE.CallExpression ) {
			code.push( '(' )
			this[ node.callee.type ]( node.callee, state )
			code.push( ')' )
		} else {
			this[ node.callee.type ]( node.callee, state )
		}
		formatSequence( node[ 'arguments' ], state, this )
	},
	MemberExpression( node, state ) {
		const { code } = state
		if ( EXPRESSIONS_PRECEDENCE[ node.object.type ] < EXPRESSIONS_PRECEDENCE.MemberExpression ) {
			code.push( '(' )
			this[ node.object.type ]( node.object, state )
			code.push( ')' )
		} else {
			this[ node.object.type ]( node.object, state )
		}
		if ( node.computed ) {
			code.push( '[' )
			this[ node.property.type ]( node.property, state )
			code.push( ']' )
		} else {
			code.push( '.' )
			this[ node.property.type ]( node.property, state )
		}
	},
	MetaProperty( node, state ) {
		state.code.push(
			node.meta.name,
			'.',
			node.property.name,
		)
	},
	Identifier( node, state ) {
		state.code.push( node.name )
	},
	Literal( node, state ) {
		state.code.push( node.raw )
	},
}


export default function astring( node, options ) {
	/*
	Returns a string representing the rendered code of the provided AST `node`.
	The `options` are:

	- `indent`: string to use for indentation (defaults to `\t`)
	- `lineEnd`: string to use for line endings (defaults to `\n`)
	- `startingIndentLevel`: indent level to start from (default to `0`)
	- `comments`: generate comments if `true` (defaults to `false`)
	*/
	const state = ( options == null ) ? {
		code: [],
		indent: '\t',
		lineEnd: '\n',
		indentLevel: 0,
		writeComments: false,
	} : {
		// Will contain the resulting code as an array of code strings
		code: [],
		// Formating options
		indent: options.indent != null ? options.indent : '\t',
		lineEnd: options.lineEnd != null ? options.lineEnd : '\n',
		indentLevel: options.startingIndentLevel != null ? options.startingIndentLevel : 0,
		writeComments: options.comments ? options.comments : false,
	}
	// Travel through the AST node and generate the code
	traveler[ node.type ]( node, state )
	return state.code.join( '' )
}
