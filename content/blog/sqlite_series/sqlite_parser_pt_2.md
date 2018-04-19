+++
title = "SQLite Parser Pt. 2: The Header... continues"
date = 2017-12-29
draft = true
tags = ["sqlite", "integer-storage", "decoding"]
[extra]
snippet = "This is the second in a series of posts describing the process of building a SQLite file parser"
image = "sqlite.gif"
image_desc = "SQLite Logo"
series = [{title = "SQLite Parser Pt. 1: The Header", link = "/blog/sqlite1/index.html"},
#{title = "SQLite Parser Pt. 2: The Header... continues",link = "/blog/sqlite2/index.html"},
#{title = "SQLite Parser Pt. 3: The Header... reorganized",link = "/blog/sqlite3/index.html"}
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
When we get bigger than 8 bits, it gets more complicated. Some people seem to believe that if you had two separate bytes to define one number then the bigger half should be to the left of the smaller half while others believe that the bigger half should be to the right of the smaller half. I don't really care why anyone would be in either camp but the consequence is, we need to know about it.

Here is a little tool to illustrate the difference.

{{ endian() }}

If we enter 12 in the left box and 32 in the right box the big endian value is 3104 while the little endian value is 8204. Whoa! that is quite a spread.

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
So now we that are on the same page with the operation, let's run the program.

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
This is going to start to get a bit repetitive since we have a bunch of small chunks, I'm going to refactor things a bit before we continue.

The first thing I want to do is to convert our buffer to a `Vec<u8>`, that way we can take advantage of some nicer features. After we call `reader.fill_buf()`, we want to add this line.

```rust
let mut buf_vec = buf.to_vec();
```

Once we have a vector of `u8`s we can start to use the `Drain` trait. This allows us to slice off bytes from the front of our vector, so the first byte is always going to be the one we care about. Our main method is going to look like this once we have finished updating it.

```rust
fn main() {
    //create a path buffer for our file
    let path = PathBuf::from("db.sqlite");
    //open said file
    let file = File::open(path).expect("Unable to open db file");
    //create a reader than has an internal buffer of 100 bytes
    //and point it to our file
    let mut reader = BufReader::with_capacity(100, file);
    //fill the reader's buffer with the first 100 bytes
    //of our file
    let buf = reader.fill_buf().expect("Unable to fill buffer");
    //convert the buffer to a Vec<u8> this will make it a little
    //easier to work with
    let mut buf_vec = buf.to_vec();
    //slice the first 16 bytes off of the vector and
    //collect them into a new vector
    let first_16 = buf_vec.drain(0..16).collect();
    let magic_string = String::from_utf8(first_16)
            .expect("Unable to convert from utf8 to magic string");
    println!("Magic String: {:?}", magic_string);
    //slice off the next two bytes, since we removed
    //the magic string bytes from this we don't have
    //keep track of where we want to start any longer
    let next_two: Vec<u8> = buf_vec.drain(0..2).collect();
    println!("next_two: {:?}", next_two);
    //Convert the bytes (big endian style) into a u16
    let page_size = parse_u16(next_two[0], next_two[1]);
    println!("page size: {:?}", page_size);
}
```

Now, with that out of the way, let's rip through the next 6 parts of our header. Each of the next parts is only one byte in length, so no need to worry about combining them. Right now we are just capturing the data, I am planning on discussing each of these once we get through all the header data.

- File Format Write Version
  - This value will be either 1 or 2
  - 1 is for Legacy mode
  - 2 is for Write Ahead Log mode
- File Format Read Version
  - This value will be either 1 or 2
  - 1 is for Legacy mode
  - 2 is for Write Ahead Log mode
- Reserved Space
  - This is the total number of bytes that are reserved for extensions
  - An extension could use this space to store page level data
  - This number should be between 0 and our page size - 480
- Maximum embedded payload fraction
  - This will always be 64
- Minimum embedded payload fraction
  - This will always be 32
- Leaf Payload Fraction
  - This will always be 32

Alright, time to capture these bytes.

```rust
    let single_bytes = buf_vec.drain(0..6).collect();
    let write_mode = single_bytes[0];
    let read_mode = signle_bytes[1];
    let reserved = single_bytes[2];
    let max_fraction = single_bytes[3];
    let min_fraction = single_bytes[4];
    let min_leaf = single_bytes[5];
```
Moving right along, most of the rest of our header is going to be in 4 byte big endian integers. This is going to work almost the same as our page size just with more values. Let's write a little helper function to join together our bytes.

```rust
fn parse_u32(bytes: &[u8]) -> u32 {
    //shift our largest bytes over 24 bits
    //8+24 = 32 so this would be our left most 8
    (bytes[0] as u32) << 24 | 
    //shift the next value 16
    (bytes[1] as u32) << 16 |
    //shift the next value 8
    (bytes[2] as u32) << 8  |
    (bytes[3] as u32)
    //or them all together
}
```
The same principle works here as before, we just have more values to move around. Here is an example of what [32,32,32,32] would look like in binary while going through our function.

```
the number
0000 0000 0000 0000 0000 0000 0010 0000 //32
shifted 24 to the left would be
0010 0000 0000 0000 0000 0000 0000 0000 //536870912
shifted 16 to the left would be
0000 0000 0010 0000 0000 0000 0000 0000 //2097152
shifted 8 to the left would be
0000 0000 0000 0000 0010 0000 0000 0000 //8192
if we |'d them all together we would get
0010 0000 0010 0000 0010 0000 0010 0000 //538976288
```
Now that we have our helper function, its time to parse out the rest of our header. Most of these values are going to feel a bit vague for the time being, we will go over more about each of them later on in the series.

- File change counter.
  - Exactly what it sounds like
  - This gets increased ever time SQLite changes the file
- Size of the database file in pages
  - The number of pages that our database contains
- Page number of the first freelist trunk page
  - If we took this number and multiplied it by the page size, we would be at this special position in the file
- Total number of freelist pages
- The schema cookie
- The schema format number
  - 1: version 3.0.0 and greater
  - 2: version 3.1.3 and greater
  - 3: version 3.1.4 and greater
  - 4: version 3.3.0 and greater
  - I guess the rest of this giant number is for the future?
- Default page cache size.
- The page number of the largest root b-tree page
- The database text encoding.
 - 1: UTF-8 
 - 2: UTF-16 little endian 
 - 3: UTF-16 big endian
- The user version
  - read and set by the user_version pragma
- Incremental-vacuum mode
  - 0: false
  - !0: true
- The Application ID 
  - set by PRAGMA application_id

alright, lets parse them all out. We are going to use a feature available for rust iterators called chunks, which will break our iterator up into whatever size chunk we tell it to.

```rust
//drain the 4 byte properties out of the vec original vec
let four_bytes: Vec<u8> = buf_vec.drain(0..(4 * 12)).collect();
//break this into chunks of 4 bytes
let mut four_iter = four_bytes.chunks(4);
//call next for each of the 4 byte properties we are looking for
let chage_counter = parse_u32(four_iter.next().unwrap());
let size = parse_u32(four_iter.next().unwrap());
let first_free_truck = parse_u32(four_iter.next().unwrap());
let free_count = parse_u32(four_iter.next().unwrap());
let schema_cookie = parse_u32(four_iter.next().unwrap());
let schema_format = parse_u32(four_iter.next().unwrap());
let cache_size = parse_u32(four_iter.next().unwrap());
let largest_b_root = parse_u32(four_iter.next().unwrap());
let db_text_encoding = parse_u32(four_iter.next().unwrap());
let user_version = parse_u32(four_iter.next().unwrap());
let incremental_vac = parse_u32(four_iter.next().unwrap());
let app_id = parse_u32(four_iter.next().unwrap());
```
In retrospect it might be worth it to go back and use an iterator for the single byte options as well, but I'm just going to plow through since we are so close to the end. The next section of the header is 20 bytes and reserved for expansion, so we can skip it. That brings us to the last 2 4 byte integers `version valid for` and `SQLite version number`.

The first one is going to be the `change counter` value for the last time the SQLite version number was updated, let's grab those.

```rust
let _ = buf_vec.drain(0..20);
let _reserved: Vec<u8> = buf_vec.drain(0..20).collect();
let last_bytes: Vec<u8> = buf_vec.drain(0..8).collect();
let mut last_two = last_bytes.chunks(4);
let version_valid_for = parse_u32(last_two.next().unwrap());
let sqllite_version = parse_u32(last_two.next().unwrap());
```
Whew, that it the end of our header. Up next I am going to clean some things up and dig a little deeper into what each of our values means for the rest of our file. If you wanted to look at the code, you can check it out [here](https://github.com/FreeMasen/sqlite_parser/tree/wired_forge_pt2).

[Part 3](/blog/sqlite3/index.html)
