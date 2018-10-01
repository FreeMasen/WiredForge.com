+++
title = "What is a Scanner"
date = 2018-10-01
draft = false
order = 1
tags = ["rust", "ecma", "javascript"]
[extra]
snippet = "The basic concepts behind a scanner's role in parsing code"
image = "rust-ecma.svg"
image_desc = "Rusty ECMA"
+++

After releasing the Rusty ECMA Script Scanner (RESS) 0.4, my next big effort in the Rust+Javascript space is to increase the amount of documentation. This post is an effort to clarify what RESS does and how someone might use it. 

The first thing to cover is to answer the question __What is a scanner's role in parsing code?__ The basic idea behind a scanner is to stand between the bare text of a code file and the component that will interpret the larger context (the parser). The idea here is to separate the process of reading text from determining the actual meaning of that text. Typically a scanner sits idly by until the parser asks for the next *token*. A *token* can be as simple as a single character or it can be more complicated like a word, it all depends on the scanner. For RESS I wanted to give a little more information, I ended up with 11 different distinct types of tokens.

## RESS Tokens
* Boolean - `true` or `false`
* End of File - The end of input
* Identifier - A variable, function, property or method name i.e. `Math`, `x`
* Keyword - A reserved word, something that carries additional meaning i.e. `var`, `function`, `while`
* Null - `null`
* Number - A number i.e. `-0.11`, `0xccc`, `0o777`, `0b101010`, `4e1123`
* Punctuation - A symbol that carries additional meaning i.e. `{`, `)`, `^`, `+`, `===`
* String - A quoted block of text i.e. `'use strict'`, `"stuff in quotes"`
* RegEx - A regular expression literal i.e. `/[a-zA-Z]+/g`
* Template - A string with values inside i.e. `` `please give me ${4} more pieces.` ``
* Comment - Text wrapped in `/* */` or preceded by `//` i.e. `//single line comment`, `/* single line multi-line comment */`

These are the different types of information that a word or symbol in a javascript file might represent. Let's use an example to illustrate what I mean.

```js
function print(message) {
    console.log(message)
}
```

The above javascript would be comprised of a series of tokens, like this.

1. `function` - Keyword
1. `print` - Identifier
1. `(` - Punctuation
1. `message` - Identifier
1. `)` - Punctuation
1. `{` - Punctuation
1. `console` - Identifier
1. `log` - Identifier
1. `(` - Punctuation
1. `message` - Identifier
1. `)` - Punctuation
1. `}` - Punctuation

Now that we have that basic idea, how would you use RESS? Essentially you would need to embed a RESS `Scanner` into a context aware service. It would be the parent service's job to be aware of the context that these tokens exist in. Let's say your work as a style guideline stating that no semi-colons should be used. You could build a validation utility to check for the existence of semi-colons in any js files that are included in the project.

First, let's create this project using `cargo`.

```sh
cargo new semi_finder
cd semi_finder
```

Then we will add RESS and `WalkDir` as dependencies.

### Cargo.toml
```toml
[package]
name = "semi_finder"
version = "0.1.0"
authors = ["Robert Masen <r@robertmasen.pizza>"]

[dependencies]
ress = "0.4"
walkdir = "2.2"
```

Now, add them to the project, we'll also need some stuff from `std` so I will add it here too.

### src/main.rs
```rust
extern crate ress;
extern crate walkdir;

use ress::{Scanner, Punct};
use walkdir::{WalkDir};

use std::{
    env::args,
    path::PathBuf,
};

fn main() {
    println!("Hello world!");
}
```

Next, let's write a function that will take in a js string, pass it to a `Scanner` and then check for any semi-colons. In the event we find a semi-colon, we will return `Result::Err(String)` to make things simple, ideally you would define your own error type. One thing to be aware of is that the `Scanner`'s `next` method will return an `Item` not just a `Token` this allow the caller to get the `Span` that this token exists in. A `Span` is just the start and end index in the string.

```rust
fn check_js(js: &str) -> Result<(), String> {
    // Create a scanner with the text
    let s = Scanner::new(js);
    // filter out any tokens that are not semi-colons
    // then collect them all into a `Vec` of the start index
    // for the semi-colon
    let semis: Vec<usize> = s.filter_map(|item| {
        // If this token matches the `Punct::SemiColon`
        if item.token.matches_punct(Punct::SemiColon) {
            // we want to return the first position of this token
            // since semi-colons are only 1 character wide we would
            // only need this part of the `Span`
            Some(item.span.start)
        } else {
            None
        }
    }).collect();
    // If we have anything in the result of the `filter_map`
    // we will return an error
    if  semis.len() > 0 {
        Err(format!("found semi-colons at the following indexes: {:?}", semis))
    } else {
        Ok(())
    }
}
```

Now that we can determine if any arbitrary javascript contains semi-colons, lets build a function that will loop over
a directory of files and checks each one.

```rust

```