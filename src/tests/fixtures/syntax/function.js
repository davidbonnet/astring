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
function* o() {
  yield 42;
}
function* p() {
  yield 42;
  yield 4 + 2;
  return "answer";
}
async function a() {}
const b = async function () {};
const c = {
  async f() {}
};
const d = async () => {};
async function e() {
  await a + await b;
  return await f();
}
let q = function* () {};
let r = a => a;
let s = (a, b) => a + b;
let t = (a, b = 0) => a + b;
let u = (a, b) => {};
let v = () => {};
let w = () => ({});
let x = () => {
  let a = 42;
  return a;
};
let y = () => ({
  a: 1,
  b: 2
});
