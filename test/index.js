
var assert = require( 'assert' )
var fs = require( 'fs' )
var path = require( 'path' )
var acorn = require( 'acorn' )
var astring = require( '../dist/astring' )


var dirname = path.join( __dirname, 'checks' )
var files = fs.readdirSync( dirname ).sort()
var options = {
	ecmaVersion: 6,
	sourceType: 'module'
}

describe( 'Code generation', function() {
	files.forEach( function( filename ) {
		var code = fs.readFileSync( path.join( dirname, filename ), 'utf8' )
		var ast = acorn.parse( code, options )
		it( filename, function() {
			assert.equal( astring( ast ), code )		
		} )
	} )
} )
