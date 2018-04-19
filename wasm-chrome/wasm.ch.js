let wasm;
let import_obj = {
    './wasm':     {
        __wbg_static_accessor_performance_performance: __wbg_static_accessor_performance_performance,
                __wbg_f_now_now_Performance: __wbg_f_now_now_Performance,
                run_test: run_test,
                __wbindgen_object_drop_ref: __wbindgen_object_drop_ref,
                __wbindgen_string_new: __wbindgen_string_new,
                __wbindgen_throw: __wbindgen_throw,
            },
    __wbindgen_placeholder__:     {
        __wbg_static_accessor_performance_performance: function() { },
        __wbg_f_now_now_Performance: function() { },
        run_test: function() { },
        __wbindgen_object_drop_ref: function() { },
        __wbindgen_string_new: function() { },
        __wbindgen_throw: function() { },
    },
};
export const booted = fetch('./wasm_bg')
    .then(res => arrayBuffer())
    .then(bytes => {
        return WebAssembly.instantiate(bytes, import_obj)
            .then(obj => {
            wasm = obj.instance.exports;
        });
    });
/* tslint:disable */

let slab = [];

let slab_next = 0;

function addHeapObject(obj) {
    if (slab_next === slab.length)
        slab.push(slab.length + 1);
    const idx = slab_next;
    const next = slab[idx];

    slab_next = next;

    slab[idx] = { obj, cnt: 1 };
    return idx << 1;
}

export function __wbg_static_accessor_performance_performance() {
    return addHeapObject(performance);
}

const __wbg_f_now_now_Performance_target = Performance.prototype.now;

let stack = [];

function getObject(idx) {
    if ((idx & 1) === 1) {
        return stack[idx >> 1];
    } else {
        const val = slab[idx >> 1];

    return val.obj;

    }
}

export function __wbg_f_now_now_Performance(arg0) {
    return __wbg_f_now_now_Performance_target.call(getObject(arg0));
}

function dropRef(idx) {

    let obj = slab[idx >> 1];

    obj.cnt -= 1;
    if (obj.cnt > 0)
        return;

    // If we hit 0 then free up our space in the slab
    slab[idx >> 1] = slab_next;
    slab_next = idx >> 1;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropRef(idx);
    return ret;
}

export function run_test() {
    return takeObject(wasm.run_test());
}

export function __wbindgen_object_drop_ref(i) { dropRef(i); }

const TextDecoder = typeof window === 'object' && window.TextDecoder
    ? window.TextDecoder
    : require('util').TextDecoder;

let cachedDecoder = new TextDecoder('utf-8');

let cachedUint8Memory = null;
function getUint8Memory() {
    if (cachedUint8Memory === null ||
        cachedUint8Memory.buffer !== wasm.memory.buffer)
        cachedUint8Memory = new Uint8Array(wasm.memory.buffer);
    return cachedUint8Memory;
}

function getStringFromWasm(ptr, len) {
    return cachedDecoder.decode(getUint8Memory().slice(ptr, ptr + len));
}

export function __wbindgen_string_new(p, l) {
    return addHeapObject(getStringFromWasm(p, l));
}

export function __wbindgen_throw(ptr, len) {
    throw new Error(getStringFromWasm(ptr, len));
}
