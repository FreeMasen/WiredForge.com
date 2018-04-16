+++
title = "Wasm Serialization Test"
draft = false
[extra]
snippet = "A simple test of the RMP and Bincode serializated"
+++
<link type="text/css" rel="stylesheet" href="ser_test.css">
# Results
<div id="tests">
    <div id="native" class="result-list">
    </div>
    <div id="wasm"class="result-list">
    </div>
</div>
<script src="js/wasm_ser.js" type="text/javascript"></script>

# Tests

## Shared Code
```rust
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate rmp_serde;
extern crate bincode;

use std::ops::Sub;
use std::fmt::Debug;

use rmp_serde::{to_vec as rmp_ser, from_slice as rmp_de};
use bincode::{serialize as bin_ser, deserialize as bin_de};

#[derive(Serialize, Deserialize,Debug,PartialEq, Clone)]
enum Message {
    Ping, Pong, Chat(String), Nick(String), Me(String)
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TestResult<T> {
    rmp: Test<T>,
    bin: Test<T>,
}
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Test<T> {
    start_timestamp: T,
    end_timestamp: T,
    time_unit: String,
    largest: usize,
    total_size: usize,
}

pub fn get_res<T:Sub<T>>(now: Box<Fn() -> T>, time_unit: &str) -> TestResult<T>
where <T as Sub>::Output: Debug
{
    let rmp_msgs = msgs();
    let rmp_start = (now)();
    let rmp_res = rmp_test(rmp_msgs);
    let rmp_end = (now)();
    let rmp_test = Test {
        start_timestamp: rmp_start,
        end_timestamp: rmp_end,
        time_unit: String::from(time_unit),
        largest: rmp_res.0,
        total_size: rmp_res.1,
    };
    let bin_msgs = msgs();
    let bin_start = (now)();
    let bin_res = bin_test(bin_msgs);
    let bin_end = (now)();
    let bin_test = Test {
        start_timestamp: bin_start,
        end_timestamp: bin_end,
        time_unit: String::from(time_unit),
        largest: bin_res.0,
        total_size: bin_res.1
    };
    TestResult {
        rmp: rmp_test,
        bin: bin_test,
    }
}

fn rmp_test(x: Vec<Message>) -> (usize, usize) {
    let mut total_size = 0;
    let mut max = 0;
    for msg in x {
        let serialized = rmp_ser(&msg).expect("Unable to serialize");
        let size = serialized.len();
        total_size += size;
        if max < size {
            max = size;
        }
        let _: Message = rmp_de(&serialized).expect("Unable to deserialize");
    }
    (max, total_size)
}

fn bin_test(x: Vec<Message>) -> (usize, usize) {
    let mut total_size = 0;
    let mut max = 0;
    for msg in x {
        let serialized = bin_ser(&msg).expect("Unable to serialize");
        let size = serialized.len();
        total_size += size;
        if max < size {
            max = size;
        }
        let _: Message = bin_de(&serialized).expect("Unable to deserialize");
    }
    (max, total_size)
}

fn msgs() -> Vec<Message> {
    let mut ret = vec!();
    let one_of_each = vec![
        Message::Ping,
        Message::Pong,
        Message::Chat(String::from("Hello World!")),
        Message::Nick(String::from("CoolDood2001")),
        Message::Me(String::from("Me!"))
    ];
    for _ in 0..1000 {
        ret.extend(one_of_each.clone());
    }
    ret
}
```

## Native Code

```rust

pub fn get_wasm_results(_req: Request) -> Box<Future<Item = Response, Error = Error>> {
    let resluts = get_res(Box::new(now), "ns");
    let body = serde_json::to_vec(&resluts);
    match body {
        Ok(b) => Box::new(
            ok(
                Response::new()
                    .with_header(ContentLength(b.len() as u64))
                    .with_body(b)
            )
        ),
        Err(_) => Box::new(ok(r500()))
    }
}

fn now() -> u32 {
    let start = ::std::time::SystemTime::now().duration_since(::std::time::UNIX_EPOCH);
    start.unwrap().subsec_nanos()
}
```

## WASM Code

```rust
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
```