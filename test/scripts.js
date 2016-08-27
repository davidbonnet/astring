var assert = require( 'assert' )
var fs = require( 'fs' )
var path = require( 'path' )
var glob = require( 'glob' )
var acorn = require( 'acorn' )
var astravel = require( 'astravel' )
var normalizeNewline = require( 'normalize-newline' )
var astring = require( '../dist/astring.debug' )


var dependencies = Object.getOwnPropertyNames(
	require( '../package.json' ).devDependencies
)


var pattern = path.join(
	__dirname,
	'../node_modules/{' + dependencies.join( ',' ) + '}/**/*.js'
)
var options = {
	ecmaVersion: 6,
	sourceType: 'module',
	allowHashBang: true
}

var stripLocation = astravel.makeTraveler( {
	go: function( node, state ) {
		delete node.start
		delete node.end
		this[ node.type ]( node, state )
	}
} )

console.log( 'Looking for files…' )
var files = glob.sync( pattern, {
	nodir: true
} )

console.log( 'Found', files.length, 'files, processing them…' )

var processedFiles = 0, errorFiles = 0

files.forEach( function( filename ) {
	var code = normalizeNewline( fs.readFileSync( filename, 'utf8' ) )
	try {
		var ast = acorn.parse( code, options )
		stripLocation.go( ast )
		// console.log( JSON.stringify(ast, null, 2) )
	} catch ( error ) {
		return
	}
	try {
		var formattedAst = acorn.parse( astring( ast ), options )
		stripLocation.go( formattedAst )
		assert.deepEqual( formattedAst, ast )
	} catch ( errpr ) {
		console.error( 'Error on file ', filename )
		errorFiles++
	}
	processedFiles++
} )

console.log( 'Processed ' + processedFiles + ' files with ' + errorFiles + ' error' + ( errorFiles === 1 ? '' : 's' ) )
