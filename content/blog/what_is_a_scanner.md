+++
title = "What is RESS"
date = 2018-10-02
draft = false
weight = 1
tags = ["rust", "ecma", "javascript"]
[extra]
snippet = "The basic use of the Rusty ECMAscript Scanner"
image = "rust-ecma.svg"
image_desc = "Rusty ECMA"
date_sort = 20181002
+++

After releasing the Rusty ECMA Script Scanner (RESS) 0.5, my next big effort in the Rust+Javascript space is to increase the amount of documentation. This post is an effort to clarify what RESS does and how someone might use it.

The first thing to cover is to answer the question *What is a scanner's role in parsing code?* The basic idea behind a scanner is to stand between the bare text of a code file and the component that will interpret the larger context (most likely a parser). The idea here is to separate the process of reading text from determining the actual meaning of that text. A scanner typically provides a series of *token*s to
whoever is using it. A *token* can be as simple as a single character or it can be more complicated like a word, it all depends on the scanner. For RESS I wanted to give a little more information than a single character and I ended up with 11 distinct tokens.

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

the above javascript as tokens would look like this.

1. `function` - Keyword
2. `print` - Identifier
3. `(` - Punctuation
4. `message` - Identifier
5. `)` - Punctuation
6. `{` - Punctuation
7. `console` - Identifier
8. `.` - Punctuation
9. `log` - Identifier
10. `(` - Punctuation
11. `message` - Identifier
12. `)` - Punctuation
13. `}` - Punctuation

It might seem foreign to think about any code like this since we typically thing about larger parts of our code, like functions definitions or variable assignments. Eventually, any parser would get to that level but we are working one step below that. Normally the scanner sits
idly by until the parent process asks for another token, this makes it a great fit for implementing the rust `Iterator` trait. This is exactly
how the `Scanner` works, you can create a new scanner with text and then loop over its results.

```rust

extern crate ress;
use ress::{Scanner};
fn main() {
    let js = "function print(message) {
        console.log(message)
    }";
    let scanner = Scanner::new(js);
    for item in scanner {
        println!("{:?} ", item.token);
    }
}
```

The above program would output the following.
```sh
Keyword(Keyword::Function)
Ident(Ident("print"))
Punct(Punct::OpenParen)
Ident(Ident("message"))
Punct(Punct::CloseParen)
Punct(Punct::OpenBrace)
Ident(Ident("console"))
Punct(Punct::Period)
Ident(Ident("log"))
Punct(Punct::OpenParen)
Ident(Ident("message"))
Punct(Punct::CloseParen)
Punct(Punct::CloseBrace)
```
One of the nice things about the rust `Iterator` trait is the amount of stuff you get for free once you have implemented it. You can
use `filter` or `map` with it, you can even `collect` it up into a `Vec`, right out of the box.


Now that we have that basic idea about how RESS works, it might not seem super helpful all by itself. To build something with `RESS` you would need to embed a `Scanner` into something that knows about the larger context. It would be the parent's job to tie all of the tokens together into something more useful. Let's build something to see more about what I mean.

For this example we are going to build a tool to help a team of JS developers to stick to a very simple style guideline "no semi-colons should be used". This should be pretty straight forward since the only context we care about is that no semi-colons are allowed, so either all of the tokens pass or all the tokens fail.

To get started, let's create this project using `cargo`.

```sh
cargo new semi_finder
cd semi_finder
```

Then we will add `ress` and, since I want to be able to evaluate a whole directory of files, `walkdir` as dependencies. If you are not
familiar with `walkdir` it is a library for easily dealing with file system directories and their contents.

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

### src/main.rs
```rust
extern crate ress;
extern crate walkdir;
```

Once we have them added, we can import the things we want to use from them. From `ress` we are going to need the `Scanner`
and the `Punct` since the semi-colon is a variant of a `Punct`. From `walkdir` we are going to use the `WalkDir` struct. Finally
from the standard library we need `collections::HashMap` to allow us to keep track of the files that have semi-colons,
`env::args` to get the arguments from the command line, `fs::read_to_string` to easily read a file into a string, and
`path::PathBuf` to pass our paths around. All of that would look like this.

```rust
use ress::{Punct, Scanner};
use walkdir::WalkDir;

use std::{
        collections::HashMap,
        env::args, 
        fs::read_to_string,
        path::PathBuf
};
```

Next, let's write a function that will take in a js string, pass it to a `Scanner` and then check for any semi-colons. If we find any semi-colons, we are going to add it's index to a `Vec` that will get returned when we are done.

```rust
fn check_js(js: &str) -> Vec<usize> {
    // Create a scanner with the text then
    // filter out any tokens that are not semi-colons
    // then collect them all into a `Vec` of the start indexes
    Scanner::new(js).filter_map(|item| {
            // If this token matches the `Punct::SemiColon`
            if item.token.matches_punct(Punct::SemiColon) {
                // we want to return the first position of this token
                // since semi-colons are only 1 character wide we would
                // only need this part of the `Span`
                Some(item.span.start)
            } else {
                None
            }
        }).collect()
}
```

Now that we can determine if any arbitrary javascript contains semi-colons, let's build a function that will loop over
a directory of files and checks each one. This time we are going to collect all of our results into a `HashMap` with the path
as the key and the list of semi-colon indexes as the value.

```rust
fn check_files(start: String) -> HashMap<PathBuf, Vec<usize>> {
    // We are going to store the location of any semi-colons we have found
    let mut ret: HashMap<PathBuf, Vec<usize>> = HashMap::new();
    // loop over the directories in our path
    // set the min_depth to 1, so we will skip the
    // path passed in as `start`
    for entry in WalkDir::new(start).min_depth(1) {
        match entry {
            Ok(entry) => {
                // If the entry doesn't error
                // capture the path of this entry
                let path = entry.path();
                //if the path ends with js, we want to check for semicolons
                if path.extension() == Some(::std::ffi::OsStr::new("js")) {
                    // if we can read the file to a string
                    // pass the text off to our check_js fn
                    // if we can't we'll just skip it for now
                    if let Ok(js) = read_to_string(path) {
                        let indexes = check_js(&js);
                            // if we found any semicolons, add them to our hashmap
                            if !indexes.is_empty() {
                                ret.insert(path.to_path_buf(), indexes);
                            }
                    }
                }
            },
            Err(e) => eprintln!("failed to get a directory entry: {:?}", e),
        }
    }
    ret
}
```

At this point all we have left to do is provide a small CLI for it. Let's update `main` to include the following. It is a bit of a naive approach to parsing arguments but we don't really need much.

```rust
fn main() {
    // get the command line arguments that started this process
    let mut args = args();
    // discard the first argument, this will be the path to our
    // executable
    let _ = args.next();
    // The next argument will be the path to check
    // display an error to the user if no path
    // was provided and exit early
    let start = if let Some(start) =  args.next() {
        eprintln!("No directory provided as starting location.");
        return;
    }
    // Pass the argument off to our `check_files` function
    let issues = check_files(start);
    // If no issues were found
    if issues.is_empty() {
        // Print the success message
        println!("Good to go, no semicolons found");
    } else {
        // Otherwise loop over the hashmap and 
        // tell the user where we found semi-colons that need to be
        // removed
        for (path, indexes) in issues {
            println!("{} issues found in {:?} at indexes:", indexes.len(), path);
            println!("\t{:?}\n", indexes)
        }
    }
}
```

To test all this out let's put a file in our project root called `js` and add a file called `file.js` with the following.

```js
function hideContent(el) {
    console.log('hideContent', el);
    let content = el.parentElement.children[1]
    console.log(content)
    let currentClass = content.getAttribute('class')
    let newClass;
    if (currentClass.indexOf('hidden') > -1) {
        newClass = currentClass.replace(' hidden')
    } else {
        newClass = currentClass + ' hidden'
    }
    content.setAttribute('class', newClass);
}
```

Then run the following to evaluate the file.

```sh
cargo run -- ./js/
3 issues found in "./path/to/js/file.js" at indexes:
        [62, 209, 421]
```

Looks like it is working just fine! It might be nice to have a method to go from an index to a line and column number but I think that might be for version 2.


In the process of putting this post together I have added the above code to the examples for RESS. You can find the full file [here](https://github.com/FreeMasen/RESS/blob/8b8abfa61d1a0273c1502031669262e29f69a6c5/examples/semi_finder/src/main.rs). If you have RESS cloned on your computer and you wanted to try this example out you can do so with the following command


```sh
cargo run --example semi_finder -- ./path/to/js
```

Next post, I plan on covering [`ressa`](https://github.com/freemasen/ressa) which uses `ress` move up to the next level of a parser's job.