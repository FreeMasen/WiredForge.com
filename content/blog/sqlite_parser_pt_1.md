+++
date = "2017-10-12"
slug = "sqlite1"
tags = ["sqlite", "integer-storage", "decoding"]
[extra]
snipet = "This is the first in a series of posts describing the process of building a SQLite file parser"
image = "sqlite.gif"
+++

This is the first in a series of posts describing the process of building a SQLite file parser.

For those who don't know, SQLite is a relational database engine that utilizes a single file
instead of

``` rust

fn parse_u16(big: u8, little: u8) -> u16 {
    Wrapping(big as u16).0 << 8 |
    little as u16
}
```

> things and stuff

