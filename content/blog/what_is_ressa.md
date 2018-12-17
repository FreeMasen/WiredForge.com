+++
title = "What is RESSA"
date = 2018-12-17
draft = false
weight = 2
tags = ["rust", "ecma", "javascript"]
[extra]
snippet = "The basic use of the Rusty ECMAscript Syntax Analyzer"
image = "rust-ecma.svg"
image_desc = "Rusty ECMA"
date_sort = 20181217
+++

Now that I have released a minimal working version of [RESSA](https://github.com/FreeMasen/RESSA), it seems like a good time
to go over how someone might use it. RESSA is a library for parsing javascript from text into an abstract syntax tree (AST).
The target for this project is to enable users to build javascript
development tools with Rust.

Before we dig in too deep, it may be worth it to go back and read about [RESS](https://wiredforge.com/blog/rusty_ecma/what-is-a-scanner/index.html), which powers the core of RESSA. It isn't _required_ but it might be helpful. Where RESS covers the first part of the parsing process, _tokenization_, RESSA builds on that to evaluate what a set of tokens might represent. To be clear we are still just dealing with the _syntax_, no semantic meaning or evaluation will come into play.

The main point of entry for RESSA is the `Parser` struct, which takes in some javascript as a `&str` and converts that into an AST. There are two ways to construct a `Parser`, by using `Parser::new(&str)` or by using the `Builder` struct. The `new` method will give you a `Parser` setup with the default configuration, it will assume the `&str` should be parsed as a `Script` not a `Module`, it will not tolerate any errors and it will discard any `Comment`s it finds. The `Builder` method would allow you to customize these more ergonomically.

```rust
let mut p = Builder::new()
                .module(true)
                .tolerant(true)
                .js("console.log('things!');")
                .build()
                .expect("failed to create parser");
```
Once you have a `Parser` there are two ways to use it, the simplest way would be to call the `parse()` method, which returns a `Result<Program, Error>`, a `Program` is either a `Script` or `Module` containing a `Vec<ProgramPart>`. The other way to use it is as an iterator over `Result<ProgramPart, Error>`. As might be apparent, `ProgramPart` is the main building block of the tree, all complete sections of code will end up as a `ProgramPart` which has 3 variants.

- `Directive` - A literal at the top of a file or function
- `Declaration` - Any top level declaration like a `function` or `var` or `export`
- `Statement` - Any other javascript part

Looking over the list above, a directive is pretty straight forward - technically it could be an literal but the only one that has any semantic meaning is `'use strict'`. Declarations are top level items `function`, `class`, `var`, `let`, `const`, `import` and `export`, while most of these can appear below the top level, when they are at the top level they will be `Declarations` otherwise they would be `Statements`. Instead of just listing out all of the different possibilities, let's look at an example.

```js
function print(message) {
    console.log(message)
}
```

The above example, lifted from the RESS tutorial, when parsed by RESSA would look like this.

```rust
ProgramPart::Decl(
    Declaration::Function(
        Function {
            id: Some(String::from("print")),
            params: vec![
                FunctionArg::Pattern(
                    Pattern::Identifier(
                        String::from("message")
                    )
                )
            ],
            body: vec![
                ProgramPart::Statement(
                    Statement::Expr(
                        Expression::Call(
                            CallExpression {
                                callee: Box::new(
                                    Expression::Member(
                                        MemberExpression {
                                            object: Box::new(
                                                Expression::Ident(
                                                    String::from("console")
                                                )
                                            ),
                                            property: Box::new(
                                                Expression::Ident(
                                                    String::from("log")
                                                )
                                            ),
                                            computed: false,
                                        }
                                    )
                                ),
                                arguments: vec![
                                    Expression::Ident(
                                        String::from("message")
                                    )
                                ],
                            },
                        )
                    )
                )
            ],
            generator: false,
            is_async: false,
        }
    )
);
```
Whoa, that is quite a bit of information for three lines of code! Let's break it down a little, first we have our `ProgramPart::Decl` which will always contain a `Declaration`. A `Declaration` can be a few different things, in this case it is `Declaration::Function`, pretty straight forward so far. The `Function` has an `id` property that could be `None` but in this case it is "print", next are the params, params can be either a `Pattern` or `Expression` this param is a `Pattern` specifically a `Pattern::Identifier` named "message".

Now we are at the function body, A function body is a `Vec` of `ProgramPart`s in this case we have one `Statement` which is a `Statement::Expr` which will always contain an `Expression`. Our one expression here is an `Expression::Call`, meaning it is calling another function, inside of this variant we will have a struct `CallExpression`. A `CallExpression` has two properties the `callee` and the `arguments`, the callee can be any `Expression` so we need to wrap that in a `Box`, otherwise the compiler would tells us `Expression` could be infinatly sized which the compiler hates. Inside of our `Box` we have an `Expression::Member` which contains a `MemberExpression`, this is how we describe the action of accessing _members_ of something, so in `console.log` or `console['log']`, `log` is a member of `console`. a `MemberExpression` has three properties, `object` which is the parent, here it is "console", but since it _could_ be almost anything we first need to wrap it in an `Expression` and again with the compiler's distane for infinity we need to wrap that in a `Box`, inside our box is going to be an `Expression::Ident` with the value of "console". For the `property` we need to do a similar dance, we have a `Box` wrapping an `Expression::Ident` wrapping the value "log". The final property here is `computed`, this is a flag to indicate if we used index notation (`console['log']`) instead of dot notation (`cosole.log`), for this case it would be `false`. Moving on to the `arguments`, this will be a `Vec<Expression>`, in our case there is only one and it will be of type `Expression::Ident` with the value of "message". At this point we get to exit the function's body and go back to the `Function` properties `generator` and `is_async`, both of which are `false`.

Holy cow, that is **verbose**! The unfortunate truth is that javascript has so many corner cases to cover meaning to truely capture any part of a program requires this much information. Let's take the `MemberExpression` as an example, this needs to be able to represent almost any combination of literals and identifiers. Consider the following code block, it is an illustration of a large number of ways to represent `console.log`.

```js
console.log;
console['log'];
const logVar = 'log';
console[logVar];
console[['l','o','g'].join('')];
class Log {
    toString() {
        return 'log';
    }
}
const logToString = new Log();
console[logToString];
function logFunc() {
    return 'log';
}
console[logFunc()];
function getConsole() {
    return console
}
getConsole()[logFunc()];
getConsole().log;
```

And that's just what I could think of in this moment, imagine how many other possiblilities there might be. To handle all of that `RESSA` leans pretty heavily on `enum`s which is nice because it provides an inheriently structured kind of dynamic value. The two heavy lifters in this space are `Statement` and `Expression`, with these two structures `RESSA` is able to represent the nearly infinate possible combinations of tokens that would represent valid javascript.

At this point I would normally start a little example development tool and walk through how it works, however that would make this already long winded and dense post *significantly* longer. In the coming weeks I am hoping to create an [`mdbook`](https://github.com/rust-lang-nursery/mdBook) with one such example.