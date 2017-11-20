+++
title = "SQLite Parser Pt. 1: The Header"
date = "2017-10-12"
slug = "sqlite1"
draft = true
tags = ["sqlite", "integer-storage", "decoding"]
[extra]
snipet = "This is the first in a series of posts describing the process of building a SQLite file parser"
image = "sqlite.gif"
+++

This is the first in a series of posts describing the process of building a SQLite file parser. To view my progress (which may or may not be ahead of this post) the repo can be found [here](https://github.com/FreeMasen/sqlite_parser)

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
    - All of this use amounts to lots of resources for learning.

To did deeper, their [website](http://sqlite.org) has quite a bit of information.

---
Databases are fascinating. Just about every application I have built has amounted to a user interface for data storage, however the database as a whole is a black box to me. While I have been able to infer how the system works from experience, I really wanted to dig into how it all seems to work 'automagically'.

I started to read the documentation for SQLite as a way to demystify the magic part of data warehousing. SQLite provides a detailed specification for its file format, I thought this would be a great place to start. At about the 4th paragraph I started to doubt that I would be able to make sense of any of it:
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

pointer map..

Oh my!

At this point, my head is swimming but when the going gets tough, the tough bang their brain against it until something clicks. Thankfully shortly after that mess, a table is included that starts to help make some more sense. This table dictates where in the file specific header information lives. At this point, I am going to need to write some code to be able to understand any of this.

According to the doc the first 100 bytes of the fill will be the file's header which is explicitly sectioned into 23 pieces. So lets start writing some code.

First, we need to create a database file. There are many methods to do this but I used the [DB Browser for SQLite](http://sqlitebrowser.org/) to create mine. 

the table I created was pretty simple:

![create table user (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE, name TEXT, email TEXT)](/images/create_table.png)

Now we need to read the first 100 bytes of this file. For simplicity I saved this in my project root.

```rust
use std::io::*;
use std::path::{PathBuf};
use std::fs{File};

fn main() {
    let path = PathBuf::from("db.sqlite");
    let file = File::open(path).expect("Unable to open db file");
    let mut reader = BufReader::with_capacity(100, file);
    let buf = reader.fill_buf().expect("Unable to fill buffer");
    println!("First 100 bytes:\n{:?}", buf);
}
```

```bash
> cargo run
First 100 bytes:
[83, 81, 76, 105, 116, 101, 32, 102, 111, 114, 109, 97, 116, 32, 51, 0, 16, 0, 1, 1, 0, 64, 32, 32, 0, 0, 0, 8, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 46, 1, 90]
```

Success!