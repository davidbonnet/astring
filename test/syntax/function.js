function f(a, b, c) {
	return null;
}
var g = function (a, b, c) {
	return null;
};
function h(a, b = 1, c = 2) {
	return null;
}
function i(a = 1, b, c) {
	return null;
}
function j(...a) {}
function k() {}
var l = function () {};
var m = function (a = 1, b, c) {};
function* f() {
	yield 42;
}
function* g() {
	yield 42;
	yield 7;
	return "answer";
}
let h = function* () {};
let f = (a) => a;
let g = (a, b) => a + b;
let h = (a, b = 0) => a + b;
let i = (a, b) => {};
let j = () => {};
let k = () => ({});
let l = () => {
	let a = 42;
	return a;
};
let m = () => ({
	a: 1,
	b: 2
});
