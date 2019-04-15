+++
title = "Using Wasmer for Plugins Part 2"
date = 2019-05-30
draft = true
[extra]
snippet = "Things are getting complicated"
image = "rust-logo-blk.png"
date_sort = 20190530
image_desc = "Made by Freepik from www.flaticon.com, licensed by CC-3.0-BY"
+++

If you haven't seen it yet, you may want to checkout [part one](./wasmer_plugin_pt1.md) where we went over the basics of using wasmer. In this post we are going to cover how we could pass more complicated data from the wasm module back to the runner. Let's make one last naive and dumb plugin that takes a string and returns that string repeated twice. 

### Plugin
```rust
pub fn double(s: &str) -> String {
    s.repeat(2)
}

#[no_mangle]
pub fn _double(ptr: i32, len: u32) -> i32 {
    let string = unsafe { String::from_raw_parts(ptr as _, len as _, len as _) };
    let ret = double(&string);
    ret.as_ptr() as _
}
```

Most of what is going on here is exactly what we did the last time, the only difference is that last line `ret.as_ptr() as _` and the return value is now `i32`. `as_ptr` is a method that will return the byte index in memory of a value, which normally would be a pretty scary thing to deal with but I promise that we are going to survive. So how would we use this new plugin

### Runner
```rust
use wasmer_runtime::{
    Ctx,
    imports,
    Instance,
    instantiate,
};

use std::{
    fs::File,
    io::Read,
    path::PathBuf,
};

fn main() {
    // This part hasn't change at all!
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                .join("target")
                .join("wasm32-unknown-unknown")
                .join("debug")
                .join("really_dumb_plugin.wasm");
    let mut wasm = Vec::new();
    let mut f = File::open(path)
                .expect("Failed to open wasm file");
    f.read_to_end(&mut wasm)
                .expect("Failed to read wasm file");
    let instance = instantiate(&wasm, imports!{})
                .expect("failed to instantiate wasm module");
    let context = instance.inst.context();
    let memory = context.memory(0);
    let view: Vec<Cell<u8>> = memory.view();
    let s = "supercalifragilisticexpialidocious".to_string();
    let bytes = s.as_bytes();
    let len = bytes.len();
    for (cell, byte) in view[0..len].iter().zip(bytes.iter()) {

        cell.set(byte)
    }
    // Our changes start here with a slightly different fn signature
    let length = instance.func::<(i32, u32), i32>("_double")
                            .expect("Failed to bind _length");
    // We call it just the same though
    let ptr = length.call(0 as i32, len as u32);
    let end = ptr as usize + (len * 2);
    // The return value now represents the index that the new string lives in
    // in the wasm memory. At this point we can extract it into a string
    let wasm_bytes = &view[ptr as usize..end];
    let doubled = String::from_utf8(wasm_bytes)
                    .expect("Failed to extract string from memory");
    println!("original: {:?}, doubled: {:?}", string, doubled);
}
```

Again, almost all of this is going to be reused from the last example. We need to change the type arguments for `func` ever so slightly and the name of the function. Next we are going to call the `func` just like we did the last time, this time the return value is going to represent the index for the start of our new string. Since we will only ever double the string we can calculate the end by adding twice the original length the start, with both the start and the end we can capture the bytes as a slice. If you have the bytes as a slice you can try and convert it into a string using the `String::from_utf8` method. If we were to run this we should see

```
cargo run
original: "supercalifragilisticexpialidocious", doubled: "supercalifragilisticexpialidocioussupercalifragilisticexpialidocious"
```

Huzzah! Success... though the situations where you would know the size of any data after a plugin ran is going to be about as small as it being useful to add two numbers together. Now the big question becomes, if web assembly functions can only return 1 value how could we possibly know both the start and the length of any value coming back? One solution would be to reserve a section of memory that the wasm module could use to put the length in and then get the length value from there. What might that look like?

### Plugin
```rust
pub fn double(s: &str) -> String {
    s.repeat(2)
}

#[no_mangle]
pub fn _double(ptr: i32, len: u32) -> i32 {
    let string = unsafe { String::from_raw_parts(ptr as _, len as _, len as _) };
    let ret = double(&string);
    let len = ret.len() as u32;
    // write the length to byte 1 in memory
    unsafe {
        ::std::ptr::write(1 as _, len);
    }
    ret.as_ptr() as _
}
```

This time in our plugin we have one change, the call to [`::std::ptr::write`](https://doc.rust-lang.org/std/ptr/fn.write.html), which will write to any place in memory you tell it and value you want. This is a pretty dangerous unsafe call, it is important that we have all our ducks in a row or we may corrupt some existing memory. This is going to write the 4 bytes that make up the variable `len` into memory at index 1, 2, 3, and 4. The key to making that work is that we are going to need to leave those 4 bytes empty when we insert our value from the runner.

### Runner
```rust
use wasmer_runtime::{
    Ctx,
    imports,
    Instance,
    instantiate,
};

use std::{
    fs::File,
    io::Read,
    path::PathBuf,
};

fn main() {
    // This part hasn't change at all!
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                .join("target")
                .join("wasm32-unknown-unknown")
                .join("debug")
                .join("really_dumb_plugin.wasm");
    let mut wasm = Vec::new();
    let mut f = File::open(path)
                .expect("Failed to open wasm file");
    f.read_to_end(&mut wasm)
                .expect("Failed to read wasm file");
    let instance = instantiate(&wasm, imports!{})
                .expect("failed to instantiate wasm module");
    let context = instance.inst.context();
    let memory = context.memory(0);
    let view: Vec<Cell<u8>> = memory.view();
    let s = "supercalifragilisticexpialidocious".to_string();
    let bytes = s.as_bytes();
    let len = bytes.len();
    // Our changes start here by starting our input value at byte 5
    // instead of byte 0
    for (cell, byte) in view[5..len + 5].iter().zip(bytes.iter()) {
        cell.set(byte)
    }
    let length = instance.func::<(i32, u32), i32>("_double")
                            .expect("Failed to bind _length");
    // We update the `ptr` parameter to be 5 as well
    let ptr = length.call(5 as i32, len as u32);
    // We create a container for our new length bytes
    let mut new_len_bytes = [0u8;4];
    for i in 0..4 {
        let idx = i + 1;
        new_len_bytes[i] = view.get(idx)
                        .map(|c| c.get())
                        .expect("Failed to get length part");
    }
    // Convert the bytes into a single u32
    let new_len = u32::from_ne_bytes(new_len_bytes);
    // determine the end by adding the new length
    // to the pointer
    let end = ptr as usize + new_len;

    let wasm_bytes = &view[ptr as usize..end];
    let doubled = String::from_utf8(wasm_bytes)
                    .expect("Failed to extract string from memory");
    println!("original: {:?}, doubled: {:?}", string, doubled);
}
```

Huzzah! Success... and it is far more robust that before. If we executed a wasm module that exported `_double` that actually tripled a string or cut the string in half, we would still know the correct length. Now that we can pass arbitrary sets of bytes from rust to wasm that means we have to tools to pass more complicated data. All we need now is a way to turn any struct into bytes and then back again, for that we can use something like [`bincode`](https://github.com/TyOverby/bincode) which is a binary serialization format used by [WebRender](https://github.com/servo/webrender) and [Servo's ipc-channel](https://github.com/servo/ipc-channel). It implements the traits defined by the [`serde`](https://serde.rs/) crate which greatly opens our options.

Since there are a bunch of `serde` trait implementations for a bunch of standard rust types including strings and tuples, let's leverage that to create one more dumb example. First we need to update our Cargo.toml

```toml
[package]
name = "really-dumb-plugin"
version = "0.1.0"
authors = ["freemasen <r@wiredforge.com>"]
edition = "2018"

[lib]
crate-type = ["cdylib"]

[dependencies]
serde = "1"
bincode = "1"
```
Now we can leverage serde and bincode from our plugin.

### Plugin
```rust
use bindcode::deserialize;
use serde::Deserialize;

fn multiply(pair: (u8, String)) -> String {
    pair.1.repeat(pair.0)
}

fn _multiply(ptr: i32, len: u32) -> i32 {
    // pull the bytes our of memory
    let slice: &[u8] = unsafe { ::std::slice::from_raw_parts(ptr as _, len as _) };
    // Deserialize them into a tuple
    let pair = deserialize(slice).expect("Failed to deserialize pair");
    // pass that along
    let ret = multiply(pair);
    let len = ret.len() as u32;
    // write the length to byte 1 in memory
    unsafe {
        ::std::ptr::write(1 as _, len);
    }
    ret.as_ptr() as _
}
```

This time when we take in our `ptr` and `len` arguments, we pass those along to `::std::slice::from_raw_parts` which creates a reference to our bytes. After we get those bytes we can deserialize them into a tuple of a u8 and a string. At this point we are going to follow the same path as before. To get the runner up to date with these changes we also need to update the Cargo.toml there.

### Cargo.toml
```toml
[package]
name = "really-dumb-plugin-runner"
version = "0.1.0"
authors = ["freemasen <r@wiredforge.com>"]
edition = "2018"

[dependencies]
wasmer_runtime = "0.3.0"
serde = "1"
bincode = "1"
```

Now with that we can serialize our data into bytes

### Runner
```rust
use wasmer_runtime::{
    Ctx,
    imports,
    Instance,
    instantiate,
};

use serde::Serialize;
use bincode::serialize;

use std::{
    fs::File,
    io::Read,
    path::PathBuf,
    time::{
        SystemTime,
        UNIX_EPOCH
    },
};

fn main() {
    // This part hasn't change at all!
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                .join("target")
                .join("wasm32-unknown-unknown")
                .join("debug")
                .join("really_dumb_plugin.wasm");
    let mut wasm = Vec::new();
    let mut f = File::open(path)
                .expect("Failed to open wasm file");
    f.read_to_end(&mut wasm)
                .expect("Failed to read wasm file");
    let instance = instantiate(&wasm, imports!{})
                .expect("failed to instantiate wasm module");
    let context = instance.inst.context();
    let memory = context.memory(0);
    let view: Vec<Cell<u8>> = memory.view();
    // Changes start here
    // Generate a random number between
    // 1 and 10
    let now = SystemTime::now();
    let timestamp = now.duration_since(UNIX_EPOCH).expect("Failed to calculate timestamp");
    let num = (timestamp.as_millis() % 10 as u32) + 1;
    let pair = (num, "repeat".to_string());
    let bytes = serialize(&pair).expect("Failed to serialize pair");
    // Material changes end here
    let len = bytes.len();
    for (cell, byte) in view[5..len + 5].iter().zip(bytes.iter()) {
        cell.set(byte)
    }
    let length = instance.func::<(i32, u32), i32>("_double")
                            .expect("Failed to bind _length");
    let ptr = length.call(5 as i32, len as u32);
    let mut new_len_bytes = [0u8;4];
    for i in 0..4 {
        let idx = i + 1;
        new_len_bytes[i] = view.get(idx)
                        .map(|c| c.get())
                        .expect("Failed to get length part");
    }
    // Convert the bytes into a single u32
    let new_len = u32::from_ne_bytes(new_len_bytes);
    // determine the end by adding the new length
    // to the pointer
    let end = ptr as usize + new_len;

    let wasm_bytes = &view[ptr as usize..end];
    let multiplied = String::from_utf8(wasm_bytes)
                    .expect("Failed to extract string from memory");
    println!("original: {:?}, multiplied: {:?}", string, multiplied);
}
```

For the changes this time we start with importing the required items to serialize our value via bincode. Next we are going to replace our string with a tuple, we will generate a pseudo random number between 1 and 10 for the first property and set the second property to the string "repeat". With that taken care of we use the `bincode::serialize` function to convert that tuple into a `Vec<u8>`, now we are back the the path we were on last time.

If we run these examples should see

```
cargo run
original: "repeat", multiplied: "repeatrepeatrepeatrepeatrepeat"
```

Huzzah! Another success! At this point it might be a good idea to address the elephant in the room, if we asked another developer to understand all of this, do you think anyone would build a plugin for our system? Propbably not, in the next post we are going to cover how to ease that process by leveraging `proc_macros` and even look at some more real world examples.

[part three](./wasmer_plugin_pt_3.md)