+++
title = "Using Wasmer for Plugins Part 4"
date = 2019-04-30
draft = true
[extra]
snippet = "Real world implementation"
image = "rust-logo-blk.png"
date_sort = 20190430
image_desc = "Made by Freepik from www.flaticon.com, licensed by CC-3.0-BY"
+++

In the last three posts of this series we covered all of the things we would need to use [`Wasmer`](http://wasmer.io) as the base for a plugin system. In [part one](/blog/wasmer-plugin-pt-1/index.html) we went over the basics of passing simple data in and out of a web assembly module, in [part two](/blog/wasmer-plugin-pt-2/index.html) we dug deeper into how you might do the same with more complicated data. In the [last part](/blog/wasmer-plugin-pt-3/index.html) we eased the experience of plugin developers by encapsulating all of our work into a library that exports a procedural macro. In this post we are going to explore what it would take to extend an existing plugin system to allow for wasm plugins. 

Before we get started with any code, we should first go over [mdbook](https://github.com/rust-lang-nursery/mdBook) a little bit. If you are not familiar, mdbook is an application that enables its users to create books using markdown files and a toml file for configuration. You are probably familiar with the format because [TRPL](https://doc.rust-lang.org/book/index.html) is built using it and while HTML is probably the most popular output it has the ability to render into a few other formats. These other formats are provided through a plugin system which has two sides, preprocessors and renderers. Each side is really aptly named, the preprocessors will get the information first then the renderer will get the information last. Both types of plugins communicate with the main mdbook process via stdin and stdout. The basic workflow is that mdbook will read in the book and it's contents from the file system, generate a struct that represents that book and then serializes it to json and pipes it to a child process. If that child process is a preprocessor, it will deserialize, update, re-serialize and then pipe that back, if it is a render it will deserialize and then render that however it likes. At this point, we are going to focus on the preprocessor because wasm isn't currently a great candidate for dealing with the file system or network and the preprocessor doesn't need any of that. 

In the [official guide](https://rust-lang-nursery.github.io/mdBook/for_developers/preprocessors.html) the mdbook team outlined the basic structure as being an struct that implements the trait `Preprocessor` which requires two methods `name`, `run` and allows an optional method `supports` which by default returns true. The main entry point being the `run` method, which take a `PreprocessorContext` and a `Book` and returns a `Result<Book>`. While this is a good start, because it provides a nice structure to adhere to, in actuality there are a few more things we need to do. First, we need to have this implementation inside of a command line application and that it can support running with no arguments as well as with the `supports` argument. If the supports argument is provided, the application should use the exit status code to indicate if it does support a particular renderer. If no argument was provided we would then deserialize the context and book provided from stdin (as a tuple). Once those two values are acquired, you can pass them off to your implementation of preprocessor's run method and then serialize the book it returns and send that back out to stdout. Let's quickly look at what a preprocessor might look like if it just updates any references to WASM as Wasm (because wasm isn't an acronym). For this example, we are going to update the runner. First we want to add a few more dependencies, namely mdBook, docopt, serde and serde_derive.

``` toml
# ./Cargo.toml
[package]
name = "mdbook-wasmer-plugin-example"
version = "0.1.0"
authors = ["rfm <r@robertmasen.pizza>"]
edition = "2018"

[dependencies]
mdbook = { git = "https://github.com/rust-lang-nursery/mdBook" }
docopt = "1"
serde = "1"
serde_derive = "1"
serde_json = "1"
```
Two things to point out here, first is that we are updating the name of this program to have a prefix of `mdbook-` this is a requirement of any mdbook preprocessor, the other is that we are using mdbook as a git dependency. As of the writing of this post there is an issue with their handlebars dependency that would make the library fail to compile to wasm. The next version of mdbook will not include this problem but for now, this example will need to work with the git repository instead of crates.io. We are going to use docopt for command line argument parsing but you could just as easily use clap or DIY it if you'd prefer. 

> Note: This example is going to remove a lot of the wasmer-runtime stuff from our program for readability (you may want to keep some of it around for later).

```rust
// ./crates/example-runner/src/main.rs
use docopt::Docopt;
use serde::Deserialize;
use serde_json::{
    from_reader, 
    to_writer,
};
use std::{
    process::exit,
    io::{
        stdin,
        stdout,
    }
};
use mdbook::{
    book::{
        Book,
        BookItem,
    },
    preprocess::PreprocessorContext,
};

static USAGE: &str = "
Usage:
    mdbook-wasm-preprocessor
    mdbook-wasm-preprocessor supports <supports>
";

#[derive(Deserialize)]
struct Opts {
    pub arg_supports: Option<String>,
}

fn main() {
    // Parse and deserialize command line
    // arguments
    let opts: Opts = Docopt::new(USAGE)
                    .and_then(|d| d.deserialize())
                    .unwrap_or_else(|e| e.exit());
    // If the arg supports was include
    // we need to handle that
    if let Some(_renderer_name) = opts.arg_supports {
        // This will always resolve
        // to `true` for mdbook
        exit(0);
    }
    // Parse and deserialize the context and book
    // from stdin
    let (ctx, book): (PreprocessorContext, Book) = 
        from_reader(stdin())
        .expect("Failed to deserialize context and book");
    // Update the book's contents
    let updated = preprocess(ctx, book)
        .expect("Failed to preprocess book");
    // serialize and write the updated book
    // to stdout
    to_writer(stdout(), &updated)
        .expect("Failed to serialize/write book");
}

/// Update the book's contents so that all WASMs are
/// replaced with Wasm
fn preprocess(_ctx: PreprocessorContext, mut book: Book) -> Result<Book, String> {
    // Iterate over the book's sections assigning
    // the updated items to the book we were passed
    book.sections = book.sections.into_iter().map(|s| {
        // each section could be a chapter
        // or a seperator
        match s {
            // if its a chapter, we want to update that
            BookItem::Chapter(mut ch) => {
                // replace all WASMs with Wasms
                ch.content = ch.content.replace("WASM", "Wasm");
                // Wrap the contents back up into a Chapter
                BookItem::Chapter(ch)
            },
            _ => s,
        }
    }).collect();
    // Return the updated book
    Ok(book)
}
```

If you have never used docopt, it essentially uses command line usage text as a serialization format. To start we are going to define our usage, note here that the mdbook- prefix is required to make a preprocessor actually work. With that done we can declare the struct that will represent the deserialized command line arguments. Docopt uses a prefix scheme for flags vs sub-commands vs arguments, for this we want to have a field `arg_supports` that will be an optional string. Now we can actually get into the execution, first we pass the usage off to docopt and exit early if it fails to parse. Next we want to check if the caller provided the supports argument, if so we are just going to exit early with 0 which just says yes, we support this format. Once we are through that we can use the serde_json function deserialize_from to both read stdin and also serialize it into a tuple with a context first and the book second. Now that we have those two items we are going to pass them along to the function preprocess. 

For this preprocessor, we are going loop over all of the sections and any chapters we find we are going to update the contents of those to replace any "WASM"s with "Wasm"s. After we update all of those we are going to use the serde_json function serialize_to to serialize this book to json and write that to stdout. As you can see, this is both a powerful system but also one that requires plugin developers to know quite a bit about how everything works. After building a [preprocessor](https://github.com/FreeMasen/mdbook-presentation-preprocessor) myself and then hearing about wasmer-runtime I immediately started thinking about how it could be used to make that process easier.

The first try was to build one of these command line preprocessors that would execute wasm preprocessors as a stand alone project. Unfortunately I quickly learned that wouldn't work, the main issue being the amount that mdbook has to interact with the file system. By just including mdbook in a plugin project, you need to be able to compile a crate called samefile which has some architecture based implementations that only support redox, unix and windows. Let's fork mdbook then and create a scenario that will allow us to do what we want if nothing else it will be a good proof of concept.

Currently mdbook is one crate with a library and a binary 