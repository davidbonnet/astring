
var assert = require( 'assert' )
var fs = require( 'fs' )
var path = require( 'path' )
var acorn = require( 'acorn' )
var astring
try {
	astring = require( '../dist/astring' )
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
		it( filename, function() {
			var ast = acorn.parse( code, options )
			assert.equal( astring( ast ), code )		
		} )
	} )
} )
