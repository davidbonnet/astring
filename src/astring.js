// Astring is a tiny and fast JavaScript code generator from an ESTree-compliant AST.
//
// Astring was written by David Bonnet and released under an MIT license.
//
// The Git repository for Astring is available at:
// https://github.com/davidbonnet/astring.git
//
// Please use the GitHub bug tracker to report issues:
// https://github.com/davidbonnet/astring/issues

const { stringify } = JSON


const OPERATOR_PRECEDENCE = {
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
	Formats a sequence of `nodes`.
	*/
	const { output } = state
	output.write( '(' )
	if ( nodes != null && nodes.length > 0 ) {
		traveler[ nodes[ 0 ].type ]( nodes[ 0 ], state )
		const { length } = nodes
		for ( let i = 1; i < length; i++ ) {
			let param = nodes[ i ]
			output.write( ', ' )
			traveler[ param.type ]( param, state )
		}
	}
	output.write( ')' )
}


function formatBinaryExpressionPart( node, parentNode, isRightHand, state, traveler ) {
	/*
	Formats into the `output` stream a left-hand or right-hand expression `node` from a binary expression applying the provided `operator`.
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
				if ( OPERATOR_PRECEDENCE[ node.operator ] > OPERATOR_PRECEDENCE[ parentNode.operator ] ) {
					traveler[ node.type ]( node, state )
					return
				}
			} else {
				if ( OPERATOR_PRECEDENCE[ node.operator ] >= OPERATOR_PRECEDENCE[ parentNode.operator ] ) {
					traveler[ node.type ]( node, state )
					return
				}
			}
		} else {
			traveler[ node.type ]( node, state )
			return
		}
	}
	state.output.write( '(' )
	traveler[ node.type ]( node, state )
	state.output.write( ')' )
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


function formatComments( comments, output, indent, lineEnd ) {
	/*
	Inserts into `output` the provided list of `comments`, with the given `indent` and `lineEnd` strings.
	Line comments will end with `"\n"` regardless of the value of `lineEnd`.
	Expects to start on a new unindented line.
	*/
	const { length } = comments
	for ( let i = 0; i < length; i++ ) {
		let comment = comments[ i ]
		output.write( indent )
		if ( comment.type[ 0 ] === 'L' )
			// Line comment
			output.write( '// ' + comment.value.trim() + '\n' )
		else
			// Block comment
			output.write(
				'/*' + lineEnd +
				reindent( comment.value, indent ) + lineEnd +
				indent + '*/' + lineEnd
			)
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


let ForInStatement, FunctionDeclaration, RestElement, BinaryExpression, ArrayExpression, BlockStatement


export const defaultGenerator = {
	Program( node, state ) {
		const indent = state.indent.repeat( state.indentLevel )
		const { lineEnd, output, writeComments } = state
		if ( writeComments && node.comments != null )
			formatComments( node.comments, output, indent, lineEnd )
		let statements = node.body
		const { length } = statements
		for ( let i = 0; i < length; i++ ) {
			let statement = statements[ i ]
			if ( writeComments && statement.comments != null )
				formatComments( statement.comments, output, indent, lineEnd )
			output.write( indent )
			this[ statement.type ]( statement, state )
			output.write( lineEnd )
		}
		if ( writeComments && node.trailingComments != null )
			formatComments( node.trailingComments, output, indent, lineEnd )
	},
	BlockStatement: BlockStatement = function( node, state ) {
		const indent = state.indent.repeat( state.indentLevel++ )
		const { lineEnd, output, writeComments } = state
		const statementIndent = indent + state.indent
		output.write( '{' )
		let statements = node.body
		if ( statements != null && statements.length > 0 ) {
			output.write( lineEnd )
			if ( writeComments && node.comments != null ) {
				formatComments( node.comments, output, statementIndent, lineEnd )
			}
			const { length } = statements
			for ( let i = 0; i < length; i++ ) {
				let statement = statements[ i ]
				if ( writeComments && statement.comments != null )
					formatComments( statement.comments, output, statementIndent, lineEnd )
				output.write( statementIndent )
				this[ statement.type ]( statement, state )
				output.write( lineEnd )
			}
			output.write( indent )
		} else {
			if ( writeComments && node.comments != null ) {
				output.write( lineEnd )
				formatComments( node.comments, output, statementIndent, lineEnd )
				output.write( indent )
			}
		}
		if ( writeComments && node.trailingComments != null )
			formatComments( node.trailingComments, output, statementIndent, lineEnd )
		output.write( '}' )
		state.indentLevel--
	},
	ClassBody: BlockStatement,
	EmptyStatement( node, state ) {
		state.output.write( ';' )
	},
	ExpressionStatement( node, state ) {
		const precedence = EXPRESSIONS_PRECEDENCE[ node.expression.type ]
		if ( precedence === 17 || ( precedence === 3 && node.expression.left.type[ 0 ] === 'O' ) ) {
			// Should always have parentheses or is an AssignmentExpression to an ObjectPattern
			state.output.write( '(' )
			this[ node.expression.type ]( node.expression, state )
			state.output.write( ')' )
		} else {
			this[ node.expression.type ]( node.expression, state )
		}
		state.output.write( ';' )
	},
	IfStatement( node, state ) {
		const { output } = state
		output.write( 'if (' )
		this[ node.test.type ]( node.test, state )
		output.write( ') ' )
		this[ node.consequent.type ]( node.consequent, state )
		if ( node.alternate != null ) {
			output.write( ' else ' )
			this[ node.alternate.type ]( node.alternate, state )
		}
	},
	LabeledStatement( node, state ) {
		this[ node.label.type ]( node.label, state )
		state.output.write( ': ' )
		this[ node.body.type ]( node.body, state )
	},
	BreakStatement( node, state ) {
		const { output } = state
		output.write( 'break' )
		if ( node.label ) {
			output.write( ' ' )
			this[ node.label.type ]( node.label, state )
		}
		output.write( ';' )
	},
	ContinueStatement( node, state ) {
		const { output } = state
		output.write( 'continue' )
		if ( node.label ) {
			output.write( ' ' )
			this[ node.label.type ]( node.label, state )
		}
		output.write( ';' )
	},
	WithStatement( node, state ) {
		const { output } = state
		output.write( 'with (' )
		this[ node.object.type ]( node.object, state )
		output.write( ') ' )
		this[ node.body.type ]( node.body, state )
	},
	SwitchStatement( node, state ) {
		const indent = state.indent.repeat( state.indentLevel++ )
		const { lineEnd, output, writeComments } = state
		state.indentLevel++
		const caseIndent = indent + state.indent
		const statementIndent = caseIndent + state.indent
		output.write( 'switch (' )
		this[ node.discriminant.type ]( node.discriminant, state )
		output.write( ') \{' + lineEnd )
		const { cases: occurences } = node
		const { length: occurencesCount } = occurences
		for ( let i = 0; i < occurencesCount; i++ ) {
			let occurence = occurences[ i ]
			if ( writeComments && occurence.comments != null )
				formatComments( occurence.comments, output, caseIndent, lineEnd )
			if ( occurence.test ) {
				output.write( caseIndent + 'case ' )
				this[ occurence.test.type ]( occurence.test, state )
				output.write( ':' + lineEnd )
			} else {
				output.write( caseIndent + 'default:' + lineEnd )
			}
			let { consequent } = occurence
			const { length: consequentCount } = consequent
			for ( let i = 0; i < consequentCount; i++ ) {
				let statement = consequent[ i ]
				if ( writeComments && statement.comments != null )
					formatComments( statement.comments, output, statementIndent, lineEnd )
				output.write( statementIndent )
				this[ statement.type ]( statement, state )
				output.write( lineEnd )
			}
		}
		state.indentLevel -= 2
		output.write( indent + '}' )
	},
	ReturnStatement( node, state ) {
		const { output } = state
		output.write( 'return' )
		if ( node.argument ) {
			output.write( ' ' )
			this[ node.argument.type ]( node.argument, state )
		}
		output.write( ';' )
	},
	ThrowStatement( node, state ) {
		const { output } = state
		output.write( 'throw ' )
		this[ node.argument.type ]( node.argument, state )
		output.write( ';' )
	},
	TryStatement( node, state ) {
		const { output } = state
		output.write( 'try ' )
		this[ node.block.type ]( node.block, state )
		if ( node.handler ) {
			let { handler } = node
			output.write( ' catch (' )
			this[ handler.param.type ]( handler.param, state )
			output.write( ') ' )
			this[ handler.body.type ]( handler.body, state )
		}
		if ( node.finalizer ) {
			output.write( ' finally ' )
			this[ node.finalizer.type ]( node.finalizer, state )
		}
	},
	WhileStatement( node, state ) {
		const { output } = state
		output.write( 'while (' )
		this[ node.test.type ]( node.test, state )
		output.write( ') ' )
		this[ node.body.type ]( node.body, state )
	},
	DoWhileStatement( node, state ) {
		const { output } = state
		output.write( 'do ' )
		this[ node.body.type ]( node.body, state )
		output.write( ' while (' )
		this[ node.test.type ]( node.test, state )
		output.write( ');' )
	},
	ForStatement( node, state ) {
		const { output } = state
		output.write( 'for (' )
		if ( node.init != null ) {
			state.noTrailingSemicolon = true
			this[ node.init.type ]( node.init, state )
			state.noTrailingSemicolon = false
		}
		output.write( '; ' )
		if ( node.test )
			this[ node.test.type ]( node.test, state )
		output.write( '; ' )
		if ( node.update )
			this[ node.update.type ]( node.update, state )
		output.write( ') ' )
		this[ node.body.type ]( node.body, state )
	},
	ForInStatement: ForInStatement = function( node, state ) {
		const { output } = state
		output.write( 'for (' )
		const { left } = node, { type } = left
		state.noTrailingSemicolon = true
		this[ type ]( left, state )
		state.noTrailingSemicolon = false
		// Identifying whether node.type is `ForInStatement` or `ForOfStatement`
		output.write( node.type[ 3 ] === 'I' ? ' in ' : ' of ' )
		this[ node.right.type ]( node.right, state )
		output.write( ') ' )
		this[ node.body.type ]( node.body, state )
	},
	ForOfStatement: ForInStatement,
	DebuggerStatement( node, state ) {
		state.output.write( 'debugger;' + state.lineEnd )
	},
	FunctionDeclaration: FunctionDeclaration = function( node, state ) {
		const { output } = state
		output.write( node.generator ? 'function* ' : 'function ' )
		if ( node.id )
			output.write( node.id.name )
		formatSequence( node.params, state, this )
		output.write( ' ' )
		this[ node.body.type ]( node.body, state )
	},
	FunctionExpression: FunctionDeclaration,
	VariableDeclaration( node, state ) {
		const { output } = state
		const { declarations } = node
		output.write( node.kind + ' ' )
		const { length } = declarations
		if ( length > 0 ) {
			this.VariableDeclarator( declarations[ 0 ], state )
			for ( let i = 1; i < length; i++ ) {
				output.write( ', ' )
				this.VariableDeclarator( declarations[ i ], state )
			}
		}
		if ( state.noTrailingSemicolon !== true )
			output.write( ';' )
	},
	VariableDeclarator( node, state ) {
		this[ node.id.type ]( node.id, state )
		if ( node.init != null ) {
			state.output.write( ' = ' )
			this[ node.init.type ]( node.init, state )
		}
	},
	ClassDeclaration( node, state ) {
		const { output } = state
		output.write( 'class ' )
		if ( node.id ) {
			output.write( node.id.name + ' ' )
		}
		if ( node.superClass ) {
			output.write( 'extends ' )
			this[ node.superClass.type ]( node.superClass, state )
			output.write( ' ' )
		}
		this[ node.body.type ]( node.body, state )
	},
	ImportDeclaration( node, state ) {
		const { output } = state
		output.write( 'import ' )
		const { specifiers } = node
		const { length } = specifiers
		if ( length > 0 ) {
			let i = 0, specifier
			while ( i < length ) {
				if ( i > 0 )
					output.write( ', ' )
				specifier = specifiers[ i ]
				const type = specifier.type[ 6 ]
				if ( type === 'D' ) {
					// ImportDefaultSpecifier
					output.write( specifier.local.name )
					i++
				} else if ( type === 'N' ) {
					// ImportNamespaceSpecifier
					output.write( '* as ' + specifier.local.name )
					i++
				} else {
					// ImportSpecifier
					break
				}
			}
			if ( i < length ) {
				output.write( '{' )
				for ( ; ; ) {
					specifier = specifiers[ i ]
					let { name } = specifier.imported
					output.write( name )
					if ( name !== specifier.local.name ) {
						output.write( ' as ' + specifier.local.name )
					}
					if ( ++i < length )
						output.write( ', ' )
					else
						break
				}
				output.write( '}' )
			}
			output.write( ' from ' )
		}
		this.Literal( node.source, state )
		output.write( ';' )
	},
	ExportDefaultDeclaration( node, state ) {
		const { output } = state
		output.write( 'export default ' )
		this[ node.declaration.type ]( node.declaration, state )
		if ( EXPRESSIONS_PRECEDENCE[ node.declaration.type ] && node.declaration.type[ 0 ] !== 'F' )
			// All expression nodes except `FunctionExpression`
			output.write( ';' )
	},
	ExportNamedDeclaration( node, state ) {
		const { output } = state
		output.write( 'export ' )
		if ( node.declaration ) {
			this[ node.declaration.type ]( node.declaration, state )
		} else {
			output.write( '{' )
			const { specifiers } = node, { length } = specifiers
			if ( length > 0 ) {
				for ( let i = 0; ; ) {
					let specifier = specifiers[ i ]
					let { name } = specifier.local
					output.write( name )
					if ( name !== specifier.exported.name )
						output.write( ' as ' + specifier.exported.name )
					if ( ++i < length )
						output.write( ', ' )
					else
						break
				}
			}
			output.write( '}' )
			if ( node.source ) {
				output.write( ' from ' )
				this.Literal( node.source, state )
			}
			output.write( ';' )
		}
	},
	ExportAllDeclaration( node, state ) {
		const { output } = state
		output.write( 'export * from ' )
		this.Literal( node.source, state )
		output.write( ';' )
	},
	MethodDefinition( node, state ) {
		const { output } = state
		if ( node.static )
			output.write( 'static ' )
		switch ( node.kind[ 0 ] ) {
			case 'g': // `get`
			case 's': // `set`
				output.write( node.kind + ' ' )
				break
			default:
				break
		}
		if ( node.value.generator )
			output.write( '*' )
		if ( node.computed ) {
			output.write( '[' )
			this[ node.key.type ]( node.key, state )
			output.write( ']' )
		} else {
			this[ node.key.type ]( node.key, state )
		}
		formatSequence( node.value.params, state, this )
		output.write( ' ' )
		this[ node.value.body.type ]( node.value.body, state )
	},
	ClassExpression( node, state ) {
		this.ClassDeclaration( node, state )
	},
	ArrowFunctionExpression( node, state ) {
		const { output } = state
		const { params } = node
		if ( params != null ) {
			if ( params.length === 1 && params[ 0 ].type[ 0 ] === 'I' ) {
				// If params[0].type[0] starts with 'I', it can't be `ImportDeclaration` nor `IfStatement` and thus is `Identifier`
				output.write( params[ 0 ].name )
			} else {
				formatSequence( node.params, state, this )
			}
		}
		output.write( ' => ' )
		if ( node.body.type[ 0 ] === 'O' ) {
			output.write( '(' )
			this.ObjectExpression( node.body, state )
			output.write( ')' )
		} else {
			this[ node.body.type ]( node.body, state )
		}
	},
	ThisExpression( node, state ) {
		state.output.write( 'this' )
	},
	Super( node, state ) {
		state.output.write( 'super' )
	},
	RestElement: RestElement = function( node, state ) {
		state.output.write( '...' )
		this[ node.argument.type ]( node.argument, state )
	},
	SpreadElement: RestElement,
	YieldExpression( node, state ) {
		const { output } = state
		output.write( node.delegate ? 'yield*' : 'yield' )
		if ( node.argument ) {
			output.write( ' ' )
			this[ node.argument.type ]( node.argument, state )
		}
	},
	TemplateLiteral( node, state ) {
		const { output } = state
		const { quasis, expressions } = node
		output.write( '`' )
		const { length } = expressions
		for ( let i = 0; i < length; i++ ) {
			let expression = expressions[ i ]
			output.write( quasis[ i ].value.raw )
			output.write( '${' )
			this[ expression.type ]( expression, state )
			output.write( '}' )
		}
		output.write( quasis[ quasis.length - 1 ].value.raw )
		output.write( '`' )
	},
	TaggedTemplateExpression( node, state ) {
		this[ node.tag.type ]( node.tag, state )
		this[ node.quasi.type ]( node.quasi, state )
	},
	ArrayExpression: ArrayExpression = function( node, state ) {
		const { output } = state
		output.write( '[' )
		if ( node.elements.length > 0 ) {
			const { elements } = node, { length } = elements
			for ( let i = 0; ; ) {
				let element = elements[ i ]
				if ( element != null )
					this[ element.type ]( element, state )
				if ( ++i < length ) {
					output.write( ', ' )
				} else {
					if ( element == null )
						output.write( ', ' )
					break
				}
			}
		}
		output.write( ']' )
	},
	ArrayPattern: ArrayExpression,
	ObjectExpression( node, state ) {
		const indent = state.indent.repeat( state.indentLevel++ )
		const { lineEnd, output, writeComments } = state
		const propertyIndent = indent + state.indent
		output.write( '{' )
		if ( node.properties.length > 0 ) {
			output.write( lineEnd )
			if ( writeComments && node.comments != null )
				formatComments( node.comments, output, propertyIndent, lineEnd )
			const comma = ',' + lineEnd, { properties } = node, { length } = properties
			for ( let i = 0; ; ) {
				let property = properties[ i ]
				if ( writeComments && property.comments != null )
					formatComments( property.comments, output, propertyIndent, lineEnd )
				output.write( propertyIndent )
				this.Property( property, state )
				if ( ++i < length )
					output.write( comma )
				else
					break
			}
			output.write( lineEnd )
			if ( writeComments && node.trailingComments != null )
				formatComments( node.trailingComments, output, propertyIndent, lineEnd )
			output.write( indent + '}' )
		} else if ( writeComments ) {
			if ( node.comments != null ) {
				output.write( lineEnd )
				formatComments( node.comments, output, propertyIndent, lineEnd )
				if ( node.trailingComments != null )
					formatComments( node.trailingComments, output, propertyIndent, lineEnd )
				output.write( indent + '}' )
			} else if ( node.trailingComments != null ) {
				output.write( lineEnd )
				formatComments( node.trailingComments, output, propertyIndent, lineEnd )
				output.write( indent + '}' )
			} else {
				output.write( '}' )
			}
		} else {
			output.write( '}' )
		}
		state.indentLevel--
	},
	Property( node, state ) {
		if ( node.method || node.kind[ 0 ] !== 'i' ) {
			// Either a method or of kind `set` or `get` (not `init`)
			this.MethodDefinition( node, state )
		} else {
			const { output } = state
			if ( !node.shorthand ) {
				if ( node.computed ) {
					output.write( '[' )
					this[ node.key.type ]( node.key, state )
					output.write( ']' )
				} else {
					this[ node.key.type ]( node.key, state )
				}
				output.write( ': ' )
			}
			this[ node.value.type ]( node.value, state )
		}
	},
	ObjectPattern( node, state ) {
		const { output } = state
		output.write( '{' )
		if ( node.properties.length > 0 ) {
			const { properties } = node, { length } = properties
			for ( let i = 0; ; ) {
				this.Property( properties[ i ], state )
				if ( ++i < length )
					output.write( ', ' )
				else
					break
			}
		}
		output.write( '}' )
	},
	SequenceExpression( node, state ) {
		formatSequence( node.expressions, state, this )
	},
	UnaryExpression( node, state ) {
		const { output } = state
		if ( node.prefix ) {
			output.write( node.operator )
			if ( node.operator.length > 1 )
				state.output.write( ' ' )
			if ( EXPRESSIONS_PRECEDENCE[ node.argument.type ] < EXPRESSIONS_PRECEDENCE.UnaryExpression ) {
				output.write( '(' )
				this[ node.argument.type ]( node.argument, state )
				output.write( ')' )
			} else {
				this[ node.argument.type ]( node.argument, state )
			}
		} else {
			// FIXME: This case never occurs
			this[ node.argument.type ]( node.argument, state )
			state.output.write( node.operator )
		}
	},
	UpdateExpression( node, state ) {
		// Always applied to identifiers or members, no parenthesis check needed
		if ( node.prefix ) {
			state.output.write( node.operator )
			this[ node.argument.type ]( node.argument, state )
		} else {
			this[ node.argument.type ]( node.argument, state )
			state.output.write( node.operator )
		}
	},
	AssignmentExpression( node, state ) {
		this[ node.left.type ]( node.left, state )
		state.output.write( ' ' + node.operator + ' ' )
		this[ node.right.type ]( node.right, state )
	},
	AssignmentPattern( node, state ) {
		this[ node.left.type ]( node.left, state )
		state.output.write( ' = ' )
		this[ node.right.type ]( node.right, state )
	},
	BinaryExpression: BinaryExpression = function( node, state ) {
		const { output } = state
		if ( node.operator === 'in' ) {
			// Avoids confusion in `for` loops initializers
			output.write( '(' )
			formatBinaryExpressionPart( node.left, node, false, state, this )
			output.write( ' ' + node.operator + ' ' )
			formatBinaryExpressionPart( node.right, node, true, state, this )
			output.write( ')' )
		} else {
			formatBinaryExpressionPart( node.left, node, false, state, this )
			output.write( ' ' + node.operator + ' ' )
			formatBinaryExpressionPart( node.right, node, true, state, this )
		}
	},
	LogicalExpression: BinaryExpression,
	ConditionalExpression( node, state ) {
		const { output } = state
		if ( EXPRESSIONS_PRECEDENCE[ node.test.type ] > EXPRESSIONS_PRECEDENCE.ConditionalExpression ) {
			this[ node.test.type ]( node.test, state )
		} else {
			output.write( '(' )
			this[ node.test.type ]( node.test, state )
			output.write( ')' )
		}
		output.write( ' ? ' )
		this[ node.consequent.type ]( node.consequent, state )
		output.write( ' : ' )
		this[ node.alternate.type ]( node.alternate, state )
	},
	NewExpression( node, state ) {
		state.output.write( 'new ' )
		const { output } = state
		if ( EXPRESSIONS_PRECEDENCE[ node.callee.type ] < EXPRESSIONS_PRECEDENCE.CallExpression
				|| hasCallExpression( node.callee ) ) {
			output.write( '(' )
			this[ node.callee.type ]( node.callee, state )
			output.write( ')' )
		} else {
			this[ node.callee.type ]( node.callee, state )
		}
		formatSequence( node[ 'arguments' ], state, this )
	},
	CallExpression( node, state ) {
		const { output } = state
		if ( EXPRESSIONS_PRECEDENCE[ node.callee.type ] < EXPRESSIONS_PRECEDENCE.CallExpression ) {
			output.write( '(' )
			this[ node.callee.type ]( node.callee, state )
			output.write( ')' )
		} else {
			this[ node.callee.type ]( node.callee, state )
		}
		formatSequence( node[ 'arguments' ], state, this )
	},
	MemberExpression( node, state ) {
		const { output } = state
		if ( EXPRESSIONS_PRECEDENCE[ node.object.type ] < EXPRESSIONS_PRECEDENCE.MemberExpression ) {
			output.write( '(' )
			this[ node.object.type ]( node.object, state )
			output.write( ')' )
		} else {
			this[ node.object.type ]( node.object, state )
		}
		if ( node.computed ) {
			output.write( '[' )
			this[ node.property.type ]( node.property, state )
			output.write( ']' )
		} else {
			output.write( '.' )
			this[ node.property.type ]( node.property, state )
		}
	},
	MetaProperty( node, state ) {
		state.output.write( node.meta.name + '.' + node.property.name )
	},
	Identifier( node, state ) {
		state.output.write( node.name )
	},
	Literal( node, state ) {
		if ( node.raw != null ) {
			state.output.write( node.raw )
		} else if ( node.regex != null ) {
			this.RegExpLiteral( node, state )
		} else {
			state.output.write( stringify( node.value ) )			
		}
	},
	RegExpLiteral( node, state ) {
		const { regex } = node
		state.output.write(
			'new RegExp(' + stringify( regex.pattern ) + ', ' + stringify( regex.flags ) + ')'
		)
	},
}


class Stream {

	constructor() {
		this.data = ''
	}
	
	write( string ) {
		this.data += string
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
	- `generator`: custom code generator (defaults to `defaultGenerator`)
	*/
	const state = options == null ? {
		output: new Stream(),
		generator: defaultGenerator,
		indent: '\t',
		lineEnd: '\n',
		indentLevel: 0,
		writeComments: false,
		noTrailingSemicolon: false,
	} : {
		// Functional options
		output: options.output ? options.output : new Stream(),
		generator: options.generator ? options.generator : defaultGenerator,
		// Formating options
		indent: options.indent != null ? options.indent : '\t',
		lineEnd: options.lineEnd != null ? options.lineEnd : '\n',
		indentLevel: options.startingIndentLevel != null ? options.startingIndentLevel : 0,
		writeComments: options.comments ? options.comments : false,
		// Internal state
		noTrailingSemicolon: false,
	}
	// Travel through the AST node and generate the code
	state.generator[ node.type ]( node, state )
	const { output } = state
	return output.data != null ? output.data : output
}
