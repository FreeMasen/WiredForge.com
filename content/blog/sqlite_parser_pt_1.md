+++
title = "SQLite Parser Pt. 1: The Header"
date = 2020-09-08
draft = false
tags = ["sqlite", "integer-storage", "decoding"]
[extra]
snippet = "This is the first in a series of posts describing the process of building a SQLite file parser"
image = "sqlite.gif"
image_desc = "SQLite Logo"
date_sort = 20200908
[[series]]
title = "SQLite Parser Pt. 1: The Header"
link = "/blog/sqlite_series/sqlite-parser-pt-1/index.html"
#[[series]]
#title = "SQLite Parser Pt. 2: The Header... continues" 
#link = "/blog/sqlite_series/sqlite-parser-pt-2/index.html"
#[[series]]
#title = "SQLite Parser Pt. 3: The Header... reorganized"
#link = "/blog/sqlite_series/sqlite-parser-pt-3/index.html"
+++
Databases are fascinating things, a large amount of software we build is
some kind of user interface for a database. Even though we interact with 
them quite often, how they actually work is often left a mystery. In this
series we are going to start digging into how [SQLite](https://sqlite.org/) 
works, primarily by trying to understand how the data is stored in a database 
file. 

Thankfully, the SQLite folks have an incredible amount of documentation available,
however it is written from a very technical perspective. Let's start by trying to 
demystify some of language there. We are going to be working from
[the Database File Format](https://sqlite.org/fileformat2.html) documentation,
even just the first section 1.1 starts to use some terminology that is very
specific to database or file systems work. For example "Journals" which
may be an interesting
topic but not super important for us at this stage. Let's just skip ahead until we
can find something a little more practical. We don't have to go to far until we find
section 1.2 labeled "Pages". 

The term pages here is a reference to the fact that the data will be sectioned into
equally sized parts. Similar to how a term paper would be a series of 8.5 by 11 inch
pages, this data is going to be broken into pages of at least 512 bytes and no larger
than 65,536 bytes. To figure out how big pages are for any given file we need to 
find the 16th byte of the file and somehow combine these it with the 17th byte.

That seems like enough information to at least get started with some code but
before we do, let's create a database file. To do that, we have a few options
the simplest is probably to use the SQLite cli tool

If you don't already have SQLite installed, you can use 
popular package managers like `apt` or `brew` to get it or you could use the 
[SQLite download page](https://sqlite.org/download.html). Once it is installed
open a terminal and type `sqlite3` to open the cli.

```sh
> sqlite3
SQLite version 3.28.0 2019-04-15 14:49:49
Enter ".help" for usage hints.
Connected to a transient in-memory database.
Use ".open FILENAME" to reopen on a persistent database.
sqlite> 
```

Here it tells us we have a in-memory database opened but we want one that
writes to disk so we are going to use the `.open` command to create a file

```sh
sqlite> .open data.sqlite
```
While the cli doesn't give us any feedback, we should see that a file called
data.db was created in the current working directory. While this would probably
be enough to complete or initial goal of reading the page size bytes, let's 
create a table now that we have the cli open we are going to create
a `user` table and insert a few values into it. 

```sql
CREATE TABLE user (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
    name TEXT,
    email TEXT
);
INSERT INTO user (name, email)
VALUES ('Robert Masen', 'r@robertmasen.com'),
       ('Paul Bunyan', 'pb@example.com');
```

Again the sqlite cli tool doesn't give us any feedback about our action so let's just be
sure and run `SELECT * FROM user;` and we should see the following.

```sh
1|Robert Masen|r@robertmasen.com
2|Paul Bunyan|pb@example.com
```

With that out of the way, let's start building our parser. The first thing we need to do
is read the file we created and then see what is in 16th and 17th bytes.

```rust
fn main() {
    // first, read in all the bytes of our file
    // using unwrap to just panic if this fails
    let contents = std::fs::read("data.sqlite").unwrap();
    // capture our 16 and 17 bytes in a slice
    let page_size = &contents[16..18];
    // print that slice to the screen
    println!("{:?}", page_size);
}
```

The above program will read in the file we just created as bytes, so the type
of `contents` is `Vec<u8>`. Since vectors are indexable on ranges, we then
print bytes 16 and 17 (note the range is "exclusive" so the upper end of the range is 18).
Let's see what happens when we run this.

```sh
cargo run
[16, 0]
```
> note these values may be different for you and that is ok

Progress! Though, what does that actually mean? If we read the rest of section 1.2, it
continues on to describe what a page is comprised of and the maximum sqlite file size, 
not very helpful...

If we skip a head to section 1.3, we see a short bit of text and a long table. In the 
short bit of text it tells us that all of the multi-byte values are "big-endian",
if you are not familiar with this term, I wrote up a description of binary number
representations that it would be good to look over [here](/blog/binary-pt1/index.html).

Now that we know this value is big-endian we can combine these two bytes together
using the standard library's [`u16::from_be_bytes`](https://doc.rust-lang.org/nightly/std/primitive.u16.html#method.from_be_bytes) to convert it into a single value.


```rust
fn main() {
    // first, read in all the bytes of our file
    // using unwrap to just panic if this fails
    let contents = std::fs::read("data.sqlite").unwrap();
    // create an array to hold a copy of our bytes
    let mut size_bytes = [0;2];
    // fill our array with bytes 16 and 17 of the vector
    size_bytes.copy_from_slice(&contents[16..18]);
    let page_size = u16::from_be_bytes(size_bytes);
    // print the actual size
    println!("{:?}", page_size);
}
```
and when we run this, we should see something like the following.

```sh
cargo run
4096
```
Awesome! That is more that 512 and less than 65,000  so let's chalk this up as a win!

Now that we have made it all the way to section 1.3, we can now see that 
there is quite a bit of more information right there at the start of the file. 
This table tells us where we should expect to see everything. Looking it 
over it now makes sense why the page size is at byte 16, because those first 16 
bytes are the string "SQLite format 3\000" but wait, that string is 19
characters long! Since SQLite is a c application, that means all of our strings
are going to be `NULL` terminated and the `\000` is a fancy way of writing that,
which makes it actually the expected 16 bytes. So, let's add that into our
little page size finding application.

```rust
fn main() {
    // first, read in all the bytes of our file
    // using unwrap to just panic if this fails
    let contents = std::fs::read("data.sqlite").unwrap();
    // capture the slice of bytes for our magic string
    let magic_bytes = &contents[0..16];
    // use the lossy method of constructing a string
    // incase it fails
    let magic_string = String::from_utf8_lossy(magic_bytes);
    // create an array to hold a copy of our bytes
    let mut size_bytes = [0;2];
    // fill our array with bytes 16 and 17 of the vector
    size_bytes.copy_from_slice(&contents[16..18]);
    let page_size = u16::from_be_bytes(size_bytes);
    // print the magic string and page size
    println!("{:?} {:?}", magic_string, page_size);
}
```
Now when we run this we should see something like...

```sh
cargo run
"SQLite format 3\u{0}" 4096
```

Success! That is exactly what the SQLite documentation said would be there.
So what else can we find out from this file? Looking over that table, the first
100 bytes seems to be packed with information. Since the main goal here is to build
a parser, we should probably stop here and refactor these into a some library functions.

First, let's create a few new files in the src folder. They are going to be `lib.rs`,
`error.rs`, and `header.rs`. The first of those isn't going to do much, just act as 
way to tie all our other modules together. 

```rust
// ./src/lib.rs
mod error;
mod header;
```

Next, let's setup our error. While there are a few options to take care of some of
these things for us, we'll use a enum to represent our error. 

```rust
// ./src/error.rs
#[derive(Debug)]
pub enum Error {

}
impl std::fmt::Display {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match f {
            _ => write(f, "Unknown error"),
        }
    }
}
impl std::error::Error for Error {}
```

Implementing the Error trait does require that both `Debug` and `Display` are
implemented, so first we use the `#[derive(Debug)]` attribute to take care
of the former. For the latter, we need to implement it explicitly. Since we haven't
defined any errors yet we will just put in a temporary catch all case.

Now, we can get started with the header module. 

```rust
// ./src/header.rs

/// Byte representation of magic string 
/// "SQLite format 3\u{0}"
static MAGIC_STRING: &[u8] = &[
    83, 81, 76, 105, 116, 101, 32, 102, 111, 114, 109, 97, 116, 32, 51, 0,
];

fn parse_magic_string(buf: &[u8]) -> Result<(), Error> {
    if buf != MAGIC_STRING {
        Err(Error::MagicString)
    } else {
        Ok(())
    }
}
```

Notice how we used our error, we need to define that case and its display
implementation.

```rust
enum Error {
    /// An error with the magic string
    /// at index 0 of all SQLite 3 files
    MagicString,
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            Self::MagicString => write!(f, 
                "Unexpected bytes at start of file, expected the magic string 'SQLite format 3\u{0}'"),
        }
    }
}
```

Before we move beyond the page size bytes, we should look over that section's documentation.
The issue is that the maximum page size is 65,536 bytes, but the maximum a
2 byte integer can be is 65,535. Since the minimum size is 512, they chose to use
a lower value as a signal of this maximum so a page size of 1 is how the 65,356 is
represented. Now the question is, how do we want to deal with that? One option is to use
a `u32` instead of `u16` but since we _eventually_ may want to reverse this value back to
the original, we can wrap it in a tuple struct. First let's add an error case to our `Error`
enum since this could fail. Since there are a few different cases that could cause failure
we will give that variant, a `String` argument to allow for a more detailed explanation.
And we can't forget to update our `Display` implementation.

```rust
// error.rs
enum Error {
    /// An error with the magic string
    /// at index 0 of all SQLite 3 files
    MagicString,
    InvalidPageSize(String),
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            // ...
            Self::InvalidPageSize(msg) => write!(f, "Invalid page size, {}", msg),
        }
    }
}

```

Now that we have our error fleshed out, lets work on the implementation. For that we have to
perform 2 steps, first we need to ensure that any slice we get is exactly 2 bytes. After that
we can safely convert those bytes into a `u16`, once we have that we need to validate that it
is either 1 or greater than 512. Since a `u16` can't hold a value > 65,536 we don't need to check
the upper bounds, however we do need to make sure the value is a power of 2. Let's work backwards.

```rust
/// Check if a value is a power of 2
fn is_pow_2(v: u16) -> bool {
    // First we convert the value to a float
    let flt = f32::from(v);
    // Now we check that `log2` has no remainder
    flt.log2() % 1 == 0
}
```

Now that we can test for a power of 2, we can define our tuple struct and the `TryFrom<u16>`
implementation for that.

```rust
// lib.rs

#[derive(Clone, Copy, Debug)]
struct PageSize(pub u32);

impl std::convert::TryFrom<u16> for PageSize {
    type Error = Error;
    fn try_from(v: u16) -> Result<PageSize, Error> {
        match v {
            1 => Ok(PageSize(65_536u32)),
            0 | 2..=511 => Err(Error::InvalidPageSize("value must be >= 512, found: {}", v)),
            _ => {
                if is_pow_2(v) {
                    Ok(PageSize(v as u32))
                } else {
                    Err(Error::InvalidPageSize(format!("value must be a power of 2 found: {}", v)))
                }
            }
        }
    }
}
```

Alright, finally we can write our parsing function.

```rust
// lib.rs 
fn parse_page_size(bytes: &[u8]) -> Result<PageSize, Error> {
    // ensure that the slice is exactly 2 bytes by splitting on 2
    let (two_bytes, _) = bytes.split_at(std::mem::size_of::<u16>());
    // convert it into a [u8;2] or return early on any issues
    let fixed = two_bytes.try_into().map_err(|e| {
        Error::InvalidPageSize(format!("invalid byte length found: {}", bytes))
    })?;
    // now we can create our `u16`
    let raw = u16::from_be_bytes(fixed);
    // Lastly we use our `TryInto` implementation
    raw.try_into()
}
```

Progress! Let's update `main`.

```rust
use sqlite_parser::{
    header::{parse_magic_string, parse_page_size},
    error::Error,
};
fn main() -> Result<(), Error> {
    // first, read in all the bytes of our file
    // using unwrap to just panic if this fails
    let contents = std::fs::read("data.sqlite").unwrap();
    // Validate the magic string is correct
    let magic_string = parse_magic_string(&contents[0..16])?;
    let page_size = parse_page_size(&contents[16..18]);
    // print the magic string and page size
    println!("{:?}", page_size);
}
```

Note, we updated the `main` to return a `Result` so we can take advantage of the `?` operator
to return early when we find something invalid. When we run this, we should see something
like the following, remember the actual size may be different for you.

```sh
PageSize(4096)
```

We have covered quite a bit so far, but only made it through the first 18 bytes! The docs
say that the database headers is a total of 100 bytes so we have a bit of ground to cover still.
In the next post, we are going to make our way through the rest of this header.

<!-- [Part 2](/blog/sqlite2/index.html) -->
