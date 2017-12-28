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

If we enter 12 in the left box and 32 in the right box the big endian value is 3104 while the little endian value is 8204. Whoa! that is a spread.

While it has been fun illustrating this very strange concept, let's get back to our task (combining two u8s into 1 u16).

I am expecting that we will need to perform this sort of operation more than once so why not break this out into its own function.

```rust
fn parse_u16(big_end: u8, little_end: u8) -> u16 {
    let left_16 = (big_end as u16) << 8;
    left_16 | little_end as u16
}
```
Ok, there are a few things to go over here. To start our function is going to take in two unsigned 8 bit integers, and returns an unsigned 16 bit integers.

Now we need to figure out how to put the value from `big_end` in the bits to the left of our return value and the `little_end` can essentially stay the same. To move our big end to the left we are going to shift the numbers bits to the left, that is what we are doing with the `<<` operator. In our header the big end was 4 which would be `0000 0100` and our little end was 0 which would be `0000 0000`. Our page size then would be `0000 0100 0000 0000`, the left shifting operator moves you bits over 8 places. Now to combine them we are using the `|`, which should be familiar from writing if statements. In this case the `|` will take the 1 bits from both sides and make a new number.

some examples of `|`
```
0000 0100 | 1000 0000 = 1000 0100
1111 0000 0000 0000 | 0000 0000 1111 0000 = 1111 0000 1111 0000
0000 0010 0000 0000 | 0000 0000 0000 000 = 0000 0010 0000 0000 (our example)
```
So now we have are on the same page with the operation, let's run the program.

```bash
$ cargo run
next_two: [4, 0]
page size: 1024
```
Looks good, we now have the page size at 1024 bytes. The next two entries in our header will tell us if SQLite is using the Write Ahead Log mode (2) or Legacy (1) mode for writing then reading. lets see what we have.

```rust
let write_mode = buf.get(19).expect("Unable to get write mode byte");
let read_mode = buf.get(20).expect("Unable to get read mode byte");
println!("Write: {:?}, Read: {:?}", write_mode, read_mode);
```
And when we run it.
```bash
next_two: [4, 0]
page size: 1024
Write: 1, Read: 1
```