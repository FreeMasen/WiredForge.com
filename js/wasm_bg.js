
import * as import_b from './wasm';
let wasm;
export let memory;
export const booted = fetch('/wasm_bg.wasm')
    .then(res => res.arrayBuffer())
    .then(bytes => WebAssembly.instantiate(bytes, { './wasm': import_b, })
        .then(obj => {
            wasm = obj.instance;
            memory = wasm.exports.memory;
        }));


export function run_test() {
    return wasm.exports.run_test();
}