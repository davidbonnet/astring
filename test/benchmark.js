var Benchmark = require( 'benchmark' )
var acorn = require( 'acorn' )
var uglify = require( 'uglify-js' )
var escodegen = require( 'escodegen' ).generate
var esotope = require( 'esotope' ).generate
var nodent = require( '../vendor/nodent' )
var astring
try {
	astring = require( '../dist/astring.min' )
	console.log( 'Using ./dist/astring.min.js' )
} catch ( error ) {
	try {
		astring = require( '../dist/astring' )
		console.log( 'Using ./dist/astring.js' )
	} catch ( error ) {
		astring = require( '../dist/astring.debug' )
		console.log( 'Using ./dist/astring.debug.js' )
	}
}
var fs = require( 'fs' )
var path = require( 'path' )


function benchmarkWithCode( code, name ) {
	console.log( '\nTesting "%s" (code length: %d)', name, code.length )
	var ast = acorn.parse( code, {
		ecmaVersion: 6,
		sourceType: 'module',
		locations: true
	} )
	var uglifyAst = null
	try {
		uglifyAst = uglify.parse( code )
	} catch ( error ) {}
	var uglifyOptions = {
		beautify: true
	}
	var nodentOptions = {
		map: {
			startLine: 0,
			file: 'original',
			sourceMapRoot: '/',
			sourceContent: code
		}
	}
	// console.log( nodent( ast, nodentOptions ).map.toString() )
	// console.log( astring( ast ) )
	; ( new Benchmark.Suite )
	.add( 'escodegen', function() {
		escodegen( ast )
	} )
	.add( 'esotope', function() {
		esotope( ast )
	} )
	.add( 'astring', function() {
		astring( ast )
	} )
	.add( 'uglify', function() {
		uglifyAst.print_to_string( uglifyOptions )
	} )
	.add( 'nodent', function() {
		nodent( ast, nodentOptions )
	} )
	// add listeners
	.on( 'cycle', function( event ) {
		console.log( String( event.target ) )
	} )
	.on( 'complete', function() {
		console.log( 'Fastest is ' + this.filter( 'fastest' ).map( 'name' ) )
	} )
	.run()
}

var code = fs.readFileSync( path.join( __dirname, 'index.js' ), 'utf8' )
benchmarkWithCode( code, 'test file' )

var code = fs.readFileSync( path.join( __dirname, 'tree', 'es6.js' ), 'utf8' )
benchmarkWithCode( code, 'everything' )

benchmarkWithCode( 'var a = 2;', 'tiny instruction' )


