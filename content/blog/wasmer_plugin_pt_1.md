+++
title = "Using Wasmer for Plugins Part 1"
date = 2019-05-30
draft = true
[extra]
snippet = "Rust to wasm and back again"
image = "rust-logo-blk.png"
date_sort = 20190530
image_desc = "Made by Freepik from www.flaticon.com, licensed by CC-3.0-BY"
+++

A few months ago, the [Wasmer](https://wasmer.io) team announced a Web Assembly (aka wasm) interpreter that could be embedded into rust programs. This is particularly exciting for anyone looking for to providing an avenue to add plugins to their project. Current the Web Assembly specification only allows for the existence of numbers, with just that our plugin's wouldn't be particularly useful. The Web Assembly target for rust is already capable to dealing with more complicated data within any given function, however crossing the Web Assembly boundary we are stuck with this limitation. Let's start with an example of a plugin that just deals with these numbers so we can better understand where that boundary lies.

### Plugin
```rust
#[no_mangle]
pub fn add(one: i32, two: i32) -> i32 {
    one + two
}
```

The above is an extremely naive and uninteresting example of what a plugin might look like but it sticks into our requirement that it only deals with numbers. Now to get this to compile to Web Assembly, we would need to set a few more things up. First, we need to make sure that rust knows about Web Assembly we can do that via `rustup`

```
rustup target add wasm32-unknown-unknown
```

This will add all of the things that rustc/cargo will need to compile your rust code into a `wasm` file. The next thing we need to do is update the `Cargo.toml` for this library. 

### Cargo.toml
```toml
[package]
name = "really-dumb-plugin"
version = "0.1.0"
authors = ["freemasen <r@wiredforge.com>"]
edition = "2018"

[lib]
crate-type = ["cdylib"]
```

The key here is the `crate-type = ["cdylib"]`, which say that we want this crate to be compiled as a C dynamic library. Now we can compile it with the following command

```
cargo build --target wasm32-unknown-unknown
```

At this point we should have a file in `./target/wasm32-unknown-unknown/debug/really_dumb_plugin.wasm`. Now that we have that, let's build a program that will run this, first we will get our dependencies all setup.

### Cargo.toml
```toml
[package]
name = "really-dumb-plugin-runner"
version = "0.1.0"
authors = ["freemasen <r@wiredforge.com>"]
edition = "2018"

[dependencies]
wasmer_runtime = "0.3.0"
```
Here we are adding the `wamer_runtime` crate which we will use to interact with our web assembly module.

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
    // Setup the path the the .wasm file
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                .join("target")
                .join("wasm32-unknown-unknown")
                .join("debug")
                .join("really_dumb_plugin.wasm")
    // read all the bytes into a Vec<u8>
    let mut wasm = Vec::new();
    let mut f = File::open(path).expect("Failed to open wasm file");
    f.read_to_end(&mut wasm).expect("Failed to read wasm file");
    // Instantiate the web assembly module
    let instance = instantiate(&wasm, imports!{}).expect("failed to instantiate wasm module");
    // Bind the add function from the module
    let add = instance.func::<(i32, i32), i32>("add").expect("failed to bind function add");
    // execute the add function
    let three = add.call(1, 2).expect("failed to execute add");
    println!("three: {}", three); // "three: 3"
}
```

At this point we could try and run this with `cargo run`, but we need to make sure that the additional `wasmer` dependencies. If your on MacOs or Linux you just need to make sure that you have cmake installed, for windows there are a few more things you need, checkout the [dependencies guide](https://github.com/wasmerio/wasmer#dependencies) for all the details. 

Now when we run `cargo run` it should successfully print `three: 3` in the terminal.

Huzzah, success! but that isn't super useful. Let's investigate what we would need to make it more useful.

1. Access to the WASM Memory before our function runs
1. A way to insert a more complicated data structure into that memory
1. A method to communicate where and what the data is to the wasm module
1. A system for extracting the update information from the wasm memory after the plugin is executed

First we need a way to initialize some value into the wasm module's memory before we run our function. Thankfully `wasmer_runtime` gives us a way to do exactly that. Let's update our example to take in a string and return the length of that string, this isn't going to be much more useful than our last example but we will get a little closer.

### Plugin
```rust
/// This is the actual code we would 
/// write if this was a pure rust
/// interaction
pub fn length(s: &str) -> u32 {
    s.len() as u32
}

/// Since it isn't we need a way to
/// translate the data from wasm
/// to rust
#[no_mangle]
pub fn _length(ptr: i32, len: u32) -> u32 {
    // Extract the string from memory.
    let value = unsafe { 
        String::from_raw_parts(ptr as *mut u8, len as usize, len as usize)
    };
    //pass the value to `length` and return the result
    length(&value)
}
```

There is quite a bit more that we needed to do this time around, let's go over what is happening. First we have defined a function `length`, this is exactly what we would want to if we were using this library from another rust program. Since we are using this library as a wasm module, we need to add a helper that will deal with all of the memory interactions. This may seem like an odd structure but this doing it this way allows for additional flexibility which will become more clear as we move forward. The `_length` function is going to be that helper. First, we need the arguments and return values to match what is available when crossing the wasm boundary (only numbers). Our arguments then will the the shape of our string, `ptr` is the start of the string and `len` is they length. Since we are dealing with raw memory, we need to do the conversion inside of an `unsafe` block (I know that is a bit scary but we are going to make sure that there actually is a string there in just a moment). Once we pull the string out of memory, we can pass it over to `length` just like normal, returning the result of that function. Go ahead and build it just like before.

```
cargo build --target wasm32-unknown-unknown
```

Now let's cover how we would do this on the other side.

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
    let mut f = File::open(path).expect("Failed to open wasm file");
    f.read_to_end(&mut wasm).expect("Failed to read wasm file");
    let instance = instantiate(&wasm, imports!{}).expect("failed to instantiate wasm module");
    // The changes start here
    // First we get the module's context
    let context = instance.inst.context();
    // Then we get memory 0 from that context
    // web assembly only supports one memory right
    // now so this will always be 0.
    let memory = context.memory(0);
    // Now we can get a view of that memory
    let view: Vec<Cell<u8>> = memory.view();
    // This is the string we are going to pass into wasm
    let s = "supercalifragilisticexpialidocious".to_string();
    // This is the string as bytes
    let bytes = s.as_bytes();
    // Our length of bytes
    let len = bytes.len();
    // loop over the wasm memory view bytes
    // and also the string bytes
    for (cell, byte) in view[0..len].iter().zip(bytes.iter()) {
        // set the wasm memory byte to 
        // be the value of the string byte
        cell.set(byte)
    }
    // Bind our helper function
    let length = instance.func::<(i32, u32), u32>("_length").expect("Failed to bind _length");
    let wasm_len = length.call(0 as i32, len as u32);
    println!("original: {}, wasm: {}", len, wasm_len); // original: 34, wasm: 34
}
```

Ok, there is quite a bit more going on this time around. The first few lines are going to be exactly the same, we are going to read in the wasm and then instantiate it. Once that is done, we are going to get a view into the wasm memory, we do this by first getting the `Ctx` (context) from the module instance. Once we have the context we can pull out the memory by calling `memory(0)`, web assembly only has one memory currently so in the short term this will always take the value 0 but moving forward there may be more than one memory allowed. One last step to actually get the memory is to call the `view()` method on that, it is quite a few steps but we are finally at a stage where we can modify the module's memory. You may have noticed that the type of `view` is `Vec<Cell<u8>>`, so we have a vector of bytes but each of the bytes is wrapped in a `Cell`. A [`Cell`](https://doc.rust-lang.org/std/cell/struct.Cell.html) according to the documentation is a way to allow mutating one part of an immutable value, in our case it is essentially saying "I'm not going to make this memory any longer or shorter, just change what its values are". 

Now we define the string we want to pass into the wasm memory and convert that to bytes. We also want to keep track of the byte length of that string so we capture that as `len`

To update those values we are going to user the [`Zip`](https://doc.rust-lang.org/std/iter/struct.Zip.html) iterator, which just lets us loop over two things at one time. So in each iteration of our loop, we are going to stop at both the cell and the string byte setting the value of the cell to the value of the byte. 

Now that we have injected this value into the wasm memory, we can bind our `_length` function and execute it, with the arguments `ptr` being `0` and `len` being `32`. 

```
cargo run
original: 34, wasm: 34
```

Huzzah! Success again! But alas, still pretty useless. In the next post we are going to cover step 4 and how we can ease this process for plugin developers.

[part two](/blog/wasmer-plugin-pt-2/index.html)
