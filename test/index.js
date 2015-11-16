var assert = require( 'assert' )
var fs = require( 'fs' )
var path = require( 'path' )
var acorn = require( 'acorn' )
var astravel = require( 'astravel' )
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


var stripLocation = astravel.makeTraveler( {
   go: function( node, state ) {
      delete node.start;
      delete node.end;
      this[node.type]( node, state );
   }
} );


describe( 'Syntax check', function() {
	var dirname = path.join( __dirname, 'syntax' )
	var files = fs.readdirSync( dirname ).sort()
	var options = {
		ecmaVersion: 6,
		sourceType: 'module'
	}
	files.forEach( function( filename ) {
		var code = fs.readFileSync( path.join( dirname, filename ), 'utf8' )
		it( filename.substring( 0, filename.length - 3 ), function() {
			var ast = acorn.parse( code, options )
			assert.equal( astring( ast ), code )
		} )
	} )
} )


describe( 'Tree comparison', function() {
	var dirname = path.join( __dirname, 'syntax' )
	var files = fs.readdirSync( dirname ).sort()
	var options = {
		ecmaVersion: 6,
		sourceType: 'module'
	}
	files.forEach( function( filename ) {
		var code = fs.readFileSync( path.join( dirname, filename ), 'utf8' )
		it( filename.substring( 0, filename.length - 3 ), function() {
			var ast = acorn.parse( code, options )
			var formattedAst = acorn.parse( astring( ast ), options )
			stripLocation.go( ast )
			stripLocation.go( formattedAst )
			assert.deepEqual( formattedAst, ast )
		} )
	} )
} )


describe( 'Deprecated syntax check', function() {
	var dirname = path.join( __dirname, 'deprecated' )
	var files = fs.readdirSync( dirname ).sort()
	files.forEach( function( filename ) {
		var code = fs.readFileSync( path.join( dirname, filename ), 'utf8' )
		var version = parseInt( filename.substring( 2, filename.length - 3 ) )
		it( 'es' + version, function() {
			var ast = acorn.parse( code, { ecmaVersion: version } )
			assert.equal( astring( ast ), code )
		} )
	} )
} )


describe( 'Comment generation', function() {
	var dirname = path.join( __dirname, 'comment' )
	var files = fs.readdirSync( dirname ).sort()
	var options = {
		comments: true
	}
	files.forEach( function( filename ) {
		var code = fs.readFileSync( path.join( dirname, filename ), 'utf8' )
		it( filename.substring( 0, filename.length - 3 ), function() {
			var comments = []
			var ast = acorn.parse( code, { ecmaVersion: 6, locations: true, onComment: comments } )
			astravel.attachComments( ast, comments )
			assert.equal( astring( ast, options ), code )
		} )
	} )
} )
