var modify = require( 'modify-babel-preset' )

module.exports = modify( 'es2015-loose', {
    'transform-es2015-modules-commonjs': false,
    'transform-es2015-modules-umd': true
} )
