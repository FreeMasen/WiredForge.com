+++
title = "SQLite Parser Pt. 1: The Header"
date = "2017-12-26"
draft = false
tags = ["sqlite", "integer-storage", "decoding"]
[extra]
snippet = "This is the first in a series of posts describing the process of building a SQLite file parser"
image = "sqlite.gif"
image_desc = "SQLite Logo"
series = [
{title = "SQLite Parser Pt. 1: The Header", link = "/blog/sqlite1/index.html"},
{title = "SQLite Parser Pt. 2: The Header... continues",link = "/blog/sqlite2/index.html"},
{title = "SQLite Parser Pt. 3: The Header... reorganized",link = "/blog/sqlite3/index.html"}
]
+++

This is the first in a series of posts describing the process of building a SQLite file parser. A GitHub repo of the finished code can be found [here](https://github.com/FreeMasen/sqlite_parser/tree/wired_forge_pt1)

For those who don't know, SQLite is a relational database engine that utilizes a single file for data storage and retrieval. It is widely used as an data storage solution for embedded systems or prototyping. A few things make this system very attractive: 
 - The source code is in the public domain
   - This removes all worries about licensure and redistribution
 - The overall size is small
    - The precompiled distribution are all under 2mb (not including mobile systems like android or UWP that have extra baggage)
 - It is written in C
    - All modern programming languages have some degree of compatibility with C
 - It is very widely used
    - It is included with the Python standard library.
    - Apple's CoreData library for iOS is built on top of it.

To dig deeper, their [website](http://sqlite.org) has quite a bit of information.

---
Databases are fascinating. Just about every application I have built has amounted to a user interface for a database. While I have been able to leverage their power, like any tool knowledge of how they work makes them more powerful in the user's hands. So, I thought I would dig into how SQLite works as a way to build up that knowledge.

As I started to read the documentation for SQLite I was hopeful it would start to demystify the magic part of data warehousing, however it quickly became clear that it was going to take some serious effort to understand. SQLite.org provides detailed specifications for just about every part of its system, all of them have been written from a technical perspective, so I thought it might be a good idea to start with the file format documentation. At about the 4th paragraph I started to doubt that I would be able to make sense of any of it:
> The main database file consists of one or more pages. The size of a page is a power of two between 512 and 65536 inclusive. All pages within the same database are the same size. The page size for a database file is determined by the 2-byte integer located at an offset of 16 bytes from the beginning of the database file.
>
> Pages are numbered beginning with 1. The maximum page number is 2147483646 (2<sup>31</sup> - 2). The minimum size SQLite database is a single 512-byte page. The maximum size database would be 2147483646 pages at 65536 bytes per page or 140,737,488,224,256 bytes (about 140 terabytes). Usually SQLite will hit the maximum file size limit of the underlying filesystem or disk hardware long before it hits its own internal size limit.
>
> In common use, SQLite databases tend to range in size from a few kilobytes to a few gigabytes, though terabyte-size SQLite databases are known to exist in production.
> At any point in time, every page in the main database has a single use which is one of the following:
>
> - The lock-byte page
> - A freelist page
>   - A freelist trunk page
>   - A freelist leaf page
> - A b-tree page
>   - A table b-tree interior page
>   - A table b-tree leaf page
>   - An index b-tree interior page
>   - An index b-tree leaf page 
> - A payload overflow page
> - A pointer map page 

whoa.

Two byte integer...

b-trees... 

pointer map...

Oh my!

At this point, my head is swimming but when the going gets tough, the tough bang their brain against it until something clicks. Thankfully shortly after that mess, a table is included that starts to help make some more sense. This table dictates where in the file specific header information lives. At this point, I thought, I am going to need to write some code to be able to understand any of this.

According to the doc the first 100 bytes of the fill will be the file's header which is explicitly sectioned into 23 pieces. So lets start writing some code.

First, we need to create a database file. There are many methods to do this but I used the [DB Browser for SQLite](http://sqlitebrowser.org/) to create mine. 

the table I created was pretty simple:

![CREATE TABLE user (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE, name TEXT, email TEXT)](/images/create_table.png)

Now we need to read the first 100 bytes of this file. So lets get started with our project, all of the code samples for this will be written in Rust (though I may re-write it in other languages at a later time). To start, lets enter this into a terminal.

```bash
$ cargo new ./sqlite --bin && cd ./sqlite
``` 
Now that we have an Executable rust project created, open it up in your editor of choice. 
The code block below is going to first open up our `.sqlite` file then try and read in the first
100 bytes.
```rust
use std::io::*;
use std::path::{PathBuf};
use std::fs::{File};

fn main() {
    //create a path buffer for our file, this will help the io operations
    //to know where to look without manually having to look up OS conventions like 
    //the type of slash they are using
    let path = PathBuf::from("db.sqlite");
    //Open the file or print a failure message
    let file = File::open(path).expect("Unable to open db file");
    //creat a reader with an internal buffer of 100 bytes in length that for our file
    let mut reader = BufReader::with_capacity(100, file);
    //fill the internal buffer with the first 100 bytes in our file
    //or print a failure message
    let buf = reader.fill_buf().expect("Unable to fill buffer");
    //print our first 100 bytes to the screen
    println!("First 100 bytes:\n{:?}", buf);
}
```
When we run this, the output should look something like this.

```bash
$ cargo run
First 100 bytes:
[83, 81, 76, 105, 116, 101, 32, 102, 111, 114, 109, 97, 116, 32, 51, 0, 
16, 0, 1, 1, 0, 64, 32, 32, 0, 0, 0, 8, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 
0, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 
0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 46, 1, 90]
```

Success!

Now that we have read in the bytes, let's see what they are supposed to represent

The first 16 bytes should be the string `SQLite Format 3` followed by a `NUL` character, so lets try and parse that out.

Looking at the last example, we want to work on this set of data

`[83, 81, 76, 105, 116, 101, 32, 102, 111, 114, 109, 97, 116, 32, 51, 0]`

We could manually look up each of these using a [utf-8 table](https://en.wikipedia.org/wiki/List_of_Unicode_characters#Basic_Latin) by just matching up our numbers to the number listed like `83=S, 81=Q...` but that would take far too long. Let's let the computer do all that for us.


```rust
fn main() {
    //create a path buffer for our file, this will help the io operations
    //to know where to look without manually having to look up OS conventions like 
    //the type of slash they are using
     let path = PathBuf::from("db.sqlite");
    //Open the file
    let file = File::open(path).expect("Unable to open db file");
    //creat a reader with an internal buffer of 100 bytes in length that for our file
    let mut reader = BufReader::with_capacity(100, file);
    //fill the internal buffer with the first 100 bytes in our file
    let buf = reader.fill_buf().expect("Unable to fill buffer");
    //slice off the first 16 bytes of our buffer
    let first_16 = buf.get(0..16)
                    .expect("Unable to slice our first 16 bytes");
    //Try and create a string from the slice, note the from_utf8 method is expecting a vector 
    //so we are casting our &[u8] to Vec<u8> by calling .to_vec()
    let magic_string = String::from_utf8(first_16).to_vec())
                    .expect("Unable to convert from utf8 to magic string");
    println!("did it work?\n{:?}", magic_string);
}
```
When we run this, the output should look something like this.

```bash
$ cargo run
did it work?
"SQLite format 3\u{0}"
```

That looks good, only what is at the end there? `\u{0}`

Well, when Rust tries to print a non-printable Unicode character like NUL it formats it
with a leading \u to indicate its Unicode followed by the number wrapped in curly braces
so `\u{0}` is the formatted version of `0` or `0000` or `NUL`.

According to our spec, this is exactly what we were hoping for.

This seems like a good place to break, in the next post we will dig beyond the first 16 bytes and start to really get down to business.

[Part 2](/blog/sqlite2/index.html)