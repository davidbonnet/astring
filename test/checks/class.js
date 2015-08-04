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
class F {
	[Symbol.iterator]() {}
	["method"]() {}
}
class G {
	static classMethod() {}
	method() {}
}
class H {
	static get property() {}
	static set property(value) {}
}
