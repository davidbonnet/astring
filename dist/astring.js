(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.astring = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"astring":[function(require,module,exports){


// Polyfill for non-ES6 interpreters
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});
if (!String.prototype.repeat) {
	String.prototype.repeat = function (count) {
		// Perfom some checks first
		if (count < 0) {
			throw new RangeError('Repeat count must be non-negative');
		} else if (count === Infinity) {
			throw new RangeError('Repeat count must be less than infinity');
		}
		// Ensure it's an integer
		count = count | 0;
		if (this.length * count >= 1 << 28) {
			// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/repeat
			// Most current (August 2014) browsers can't handle strings 1 << 28 chars or longer
			throw new RangeError('Repeat count must not overflow maximum string size');
		}
		var out = [];
		while (count--) {
			out.push(this);
		}
		return out.join('');
	};
}

function formatParameters(code, params, state) {
	/*
 Formats function parameters provided in `params` into the `code` array.
 */
	code.push('(');
	if (params != null && params.length !== 0) {
		for (var i = 0, _length = params.length; i < _length; i++) {
			var param = params[i];
			visitors[param.type](param, state);
			code.push(', ');
		}
		// Remove trailing comma
		code.pop();
	}
	code.push(') ');
}

function formatBinarySideExpression(code, node, operator, state) {
	/*
 Formats into the `code` array a left-hand or right-hand expression `node` from a binary expression applying the provided `operator`.
 */
	switch (node.type) {
		case 'Identifier':
		case 'Literal':
		case 'MemberExpression':
		case 'CallExpression':
			visitors[node.type](node, state);
			break;
		case 'BinaryExpression':
			if (OPERATORS_PRECEDENCE[node.operator] >= OPERATORS_PRECEDENCE[operator]) {
				visitors[node.type](node, state);
				break;
			}
		default:
			code.push('(');
			visitors[node.type](node, state);
			code.push(')');
	}
}

var OPERATORS_PRECEDENCE = {
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
};

var ForInStatement, FunctionDeclaration, RestElement, BinaryExpression, ArrayExpression;

var visitors = {
	Program: function Program(node, state) {
		var indent = state.indent.repeat(state.indentLevel);
		var lineEnd = state.lineEnd;
		var code = state.code;

		var statements = node.body;
		for (var i = 0, length = statements.length; i < length; i++) {
			code.push(indent);
			var statement = statements[i];
			visitors[statement.type](statement, state);
			code.push(lineEnd);
		}
	},
	BlockStatement: function BlockStatement(node, state) {
		var indent = state.indent.repeat(state.indentLevel++);
		var lineEnd = state.lineEnd;
		var code = state.code;

		var statementIndent = indent + state.indent;
		code.push('{');
		var statements = node.body;
		if (statements != null && statements.length !== 0) {
			code.push(lineEnd);
			for (var i = 0, length = statements.length; i < length; i++) {
				code.push(statementIndent);
				var statement = statements[i];
				visitors[statement.type](statement, state);
				code.push(lineEnd);
			}
			code.push(indent);
		}
		code.push('}');
		state.indentLevel--;
	},
	Statement: function Statement(node, state) {
		visitors[node.type](node, state);
		state.code.push(state.lineEnd);
	},
	EmptyStatement: function EmptyStatement(node, state) {
		state.code.push(';');
	},
	ExpressionStatement: function ExpressionStatement(node, state) {
		visitors[node.expression.type](node.expression, state);
		state.code.push(';');
	},
	IfStatement: function IfStatement(node, state) {
		var code = state.code;

		code.push('if (');
		visitors[node.test.type](node.test, state);
		code.push(') ');
		visitors[node.consequent.type](node.consequent, state);
		if (node.alternate != null) {
			code.push(' else ');
			visitors[node.alternate.type](node.alternate, state);
		}
	},
	LabeledStatement: function LabeledStatement(node, state) {
		visitors[node.label.type](node.label, state);
		state.code.push(':', state.lineEnd);
		visitors.Statement(node.body, state);
		// Remove line end
		state.code.pop();
	},
	BreakStatement: function BreakStatement(node, state) {
		var code = state.code;

		code.push('break');
		if (node.label) {
			code.push(' ');
			visitors[node.label.type](node.label, state);
		}
		code.push(';');
	},
	ContinueStatement: function ContinueStatement(node, state) {
		var code = state.code;

		code.push('continue');
		if (node.label) {
			code.push(' ');
			visitors[node.label.type](node.label, state);
		}
		code.push(';');
	},
	WithStatement: function WithStatement(node, state) {
		var code = state.code;

		code.push('with (');
		visitors[node.object.type](node.object, state);
		code.push(') ');
		visitors.Statement(node.body, state);
	},
	SwitchStatement: function SwitchStatement(node, state) {
		var indent = state.indent.repeat(state.indentLevel++);
		var lineEnd = state.lineEnd;
		var code = state.code;

		state.indentLevel++;
		var caseIndent = indent + state.indent;
		var statementIndent = caseIndent + state.indent;
		code.push('switch (');
		visitors[node.discriminant.type](node.discriminant, state);
		code.push(') {', lineEnd);
		var cases = node.cases;

		for (var i = 0, _length2 = cases.length; i < _length2; i++) {
			var check = cases[i];
			if (check.test) {
				code.push(caseIndent, 'case ');
				visitors[check.test.type](check.test, state);
				code.push(':', lineEnd);
			} else {
				code.push(caseIndent, 'default:', lineEnd);
			}
			var consequent = check.consequent;

			for (var _i = 0, _length3 = consequent.length; _i < _length3; _i++) {
				code.push(statementIndent);
				visitors.Statement(consequent[_i], state);
			}
		}
		state.indentLevel -= 2;
		code.push(indent, '}');
	},
	ReturnStatement: function ReturnStatement(node, state) {
		var code = state.code;

		code.push('return');
		if (node.argument) {
			code.push(' ');
			visitors[node.argument.type](node.argument, state);
		}
		code.push(';');
	},
	ThrowStatement: function ThrowStatement(node, state) {
		var code = state.code;

		code.push('throw ');
		visitors[node.argument.type](node.argument, state);
		code.push(';');
	},
	TryStatement: function TryStatement(node, state) {
		var code = state.code;

		code.push('try ');
		visitors[node.block.type](node.block, state);
		if (node.handler) {
			var handler = node.handler;

			code.push(' catch (');
			visitors[handler.param.type](handler.param, state);
			code.push(') ');
			visitors[handler.body.type](handler.body, state);
		}
		if (node.finalizer) {
			code.push(' finally ');
			visitors[node.finalizer.type](node.finalizer, state);
		}
	},
	WhileStatement: function WhileStatement(node, state) {
		var code = state.code;

		code.push('while (');
		visitors[node.test.type](node.test, state);
		code.push(') ');
		visitors[node.body.type](node.body, state);
	},
	DoWhileStatement: function DoWhileStatement(node, state) {
		var code = state.code;

		code.push('do ');
		visitors[node.body.type](node.body, state);
		code.push(' while (');
		visitors[node.test.type](node.test, state);
		code.push(');');
	},
	ForStatement: function ForStatement(node, state) {
		var code = state.code;

		code.push('for (');
		if (node.init) {
			visitors.ForInit(node.init, state);
		}
		code.push('; ');
		if (node.test) {
			visitors[node.test.type](node.test, state);
		}
		code.push('; ');
		if (node.update) {
			visitors[node.update.type](node.update, state);
		}
		code.push(') ');
		visitors[node.body.type](node.body, state);
	},
	ForInStatement: ForInStatement = function (node, state) {
		var code = state.code;

		code.push('for (');
		visitors.ForInit(node.left, state);
		code.push(node.type[3] === 'I' ? ' in ' : ' of ');
		visitors[node.right.type](node.right, state);
		code.push(') ');
		visitors[node.body.type](node.body, state);
	},
	ForOfStatement: ForInStatement,
	ForInit: function ForInit(node, state) {
		visitors[node.type](node, state);
		if (node.type === 'VariableDeclaration') {
			// Remove inserted semicolon
			state.code.pop();
		}
	},
	DebuggerStatement: function DebuggerStatement(node, state) {
		state.code.push('debugger;', state.lineEnd);
	},
	FunctionDeclaration: FunctionDeclaration = function (node, state) {
		var code = state.code;

		code.push(node.generator ? 'function* ' : 'function ');
		if (node.id) code.push(node.id.name);
		formatParameters(code, node.params, state);
		visitors[node.body.type](node.body, state);
	},
	VariableDeclaration: function VariableDeclaration(node, state) {
		var code = state.code;
		var declarations = node.declarations;

		code.push(node.kind, ' ');
		for (var i = 0, _length4 = declarations.length; i < _length4; i++) {
			var declaration = declarations[i];
			visitors[declaration.id.type](declaration.id, state);
			if (declaration.init) {
				code.push(' = ');
				visitors[declaration.init.type](declaration.init, state);
			}
			code.push(', ');
		}
		// Remove trailing comma
		code.pop();
		code.push(';');
	},
	ClassDeclaration: function ClassDeclaration(node, state) {
		var code = state.code;

		code.push('class ');
		if (node.id) {
			code.push(node.id.name + ' ');
		}
		if (node.superClass) {
			code.push('extends ');
			visitors[node.superClass.type](node.superClass, state);
			code.push(' ');
		}
		visitors.BlockStatement(node.body, state);
	},
	ImportDeclaration: function ImportDeclaration(node, state) {
		var code = state.code;

		code.push('import ');
		var specifiers = node.specifiers;
		var length = specifiers.length;

		if (length > 0) {
			var i = 0,
			    specifier = undefined;
			importSpecifiers: while (i < length) {
				specifier = specifiers[i];
				switch (specifier.type) {
					case 'ImportDefaultSpecifier':
						code.push(specifier.local.name);
						i++;
						break;
					case 'ImportNamespaceSpecifier':
						code.push('* as ', specifier.local.name);
						i++;
						break;
					default:
						break importSpecifiers;
				}
				code.push(', ');
			}
			if (i < length) {
				code.push('{');
				while (i < length) {
					specifier = specifiers[i];
					var _name = specifier.imported.name;

					code.push(_name);
					if (_name !== specifier.local.name) {
						code.push(' as ', specifier.local.name);
					}
					code.push(', ');
					i++;
				}
				// Remove trailing comma
				code.pop();
				code.push('}');
			} else {
				// Remove trailing comma
				code.pop();
			}
			code.push(' from ');
		}
		code.push(node.source.raw);
		code.push(';');
	},
	ExportDefaultDeclaration: function ExportDefaultDeclaration(node, state) {
		var code = state.code;

		code.push('export default ');
		visitors[node.declaration.type](node.declaration, state);
		code.push(';');
	},
	ExportNamedDeclaration: function ExportNamedDeclaration(node, state) {
		var code = state.code;

		code.push('export ');
		if (node.declaration) {
			visitors[node.declaration.type](node.declaration, state);
		} else {
			code.push('{');
			var specifiers = node.specifiers;
			var _length5 = specifiers.length;

			if (_length5 > 0) {
				for (var i = 0; i < _length5; i++) {
					var specifier = specifiers[i];
					var _name2 = specifier.local.name;

					code.push(_name2);
					if (_name2 !== specifier.exported.name) {
						code.push(' as ' + specifier.exported.name);
					}
					code.push(', ');
				}
				// Remove trailing comma
				code.pop();
			}
			code.push('}');
			if (node.source) {
				code.push(' from ', node.source.raw);
			}
			code.push(';');
		}
	},
	ExportAllDeclaration: function ExportAllDeclaration(node, state) {
		state.code.push('export * from ', node.source.raw, ';');
	},
	MethodDefinition: function MethodDefinition(node, state) {
		var code = state.code;

		if (node['static']) code.push('static ');
		switch (node.kind) {
			case 'get':
			case 'set':
				code.push(node.kind, ' ');
				break;
			default:
				break;
		}
		if (node.computed) {
			code.push('[');
			visitors[node.key.type](node.key, state);
			code.push(']');
		} else {
			code.push(node.key.name);
		}
		formatParameters(code, node.value.params, state);
		visitors[node.value.body.type](node.value.body, state);
	},
	ClassExpression: function ClassExpression(node, state) {
		visitors.ClassDeclaration(node, state);
	},
	ArrowFunctionExpression: function ArrowFunctionExpression(node, state) {
		var code = state.code;

		formatParameters(code, node.params, state);
		code.push('=> ');
		if (node.body.type === 'ObjectExpression') {
			code.push('(');
			visitors.ObjectExpression(node.body, state);
			code.push(')');
		} else visitors[node.body.type](node.body, state);
	},
	ThisExpression: function ThisExpression(node, state) {
		state.code.push('this');
	},
	Super: function Super(node, state) {
		state.code.push('super');
	},
	RestElement: RestElement = function (node, state) {
		state.code.push('...');
		visitors[node.argument.type](node.argument, state);
	},
	SpreadElement: RestElement,
	YieldExpression: function YieldExpression(node, state) {
		var code = state.code;

		code.push('yield');
		if (node.argument) {
			code.push(' ');
			visitors[node.argument.type](node.argument, state);
		}
	},
	TemplateLiteral: function TemplateLiteral(node, state) {
		var code = state.code;
		var quasis = node.quasis;
		var expressions = node.expressions;

		code.push('`');
		for (var i = 0, _length6 = expressions.length; i < _length6; i++) {
			var expression = expressions[i];
			code.push(quasis[i].value.raw);
			code.push('${');
			visitors[expression.type](expression, state);
			code.push('}');
		}
		code.push(quasis[quasis.length - 1].value.raw);
		code.push('`');
	},
	TaggedTemplateExpression: function TaggedTemplateExpression(node, state) {
		visitors[node.tag.type](node.tag, state);
		visitors[node.quasi.type](node.quasi, state);
	},
	ArrayExpression: ArrayExpression = function (node, state) {
		var code = state.code;

		code.push('[');
		if (node.elements.length !== 0) {
			for (var i = 0, elements = node.elements, _length7 = elements.length; i < _length7; i++) {
				var element = elements[i];
				visitors[element.type](element, state);
				code.push(', ');
			}
			code.pop();
		}
		code.push(']');
	},
	ArrayPattern: ArrayExpression,
	ObjectExpression: function ObjectExpression(node, state) {
		var indent = state.indent.repeat(state.indentLevel++);
		var lineEnd = state.lineEnd;
		var code = state.code;

		var propertyIndent = indent + state.indent;
		code.push('{');
		if (node.properties.length !== 0) {
			var comma = ',' + lineEnd;
			code.push(lineEnd);
			for (var i = 0, properties = node.properties, _length8 = properties.length; i < _length8; i++) {
				var property = properties[i];
				code.push(propertyIndent);
				if (property.computed) code.push('[');
				visitors[property.key.type](property.key, state);
				if (property.computed) code.push(']');
				if (!property.shorthand) {
					code.push(': ');
					visitors[property.value.type](property.value, state);
					code.push(comma);
				}
			}
			code.pop();
			code.push(lineEnd);
		}
		state.indentLevel--;
		code.push(indent, '}');
	},
	ObjectPattern: function ObjectPattern(node, state) {
		var code = state.code;

		code.push('{');
		if (node.properties.length !== 0) {
			for (var i = 0, properties = node.properties, _length9 = properties.length; i < _length9; i++) {
				var property = properties[i];
				if (property.computed) {
					code.push('[');
					visitors[property.key.type](property.key, state);
					code.push(']');
				} else {
					visitors[property.key.type](property.key, state);
				}
				if (!property.shorthand) {
					code.push(': ');
					visitors[property.value.type](property.value, state);
				}
				code.push(', ');
			}
			// Removing trailing comma
			code.pop();
		}
		code.push('}');
	},
	FunctionExpression: FunctionDeclaration,
	SequenceExpression: function SequenceExpression(node, state) {
		var code = state.code;
		var expressions = node.expressions;

		if (expressions.length !== 0) {
			for (var i = 0, _length10 = expressions.length; i < _length10; i++) {
				var expression = expressions[i];
				visitors[expression.type](expression, state);
				code.push(', ');
			}
			code.pop();
		}
	},
	UnaryExpression: function UnaryExpression(node, state) {
		if (node.prefix) {
			state.code.push(node.operator, ' ');
			visitors[node.argument.type](node.argument, state);
		} else {
			visitors[node.argument.type](node.argument, state);
			state.code.push(node.operator);
		}
	},
	UpdateExpression: function UpdateExpression(node, state) {
		if (node.prefix) {
			state.code.push(node.operator);
			visitors[node.argument.type](node.argument, state);
		} else {
			visitors[node.argument.type](node.argument, state);
			state.code.push(node.operator);
		}
	},
	AssignmentExpression: function AssignmentExpression(node, state) {
		visitors[node.left.type](node.left, state);
		state.code.push(' ', node.operator, ' ');
		visitors[node.right.type](node.right, state);
	},
	AssignmentPattern: function AssignmentPattern(node, state) {
		visitors[node.left.type](node.left, state);
		state.code.push(' = ');
		visitors[node.right.type](node.right, state);
	},
	BinaryExpression: BinaryExpression = function (node, state) {
		var code = state.code;
		var operator = node.operator;

		formatBinarySideExpression(code, node.left, operator, state);
		code.push(' ', node.operator, ' ');
		formatBinarySideExpression(code, node.right, operator, state);
	},
	LogicalExpression: BinaryExpression,
	ConditionalExpression: function ConditionalExpression(node, state) {
		var code = state.code;

		visitors[node.test.type](node.test, state);
		code.push(' ? ');
		visitors[node.consequent.type](node.consequent, state);
		code.push(' : ');
		visitors[node.alternate.type](node.alternate, state);
	},
	NewExpression: function NewExpression(node, state) {
		state.code.push('new ');
		visitors.CallExpression(node, state);
	},
	CallExpression: function CallExpression(node, state) {
		var code = state.code;

		switch (node.callee.type) {
			case 'Identifier':
			case 'Literal':
			case 'MemberExpression':
			case 'CallExpression':
				visitors[node.callee.type](node.callee, state);
				break;
			default:
				code.push('(');
				visitors[node.callee.type](node.callee, state);
				code.push(')');
		}
		code.push('(');
		var args = node['arguments'];
		if (args.length !== 0) {
			for (var i = 0, _length11 = args.length; i < _length11; i++) {
				var arg = args[i];
				visitors[arg.type](arg, state);
				code.push(', ');
			}
			code.pop();
		}
		code.push(')');
	},
	MemberExpression: function MemberExpression(node, state) {
		var code = state.code;

		visitors[node.object.type](node.object, state);
		if (node.computed) {
			code.push('[');
			visitors[node.property.type](node.property, state);
			code.push(']');
		} else {
			code.push('.');
			visitors[node.property.type](node.property, state);
		}
	},
	Identifier: function Identifier(node, state) {
		state.code.push(node.name);
	},
	Literal: function Literal(node, state) {
		state.code.push(node.raw);
	}
};

exports['default'] = function (node, options) {
	/*
 Returns a string representing the rendered code of the provided AST `node`.
 The `options` are:
 	- `indent`: string to use for indentation (defaults to `\t`)
 - `lineEnd`: string to use for line endings (defaults to `\n`)
 - `startingIndentLevel`: indent level to start from (default to `0`)
 */
	var state = options == null ? {
		code: [],
		indent: "\t",
		lineEnd: "\n",
		indentLevel: 0
	} : {
		// Will contain the resulting code as an array of code strings
		code: [],
		// Formating options
		indent: options.indent != null ? options.indent : "\t",
		lineEnd: options.lineEnd != null ? options.lineEnd : "\n",
		indentLevel: options.startingIndentLevel != null ? options.startingIndentLevel : 0
	};
	// Walk through the AST node and generate the code
	visitors[node.type](node, state);
	return state.code.join('');
};

module.exports = exports['default'];

},{}]},{},[])("astring")
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1Byb2plY3RzL0JlZS9hc3RyaW5nL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7O0FDR0EsSUFBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFHO0FBQy9CLE9BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLFVBQVcsS0FBSyxFQUFHOztBQUU1QyxNQUFLLEtBQUssR0FBRyxDQUFDLEVBQUc7QUFDaEIsU0FBTSxJQUFJLFVBQVUsQ0FBRSxtQ0FBbUMsQ0FBRSxDQUFBO0dBQzNELE1BQU0sSUFBSyxLQUFLLEtBQUssUUFBUSxFQUFHO0FBQ2hDLFNBQU0sSUFBSSxVQUFVLENBQUUseUNBQXlDLENBQUUsQ0FBQTtHQUNqRTs7QUFFRCxPQUFLLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQTtBQUNqQixNQUFLLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUc7OztBQUdyQyxTQUFNLElBQUksVUFBVSxDQUFFLG9EQUFvRCxDQUFFLENBQUE7R0FDNUU7QUFDRCxNQUFJLEdBQUcsR0FBRyxFQUFFLENBQUE7QUFDWixTQUFRLEtBQUssRUFBRSxFQUFHO0FBQ2pCLE1BQUcsQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFFLENBQUE7R0FDaEI7QUFDRCxTQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUUsRUFBRSxDQUFFLENBQUE7RUFDckIsQ0FBQTtDQUNEOztBQUdELFNBQVMsZ0JBQWdCLENBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUc7Ozs7QUFJaEQsS0FBSSxDQUFDLElBQUksQ0FBRSxHQUFHLENBQUUsQ0FBQTtBQUNoQixLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxD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R0FBRyxDQUFFLENBQUE7RUFDM0I7Q0FDRCxDQUFDOztxQkFJYSxVQUFVLElBQUksRUFBRSxPQUFPLEVBQUc7Ozs7Ozs7O0FBU3hDLEtBQUksS0FBSyxHQUFHLEFBQUMsT0FBTyxJQUFJLElBQUksR0FBSTtBQUMvQixNQUFJLEVBQUUsRUFBRTtBQUNSLFFBQU0sRUFBRSxJQUFJO0FBQ1osU0FBTyxFQUFFLElBQUk7QUFDYixhQUFXLEVBQUUsQ0FBQztFQUNkLEdBQUc7O0FBRUgsTUFBSSxFQUFFLEVBQUU7O0FBRVIsUUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLEdBQUcsSUFBSTtBQUN0RCxTQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU8sSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLE9BQU8sR0FBRyxJQUFJO0FBQ3pELGFBQVcsRUFBRSxPQUFPLENBQUMsbUJBQW1CLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsR0FBRyxDQUFDO0VBQ2xGLENBQUM7O0FBRUYsU0FBUSxDQUFFLElBQUksQ0FBQyxJQUFJLENBQUUsQ0FBRSxJQUFJLEVBQUUsS0FBSyxDQUFFLENBQUE7QUFDcEMsUUFBTyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBRSxFQUFFLENBQUUsQ0FBQTtDQUM1QiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcblxuLy8gUG9seWZpbGwgZm9yIG5vbi1FUzYgaW50ZXJwcmV0ZXJzXG5pZiAoICFTdHJpbmcucHJvdG90eXBlLnJlcGVhdCApIHtcblx0U3RyaW5nLnByb3RvdHlwZS5yZXBlYXQgPSBmdW5jdGlvbiAoIGNvdW50ICkge1xuXHRcdC8vIFBlcmZvbSBzb21lIGNoZWNrcyBmaXJzdFxuXHRcdGlmICggY291bnQgPCAwICkge1xuXHRcdFx0dGhyb3cgbmV3IFJhbmdlRXJyb3IoICdSZXBlYXQgY291bnQgbXVzdCBiZSBub24tbmVnYXRpdmUnIClcblx0XHR9IGVsc2UgaWYgKCBjb3VudCA9PT0gSW5maW5pdHkgKSB7XG5cdFx0XHR0aHJvdyBuZXcgUmFuZ2VFcnJvciggJ1JlcGVhdCBjb3VudCBtdXN0IGJlIGxlc3MgdGhhbiBpbmZpbml0eScgKVxuXHRcdH1cblx0XHQvLyBFbnN1cmUgaXQncyBhbiBpbnRlZ2VyXG5cdFx0Y291bnQgPSBjb3VudCB8IDBcblx0XHRpZiAoIHRoaXMubGVuZ3RoICogY291bnQgPj0gMSA8PCAyOCApIHtcblx0XHRcdC8vIEZyb20gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvU3RyaW5nL3JlcGVhdFxuXHRcdFx0Ly8gTW9zdCBjdXJyZW50IChBdWd1c3QgMjAxNCkgYnJvd3NlcnMgY2FuJ3QgaGFuZGxlIHN0cmluZ3MgMSA8PCAyOCBjaGFycyBvciBsb25nZXJcblx0XHRcdHRocm93IG5ldyBSYW5nZUVycm9yKCAnUmVwZWF0IGNvdW50IG11c3Qgbm90IG92ZXJmbG93IG1heGltdW0gc3RyaW5nIHNpemUnIClcblx0XHR9XG5cdFx0dmFyIG91dCA9IFtdXG5cdFx0d2hpbGUgKCBjb3VudC0tICkge1xuXHRcdFx0b3V0LnB1c2goIHRoaXMgKVxuXHRcdH1cblx0XHRyZXR1cm4gb3V0LmpvaW4oICcnIClcblx0fVxufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFBhcmFtZXRlcnMoIGNvZGUsIHBhcmFtcywgc3RhdGUgKSB7XG5cdC8qXG5cdEZvcm1hdHMgZnVuY3Rpb24gcGFyYW1ldGVycyBwcm92aWRlZCBpbiBgcGFyYW1zYCBpbnRvIHRoZSBgY29kZWAgYXJyYXkuXG5cdCovXG5cdGNvZGUucHVzaCggJygnIClcblx0aWYgKCBwYXJhbXMgIT0gbnVsbCAmJiBwYXJhbXMubGVuZ3RoICE9PSAwICkge1xuXHRcdGZvciAobGV0IGkgPSAwLCB7IGxlbmd0aCB9ID0gcGFyYW1zOyBpIDwgbGVuZ3RoOyBpKyspIHtcblx0XHRcdGxldCBwYXJhbSA9IHBhcmFtc1sgaSBdXG5cdFx0XHR2aXNpdG9yc1sgcGFyYW0udHlwZSBdKCBwYXJhbSwgc3RhdGUgKVxuXHRcdFx0Y29kZS5wdXNoKCAnLCAnIClcblx0XHR9XG5cdFx0Ly8gUmVtb3ZlIHRyYWlsaW5nIGNvbW1hXG5cdFx0Y29kZS5wb3AoKVxuXHR9XG5cdGNvZGUucHVzaCggJykgJyApXG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QmluYXJ5U2lkZUV4cHJlc3Npb24oIGNvZGUsIG5vZGUsIG9wZXJhdG9yLCBzdGF0ZSApIHtcblx0Lypcblx0Rm9ybWF0cyBpbnRvIHRoZSBgY29kZWAgYXJyYXkgYSBsZWZ0LWhhbmQgb3IgcmlnaHQtaGFuZCBleHByZXNzaW9uIGBub2RlYCBmcm9tIGEgYmluYXJ5IGV4cHJlc3Npb24gYXBwbHlpbmcgdGhlIHByb3ZpZGVkIGBvcGVyYXRvcmAuXG5cdCovXG5cdHN3aXRjaCAoIG5vZGUudHlwZSApIHtcblx0XHRjYXNlICdJZGVudGlmaWVyJzpcblx0XHRjYXNlICdMaXRlcmFsJzpcblx0XHRjYXNlICdNZW1iZXJFeHByZXNzaW9uJzpcblx0XHRjYXNlICdDYWxsRXhwcmVzc2lvbic6XG5cdFx0XHR2aXNpdG9yc1sgbm9kZS50eXBlIF0oIG5vZGUsIHN0YXRlIClcblx0XHRcdGJyZWFrXG5cdFx0Y2FzZSAnQmluYXJ5RXhwcmVzc2lvbic6XG5cdFx0XHRpZiAoIE9QRVJBVE9SU19QUkVDRURFTkNFWyBub2RlLm9wZXJhdG9yIF0gPj0gT1BFUkFUT1JTX1BSRUNFREVOQ0VbIG9wZXJhdG9yIF0gKSB7XG5cdFx0XHRcdHZpc2l0b3JzWyBub2RlLnR5cGUgXSggbm9kZSwgc3RhdGUgKVxuXHRcdFx0XHRicmVha1xuXHRcdFx0fVxuXHRcdGRlZmF1bHQ6XG5cdFx0XHRjb2RlLnB1c2goICcoJyApXG5cdFx0XHR2aXNpdG9yc1sgbm9kZS50eXBlIF0oIG5vZGUsIHN0YXRlIClcblx0XHRcdGNvZGUucHVzaCggJyknIClcblx0fVxufVxuXG5cbmNvbnN0IE9QRVJBVE9SU19QUkVDRURFTkNFID0ge1xuXHQnfHwnOiAzLFxuXHQnJiYnOiA0LFxuXHQnfCc6IDUsXG5cdCdeJzogNixcblx0JyYnOiA3LFxuXHQnPT0nOiA4LFxuXHQnIT0nOiA4LFxuXHQnPT09JzogOCxcblx0JyE9PSc6IDgsXG5cdCc8JzogOSxcblx0Jz4nOiA5LFxuXHQnPD0nOiA5LFxuXHQnPj0nOiA5LFxuXHQnaW4nOiA5LFxuXHQnaW5zdGFuY2VvZic6IDksXG5cdCc8PCc6IDEwLFxuXHQnPj4nOiAxMCxcblx0Jz4+Pic6IDEwLFxuXHQnKyc6IDExLFxuXHQnLSc6IDExLFxuXHQnKic6IDEyLFxuXHQnJSc6IDEyLFxuXHQnLyc6IDEyXG59XG5cblxudmFyIEZvckluU3RhdGVtZW50LCBGdW5jdGlvbkRlY2xhcmF0aW9uLCBSZXN0RWxlbWVudCwgQmluYXJ5RXhwcmVzc2lvbiwgQXJyYXlFeHByZXNzaW9uXG5cblxudmFyIHZpc2l0b3JzID0ge1xuXHRQcm9ncmFtOiBmdW5jdGlvbiggbm9kZSwgc3RhdGUgKSB7XG5cdFx0Y29uc3QgaW5kZW50ID0gc3RhdGUuaW5kZW50LnJlcGVhdCggc3RhdGUuaW5kZW50TGV2ZWwgKVxuXHRcdGNvbnN0IHsgbGluZUVuZCwgY29kZSB9ID0gc3RhdGVcblx0XHRsZXQgc3RhdGVtZW50cyA9IG5vZGUuYm9keVxuXHRcdGZvciAodmFyIGkgPSAwLCB7IGxlbmd0aCB9ID0gc3RhdGVtZW50czsgaSA8IGxlbmd0aDsgaSsrKSB7XG5cdFx0XHRjb2RlLnB1c2goIGluZGVudCApXG5cdFx0XHRsZXQgc3RhdGVtZW50ID0gc3RhdGVtZW50c1tpXVxuXHRcdFx0dmlzaXRvcnNbIHN0YXRlbWVudC50eXBlIF0oIHN0YXRlbWVudCwgc3RhdGUgKVxuXHRcdFx0Y29kZS5wdXNoKCBsaW5lRW5kIClcblx0XHR9XG5cdH0sXG5cdEJsb2NrU3RhdGVtZW50OiBmdW5jdGlvbiggbm9kZSwgc3RhdGUgKSB7XG5cdFx0Y29uc3QgaW5kZW50ID0gc3RhdGUuaW5kZW50LnJlcGVhdCggc3RhdGUuaW5kZW50TGV2ZWwrKyApXG5cdFx0Y29uc3QgeyBsaW5lRW5kLCBjb2RlIH0gPSBzdGF0ZVxuXHRcdGNvbnN0IHN0YXRlbWVudEluZGVudCA9IGluZGVudCArIHN0YXRlLmluZGVudFxuXHRcdGNvZGUucHVzaCggJ3snIClcblx0XHR2YXIgc3RhdGVtZW50cyA9IG5vZGUuYm9keVxuXHRcdGlmICggc3RhdGVtZW50cyAhPSBudWxsICYmIHN0YXRlbWVudHMubGVuZ3RoICE9PSAwICkge1xuXHRcdFx0Y29kZS5wdXNoKCBsaW5lRW5kICk7XG5cdFx0XHRmb3IgKHZhciBpID0gMCwgeyBsZW5ndGggfSA9IHN0YXRlbWVudHM7IGkgPCBsZW5ndGg7IGkrKykge1xuXHRcdFx0XHRjb2RlLnB1c2goIHN0YXRlbWVudEluZGVudCApXG5cdFx0XHRcdGxldCBzdGF0ZW1lbnQgPSBzdGF0ZW1lbnRzWyBpIF1cblx0XHRcdFx0dmlzaXRvcnNbIHN0YXRlbWVudC50eXBlIF0oIHN0YXRlbWVudCwgc3RhdGUgKVxuXHRcdFx0XHRjb2RlLnB1c2goIGxpbmVFbmQgKVxuXHRcdFx0fVxuXHRcdFx0Y29kZS5wdXNoKCBpbmRlbnQgKVxuXHRcdH1cblx0XHRjb2RlLnB1c2goICd9JyApXG5cdFx0c3RhdGUuaW5kZW50TGV2ZWwtLVxuXHR9LFxuXHRTdGF0ZW1lbnQ6IGZ1bmN0aW9uKCBub2RlLCBzdGF0ZSApIHtcblx0XHR2aXNpdG9yc1sgbm9kZS50eXBlIF0oIG5vZGUsIHN0YXRlIClcblx0XHRzdGF0ZS5jb2RlLnB1c2goIHN0YXRlLmxpbmVFbmQgKVxuXHR9LFxuXHRFbXB0eVN0YXRlbWVudDogZnVuY3Rpb24oIG5vZGUsIHN0YXRlICkge1xuXHRcdHN0YXRlLmNvZGUucHVzaCggJzsnIClcblx0fSxcblx0RXhwcmVzc2lvblN0YXRlbWVudDogZnVuY3Rpb24oIG5vZGUsIHN0YXRlICkge1xuXHRcdHZpc2l0b3JzWyBub2RlLmV4cHJlc3Npb24udHlwZSBdKCBub2RlLmV4cHJlc3Npb24sIHN0YXRlIClcblx0XHRzdGF0ZS5jb2RlLnB1c2goICc7JyApXG5cdH0sXG5cdElmU3RhdGVtZW50OiBmdW5jdGlvbiggbm9kZSwgc3RhdGUgKSB7XG5cdFx0Y29uc3QgeyBjb2RlIH0gPSBzdGF0ZVxuXHRcdGNvZGUucHVzaCggJ2lmICgnIClcblx0XHR2aXNpdG9yc1sgbm9kZS50ZXN0LnR5cGUgXSggbm9kZS50ZXN0LCBzdGF0ZSApXG5cdFx0Y29kZS5wdXNoKCAnKSAnIClcblx0XHR2aXNpdG9yc1sgbm9kZS5jb25zZXF1ZW50LnR5cGUgXSggbm9kZS5jb25zZXF1ZW50LCBzdGF0ZSApXG5cdFx0aWYgKCBub2RlLmFsdGVybmF0ZSAhPSBudWxsICkge1xuXHRcdFx0Y29kZS5wdXNoKCAnIGVsc2UgJyApXG5cdFx0XHR2aXNpdG9yc1sgbm9kZS5hbHRlcm5hdGUudHlwZSBdKCBub2RlLmFsdGVybmF0ZSwgc3RhdGUgKVxuXHRcdH1cblx0fSxcblx0TGFiZWxlZFN0YXRlbWVudDogZnVuY3Rpb24oIG5vZGUsIHN0YXRlICkge1xuXHRcdHZpc2l0b3JzWyBub2RlLmxhYmVsLnR5cGUgXSggbm9kZS5sYWJlbCwgc3RhdGUgKVxuXHRcdHN0YXRlLmNvZGUucHVzaCggJzonLCBzdGF0ZS5saW5lRW5kIClcblx0XHR2aXNpdG9ycy5TdGF0ZW1lbnQoIG5vZGUuYm9keSwgc3RhdGUgKVxuXHRcdC8vIFJlbW92ZSBsaW5lIGVuZFxuXHRcdHN0YXRlLmNvZGUucG9wKClcblx0fSxcblx0QnJlYWtTdGF0ZW1lbnQ6IGZ1bmN0aW9uKCBub2RlLCBzdGF0ZSApIHtcblx0XHRjb25zdCB7IGNvZGUgfSA9IHN0YXRlXG5cdFx0Y29kZS5wdXNoKCAnYnJlYWsnIClcblx0XHRpZiAoIG5vZGUubGFiZWwgKSB7XG5cdFx0XHRjb2RlLnB1c2goICcgJyApXG5cdFx0XHR2aXNpdG9yc1sgbm9kZS5sYWJlbC50eXBlIF0oIG5vZGUubGFiZWwsIHN0YXRlIClcblx0XHR9XG5cdFx0Y29kZS5wdXNoKCAnOycgKVxuXHR9LFxuXHRDb250aW51ZVN0YXRlbWVudDogZnVuY3Rpb24oIG5vZGUsIHN0YXRlICkge1xuXHRcdGNvbnN0IHsgY29kZSB9ID0gc3RhdGVcblx0XHRjb2RlLnB1c2goICdjb250aW51ZScgKVxuXHRcdGlmICggbm9kZS5sYWJlbCApIHtcblx0XHRcdGNvZGUucHVzaCggJyAnIClcblx0XHRcdHZpc2l0b3JzWyBub2RlLmxhYmVsLnR5cGUgXSggbm9kZS5sYWJlbCwgc3RhdGUgKVxuXHRcdH1cblx0XHRjb2RlLnB1c2goICc7JyApXG5cdH0sXG5cdFdpdGhTdGF0ZW1lbnQ6IGZ1bmN0aW9uKCBub2RlLCBzdGF0ZSApIHtcblx0XHRjb25zdCB7IGNvZGUgfSA9IHN0YXRlXG5cdFx0Y29kZS5wdXNoKCAnd2l0aCAoJyApXG5cdFx0dmlzaXRvcnNbIG5vZGUub2JqZWN0LnR5cGUgXSggbm9kZS5vYmplY3QsIHN0YXRlIClcblx0XHRjb2RlLnB1c2goICcpICcgKVxuXHRcdHZpc2l0b3JzLlN0YXRlbWVudCggbm9kZS5ib2R5LCBzdGF0ZSApXG5cdH0sXG5cdFN3aXRjaFN0YXRlbWVudDogZnVuY3Rpb24oIG5vZGUsIHN0YXRlICkge1xuXHRcdGNvbnN0IGluZGVudCA9IHN0YXRlLmluZGVudC5yZXBlYXQoIHN0YXRlLmluZGVudExldmVsKysgKVxuXHRcdGNvbnN0IHsgbGluZUVuZCwgY29kZSB9ID0gc3RhdGVcblx0XHRzdGF0ZS5pbmRlbnRMZXZlbCsrXG5cdFx0Y29uc3QgY2FzZUluZGVudCA9IGluZGVudCArIHN0YXRlLmluZGVudFxuXHRcdGNvbnN0IHN0YXRlbWVudEluZGVudCA9IGNhc2VJbmRlbnQgKyBzdGF0ZS5pbmRlbnRcblx0XHRjb2RlLnB1c2goICdzd2l0Y2ggKCcgKVxuXHRcdHZpc2l0b3JzWyBub2RlLmRpc2NyaW1pbmFudC50eXBlIF0oIG5vZGUuZGlzY3JpbWluYW50LCBzdGF0ZSApXG5cdFx0Y29kZS5wdXNoKCcpIHsnLCBsaW5lRW5kKVxuXHRcdGNvbnN0IHtjYXNlc30gPSBub2RlO1xuXHRcdGZvciAobGV0IGkgPSAwLCB7IGxlbmd0aCB9ID0gY2FzZXM7IGkgPCBsZW5ndGg7IGkrKykge1xuXHRcdFx0bGV0IGNoZWNrID0gY2FzZXNbaV07XG5cdFx0XHRpZiAoIGNoZWNrLnRlc3QgKSB7XG5cdFx0XHRcdGNvZGUucHVzaCggY2FzZUluZGVudCwgJ2Nhc2UgJyApXG5cdFx0XHRcdHZpc2l0b3JzWyBjaGVjay50ZXN0LnR5cGUgXSggY2hlY2sudGVzdCwgc3RhdGUgKVxuXHRcdFx0XHRjb2RlLnB1c2goICc6JywgbGluZUVuZCApXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb2RlLnB1c2goIGNhc2VJbmRlbnQsICdkZWZhdWx0OicsIGxpbmVFbmQgKVxuXHRcdFx0fVxuXHRcdFx0bGV0IHsgY29uc2VxdWVudCB9ID0gY2hlY2tcblx0XHRcdGZvciAobGV0IGkgPSAwLCB7IGxlbmd0aCB9ID0gY29uc2VxdWVudDsgaSA8IGxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGNvZGUucHVzaCggc3RhdGVtZW50SW5kZW50IClcblx0XHRcdFx0dmlzaXRvcnMuU3RhdGVtZW50KCBjb25zZXF1ZW50WyBpIF0sIHN0YXRlIClcblx0XHRcdH1cblx0XHR9XG5cdFx0c3RhdGUuaW5kZW50TGV2ZWwgLT0gMlxuXHRcdGNvZGUucHVzaCggaW5kZW50LCAnfScgKVxuXHR9LFxuXHRSZXR1cm5TdGF0ZW1lbnQ6IGZ1bmN0aW9uKCBub2RlLCBzdGF0ZSApIHtcblx0XHRjb25zdCB7IGNvZGUgfSA9IHN0YXRlXG5cdFx0Y29kZS5wdXNoKCAncmV0dXJuJyApXG5cdFx0aWYgKCBub2RlLmFyZ3VtZW50ICkge1xuXHRcdFx0Y29kZS5wdXNoKCAnICcgKVxuXHRcdFx0dmlzaXRvcnNbIG5vZGUuYXJndW1lbnQudHlwZSBdKCBub2RlLmFyZ3VtZW50LCBzdGF0ZSApXG5cdFx0fVxuXHRcdGNvZGUucHVzaCggJzsnIClcblx0fSxcblx0VGhyb3dTdGF0ZW1lbnQ6IGZ1bmN0aW9uKCBub2RlLCBzdGF0ZSApIHtcblx0XHRjb25zdCB7IGNvZGUgfSA9IHN0YXRlXG5cdFx0Y29kZS5wdXNoKCAndGhyb3cgJyApXG5cdFx0dmlzaXRvcnNbIG5vZGUuYXJndW1lbnQudHlwZSBdKCBub2RlLmFyZ3VtZW50LCBzdGF0ZSApXG5cdFx0Y29kZS5wdXNoKCAnOycgKVxuXHR9LFxuXHRUcnlTdGF0ZW1lbnQ6IGZ1bmN0aW9uKCBub2RlLCBzdGF0ZSApIHtcblx0XHRjb25zdCB7IGNvZGUgfSA9IHN0YXRlXG5cdFx0Y29kZS5wdXNoKCAndHJ5ICcgKVxuXHRcdHZpc2l0b3JzWyBub2RlLmJsb2NrLnR5cGUgXSggbm9kZS5ibG9jaywgc3RhdGUgKVxuXHRcdGlmICggbm9kZS5oYW5kbGVyICkge1xuXHRcdFx0bGV0IHsgaGFuZGxlciB9ID0gbm9kZVxuXHRcdFx0Y29kZS5wdXNoKCAnIGNhdGNoICgnIClcblx0XHRcdHZpc2l0b3JzWyBoYW5kbGVyLnBhcmFtLnR5cGUgXSggaGFuZGxlci5wYXJhbSwgc3RhdGUgKVxuXHRcdFx0Y29kZS5wdXNoKCAnKSAnIClcblx0XHRcdHZpc2l0b3JzWyBoYW5kbGVyLmJvZHkudHlwZSBdKCBoYW5kbGVyLmJvZHksIHN0YXRlIClcblx0XHR9XG5cdFx0aWYgKCBub2RlLmZpbmFsaXplciApIHtcblx0XHRcdGNvZGUucHVzaCggJyBmaW5hbGx5ICcgKVxuXHRcdFx0dmlzaXRvcnNbIG5vZGUuZmluYWxpemVyLnR5cGUgXSggbm9kZS5maW5hbGl6ZXIsIHN0YXRlIClcblx0XHR9XG5cdH0sXG5cdFdoaWxlU3RhdGVtZW50OiBmdW5jdGlvbiggbm9kZSwgc3RhdGUgKSB7XG5cdFx0Y29uc3QgeyBjb2RlIH0gPSBzdGF0ZVxuXHRcdGNvZGUucHVzaCggJ3doaWxlICgnIClcblx0XHR2aXNpdG9yc1sgbm9kZS50ZXN0LnR5cGUgXSggbm9kZS50ZXN0LCBzdGF0ZSApXG5cdFx0Y29kZS5wdXNoKCAnKSAnIClcblx0XHR2aXNpdG9yc1sgbm9kZS5ib2R5LnR5cGUgXSggbm9kZS5ib2R5LCBzdGF0ZSApXG5cdH0sXG5cdERvV2hpbGVTdGF0ZW1lbnQ6IGZ1bmN0aW9uKCBub2RlLCBzdGF0ZSApIHtcblx0XHRjb25zdCB7IGNvZGUgfSA9IHN0YXRlXG5cdFx0Y29kZS5wdXNoKCAnZG8gJyApXG5cdFx0dmlzaXRvcnNbIG5vZGUuYm9keS50eXBlIF0oIG5vZGUuYm9keSwgc3RhdGUgKVxuXHRcdGNvZGUucHVzaCggJyB3aGlsZSAoJyApXG5cdFx0dmlzaXRvcnNbIG5vZGUudGVzdC50eXBlIF0oIG5vZGUudGVzdCwgc3RhdGUgKVxuXHRcdGNvZGUucHVzaCggJyk7JyApXG5cdH0sXG5cdEZvclN0YXRlbWVudDogZnVuY3Rpb24oIG5vZGUsIHN0YXRlICkge1xuXHRcdGNvbnN0IHsgY29kZSB9ID0gc3RhdGVcblx0XHRjb2RlLnB1c2goICdmb3IgKCcgKVxuXHRcdGlmICggbm9kZS5pbml0ICkge1xuXHRcdFx0dmlzaXRvcnMuRm9ySW5pdCggbm9kZS5pbml0LCBzdGF0ZSApXG5cdFx0fVxuXHRcdGNvZGUucHVzaCggJzsgJyApXG5cdFx0aWYgKCBub2RlLnRlc3QgKSB7XG5cdFx0XHR2aXNpdG9yc1sgbm9kZS50ZXN0LnR5cGUgXSggbm9kZS50ZXN0LCBzdGF0ZSApXG5cdFx0fVxuXHRcdGNvZGUucHVzaCggJzsgJyApXG5cdFx0aWYgKCBub2RlLnVwZGF0ZSApIHtcblx0XHRcdHZpc2l0b3JzWyBub2RlLnVwZGF0ZS50eXBlIF0oIG5vZGUudXBkYXRlLCBzdGF0ZSApXG5cdFx0fVxuXHRcdGNvZGUucHVzaCggJykgJyApXG5cdFx0dmlzaXRvcnNbIG5vZGUuYm9keS50eXBlIF0oIG5vZGUuYm9keSwgc3RhdGUgKVxuXHR9LFxuXHRGb3JJblN0YXRlbWVudDogRm9ySW5TdGF0ZW1lbnQgPSBmdW5jdGlvbiggbm9kZSwgc3RhdGUgKSB7XG5cdFx0Y29uc3QgeyBjb2RlIH0gPSBzdGF0ZVxuXHRcdGNvZGUucHVzaCggJ2ZvciAoJyApXG5cdFx0dmlzaXRvcnMuRm9ySW5pdCggbm9kZS5sZWZ0LCBzdGF0ZSApXG5cdFx0Y29kZS5wdXNoKCBub2RlLnR5cGVbIDMgXSA9PT0gJ0knID8gJyBpbiAnIDogJyBvZiAnIClcblx0XHR2aXNpdG9yc1sgbm9kZS5yaWdodC50eXBlIF0oIG5vZGUucmlnaHQsIHN0YXRlIClcblx0XHRjb2RlLnB1c2goICcpICcgKVxuXHRcdHZpc2l0b3JzWyBub2RlLmJvZHkudHlwZSBdKCBub2RlLmJvZHksIHN0YXRlIClcblx0fSxcblx0Rm9yT2ZTdGF0ZW1lbnQ6IEZvckluU3RhdGVtZW50LFxuXHRGb3JJbml0OiBmdW5jdGlvbiggbm9kZSwgc3RhdGUgKSB7XG5cdFx0dmlzaXRvcnNbIG5vZGUudHlwZSBdKCBub2RlLCBzdGF0ZSApXG5cdFx0aWYgKCBub2RlLnR5cGUgPT09ICdWYXJpYWJsZURlY2xhcmF0aW9uJyApIHtcblx0XHRcdC8vIFJlbW92ZSBpbnNlcnRlZCBzZW1pY29sb25cblx0XHRcdHN0YXRlLmNvZGUucG9wKClcblx0XHR9XG5cdH0sXG5cdERlYnVnZ2VyU3RhdGVtZW50OiBmdW5jdGlvbiggbm9kZSwgc3RhdGUgKSB7XG5cdFx0c3RhdGUuY29kZS5wdXNoKCAnZGVidWdnZXI7Jywgc3RhdGUubGluZUVuZCApXG5cdH0sXG5cdEZ1bmN0aW9uRGVjbGFyYXRpb246IEZ1bmN0aW9uRGVjbGFyYXRpb24gPSBmdW5jdGlvbiggbm9kZSwgc3RhdGUgKSB7XG5cdFx0Y29uc3QgeyBjb2RlIH0gPSBzdGF0ZVxuXHRcdGNvZGUucHVzaCggbm9kZS5nZW5lcmF0b3IgPyAnZnVuY3Rpb24qICcgOiAnZnVuY3Rpb24gJyApXG5cdFx0aWYgKCBub2RlLmlkIClcblx0XHRcdGNvZGUucHVzaCggbm9kZS5pZC5uYW1lIClcblx0XHRmb3JtYXRQYXJhbWV0ZXJzKCBjb2RlLCBub2RlLnBhcmFtcywgc3RhdGUgKVxuXHRcdHZpc2l0b3JzWyBub2RlLmJvZHkudHlwZSBdKCBub2RlLmJvZHksIHN0YXRlIClcblx0fSxcblx0VmFyaWFibGVEZWNsYXJhdGlvbjogZnVuY3Rpb24oIG5vZGUsIHN0YXRlICkge1xuXHRcdGNvbnN0IHsgY29kZSB9ID0gc3RhdGVcblx0XHRjb25zdCB7IGRlY2xhcmF0aW9ucyB9ID0gbm9kZVxuXHRcdGNvZGUucHVzaCggbm9kZS5raW5kLCAnICcgKVxuXHRcdGZvciAobGV0IGkgPSAwLCB7IGxlbmd0aCB9ID0gZGVjbGFyYXRpb25zOyBpIDwgbGVuZ3RoOyBpKyspIHtcblx0XHRcdGxldCBkZWNsYXJhdGlvbiA9IGRlY2xhcmF0aW9uc1tpXVxuXHRcdFx0dmlzaXRvcnNbIGRlY2xhcmF0aW9uLmlkLnR5cGUgXSggZGVjbGFyYXRpb24uaWQsIHN0YXRlIClcblx0XHRcdGlmICggZGVjbGFyYXRpb24uaW5pdCApIHtcblx0XHRcdFx0Y29kZS5wdXNoKCAnID0gJyApXG5cdFx0XHRcdHZpc2l0b3JzWyBkZWNsYXJhdGlvbi5pbml0LnR5cGUgXSggZGVjbGFyYXRpb24uaW5pdCwgc3RhdGUgKVxuXHRcdFx0fVxuXHRcdFx0Y29kZS5wdXNoKCAnLCAnIClcblx0XHR9XG5cdFx0Ly8gUmVtb3ZlIHRyYWlsaW5nIGNvbW1hXG5cdFx0Y29kZS5wb3AoKVxuXHRcdGNvZGUucHVzaCggJzsnIClcblx0fSxcblx0Q2xhc3NEZWNsYXJhdGlvbjogZnVuY3Rpb24oIG5vZGUsIHN0YXRlICkge1xuXHRcdGNvbnN0IHsgY29kZSB9ID0gc3RhdGVcblx0XHRjb2RlLnB1c2goICdjbGFzcyAnIClcblx0XHRpZiAoIG5vZGUuaWQgKSB7XG5cdFx0XHRjb2RlLnB1c2goIG5vZGUuaWQubmFtZSArICcgJyApXG5cdFx0fVxuXHRcdGlmICggbm9kZS5zdXBlckNsYXNzICkge1xuXHRcdFx0Y29kZS5wdXNoKCAnZXh0ZW5kcyAnIClcblx0XHRcdHZpc2l0b3JzWyBub2RlLnN1cGVyQ2xhc3MudHlwZSBdKCBub2RlLnN1cGVyQ2xhc3MsIHN0YXRlIClcblx0XHRcdGNvZGUucHVzaCggJyAnIClcblx0XHR9XG5cdFx0dmlzaXRvcnMuQmxvY2tTdGF0ZW1lbnQoIG5vZGUuYm9keSwgc3RhdGUgKVxuXHR9LFxuXHRJbXBvcnREZWNsYXJhdGlvbjogZnVuY3Rpb24oIG5vZGUsIHN0YXRlICkge1xuXHRcdGNvbnN0IHsgY29kZSB9ID0gc3RhdGVcblx0XHRjb2RlLnB1c2goICdpbXBvcnQgJyApXG5cdFx0Y29uc3QgeyBzcGVjaWZpZXJzIH0gPSBub2RlXG5cdFx0Y29uc3QgeyBsZW5ndGggfSA9IHNwZWNpZmllcnNcblx0XHRpZiAoIGxlbmd0aCA+IDAgKSB7XG5cdFx0XHRsZXQgaSA9IDAsIHNwZWNpZmllclxuXHRcdFx0aW1wb3J0U3BlY2lmaWVyczogd2hpbGUgKCBpIDwgbGVuZ3RoICkge1xuXHRcdFx0XHRzcGVjaWZpZXIgPSBzcGVjaWZpZXJzWyBpIF1cblx0XHRcdFx0c3dpdGNoIChzcGVjaWZpZXIudHlwZSkge1xuXHRcdFx0XHRcdGNhc2UgJ0ltcG9ydERlZmF1bHRTcGVjaWZpZXInOlxuXHRcdFx0XHRcdFx0Y29kZS5wdXNoKCBzcGVjaWZpZXIubG9jYWwubmFtZSApXG5cdFx0XHRcdFx0XHRpKytcblx0XHRcdFx0XHRcdGJyZWFrXG5cdFx0XHRcdFx0Y2FzZSAnSW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyJzpcblx0XHRcdFx0XHRcdGNvZGUucHVzaCggJyogYXMgJywgc3BlY2lmaWVyLmxvY2FsLm5hbWUgKVxuXHRcdFx0XHRcdFx0aSsrXG5cdFx0XHRcdFx0XHRicmVha1xuXHRcdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0XHRicmVhayBpbXBvcnRTcGVjaWZpZXJzXG5cdFx0XHRcdH1cblx0XHRcdFx0Y29kZS5wdXNoKCAnLCAnIClcblx0XHRcdH1cblx0XHRcdGlmICggaSA8IGxlbmd0aCApIHtcblx0XHRcdFx0Y29kZS5wdXNoKCAneycgKVxuXHRcdFx0XHR3aGlsZSAoaSA8IGxlbmd0aCkge1xuXHRcdFx0XHRcdHNwZWNpZmllciA9IHNwZWNpZmllcnNbaV1cblx0XHRcdFx0XHRsZXQgeyBuYW1lIH0gPSBzcGVjaWZpZXIuaW1wb3J0ZWRcblx0XHRcdFx0XHRjb2RlLnB1c2goIG5hbWUgKVxuXHRcdFx0XHRcdGlmICggbmFtZSAhPT0gc3BlY2lmaWVyLmxvY2FsLm5hbWUgKSB7XG5cdFx0XHRcdFx0XHRjb2RlLnB1c2goICcgYXMgJywgc3BlY2lmaWVyLmxvY2FsLm5hbWUgKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRjb2RlLnB1c2goICcsICcgKVxuXHRcdFx0XHRcdGkrK1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIFJlbW92ZSB0cmFpbGluZyBjb21tYVxuXHRcdFx0XHRjb2RlLnBvcCgpXG5cdFx0XHRcdGNvZGUucHVzaCggJ30nIClcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIFJlbW92ZSB0cmFpbGluZyBjb21tYVxuXHRcdFx0XHRjb2RlLnBvcCgpXG5cdFx0XHR9XG5cdFx0XHRjb2RlLnB1c2goICcgZnJvbSAnIClcblx0XHR9XG5cdFx0Y29kZS5wdXNoKCBub2RlLnNvdXJjZS5yYXcgKVxuXHRcdGNvZGUucHVzaCggJzsnIClcblx0fSxcblx0RXhwb3J0RGVmYXVsdERlY2xhcmF0aW9uOiBmdW5jdGlvbiggbm9kZSwgc3RhdGUgKSB7XG5cdFx0Y29uc3QgeyBjb2RlIH0gPSBzdGF0ZVxuXHRcdGNvZGUucHVzaCggJ2V4cG9ydCBkZWZhdWx0ICcgKVxuXHRcdHZpc2l0b3JzWyBub2RlLmRlY2xhcmF0aW9uLnR5cGUgXSggbm9kZS5kZWNsYXJhdGlvbiwgc3RhdGUgKVxuXHRcdGNvZGUucHVzaCggJzsnIClcblx0fSxcblx0RXhwb3J0TmFtZWREZWNsYXJhdGlvbjogZnVuY3Rpb24oIG5vZGUsIHN0YXRlICkge1xuXHRcdGNvbnN0IHsgY29kZSB9ID0gc3RhdGVcblx0XHRjb2RlLnB1c2goICdleHBvcnQgJyApXG5cdFx0aWYgKCBub2RlLmRlY2xhcmF0aW9uICkge1xuXHRcdFx0dmlzaXRvcnNbIG5vZGUuZGVjbGFyYXRpb24udHlwZSBdKCBub2RlLmRlY2xhcmF0aW9uLCBzdGF0ZSApXG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvZGUucHVzaCggJ3snIClcblx0XHRcdGNvbnN0IHsgc3BlY2lmaWVycyB9ID0gbm9kZVxuXHRcdFx0Y29uc3QgeyBsZW5ndGggfSA9IHNwZWNpZmllcnNcblx0XHRcdGlmICggbGVuZ3RoID4gMCApIHtcblx0XHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdGxldCBzcGVjaWZpZXIgPSBzcGVjaWZpZXJzW2ldXG5cdFx0XHRcdFx0bGV0IHtuYW1lfSA9IHNwZWNpZmllci5sb2NhbFxuXHRcdFx0XHRcdGNvZGUucHVzaCggbmFtZSApXG5cdFx0XHRcdFx0aWYgKCBuYW1lICE9PSBzcGVjaWZpZXIuZXhwb3J0ZWQubmFtZSApIHtcblx0XHRcdFx0XHRcdGNvZGUucHVzaCggJyBhcyAnICsgc3BlY2lmaWVyLmV4cG9ydGVkLm5hbWUgKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRjb2RlLnB1c2goICcsICcgKVxuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIFJlbW92ZSB0cmFpbGluZyBjb21tYVxuXHRcdFx0XHRjb2RlLnBvcCgpXG5cdFx0XHR9XG5cdFx0XHRjb2RlLnB1c2goICd9JyApXG5cdFx0XHRpZiAoIG5vZGUuc291cmNlICkge1xuXHRcdFx0XHRjb2RlLnB1c2goICcgZnJvbSAnLCBub2RlLnNvdXJjZS5yYXcgKVxuXHRcdFx0fVxuXHRcdFx0Y29kZS5wdXNoKCAnOycgKVxuXHRcdH1cblx0fSxcblx0RXhwb3J0QWxsRGVjbGFyYXRpb246IGZ1bmN0aW9uKCBub2RlLCBzdGF0ZSApIHtcblx0XHRzdGF0ZS5jb2RlLnB1c2goICdleHBvcnQgKiBmcm9tICcsIG5vZGUuc291cmNlLnJhdywgJzsnIClcblx0fSxcblx0TWV0aG9kRGVmaW5pdGlvbjogZnVuY3Rpb24oIG5vZGUsIHN0YXRlICkge1xuXHRcdGNvbnN0IHsgY29kZSB9ID0gc3RhdGVcblx0XHRpZiAoIG5vZGUuc3RhdGljIClcblx0XHRcdGNvZGUucHVzaCggJ3N0YXRpYyAnIClcblx0XHRzd2l0Y2ggKG5vZGUua2luZCkge1xuXHRcdFx0Y2FzZSAnZ2V0Jzpcblx0XHRcdGNhc2UgJ3NldCc6XG5cdFx0XHRcdGNvZGUucHVzaCggbm9kZS5raW5kLCAnICcgKVxuXHRcdFx0XHRicmVha1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0YnJlYWtcblx0XHR9XG5cdFx0aWYgKCBub2RlLmNvbXB1dGVkICkge1xuXHRcdFx0Y29kZS5wdXNoKCAnWycgKVxuXHRcdFx0dmlzaXRvcnNbIG5vZGUua2V5LnR5cGUgXSggbm9kZS5rZXksIHN0YXRlIClcblx0XHRcdGNvZGUucHVzaCggJ10nIClcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29kZS5wdXNoKCBub2RlLmtleS5uYW1lIClcblx0XHR9XG5cdFx0Zm9ybWF0UGFyYW1ldGVycyggY29kZSwgbm9kZS52YWx1ZS5wYXJhbXMsIHN0YXRlIClcblx0XHR2aXNpdG9yc1sgbm9kZS52YWx1ZS5ib2R5LnR5cGUgXSggbm9kZS52YWx1ZS5ib2R5LCBzdGF0ZSApXG5cdH0sXG5cdENsYXNzRXhwcmVzc2lvbjogZnVuY3Rpb24oIG5vZGUsIHN0YXRlICkge1xuXHRcdHZpc2l0b3JzLkNsYXNzRGVjbGFyYXRpb24oIG5vZGUsIHN0YXRlIClcblx0fSxcblx0QXJyb3dGdW5jdGlvbkV4cHJlc3Npb246IGZ1bmN0aW9uKCBub2RlLCBzdGF0ZSApIHtcblx0XHRjb25zdCB7IGNvZGUgfSA9IHN0YXRlXG5cdFx0Zm9ybWF0UGFyYW1ldGVycyggY29kZSwgbm9kZS5wYXJhbXMsIHN0YXRlIClcblx0XHRjb2RlLnB1c2goICc9PiAnIClcblx0XHRpZiAoIG5vZGUuYm9keS50eXBlID09PSAnT2JqZWN0RXhwcmVzc2lvbicpIHtcblx0XHRcdGNvZGUucHVzaCggJygnIClcblx0XHRcdHZpc2l0b3JzLk9iamVjdEV4cHJlc3Npb24oIG5vZGUuYm9keSwgc3RhdGUgKVx0XG5cdFx0XHRjb2RlLnB1c2goICcpJyApXG5cdFx0fSBlbHNlXG5cdFx0XHR2aXNpdG9yc1sgbm9kZS5ib2R5LnR5cGUgXSggbm9kZS5ib2R5LCBzdGF0ZSApXG5cdH0sXG5cdFRoaXNFeHByZXNzaW9uOiBmdW5jdGlvbiggbm9kZSwgc3RhdGUgKSB7XG5cdFx0c3RhdGUuY29kZS5wdXNoKCAndGhpcycgKVxuXHR9LFxuXHRTdXBlcjogZnVuY3Rpb24oIG5vZGUsIHN0YXRlICkge1xuXHRcdHN0YXRlLmNvZGUucHVzaCggJ3N1cGVyJyApXG5cdH0sXG5cdFJlc3RFbGVtZW50OiBSZXN0RWxlbWVudCA9IGZ1bmN0aW9uKCBub2RlLCBzdGF0ZSApIHtcblx0XHRzdGF0ZS5jb2RlLnB1c2goICcuLi4nIClcblx0XHR2aXNpdG9yc1sgbm9kZS5hcmd1bWVudC50eXBlIF0oIG5vZGUuYXJndW1lbnQsIHN0YXRlIClcblx0fSxcblx0U3ByZWFkRWxlbWVudDogUmVzdEVsZW1lbnQsXG5cdFlpZWxkRXhwcmVzc2lvbjogZnVuY3Rpb24oIG5vZGUsIHN0YXRlICkge1xuXHRcdGNvbnN0IHsgY29kZSB9ID0gc3RhdGVcblx0XHRjb2RlLnB1c2goICd5aWVsZCcgKVxuXHRcdGlmICggbm9kZS5hcmd1bWVudCApIHtcblx0XHRcdGNvZGUucHVzaCggJyAnIClcblx0XHRcdHZpc2l0b3JzWyBub2RlLmFyZ3VtZW50LnR5cGUgXSggbm9kZS5hcmd1bWVudCwgc3RhdGUgKVxuXHRcdH1cblx0fSxcblx0VGVtcGxhdGVMaXRlcmFsOiBmdW5jdGlvbiggbm9kZSwgc3RhdGUgKSB7XG5cdFx0Y29uc3QgeyBjb2RlIH0gPSBzdGF0ZVxuXHRcdGNvbnN0IHtxdWFzaXMsIGV4cHJlc3Npb25zfSA9IG5vZGVcblx0XHRjb2RlLnB1c2goICdgJyApXG5cdFx0Zm9yIChsZXQgaSA9IDAsIHsgbGVuZ3RoIH0gPSBleHByZXNzaW9uczsgaSA8IGxlbmd0aDsgaSsrKSB7XG5cdFx0XHRsZXQgZXhwcmVzc2lvbiA9IGV4cHJlc3Npb25zWyBpIF1cblx0XHRcdGNvZGUucHVzaCggcXVhc2lzW2ldLnZhbHVlLnJhdyApXG5cdFx0XHRjb2RlLnB1c2goICckeycgKVxuXHRcdFx0dmlzaXRvcnNbIGV4cHJlc3Npb24udHlwZSBdKCBleHByZXNzaW9uLCBzdGF0ZSApXG5cdFx0XHRjb2RlLnB1c2goICd9JyApXG5cdFx0fVxuXHRcdGNvZGUucHVzaCggcXVhc2lzW3F1YXNpcy5sZW5ndGgtMV0udmFsdWUucmF3IClcblx0XHRjb2RlLnB1c2goICdgJyApXG5cdH0sXG5cdFRhZ2dlZFRlbXBsYXRlRXhwcmVzc2lvbjogZnVuY3Rpb24oIG5vZGUsIHN0YXRlICkge1xuXHRcdHZpc2l0b3JzWyBub2RlLnRhZy50eXBlIF0oIG5vZGUudGFnLCBzdGF0ZSApXG5cdFx0dmlzaXRvcnNbIG5vZGUucXVhc2kudHlwZSBdKCBub2RlLnF1YXNpLCBzdGF0ZSApXG5cdH0sXG5cdEFycmF5RXhwcmVzc2lvbjogQXJyYXlFeHByZXNzaW9uID0gZnVuY3Rpb24oIG5vZGUsIHN0YXRlICkge1xuXHRcdGNvbnN0IHsgY29kZSB9ID0gc3RhdGVcblx0XHRjb2RlLnB1c2goICdbJyApXG5cdFx0aWYgKCBub2RlLmVsZW1lbnRzLmxlbmd0aCAhPT0gMCApIHtcblx0XHRcdGZvciAobGV0IGkgPSAwLCB7ZWxlbWVudHN9ID0gbm9kZSwgeyBsZW5ndGggfSA9IGVsZW1lbnRzOyBpIDwgbGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0bGV0IGVsZW1lbnQgPSBlbGVtZW50c1sgaSBdXG5cdFx0XHRcdHZpc2l0b3JzWyBlbGVtZW50LnR5cGUgXSggZWxlbWVudCwgc3RhdGUgKVxuXHRcdFx0XHRjb2RlLnB1c2goICcsICcgKVxuXHRcdFx0fVxuXHRcdFx0Y29kZS5wb3AoKVxuXHRcdH1cblx0XHRjb2RlLnB1c2goICddJyApXG5cdH0sXG5cdEFycmF5UGF0dGVybjogQXJyYXlFeHByZXNzaW9uLFxuXHRPYmplY3RFeHByZXNzaW9uOiBmdW5jdGlvbiggbm9kZSwgc3RhdGUgKSB7XG5cdFx0Y29uc3QgaW5kZW50ID0gc3RhdGUuaW5kZW50LnJlcGVhdCggc3RhdGUuaW5kZW50TGV2ZWwrKyApXG5cdFx0Y29uc3QgeyBsaW5lRW5kLCBjb2RlIH0gPSBzdGF0ZVxuXHRcdGNvbnN0IHByb3BlcnR5SW5kZW50ID0gaW5kZW50ICsgc3RhdGUuaW5kZW50XG5cdFx0Y29kZS5wdXNoKCAneycgKVxuXHRcdGlmICggbm9kZS5wcm9wZXJ0aWVzLmxlbmd0aCAhPT0gMCApIHtcblx0XHRcdGNvbnN0IGNvbW1hID0gJywnICsgbGluZUVuZFxuXHRcdFx0Y29kZS5wdXNoKCBsaW5lRW5kIClcblx0XHRcdGZvciAoIGxldCBpID0gMCwgeyBwcm9wZXJ0aWVzIH0gPSBub2RlLCB7IGxlbmd0aCB9ID0gcHJvcGVydGllczsgaSA8IGxlbmd0aDsgaSsrICkge1xuXHRcdFx0XHRsZXQgcHJvcGVydHkgPSBwcm9wZXJ0aWVzWyBpIF1cblx0XHRcdFx0Y29kZS5wdXNoKCBwcm9wZXJ0eUluZGVudCApXG5cdFx0XHRcdGlmICggcHJvcGVydHkuY29tcHV0ZWQgKSBjb2RlLnB1c2goICdbJyApXG5cdFx0XHRcdHZpc2l0b3JzWyBwcm9wZXJ0eS5rZXkudHlwZSBdKCBwcm9wZXJ0eS5rZXksIHN0YXRlIClcblx0XHRcdFx0aWYgKCBwcm9wZXJ0eS5jb21wdXRlZCApIGNvZGUucHVzaCggJ10nIClcblx0XHRcdFx0aWYgKCAhcHJvcGVydHkuc2hvcnRoYW5kICkge1xuXHRcdFx0XHRcdGNvZGUucHVzaCggJzogJyApXG5cdFx0XHRcdFx0dmlzaXRvcnNbIHByb3BlcnR5LnZhbHVlLnR5cGUgXSggcHJvcGVydHkudmFsdWUsIHN0YXRlIClcblx0XHRcdFx0XHRjb2RlLnB1c2goIGNvbW1hIClcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0Y29kZS5wb3AoKVxuXHRcdFx0Y29kZS5wdXNoKCBsaW5lRW5kIClcblx0XHR9XG5cdFx0c3RhdGUuaW5kZW50TGV2ZWwtLVxuXHRcdGNvZGUucHVzaCggaW5kZW50LCAnfScgKVxuXHR9LFxuXHRPYmplY3RQYXR0ZXJuOiBmdW5jdGlvbiggbm9kZSwgc3RhdGUgKSB7XG5cdFx0Y29uc3QgeyBjb2RlIH0gPSBzdGF0ZVxuXHRcdGNvZGUucHVzaCggJ3snIClcblx0XHRpZiAoIG5vZGUucHJvcGVydGllcy5sZW5ndGggIT09IDAgKSB7XG5cdFx0XHRmb3IgKCBsZXQgaSA9IDAsIHsgcHJvcGVydGllcyB9ID0gbm9kZSwgeyBsZW5ndGggfSA9IHByb3BlcnRpZXM7IGkgPCBsZW5ndGg7IGkrKyApIHtcblx0XHRcdFx0bGV0IHByb3BlcnR5ID0gcHJvcGVydGllc1sgaSBdXG5cdFx0XHRcdGlmICggcHJvcGVydHkuY29tcHV0ZWQgKSB7XG5cdFx0XHRcdFx0Y29kZS5wdXNoKCAnWycgKVxuXHRcdFx0XHRcdHZpc2l0b3JzWyBwcm9wZXJ0eS5rZXkudHlwZSBdKCBwcm9wZXJ0eS5rZXksIHN0YXRlIClcblx0XHRcdFx0XHRjb2RlLnB1c2goICddJyApXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dmlzaXRvcnNbIHByb3BlcnR5LmtleS50eXBlIF0oIHByb3BlcnR5LmtleSwgc3RhdGUgKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICggIXByb3BlcnR5LnNob3J0aGFuZCApIHtcblx0XHRcdFx0XHRjb2RlLnB1c2goICc6ICcgKVxuXHRcdFx0XHRcdHZpc2l0b3JzWyBwcm9wZXJ0eS52YWx1ZS50eXBlIF0oIHByb3BlcnR5LnZhbHVlLCBzdGF0ZSApXG5cdFx0XHRcdH1cblx0XHRcdFx0Y29kZS5wdXNoKCAnLCAnIClcblx0XHRcdH1cblx0XHRcdC8vIFJlbW92aW5nIHRyYWlsaW5nIGNvbW1hXG5cdFx0XHRjb2RlLnBvcCgpXG5cdFx0fVxuXHRcdGNvZGUucHVzaCggJ30nIClcblx0fSxcblx0RnVuY3Rpb25FeHByZXNzaW9uOiBGdW5jdGlvbkRlY2xhcmF0aW9uLFxuXHRTZXF1ZW5jZUV4cHJlc3Npb246IGZ1bmN0aW9uKCBub2RlLCBzdGF0ZSApIHtcblx0XHRjb25zdCB7IGNvZGUgfSA9IHN0YXRlXG5cdFx0Y29uc3Qge2V4cHJlc3Npb25zfSA9IG5vZGVcblx0XHRpZiAoIGV4cHJlc3Npb25zLmxlbmd0aCAhPT0gMCApIHtcblx0XHRcdGZvciAobGV0IGkgPSAwLCB7IGxlbmd0aCB9ID0gZXhwcmVzc2lvbnM7IGkgPCBsZW5ndGg7IGkrKykge1xuXHRcdFx0XHRsZXQgZXhwcmVzc2lvbiA9IGV4cHJlc3Npb25zWyBpIF1cblx0XHRcdFx0dmlzaXRvcnNbIGV4cHJlc3Npb24udHlwZSBdKCBleHByZXNzaW9uLCBzdGF0ZSApXG5cdFx0XHRcdGNvZGUucHVzaCggJywgJyApXG5cdFx0XHR9XG5cdFx0XHRjb2RlLnBvcCgpXG5cdFx0fVxuXHR9LFxuXHRVbmFyeUV4cHJlc3Npb246IGZ1bmN0aW9uKCBub2RlLCBzdGF0ZSApIHtcblx0XHRpZiAoIG5vZGUucHJlZml4ICkge1xuXHRcdFx0c3RhdGUuY29kZS5wdXNoKCBub2RlLm9wZXJhdG9yLCAnICcgKVxuXHRcdFx0dmlzaXRvcnNbIG5vZGUuYXJndW1lbnQudHlwZSBdKCBub2RlLmFyZ3VtZW50LCBzdGF0ZSApXG5cdFx0fSBlbHNlIHtcblx0XHRcdHZpc2l0b3JzWyBub2RlLmFyZ3VtZW50LnR5cGUgXSggbm9kZS5hcmd1bWVudCwgc3RhdGUgKVxuXHRcdFx0c3RhdGUuY29kZS5wdXNoKCBub2RlLm9wZXJhdG9yIClcblx0XHR9XG5cdH0sXG5cdFVwZGF0ZUV4cHJlc3Npb246IGZ1bmN0aW9uKCBub2RlLCBzdGF0ZSApIHtcblx0XHRpZiAoIG5vZGUucHJlZml4ICkge1xuXHRcdFx0c3RhdGUuY29kZS5wdXNoKCBub2RlLm9wZXJhdG9yIClcblx0XHRcdHZpc2l0b3JzWyBub2RlLmFyZ3VtZW50LnR5cGUgXSggbm9kZS5hcmd1bWVudCwgc3RhdGUgKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR2aXNpdG9yc1sgbm9kZS5hcmd1bWVudC50eXBlIF0oIG5vZGUuYXJndW1lbnQsIHN0YXRlIClcblx0XHRcdHN0YXRlLmNvZGUucHVzaCggbm9kZS5vcGVyYXRvciApXHRcblx0XHR9XG5cdH0sXG5cdEFzc2lnbm1lbnRFeHByZXNzaW9uOiBmdW5jdGlvbiggbm9kZSwgc3RhdGUgKSB7XG5cdFx0dmlzaXRvcnNbIG5vZGUubGVmdC50eXBlIF0oIG5vZGUubGVmdCwgc3RhdGUgKVxuXHRcdHN0YXRlLmNvZGUucHVzaCggJyAnLCBub2RlLm9wZXJhdG9yLCAnICcgKVxuXHRcdHZpc2l0b3JzWyBub2RlLnJpZ2h0LnR5cGUgXSggbm9kZS5yaWdodCwgc3RhdGUgKVxuXHR9LFxuXHRBc3NpZ25tZW50UGF0dGVybjogZnVuY3Rpb24oIG5vZGUsIHN0YXRlICkge1xuXHRcdHZpc2l0b3JzWyBub2RlLmxlZnQudHlwZSBdKCBub2RlLmxlZnQsIHN0YXRlIClcblx0XHRzdGF0ZS5jb2RlLnB1c2goICcgPSAnIClcblx0XHR2aXNpdG9yc1sgbm9kZS5yaWdodC50eXBlIF0oIG5vZGUucmlnaHQsIHN0YXRlIClcblx0fSxcblx0QmluYXJ5RXhwcmVzc2lvbjogQmluYXJ5RXhwcmVzc2lvbiA9IGZ1bmN0aW9uKCBub2RlLCBzdGF0ZSApIHtcblx0XHRjb25zdCB7IGNvZGUgfSA9IHN0YXRlXG5cdFx0Y29uc3QgeyBvcGVyYXRvciB9ID0gbm9kZVxuXHRcdGZvcm1hdEJpbmFyeVNpZGVFeHByZXNzaW9uKCBjb2RlLCBub2RlLmxlZnQsIG9wZXJhdG9yLCBzdGF0ZSApXG5cdFx0Y29kZS5wdXNoKCAnICcsIG5vZGUub3BlcmF0b3IsICcgJyApXG5cdFx0Zm9ybWF0QmluYXJ5U2lkZUV4cHJlc3Npb24oIGNvZGUsIG5vZGUucmlnaHQsIG9wZXJhdG9yLCBzdGF0ZSApXG5cdH0sXG5cdExvZ2ljYWxFeHByZXNzaW9uOiBCaW5hcnlFeHByZXNzaW9uLFxuXHRDb25kaXRpb25hbEV4cHJlc3Npb246IGZ1bmN0aW9uKCBub2RlLCBzdGF0ZSApIHtcblx0XHRjb25zdCB7IGNvZGUgfSA9IHN0YXRlXG5cdFx0dmlzaXRvcnNbIG5vZGUudGVzdC50eXBlIF0oIG5vZGUudGVzdCwgc3RhdGUgKVxuXHRcdGNvZGUucHVzaCggJyA/ICcgKVxuXHRcdHZpc2l0b3JzWyBub2RlLmNvbnNlcXVlbnQudHlwZSBdKCBub2RlLmNvbnNlcXVlbnQsIHN0YXRlIClcblx0XHRjb2RlLnB1c2goICcgOiAnIClcblx0XHR2aXNpdG9yc1sgbm9kZS5hbHRlcm5hdGUudHlwZSBdKCBub2RlLmFsdGVybmF0ZSwgc3RhdGUgKVxuXHR9LFxuXHROZXdFeHByZXNzaW9uOiBmdW5jdGlvbiggbm9kZSwgc3RhdGUgKSB7XG5cdFx0c3RhdGUuY29kZS5wdXNoKCAnbmV3ICcgKVxuXHRcdHZpc2l0b3JzLkNhbGxFeHByZXNzaW9uKCBub2RlLCBzdGF0ZSApXG5cdH0sXG5cdENhbGxFeHByZXNzaW9uOiBmdW5jdGlvbiggbm9kZSwgc3RhdGUgKSB7XG5cdFx0Y29uc3QgeyBjb2RlIH0gPSBzdGF0ZVxuXHRcdHN3aXRjaCAoIG5vZGUuY2FsbGVlLnR5cGUgKSB7XG5cdFx0XHRjYXNlICdJZGVudGlmaWVyJzpcblx0XHRcdGNhc2UgJ0xpdGVyYWwnOlxuXHRcdFx0Y2FzZSAnTWVtYmVyRXhwcmVzc2lvbic6XG5cdFx0XHRjYXNlICdDYWxsRXhwcmVzc2lvbic6XG5cdFx0XHRcdHZpc2l0b3JzWyBub2RlLmNhbGxlZS50eXBlIF0oIG5vZGUuY2FsbGVlLCBzdGF0ZSApXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRjb2RlLnB1c2goICcoJyApXG5cdFx0XHRcdHZpc2l0b3JzWyBub2RlLmNhbGxlZS50eXBlIF0oIG5vZGUuY2FsbGVlLCBzdGF0ZSApXG5cdFx0XHRcdGNvZGUucHVzaCggJyknIClcblx0XHR9XG5cdFx0Y29kZS5wdXNoKCAnKCcgKVxuXHRcdGNvbnN0IGFyZ3MgPSBub2RlWyAnYXJndW1lbnRzJyBdXG5cdFx0aWYgKCBhcmdzLmxlbmd0aCAhPT0gMCApIHtcblx0XHRcdGZvciAobGV0IGkgPSAwLCB7IGxlbmd0aCB9ID0gYXJnczsgaSA8IGxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGxldCBhcmcgPSBhcmdzWyBpIF1cblx0XHRcdFx0dmlzaXRvcnNbIGFyZy50eXBlIF0oIGFyZywgc3RhdGUgKVxuXHRcdFx0XHRjb2RlLnB1c2goICcsICcgKVxuXHRcdFx0fVxuXHRcdFx0Y29kZS5wb3AoKVxuXHRcdH1cblx0XHRjb2RlLnB1c2goICcpJyApXG5cdH0sXG5cdE1lbWJlckV4cHJlc3Npb246IGZ1bmN0aW9uKCBub2RlLCBzdGF0ZSApIHtcblx0XHRjb25zdCB7IGNvZGUgfSA9IHN0YXRlXG5cdFx0dmlzaXRvcnNbIG5vZGUub2JqZWN0LnR5cGUgXSggbm9kZS5vYmplY3QsIHN0YXRlIClcblx0XHRpZiAoIG5vZGUuY29tcHV0ZWQgKSB7XG5cdFx0XHRjb2RlLnB1c2goICdbJyApXG5cdFx0XHR2aXNpdG9yc1sgbm9kZS5wcm9wZXJ0eS50eXBlIF0oIG5vZGUucHJvcGVydHksIHN0YXRlIClcblx0XHRcdGNvZGUucHVzaCggJ10nIClcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29kZS5wdXNoKCAnLicgKVxuXHRcdFx0dmlzaXRvcnNbIG5vZGUucHJvcGVydHkudHlwZSBdKCBub2RlLnByb3BlcnR5LCBzdGF0ZSApXG5cdFx0fVxuXHR9LFxuXHRJZGVudGlmaWVyOiBmdW5jdGlvbiggbm9kZSwgc3RhdGUgKSB7XG5cdFx0c3RhdGUuY29kZS5wdXNoKCBub2RlLm5hbWUgKVxuXHR9LFxuXHRMaXRlcmFsOiBmdW5jdGlvbiggbm9kZSwgc3RhdGUgKSB7XG5cdFx0c3RhdGUuY29kZS5wdXNoKCBub2RlLnJhdyApXG5cdH1cbn07XG5cblxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiggbm9kZSwgb3B0aW9ucyApIHtcblx0Lypcblx0UmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHJlbmRlcmVkIGNvZGUgb2YgdGhlIHByb3ZpZGVkIEFTVCBgbm9kZWAuXG5cdFRoZSBgb3B0aW9uc2AgYXJlOlxuXG5cdC0gYGluZGVudGA6IHN0cmluZyB0byB1c2UgZm9yIGluZGVudGF0aW9uIChkZWZhdWx0cyB0byBgXFx0YClcblx0LSBgbGluZUVuZGA6IHN0cmluZyB0byB1c2UgZm9yIGxpbmUgZW5kaW5ncyAoZGVmYXVsdHMgdG8gYFxcbmApXG5cdC0gYHN0YXJ0aW5nSW5kZW50TGV2ZWxgOiBpbmRlbnQgbGV2ZWwgdG8gc3RhcnQgZnJvbSAoZGVmYXVsdCB0byBgMGApXG5cdCovXG5cdHZhciBzdGF0ZSA9IChvcHRpb25zID09IG51bGwpID8ge1xuXHRcdGNvZGU6IFtdLFxuXHRcdGluZGVudDogXCJcXHRcIixcblx0XHRsaW5lRW5kOiBcIlxcblwiLFxuXHRcdGluZGVudExldmVsOiAwXG5cdH0gOiB7XG5cdFx0Ly8gV2lsbCBjb250YWluIHRoZSByZXN1bHRpbmcgY29kZSBhcyBhbiBhcnJheSBvZiBjb2RlIHN0cmluZ3Ncblx0XHRjb2RlOiBbXSxcblx0XHQvLyBGb3JtYXRpbmcgb3B0aW9uc1xuXHRcdGluZGVudDogb3B0aW9ucy5pbmRlbnQgIT0gbnVsbCA/IG9wdGlvbnMuaW5kZW50IDogXCJcXHRcIixcblx0XHRsaW5lRW5kOiBvcHRpb25zLmxpbmVFbmQgIT0gbnVsbCA/IG9wdGlvbnMubGluZUVuZCA6IFwiXFxuXCIsXG5cdFx0aW5kZW50TGV2ZWw6IG9wdGlvbnMuc3RhcnRpbmdJbmRlbnRMZXZlbCAhPSBudWxsID8gb3B0aW9ucy5zdGFydGluZ0luZGVudExldmVsIDogMFxuXHR9O1xuXHQvLyBXYWxrIHRocm91Z2ggdGhlIEFTVCBub2RlIGFuZCBnZW5lcmF0ZSB0aGUgY29kZVxuXHR2aXNpdG9yc1sgbm9kZS50eXBlIF0oIG5vZGUsIHN0YXRlIClcblx0cmV0dXJuIHN0YXRlLmNvZGUuam9pbiggJycgKVxufVxuXG5cbiJdfQ==
