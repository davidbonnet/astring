export * from "module";
export * as module from "module";
export {name} from "module";
export {a as b, c as d} from "module";
let e, g;
export {e as f, g as h};
export {};
export default i = 42;
export var j = 42;
export let k = 42;
export function l() {}
export {val} from '../other/a.json' with { type: "json" };
let m, n, o, p;
export {m as "m"};
export {n as "n", "o" as o, "p"} from "module";
