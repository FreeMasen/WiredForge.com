+++
title = "SQLite Parser Pt. 2: The Header... continues"
date = "2017-12-26"
slug = "sqlite2"
draft = true
tags = ["sqlite", "integer-storage", "decoding"]
[extra]
snipet = "This is the second in a series of posts describing the process of building a SQLite file parser"
image = "sqlite.gif"
series = [{title = "SQLite Parser Pt. 1: The Header", link = "/blog/sqlite1/index.html"},
{title = "SQLite Parser Pt. 2: The Header... continues",link = "/blog/sqlite2/index.html"}
]
+++
This is the second in a series of posts describing the process of building a SQLite file parser. A GitHub repo of the finished code can be found [here](https://github.com/FreeMasen/sqlite_parser/tree/wired_forge_pt2)


Continuing from where we left off, we need to figure out what the rest of the
first 100 bytes are supposed to look like. Digging further into the documentation,
the next entry in the header is defined as:

<table class="doc-table">
    <tr>
        <th>offset</th>
        <th>bytes</th>
        <th>desc</th>
    </tr>
    <tr>
        <td class="number-cell">16</td>
        <td class="number-cell">2</td>
        <td>The database page size in bytes. Must be a power of two between 512 and 32768 inclusive, or the value 1 representing a page size of 65536.</td>
    </tr>
</table>

There is a lot to unpack here. First, our position is at offset 16 (with an index starting at 0) which means that it should be butted right up against the magic string from the last post. Next, the length should be 2 bytes, sounds easy enough(?). By adding the following to our current main method, we should see the next two bytes.

```rust
let next_two = buf.get(16..18).expect("Unable to slice of next two");
println!("next_two: {:?}", next_two);
```
Running our program should now output.

```bash
$ cargo run
next_two: [4, 0]
```

Now that we have our value, let's dig into the description. The important parts here is that we should expect the total page size to be between 512 and 32768 or 1. Looking at our output `[4, 0]` we need to figure out how to combine these two numbers. Further down the documentation gives us a good hint on how to make this work:

> ...this value is interpreted as a big-endian integer...

The key here that the number is big-endian, for those in the know about about endianness, feel free to skip ahead.

If you have made it this far, you probably know that all numbers need to be somehow representable in binary and if a byte is 8 bits, it would look something like this.
```
0000 0001 = 1
0000 0011 = 3
0010 1100 = 44
1010 1010 = 170
```
When we get bigger than 8 bits, it gets more complicated. Some people seem to believe that if you had two separate bytes to define one number then the bigger half should be to the left of the smaller half while others believe that the bigger half should be to the right of the smaller half. I don't really care why anyone would be in either camp but the consequence is we need to know about it.

Here is a little tool to illustrate the difference.

{{ endian() }}

.that was fun... but lets get back to the task.

Since we will probably need to do this a bunch, let's pull
this out into its own function

```rust

fn parse_u16(big_end: u8, little_end: u8) -> u16 {
        (big_end as u16) << 8 | little_end as u16
}
```

Let's unpack this a little.

First, our operation `<<`, this is the symbol that someone deciede would be a binary shift operator. Binary shifts only make sense if you can really think in binary... but examples also help.

```rust
let start: Wrapping<u16> = 1; // 0000 0000 0000 0001
let shift_left: Wrapping<u16> = start << 8; //0000 0001 0000 0000
let shift_right: Wrapping<u16> = start >> 4; //0001 0000 0000 0000

```

the Wrapping import allows us to wrap any overflowing number to the
lowest option before continuing. To give an example:
```
255 + 1 = 0
```
Since we know that our big_end will never actually get bigger than 255, we don't have to worry about growing larger than a u16 can handle. The Rust compiler, like most compilers, doesn't know that we can make that promise so we have to give it an out, in case we don't hold up our end of the bargin. Other languages would make this the default behavior or throw a runtime exception but the Rust team has decided that this should be a compiler error so we are going to have to just deal with that.