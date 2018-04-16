#![feature(proc_macro, wasm_custom_section, wasm_import_module)]
extern crate wasm_bindgen;
extern crate ser_test;
extern crate serde_json;
use wasm_bindgen::prelude::*;
use ser_test::get_res;
use serde_json::to_string;

#[wasm_bindgen]
extern {
    type Performance;
    static performance: Performance;
    #[wasm_bindgen(method)]
    fn now(this: &Performance) -> f64;
}

#[wasm_bindgen]
pub fn run_test() -> JsValue {
    let data = get_res(Box::new(now), "ms");
    match to_string(&data) {
        Ok(data) => JsValue::from_str(&data),
        Err(_) => JsValue::from_str("Unable to serialize tests")
    }
}

fn now() -> f64 {
    performance.now()
}