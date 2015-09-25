let a = {};
let b = {
	"1": "one",
	"2": "two",
	"3": "three"
};
let c = {
	[42]: "answer",
	[7]: "lucky"
};
let d = {
	a: 1,
	b: 2,
	c: 3
};
let e = d.a;
let f = d["c"];
let g = {
	m() {},
	['m'](a) {},
	n(a) {
		return a;
	}
};
