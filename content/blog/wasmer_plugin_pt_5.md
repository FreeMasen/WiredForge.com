+++
title = "Using Wasmer for Plugins Part 5"
date = 2019-05-10
draft = true
[extra]
snippet = "Debugging"
image = "rust-logo-blk.png"
date_sort = 20190510
image_desc = "Made by Freepik from www.flaticon.com, licensed by CC-3.0-BY"
+++
One of the biggest issues that we haven't yet covered, that I thought would be useful is a little more visibility into error handling. When we call a wasmer `func` it will always return a `Result` but the error messaging is less than ideal, for example.

```
cargo run -p example-runner
#TODO add error message here
```
Trapping is a concept that is used by assembly languages to describe error conditions but this is far lower than we care to deal with. Instead, wouldn't it be nice to get the Rust `Error` data when something goes wrong? To do  that we can use the import object to define a custom panic hook that our `proc_macro` will expose to the plugin application. While still not an ideal scenario, it is extremely valuable to, at least, get some diagnostic information from the plugin. First we want to define a function in our runner that will work as a member of our import object. 

```rust

```

The `func!` macro is going to take care of a lot of the setup for us, we can point it at a function that takes a mutable reference to the wasmer context as well as the message start pointer and length values. This will allow us to extract  