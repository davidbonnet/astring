/*
Before running benchmarks, install third parties by running:
npm install escodegen@1.8 esotope@1.4 uglify-js@2.8 babel-generator@6.24
*/

const Benchmark = require( 'benchmark' )
const acorn = require( 'acorn' )
const uglify = require( 'uglify-js' )
const escodegen = require( 'escodegen' ).generate
const esotope = require( 'esotope' ).generate
const nodent = require( '../vendor/nodent' )
const astring = require( '../dist/astring' ).generate
const babylon = require( 'babylon' )
const babel = require( 'babel-generator' ).default
const fs = require( 'fs' )
const path = require( 'path' )


function benchmarkWithCode( code, name ) {
	console.log( '\nTesting "%s" (code length: %d)', name, code.length )
	const ast = acorn.parse( code, {
		ecmaVersion: 8,
		sourceType: 'module',
	} )
	let uglifyAst = null
	try {
		uglifyAst = uglify.parse( code )
	} catch ( error ) {}
	const uglifyOptions = {
		beautify: true,
	}
	const babelAst = babylon.parse( code, {
		sourceType: 'module',
	} )
	; ( new Benchmark.Suite )
	.add( 'escodegen', () => {
		escodegen( ast )
	} )
	.add( 'esotope', () => {
		esotope( ast )
	} )
	.add( 'astring', () => {
		astring( ast )
	} )
	.add( 'uglify', () => {
		uglifyAst.print_to_string( uglifyOptions )
	} )
	.add( 'nodent', () => {
		nodent( ast )
	} )
	.add( 'babel', () => {
		babel( babelAst, {}, code ).code
	} )
	// add listeners
	.on( 'cycle', ( event ) => {
		console.log( String( event.target ) )
	} )
	.on( 'complete', function() {
		console.log( 'Fastest is ' + this.filter( 'fastest' ).map( 'name' ) )
	} )
	.run()
}


benchmarkWithCode(
	fs.readFileSync( path.join( __dirname, '_benchmark.js' ), 'utf8' ),
	'benchmark file',
)

benchmarkWithCode(
	fs.readFileSync( path.join( __dirname, 'tree', 'es6.js' ), 'utf8' ),
	'everything',
)

benchmarkWithCode( 'var a = 2;', 'tiny instruction' )
