var Benchmark = require( 'benchmark' )
var acorn = require( 'acorn' )
var uglify = require( 'uglify-js' )
var escodegen = require( 'escodegen' ).generate
var esotope = require( 'esotope' ).generate
var esast = require( 'esast/dist/render' ).default
var jsonToEsast = require( 'esast/dist/fromJson' ).default
var astring
try {
	astring = require( '../dist/astring.debug' )
	console.log( 'Using ./dist/astring.debug.js' )
} catch ( error ) {
	try {
		astring = require( '../dist/astring.min' )
		console.log( 'Using ./dist/astring.min.js' )
	} catch ( error ) {
		astring = require( '../dist/astring' )
		console.log( 'Using ./dist/astring.js' )
	}
}
var fs = require( 'fs' )
var path = require( 'path' )


function benchmarkWithCode( code ) {
	var ast = acorn.parse( code, {
		ecmaVersion: 6,
		sourceType: 'module'
	} )

	var uglifyAst = uglify.parse( code )
	var uglifyOptions = {
		beautify: true
	}

	console.log( '\n\nTesting code:' )
	console.log( astring( ast ) )

	var suite = ( new Benchmark.Suite )
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
	.add( 'esast', function() {
		esast( jsonToEsast( ast ) )
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

code = fs.readFileSync( path.join( __dirname, 'index.js' ), 'utf8' )
benchmarkWithCode( code )

benchmarkWithCode( 'var a = 2;' )


