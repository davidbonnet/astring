for (let a in b) {}
for (let [a, b] in c) {}
for (let {a, b} in c) {}
for (let {a: b, c} in d) {}
for (let a of b) {}
for (var [a, b] of c) {}
for (let {a, b} in c) {}
for (let {a: b, c} in d) {}
for (let i = 0, {length} = list; i < length; i++) {}
for (; ; ) {}
for (p(function (a) {
	var foo = done();
}); g.length; ) {}
