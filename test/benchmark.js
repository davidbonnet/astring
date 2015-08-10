var Benchmark = require( 'benchmark' )
var acorn = require( 'acorn' )
var escodegen = require( 'escodegen' ).generate
var esotope = require( 'esotope' ).generate
var astring
try {
	astring = require( '../dist/astring.debug' )
} catch ( error ) {
	astring = require( '../dist/astring.min' )
}
var fs = require( 'fs' )
var path = require( 'path' )


function benchmarkWithCode( code ) {
	var ast = acorn.parse( code, {
		ecmaVersion: 6,
		sourceType: 'module'
	} )

	console.log( "\n\nTesting code:" )
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
	// add listeners
	.on( 'cycle', function( event ) {
	  console.log( String( event.target ) )
	})
	.on( 'complete', function() {
	  console.log( 'Fastest is ' + this.filter( 'fastest' ).pluck( 'name' ) )
	} )
	.run()
}

code = fs.readFileSync( path.join( __dirname, 'index.js' ), 'utf8' )
benchmarkWithCode( code )

benchmarkWithCode( "var a = 2;" )


