async function f() {}
const g = async function () {};
const a = {
	async f() {}
};
const h = async () => {};
async function j() {
	return await f();
}
