
var assert = require( 'assert' )
var fs = require( 'fs' )
var path = require( 'path' )
var acorn = require( 'acorn' )
var astring
try {
	astring = require( '../dist/astring.debug' )
} catch ( error ) {
	astring = require( '../dist/astring.min' )
}


var dirname = path.join( __dirname, 'checks' )
var files = fs.readdirSync( dirname ).sort()
var options = {
	ecmaVersion: 6,
	sourceType: 'module'
}

describe( 'Code generation', function() {
	files.forEach( function( filename ) {
		var code = fs.readFileSync( path.join( dirname, filename ), 'utf8' )
		it( filename.split( '.' )[ 0 ], function() {
			var ast = acorn.parse( code, options )
			assert.equal( astring( ast ), code )
		} )
	} )
	var code = "with (a) {\n\tb = 1;\n\tc = 2;\n}\n"
	it( 'with', function () {
		var ast = acorn.parse( code, { ecmaVersion: 5 } )
		assert.equal( astring( ast ), code )
	} )
} )

