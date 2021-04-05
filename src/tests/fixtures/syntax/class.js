class A {
  constructor() {}
}
class B extends A {}
class C extends A {
  method() {}
  get property() {
    return this._property;
  }
  set property(value) {
    this._property = value;
  }
}
class D extends class A {} {}
class E extends class {
  constructor() {}
} {}
class F extends class {
  constructor() {}
} {
  constructor() {}
}
class G {
  [Symbol.iterator]() {}
  ["method"]() {}
}
class H {
  static classMethod() {}
  method() {}
}
class I {
  static get property() {}
  static set property(value) {}
}
class J extends A {
  constructor() {
    super();
  }
}
class K extends (() => {}) {}
class L extends (1 + 1) {}
class M extends (-1) {}
class N extends (c++) {}
function* a() {
  class A extends (yield) {}
}
async function b() {
  class A extends (await a()) {}
}
