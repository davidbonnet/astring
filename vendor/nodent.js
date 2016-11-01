'use strict';

// This module is derived from Astring by David Bonnet (see below), but heavily
// modified to support source-maps & es7 as specified in
// https://github.com/estree/estree/blob/master/experimental/async-functions.md
// --------------------
// Astring is a tiny and fast JavaScript code generator from an ESTree-compliant AST.
//
// Astring was written by David Bonnet and released under an MIT license.
//
// The Git repository for Astring is available at:
// https://github.com/davidbonnet/astring.git
//
// Please use the GitHub bug tracker to report issues:
// https://github.com/davidbonnet/astring/issues

var SourceMapGenerator = require('source-map').SourceMapGenerator;
var ForInStatement, RestElement, BinaryExpression, ArrayExpression, BlockStatement;

var repeat ;
if ("".repeat) {
    repeat = function(str,count){
        return count && str ? str.repeat(count):"" ;
    } ;
} else {
    var cache = {} ;
    repeat = function(str,count) {
        if (!count || !str) return "" ;
        var k = ""+str+count ;
        if (!cache[k]) {
            var out = [];
            while (count--) {
                out.push(str);
            }
            cache[k] = out.join('');
        }
        return cache[k] ;
    }
}

var OPERATORS_PRECEDENCE = {
    'ExpressionStatement': -1, //  Use to parenthesize FunctionExpressions as statements
    'Identifier': 21,
    'Literal': 21,
    'BooleanLiteral':21,
    'RegExpLiteral':21,
    'NumericLiteral':21,
    'StringLiteral':21,
    'NullLiteral':21,
    'ThisExpression': 21,
    'SuperExpression': 21,
    'ObjectExpression': 21,
    'ClassExpression': 21,
    //      '(_)':20,   // Parens
    'MemberExpression': 19,
    //      'new()':19,
    'CallExpression': 18,
    'NewExpression': 18,
    'ArrayExpression': 17.5,
    'FunctionExpression': 17.5,
    'FunctionDeclaration': 17.5,
    'ArrowFunctionExpression': 17.5,
    'UpdateExpression++': 17, //  Postfix is 17, prefix is 16
    'UpdateExpression--': 17, //  Postfix is 17, prefix is 16
    'UpdateExpression++prefix': 16, //  Postfix is 17, prefix is 16
    'UpdateExpression--prefix': 16, //  Postfix is 17, prefix is 16
    'UnaryExpression':16, // ! ~ + - typeof void delete
    'AwaitExpression': 16,
    'BinaryExpression**': 15,
    'BinaryExpression*': 15,
    'BinaryExpression/': 15,
    'BinaryExpression%': 15,
    'BinaryExpression+': 14,
    'BinaryExpression-': 14,
    'BinaryExpression<<': 13,
    'BinaryExpression>>': 13,
    'BinaryExpression>>>': 13,
    'BinaryExpression<': 12,
    'BinaryExpression<=': 12,
    'BinaryExpression>': 12,
    'BinaryExpression>=': 12,
    'BinaryExpressionin': 12,
    'BinaryExpressioninstanceof': 12,
    'BinaryExpression==': 11,
    'BinaryExpression===': 11,
    'BinaryExpression!=': 11,
    'BinaryExpression!==': 11,
    'BinaryExpression&': 10,
    'BinaryExpression^': 9,
    'BinaryExpression|': 8,
    'LogicalExpression&&': 7,
    'LogicalExpression||': 6,
    'ConditionalExpression': 5,
    'AssignmentPattern': 4,
    'AssignmentExpression': 4,
    'yield': 3,
    'YieldExpression': 3,
    'SpreadElement': 2,
    'comma-separated-list':1.5,
    'SequenceExpression': 1
};

var CommaList = {type:'comma-separated-list'} ;

function precedence(node) {
    var p = OPERATORS_PRECEDENCE[node.type] || OPERATORS_PRECEDENCE[node.type+node.operator]  || OPERATORS_PRECEDENCE[node.type+node.operator+(node.prefix?"prefix":"")];
    if (p !== undefined)
        return p;
    //console.log("Precedence?",node.type,node.operator) ;
    return 20;
}

function out(node,state,type) {
    var f = this[type || node.type] ;
    if (f) {
/*
        try {
            var attr = Object.keys(node).filter(k=>k[0]==='$').map(k=>k+(node[k]?"+":"-")) ;
            if (attr.length) 
                state.write(node,"/*"+attr.join(", ")+"\u002A/ ") ;
        } catch (ex) {} ;
*/        
        f.call(this, node, state);
    } else {
        // Unknown node type - just spew its source
        state.write(node,"/*"+node.type+"?*/ "+state.sourceAt(node.start,node.end)) ;
    }
}
function expr(state, parent, node, assoc) {
    if (assoc===2 ||
            precedence(node) < precedence(parent) ||
            (precedence(node) == precedence(parent) && (assoc || parent.right === node))) {
        state.write(null, '(');
        this.out(node, state,node.type);
        state.write(null, ')');
    } else {
        this.out(node, state,node.type);
    }
}
function formatParameters(params, state) {
    var param;
    state.write(null, '(');
    if (params != null && params.length > 0) {
        this.out(params[0], state,params[0].type);
        for (var i = 1, length = params.length; i < length; i++) {
            param = params[i];
            state.write(param, ', ');
            this.out(param, state,param.type);
        }
    }
    state.write(null, ') ');
}
var traveler = {
    out: out,
    expr: expr,
    formatParameters: formatParameters,
    Program: function (node, state) {
        var statements, statement;
        var indent = repeat(state.indent, state.indentLevel);
        var lineEnd = state.lineEnd;
        statements = node.body;
        for (var i = 0, length = statements.length; i < length; i++) {
            statement = statements[i];
            state.write(null, indent);
            this.out(statement, state,statement.type);
            state.write(null, lineEnd);
        }
    },
    BlockStatement: BlockStatement = function (node, state) {
        var statements, statement;
        var indent = repeat(state.indent, state.indentLevel++);
        var lineEnd = state.lineEnd;
        var statementIndent = indent + state.indent;
        state.write(node, '{');
        statements = node.body;
        if (statements != null && statements.length > 0) {
            state.write(null, lineEnd);
            for (var i = 0, length = statements.length; i < length; i++) {
                statement = statements[i];
                state.write(null, statementIndent);
                this.out(statement, state,statement.type);
                state.write(null, lineEnd);
            }
            state.write(null, indent);
        }
        state.write(node.loc ? {
            loc: {
                start: {
                    line: node.loc.end.line,
                    column: 0
                }
            }
        } : null, '}');
        state.indentLevel--;
    },
    ClassBody: BlockStatement,
    EmptyStatement: function (node, state) {
        state.write(node, ';');
    },
    ParenthesizedExpression: function (node, state) {
        this.expr(state, node, node.expression, 2);
    },
    ExpressionStatement: function (node, state) {
        if (node.expression.type === 'FunctionExpression' || node.expression.type === 'ObjectExpression') {
            state.write(null, '(');
            this.expr(state, node, node.expression);
            state.write(null, ')');
        } else {
            this.expr(state, node, node.expression);
        }
        state.write(null, ';');
    },
    IfStatement: function (node, state) {
        state.write(node, 'if (');
        this.out(node.test, state,node.test.type);
        state.write(null, ') ');
        if (node.consequent.type !== 'BlockStatement')
            state.write(null, state.lineEnd, repeat(state.indent, state.indentLevel + 1));
        this.out(node.consequent, state,node.consequent.type);
        if (node.alternate != null) {
            if (node.consequent.type !== 'BlockStatement')
                state.write(null, state.lineEnd, repeat(state.indent, state.indentLevel));
            state.write(null, ' else ');
            if (node.alternate.type !== 'BlockStatement' && node.alternate.type !== 'IfStatement')
                state.write(null, state.lineEnd, repeat(state.indent, state.indentLevel + 1));
            this.out(node.alternate, state,node.alternate.type);
        }
    },
    LabeledStatement: function (node, state) {
        this.out(node.label, state,node.label.type);
        state.write(null, ':');
        this.out(node.body, state,node.body.type);
    },
    BreakStatement: function (node, state) {
        state.write(node, 'break');
        if (node.label) {
            state.write(null, ' ');
            this.out(node.label, state,node.label.type);
        }
        state.write(null, ';');
    },
    ContinueStatement: function (node, state) {
        state.write(node, 'continue');
        if (node.label) {
            state.write(null, ' ');
            this.out(node.label, state,node.label.type);
        }
        state.write(null, ';');
    },
    WithStatement: function (node, state) {
        state.write(node, 'with (');
        this.out(node.object, state,node.object.type);
        state.write(null, ') ');
        this.out(node.body, state,node.body.type);
    },
    SwitchStatement: function (node, state) {
        var occurence, consequent, statement;
        var indent = repeat(state.indent, state.indentLevel++);
        var lineEnd = state.lineEnd;
        state.indentLevel++;
        var caseIndent = indent + state.indent;
        var statementIndent = caseIndent + state.indent;
        state.write(node, 'switch (');
        this.out(node.discriminant, state,node.discriminant.type);
        state.write(null, ') {', lineEnd);
        var occurences = node.cases;
        for (var i = 0; i < occurences.length; i++) {
            occurence = occurences[i];
            if (occurence.test) {
                state.write(occurence, caseIndent, 'case ');
                this.out(occurence.test, state,occurence.test.type);
                state.write(null, ':', lineEnd);
            } else {
                state.write(occurence, caseIndent, 'default:', lineEnd);
            }
            consequent = occurence.consequent;
            for (var j = 0; j < consequent.length; j++) {
                statement = consequent[j];
                state.write(null, statementIndent);
                this.out(statement, state,statement.type);
                state.write(null, lineEnd);
            }
        }
        state.indentLevel -= 2;
        state.write(null, indent, '}');
    },
    ReturnStatement: function (node, state) {
        if (node.async)
            state.write(node, ' async ');
        state.write(node, 'return');
        if (node.argument) {
            state.write(null, ' ');
            this.out(node.argument, state,node.argument.type);
        }
        state.write(null, ';');
    },
    ThrowStatement: function (node, state) {
        if (node.async)
            state.write(node, ' async ');
        state.write(node, 'throw ');
        this.out(node.argument, state,node.argument.type);
        state.write(null, ';');
    },
    TryStatement: function (node, state) {
        var handler;
        state.write(node, 'try ');
        this.out(node.block, state,node.block.type);
        if (node.handler) {
            this.out(node.handler, state, node.handler.type)
        }
        if (node.finalizer) {
            state.write(node.finalizer, ' finally ');
            this.out(node.finalizer, state,node.finalizer.type);
        }
    },
    CatchClause: function (node, state) {
        state.write(node, ' catch (');
        this.out(node.param, state, node.param.type);
        state.write(null, ') ');
        this.out(node.body, state, node.body.type);
    },
    WhileStatement: function (node, state) {
        state.write(node, 'while (');
        this.out(node.test, state,node.test.type);
        state.write(null, ') ');
        if (node.body.type !== 'BlockStatement')
            state.write(null, state.lineEnd, repeat(state.indent, state.indentLevel + 1));
        this.out(node.body, state,node.body.type);
    },
    DoWhileStatement: function (node, state) {
        state.write(node, 'do ');
        if (node.body.type !== 'BlockStatement')
            state.write(null, state.lineEnd, repeat(state.indent, state.indentLevel + 1));
        this.out(node.body, state,node.body.type);
        state.write(null, ' while (');
        this.out(node.test, state,node.test.type);
        state.write(null, ');');
    },
    ForStatement: function (node, state) {
        state.write(node, 'for (');
        if (node.init != null) {
            var init = node.init, type = init.type;
            state.inForInit++ ;
            this.out(init, state,type);
            state.inForInit-- ;
            if (type !== 'VariableDeclaration')
              state.write(null, '; ');
        } else {
          state.write(null, '; ');
        }
        if (node.test)
            this.out(node.test, state,node.test.type);
        state.write(null, '; ');
        if (node.update)
            this.out(node.update, state,node.update.type);
        state.write(null, ') ');
        if (node.body.type !== 'BlockStatement')
            state.write(null, state.lineEnd, repeat(state.indent, state.indentLevel + 1));
        this.out(node.body, state,node.body.type);
    },
    ForInStatement: ForInStatement = function (node, state) {
        state.write(node, 'for (');
        var left = node.left, type = left.type;
        state.inForInit++ ;
        this.out(left, state,type);
        if (type[0] === 'V' && type.length === 19) {
            state.back();
        }
        state.inForInit-- ;
        state.write(null, node.type[3] === 'I' ? ' in ' : ' of ');
        this.out(node.right, state,node.right.type);
        state.write(null, ') ');
        if (node.body.type !== 'BlockStatement')
            state.write(null, state.lineEnd, repeat(state.indent, state.indentLevel + 1));
        this.out(node.body, state,node.body.type);
    },
    ForOfStatement: ForInStatement,
    DebuggerStatement: function (node, state) {
        state.write(node, 'debugger;');
    },
    Function: function (node, state) {
        if (node.async)
            state.write(node, 'async ');
        state.write(node, node.generator ? 'function* ' : 'function ');
        if (node.id)
            state.write(node.id, node.id.name);
        this.formatParameters(node.params, state);
        this.out(node.body, state,node.body.type);
    },
    FunctionDeclaration: function (node, state) {
        this.Function(node, state);
        state.write(null, state.lineEnd, repeat(state.indent, state.indentLevel));
    },
    FunctionExpression: function (node, state) {
        this.Function(node, state);
    },
    VariableDeclaration: function (node, state) {
        var declarations = node.declarations;
        state.write(node, node.kind, ' ');
        var length = declarations.length;
        if (length > 0) {
            this.out(declarations[0], state,'VariableDeclarator');
            for (var i = 1; i < length; i++) {
                state.write(null, ', ');
                this.out(declarations[i], state,'VariableDeclarator');
            }
        }
        state.write(null, ';');
    },
    VariableDeclarator: function (node, state) {
        this.out(node.id, state,node.id.type);
        if (node.init != null) {
            state.write(null, ' = ');
            this.expr(state,CommaList,node.init) ;
        }
    },
    ClassDeclaration: function (node, state) {
        state.write(node, 'class ');
        if (node.id) {
            state.write(node.id, node.id.name + ' ');
        }
        if (node.superClass) {
            state.write(null, 'extends ');
            this.out(node.superClass, state,node.superClass.type);
            state.write(null, ' ');
        }
        this.out(node.body, state,'BlockStatement');
    },
    ImportSpecifier: function (node, state) {
        if (node.local.name == node.imported.name) {
            this.out(node.local, state,node.local.type);
        } else {
            this.out(node.imported, state,node.imported.type);
            state.write(null, ' as ');
            this.out(node.local, state,node.local.type);
        }
    },
    ImportDefaultSpecifier: function (node, state) {
        this.out(node.local, state,node.local.type);
    },
    ImportNamespaceSpecifier: function (node, state) {
        state.write(null, '* as ');
        this.out(node.local, state,node.local.type);
    },
    ImportDeclaration: function (node, state) {
        var i, specifier, name;
        state.write(node, 'import ');
        var specifiers = node.specifiers;
        var length = specifiers.length;
        var block = true;
        if (length > 0) {
            for (var i = 0; i < length; i++) {
                if (specifiers[i].type === 'ImportSpecifier' && block) {
                    block = false;
                    state.write(null, '{');
                }
                this.out(specifiers[i], state,specifiers[i].type);
                if (i < length - 1)
                    state.write(null, ', ');
            }
            if (specifiers[length - 1].type === 'ImportSpecifier')
                state.write(null, '}');
            state.write(null, ' from ');
        }
        state.write(node.source, node.source.raw);
        state.write(null, ';');
    },
    ExportDefaultDeclaration: function (node, state) {
        state.write(node, 'export default ');
        this.out(node.declaration, state,node.declaration.type);
    },
    ExportSpecifier: function (node, state) {
        if (node.local.name == node.exported.name) {
            this.out(node.local, state,node.local.type);
        } else {
            this.out(node.local, state,node.local.type);
            state.write(null, ' as ');
            this.out(node.exported, state,node.exported.type);
        }
    },
    ExportNamedDeclaration: function (node, state) {
        var specifier, name;
        state.write(node, 'export ');
        if (node.declaration) {
            this.out(node.declaration, state,node.declaration.type);
        } else {
            var specifiers = node.specifiers;
            state.write(node, '{');
            if (specifiers && specifiers.length > 0) {
                for (var i = 0; i < specifiers.length; i++) {
                    this.out(specifiers[i], state,specifiers[i].type);
                    if (i < specifiers.length - 1)
                        state.write(null, ', ');
                }
            }
            state.write(null, '}');
            if (node.source) {
                state.write(node.source, ' from ', node.source.raw);
            }
            state.write(null, ';');
        }
    },
    ExportAllDeclaration: function (node, state) {
        state.write(node, 'export * from ');
        state.write(node.source, node.source.raw, ';');
    },
    MethodDefinition: function (node, state) {
        if (node.value.async)
            state.write(node, 'async ');
        if (node.static)
            state.write(node, 'static ');
        switch (node.kind) {
            case 'get':
            case 'set':
                state.write(node, node.kind, ' ');
                break;
            default:
                break;
        }
        if (node.value.generator)
          state.write(null, '*');
        if (node.computed) {
            state.write(null, '[');
            this.out(node.key, state,node.key.type);
            state.write(null, ']');
        } else {
            this.out(node.key, state,node.key.type);
        }
        this.formatParameters(node.value.params, state);
        this.out(node.value.body, state,node.value.body.type);
    },
    ClassMethod: function (node,state){
        if (node.async)
            state.write(node, 'async ');
        if (node.static)
            state.write(node, 'static ');
        switch (node.kind) {
            case 'get':
            case 'set':
                state.write(node, node.kind, ' ');
                break;
            default:
                break;
        }
        if (node.generator)
          state.write(null, '*');
        if (node.computed) {
            state.write(null, '[');
            this.out(node.key, state,node.key.type);
            state.write(null, ']');
        } else {
            this.out(node.key, state,node.key.type);
        }
        this.formatParameters(node.params, state);
        this.out(node.body, state, node.body.type);
    },
    ClassExpression: function (node, state) {
        this.out(node, state,'ClassDeclaration');
    },
    ArrowFunctionExpression: function (node, state) {
        if (node.async)
            state.write(node, 'async ');
        this.formatParameters(node.params, state);
        state.write(node, '=> ');
        if (node.body.type === 'ObjectExpression' || node.body.type === 'SequenceExpression') {
            state.write(null, '(');
            this.out(node.body, state,node.body.type);
            state.write(null, ')');
        } else {
            this.out(node.body, state,node.body.type);
        }
    },
    ThisExpression: function (node, state) {
        state.write(node, 'this');
    },
    Super: function (node, state) {
        state.write(node, 'super');
    },
    RestElement: RestElement = function (node, state) {
        state.write(node, '...');
        this.out(node.argument, state,node.argument.type);
    },
    SpreadElement: RestElement,
    YieldExpression: function (node, state) {
        state.write(node, node.delegate ? 'yield*' : 'yield');
        if (node.argument) {
            state.write(null, ' ');
            this.expr(state, node, node.argument);
        }
    },
    AwaitExpression: function (node, state) {
        state.write(node, 'await ');
        this.expr(state, node, node.argument);
    },
    TemplateLiteral: function (node, state) {
        var expression;
        var quasis = node.quasis, expressions = node.expressions;
        state.write(node, '`');
        for (var i = 0, length = expressions.length; i < length; i++) {
            expression = expressions[i];
            state.write(quasis[i].value, quasis[i].value.raw);
            state.write(null, '${');
            this.out(expression, state,expression.type);
            state.write(null, '}');
        }
        state.write(quasis[quasis.length - 1].value, quasis[quasis.length - 1].value.raw);
        state.write(node, '`');
    },
    TaggedTemplateExpression: function (node, state) {
        this.out(node.tag, state,node.tag.type);
        this.out(node.quasi, state,node.quasi.type);
    },
    ArrayExpression: ArrayExpression = function (node, state) {
        state.write(node, '[');
        if (node.elements.length > 0) {
            var elements = node.elements, length = elements.length;
            for (var i = 0; ; ) {
                var element = elements[i];
                element && this.expr(state,CommaList,element) ;

                i += 1 ;
                if (i < length || element===null)
                    state.write(null, ',');
                if (i >= length)
                    break;
                if (state.lineLength() > state.wrapColumn)
                    state.write(null, state.lineEnd, repeat(state.indent, state.indentLevel + 1));
            }
        }
        state.write(null, ']');
    },
    ArrayPattern: ArrayExpression,
    ObjectExpression: function (node, state) {
        var property;
        var indent = repeat(state.indent, state.indentLevel++);
        var lineEnd = state.lineEnd;
        var propertyIndent = indent + state.indent;
        state.write(node, '{');
        if (node.properties.length > 0) {
            state.write(null, lineEnd);
            var properties = node.properties, length = properties.length;
            for (var i = 0; ; ) {
                property = properties[i];
                state.write(null, propertyIndent);
                this.out(property, state,'Property');
                if (++i < length)
                    state.write(node, ',', lineEnd);
                 else
                    break;
                if (state.lineLength() > state.wrapColumn)
                    state.write(null, state.lineEnd, repeat(state.indent, state.indentLevel + 1));
            }
            state.write(null, lineEnd, indent, '}');
        } else {
            state.write(null, '}');
        }
        state.indentLevel--;
    },
    Property: function (node, state) {
        if (node.method || (node.kind === 'get' || node.kind === 'set')) {
            this.MethodDefinition(node, state);
        } else {
            if (!node.shorthand) {
                if (node.computed) {
                    state.write(null, '[');
                    this.out(node.key, state,node.key.type);
                    state.write(null, ']');
                } else {
                    this.out(node.key, state,node.key.type);
                }
                state.write(null, ': ');
            }
            this.expr(state,CommaList,node.value);
        }
    },
    ObjectPattern: function (node, state) {
        state.write(node, '{');
        if (node.properties.length > 0) {
            var properties = node.properties, length = properties.length;
            for (var i = 0; ; ) {
                this.out(properties[i], state,'Property');
                if (++i < length)
                    state.write(null, ', ');
                 else
                    break;
            }
        }
        state.write(null, '}');
    },
    SequenceExpression: function (node, state) {
        var expression;
        var expressions = node.expressions;
        if (expressions.length > 0) {
            var length = expressions.length;
            for (var i = 0; i<length; i++) {
                expression = expressions[i];
                if (i)
                    state.write(null, ', ') ;
                this.expr(state,CommaList,expression) ;
            }
        }
    },
    UnaryExpression: function (node, state) {
        if (node.prefix) {
            state.write(node, node.operator);
            if (node.operator.length > 1)
                state.write(node, ' ');
            this.expr(state, node, node.argument, true);
        } else {
            this.expr(state, node, node.argument);
            state.write(node, node.operator);
        }
    },
    UpdateExpression: function (node, state) {
        if (node.prefix) {
            state.write(node, node.operator);
            this.out(node.argument, state,node.argument.type);
        } else {
            this.out(node.argument, state,node.argument.type);
            state.write(node, node.operator);
        }
    },
    BinaryExpression: BinaryExpression = function (node, state) {
        var operator = node.operator;
        if (operator==='in' && state.inForInit)
          state.write(null, '(');
        this.expr(state, node, node.left);
        state.write(node, ' ', operator, ' ');
        this.expr(state, node, node.right, node.right.type==='ArrowFunctionExpression'?2:0);
        if (operator==='in' && state.inForInit)
          state.write(null, ')');
    },
    LogicalExpression: BinaryExpression,
    AssignmentExpression: function (node, state) {
      if (node.left.type==='ObjectPattern')
        state.write(null,'(');
      this.BinaryExpression(node,state);
      if (node.left.type==='ObjectPattern')
        state.write(null,')');
    },
    AssignmentPattern: function (node, state) {
        this.expr(state, node, node.left);
        state.write(node, ' = ');
        this.expr(state, node, node.right);
    },
    ConditionalExpression: function (node, state) {
        this.expr(state, node, node.test, true);
        state.write(node, ' ? ');
        this.expr(state, node, node.consequent);
        state.write(null, ' : ');
        this.expr(state, node, node.alternate);
    },
    NewExpression: function (node, state) {
        state.write(node, 'new ');
        this.out(node, state,'CallExpression');
    },
    CallExpression: function (node, state) {
        this.expr(state, node, node.callee, node.callee.type==='ObjectExpression'?2:0);
        state.write(node, '(');
        var args = node['arguments'];
        if (args.length > 0) {
            var length = args.length;
            for (var i = 0; i < length; i++) {
                if (i!=0)
                    state.write(null, ', ');
                this.expr(state,CommaList,args[i]) ;
            }
        }
        state.write(null, ')');
    },
    MemberExpression: function (node, state) {
        var requireParens = (node.object.type === 'ObjectExpression' || (node.object.type.match(/Literal$/) && node.object.raw.match(/^[0-9]/))) ;
        var noParens = !requireParens &&
            ((node.object.type === 'ArrayExpression' || node.object.type === 'CallExpression' || node.object.type === 'NewExpression')
            || precedence(node) <= precedence(node.object));
        if (noParens) {
            this.out(node.object, state,node.object.type);
        } else {
            state.write(null, '(');
            this.out(node.object, state,node.object.type);
            state.write(null, ')');
        }
        if (node.computed) {
            state.write(node, '[');
            this.out(node.property, state,node.property.type);
            state.write(null, ']');
        } else {
            state.write(node, '.');
            this.out(node.property, state,node.property.type);
        }
    },
    Identifier: function (node, state) {
        state.write(node, node.name);
    },
    Literal: function (node, state) {
        state.write(node, node.raw);
    },
    NullLiteral:function (node, state) {
        state.write(node, 'null');
    },
    BooleanLiteral:function (node, state) {
        state.write(node, JSON.stringify(node.value));
    },
    StringLiteral:function (node, state) {
        state.write(node, JSON.stringify(node.value));
    },
    RegExpLiteral:function (node, state) {
        state.write(node, node.extra.raw || ('/'+node.pattern+'/'+node.flags));
    },
    NumericLiteral:function (node, state) {
        state.write(node, JSON.stringify(node.value));
    },
};
module.exports = function (node, options, originalSource) {
    options = options || {};
    var buffer = "", lines = [];
    var map = options.map && new SourceMapGenerator(options.map);
    if (map && options.map.sourceContent) {
        map.setSourceContent(options.map.file, options.map.sourceContent);
    }
    var backBy = "";
    var leadingComments = [];
    var trailingComments = [];
    function write(node) {
        backBy = arguments[arguments.length - 1] ;
        for (var i = 1; i < arguments.length; i++) {
            if (map && node && node.loc && node.loc.start) {
                var startOfLine = false;
                map.addMapping({
                    source: options.map.file,
                    original: {
                        line: node.loc.start.line,
                        column: startOfLine ? 0 : node.loc.start.column
                    },
                    generated: {
                        line: options.map.startLine + lines.length + 1,
                        column: startOfLine ? 0 : buffer.length
                    }
                });
            }
            if (arguments[i] === st.lineEnd) {
                if (trailingComments.length) {
                    trailingComments.forEach(function (c) {
                        if (c.type === 'Line')
                            buffer += " // " + c.value;
                         else {
                            (" /*" + c.value + "*/").split("\n").forEach(function (v) {
                                buffer += v;
                                lines.push(buffer);
                                buffer = "";
                            });
                            buffer = lines.pop();
                        }
                    });
                    trailingComments = [];
                }
                lines.push(buffer);
                buffer = "";
                if (leadingComments.length) {
                    var preceeding = lines.pop();
                    leadingComments.forEach(function (c) {
                        var indent = repeat(st.indent, c.indent);
                        if (c.type === "Line")
                            lines.push(indent + "//" + c.value);
                         else
                            (indent + "/*" + c.value + "*/").split("\n").forEach(function (l) {
                            lines.push(l);
                        });
                    });
                    lines.push(preceeding);
                    leadingComments = [];
                }
            } else {
                buffer += arguments[i];
                if (node && node.$comments) {
                    node.$comments.forEach(function (c) {
                        var trailing = node.loc.start.column < c.loc.start.column;
                        c.indent = st.indentLevel;
                        if (trailing) {
                            trailingComments.push(c);
                        } else {
                            leadingComments.push(c);
                        }
                    });
                    node.$comments = null;
                }
            }
        }
    }
    function lineLength() {
        return buffer.length;
    }
    function sourceAt(start, end) {
        return originalSource?originalSource.substring(start,end):"/* Omitted Non-standard node */" ;
    }
    function back() {
        buffer = buffer.substring(0, buffer.length - backBy.length);
    }
    var st = {
        inForInit: 0,
        lineLength: lineLength,
        sourceAt:sourceAt,
        write: write,
        back: back,
        indent: "    ",
        lineEnd: "\n",
        indentLevel: 0,
        wrapColumn: 80
    };
    traveler.out(node, st);
    trailingComments = node.$comments || [];
    st.write(node, st.lineEnd);
    var result = lines.join(st.lineEnd);
    if (options && options.map) {
        return {
            code: result,
            map: map
        };
    }
    return result;
};