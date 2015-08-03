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
