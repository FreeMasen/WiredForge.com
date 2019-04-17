+++
title = "Using Wasmer for Plugins Part 3"
date = 2019-05-30
draft = true
[extra]
snippet = "Now with more ease"
image = "rust-logo-blk.png"
date_sort = 20190530
image_desc = "Made by Freepik from www.flaticon.com, licensed by CC-3.0-BY"
+++

In the last two posts of this series we covered all of the things we would need to use [`Wasmer`](http://wasmer.io) as the base for a plugin system. In [part one](/blog/wasmer-plugin-pt-1/index.html) we went over the basics of passing simple data in and out of a web assembly module, in [part two](/blog/wasmer-plugin-pt-2/index.html) we dug deeper into how you might do the same with more complicated data. In this part we are going to how we might ease the experience for people developing plugins for our application. The first thing we want to do is make sure that [`bincode`](https://github.com/TyOverby/bincode) is available. We can do that by creating a library that provides some wrappers for the parts of `bincode` we want to use. In a new directory, let's create a library.

```
cargo new --lib plugin-helper
cd ./plugin-helper
```

That will generate our project, let's add `bincode` as a dependency.

### Cargo.toml
```toml
[package]
name = "plugin-helper"
version = "0.1.0"
authors = ["freemasen <r@wiredforge.com>"]
edition = "2018"

[dependencies]
serde = "1"
bincode = "1"
```

Now in our `./src/lib.rs` file we can define two public functions for interacting with bincode.

### lib.rs
```rust
use serde::{Serialize, Deserialize};
use bincode::{serialize, deserialize};

pub fn convert_data<'a, D>(bytes: &'a [u8]) -> D 
where D: Deserialize<'a> {
    deserialize(bytes).expect("Failed to deserialize bytes")
}

pub fn revert_data<S>(s: S) -> Vec<u8> 
where S: Serialize {
    serialize(s).expect("Failed to serialize data")
}
```

It would probably be smarter to have these return results but for now this will do. The big win here is that our users will only need to import our library and not need to worry about having `serde` and `bincode` available. Each of these mirror what the `bincode` `serialize` and `deserialize` methods look like, it will become clear in just a moment why these are useful. 

Now that we have our helper functions, we can get into the good stuff, a `proc_macro`. If you have never built one of these, it can seem intimidating but we will go slow so don't fret. The first thing to understand is that `proc_macro`s are _meta-programming_, meaning we are writing code that writes code. Currently there are 3 options to chose from when writing a `proc_macro` but they all follow the same basic structure. We are going to write a function that will take [`TokenStream`](https://doc.rust-lang.org/proc_macro/struct.TokenStream.html)s as arguments and return a `TokenStream`. A `TokenStream` is a collection of rust language parts, for example a keyword like `fn` or punctuation like `{`. It is almost like we are getting the text from a source file and returning a modified version of that text, though we get the added benefit of the fact that `rustc` is going to have validated it at least knows all of the words in that text and will only let us add words to it that it knows. To make this whole process a little easier, we are going to lean on a few of crates pretty heavily, they are [`syn`](https://crates.io/crates/syn),  [`proc-macro2`](https://crates.io/crates/proc-macro2), and [`quote`](https://crates.io/crates/quote).
`syn` is going to parse the `TokenStream` into a structure that has more information, it will help answer questions like 'is this a function?' or 'is this function public?'. Many parts of that's structure are provided by `proc-macro2`. `quote` is going to help us create a `TokenStream` by "quasi-quoting" some rust text, we'll get into what that means in just a moment.

Now that we have our dependencies outlined, let's talk about the three types of `proc_macro`s. First we have a _custom derive_, if you have ever use the `#[derive(Serialize)]` attribute, you have used a custom derive. For these, we need to define a function that takes a single `TokenStream` argument and returns a new token stream, this return value will be append to the one passed in. That mean's we can't modify the original code, only augment it with something like an `impl` block, which makes it great for deriving a trait. Another option is often referred to as _function like_ macros, these look just like the macros created with `#[macro_rules]` but are defined using a similar system to the custom derives. The big difference between custom derives and function like proc macros is the return value for the latter is going to replace the argument provided, not extend it. Lastly we have the _attribute like_ macros, this is the one we are going to use. Attribute macros work just like function like macros, however the function we write will take 2 arguments, the first of which will be defined in the attribute and the second is what that attribute is sitting on top of. To use the example from the rust book

```rust
#[route(GET, "/")]
fn index() {

}
```

The first argument is going to include `GET` and `"/"` and the second will contain the function. With that basic structure defined, let's get started with our example. First we want to add another crate to this workspace. In the same folder as our last library create another rust project.

```
cargo new --lib plugin-helper-macro
```

With that created, we want to edit our original Cargo.toml.

```toml
[package]
name = "plugin-helper"
version = "0.1.0"
authors = ["freemasen <r@wiredforge.com>"]
edition = "2018"

[dependencies]
serde = "1"
bincode = "1"

[workspace]
members = [
    "./plugin-helper-macro",
]
```

With that we can update our new project's Cargo.toml

```toml
[package]
name = "plugin-helper"
version = "0.1.0"
authors = ["freemasen <r@wiredforge.com>"]
edition = "2018"

[dependencies]
quote = "0.6"
proc-macro2 = "0.4"
syn = { version = "0.15", features = ["full"] }

[lib]
proc-macro = true
```

A few things to note here, first `syn` is pretty heavily feature gated, for this we want to add the "full" feature which will allow us to use all of the different types defined there. The next thing to point out is in the `[lib]` table we are going to add `proc-macro =  true` to tell cargo that this crate will only contain a proc_macro. Currently proc_macros need to be defined in their own crates. With that out of the way we can get started editing our `lib.rs`.

```rust
#[proc_macro_attribute]
pub fn plugin_helper(_attr: TokenStream, tokens: TokenStream) -> TokenStream {
    tokens
}
```

The above is a minimal proc_macro, it starts with the attribute `#[proc_macro_attribute]`, which will define an attribute with the same name as our function. This attribute currently does nothing but remove itself from the code. While this is totally useless, let's get a few more 