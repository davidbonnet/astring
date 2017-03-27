const fs = require( 'fs' )
const path = require( 'path' )
const { test } = require( 'tap' )
const acorn = require( 'acorn' )
const astravel = require( 'astravel' )

const astring = require( '../dist/astring' ).default


const stripLocation = astravel.makeTraveler( {
	go( node, state ) {
		delete node.start
		delete node.end
		this[ node.type ]( node, state )
	},
	Property( node, state ) {
		this.go( node.key, state )
		// Always walk through value, regardless of `node.shorthand` flag
		this.go( node.value, state )
	},
} )


test( 'Syntax check', assert => {
	const dirname = path.join( __dirname, 'syntax' )
	const files = fs.readdirSync( dirname ).sort()
	const options = {
		ecmaVersion: 8,
		sourceType: 'module',
	}
	files.forEach( filename => {
		const code = fs.readFileSync( path.join( dirname, filename ), 'utf8' )
		assert.test( filename.substring( 0, filename.length - 3 ), assert => {
			const ast = acorn.parse( code, options )
			assert.equal( astring( ast ), code )
			assert.end()
		} )
	} )
	assert.end()
} )


test( 'Tree comparison', assert => {
	const dirname = path.join( __dirname, 'tree' )
	const files = fs.readdirSync( dirname ).sort()
	const options = {
		ecmaVersion: 8,
		sourceType: 'module',
	}
	files.forEach( filename => {
		const code = fs.readFileSync( path.join( dirname, filename ), 'utf8' )
		assert.test( filename.substring( 0, filename.length - 3 ), assert => {
			const ast = acorn.parse( code, options )
			const formattedAst = acorn.parse( astring( ast ), options )
			stripLocation.go( ast )
			stripLocation.go( formattedAst )
			assert.deepEqual( formattedAst, ast )
			assert.end()
		} )
	} )
	assert.end()
} )


test( 'Deprecated syntax check', assert => {
	const dirname = path.join( __dirname, 'deprecated' )
	const files = fs.readdirSync( dirname ).sort()
	files.forEach( filename => {
		const code = fs.readFileSync( path.join( dirname, filename ), 'utf8' )
		const version = parseInt( filename.substring( 2, filename.length - 3 ) )
		assert.test( 'es' + version, assert => {
			const ast = acorn.parse( code, { ecmaVersion: version } )
			assert.equal( astring( ast ), code )
			assert.end()
		} )
	} )
	assert.end()
} )


test( 'Comment generation', assert => {
	const dirname = path.join( __dirname, 'comment' )
	const files = fs.readdirSync( dirname ).sort()
	const options = {
		comments: true,
	}
	files.forEach( filename => {
		const code = fs.readFileSync( path.join( dirname, filename ), 'utf8' )
		assert.test( filename.substring( 0, filename.length - 3 ), assert => {
			const comments = []
			const ast = acorn.parse( code, {
				ecmaVersion: 8,
				locations: true,
				onComment: comments,
			} )
			astravel.attachComments( ast, comments )
			assert.equal( astring( ast, options ), code )
			assert.end()
		} )
	} )
	assert.end()
} )


