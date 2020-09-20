+++
title = "SQLite File Parser Pt. 1"
date = 2020-09-11
draft = false
tags = ["sqlite", "integer-storage", "decoding"]
[extra]
snippet = "The Header"
+++
Databases are fascinating things, a large amount of software we build is
some kind of user interface for a database. Even though we interact with 
them quite often, how they actually work is often left a mystery. In this
series we are going to start digging into how [SQLite](https://sqlite.org/) 
works, by trying to understand how the data is stored in a database 
file. 

If you want to follow along, we first want to create a new Rust project by
running something similar to the following.

```sh
$ cargo new sqlite-parser
```

This will create a new folder and put a simple Rust binary project in it.
If you are new to Rust, we are going be working in `src/main.rs` for the rest
of this post. However we should look a little more into the Sqlite documentation
before we start writing any code.

Thankfully, the SQLite folks have an incredible amount of documentation available,
however it is written from a very technical perspective. If you wanted to follow along,
we will be working from [this document](https://sqlite.org/fileformat2.html) that details how 
a Sqlite3 database file will be laid out. Very early on that page, we start to get into the
weeds about "Hot Journals", while this may be an interesting topic, if we want to 
try and read the database file format we don't much care about that to start. Instead we can
skip ahead to a the section 1.3, entitled "The Database Header". This will break down the
first 100 bytes of any Sqlite3 file value by value. Our first goal is going to be able to
read and understand these first 100 bytes. Before we get started with any code, we should setup
our system and create a database file. If you don't already have `sqlite3` installed, you can use 
popular package managers like `apt` or `brew` to get it or you could use the 
[SQLite download page](https://sqlite.org/download.html). Once it is installed
you should be able to open a terminal and type `sqlite3` to see something like the following.

```sh
$ sqlite3
SQLite version 3.31.1 2020-01-27 19:55:54
Enter ".help" for usage hints.
Connected to a transient in-memory database.
Use ".open FILENAME" to reopen on a persistent database.
sqlite> 
```

We are going to use this interface to create a new database, we can do that by using the 
`.open` command.

```sh
sqlite> .open data.sqlite
```
While the cli doesn't give us any feedback, we should see that a file called
data.sqlite was created in the current working directory (this should be the same directory as 
our rust project). While this would probably be enough to complete our initial goal of reading 
the database header, let's create a table named `user` and insert a few values into it while we're
here.

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

Again the sqlite cli doesn't give us any feedback about our activities so let's just be
sure and run `SELECT * FROM user;` and we should see the following.

```sh
1|Robert Masen|r@robertmasen.com
2|Paul Bunyan|pb@example.com
```

With that out of the way, let's dig into these first few bytes. According to the table,
our first 16 bytes will be the string `SQLite format 3\000`. You may be asking yourself
why they would say it is 16 bytes when that string is clearly 19 characters long. Since
Sqlite is written as a C application, all of the strings will be [`NULL` terminated](https://en.wikipedia.org/wiki/Null-terminated_string), and
that `\000` at the end of the string is one way to write a `NULL` byte. Let's see if we 
can read that string from our newly created database file.

```rust
fn main() {
    // first, read in all the bytes of our file
    // using unwrap to just panic if this fails
    let contents = std::fs::read("data.sqlite").unwrap();
    // capture the first 16 bytes
    let magic_string = &contents[0..16];
    // print that slice to the screen
    println!("{:?}", magic_string);
}
```

The above program will read in the file we just created as bytes, making the type
of `contents` is `Vec<u8>`. Since vectors are indexable on ranges, we then
print bytes 0 through 15 (note the range is "exclusive" so the upper end of the range is 16).
Let's see what happens when we run this.

```sh$
cargo run
[83, 81, 76, 105, 116, 101, 32, 102, 111, 114, 109, 97, 116, 32, 51, 0,]
```
Ok, so that wasn't very illuminating, let's convert those bytes to something readable
by a human.

```rust
fn main() {
    let contents = std::fs::read("data.sqlite").unwrap();
    let magic_string = &contents[0..16];
    // We use from_utf8_lossy because we don't much care right 
    // now if we lose some information.
    println!("{:?}", String::from_utf8_lossy(magic_string));
}
```
With that small update, let's run it again.

```sh$
cargo run
"SQLite format 3\u{0}"
```
Nice! That is exactly what we were looking for. Notice, rust uses a different way to display
a null byte `\u{0}` but it means the same thing.

Next up on the table is the "The database page size in bytes". The documentation gives us
a few different pieces of important information, though nothing more about what this data
means beyond that sentence. The basic idea here is that no matter how large our database
file may be it will always be divided into sections of equal size. Not unlike how a book
may be divided into the same size of page. Not super important now, but we
are going to come back to pages after we get though the database header. 

Let's take a go over some information provided by the documentation.
First it says that the value starts at byte index 16, and has a
length of 2. Let's take a look at what these two bytes look like by extending our program.

```rust
fn main() {
    //...
    println!("{:?}", &contents[16..18]);
}
```

When we run that it should look something like this. Note, the actual values may be different
for your database file and that is ok.

```sh$
cargo run
[16, 0]
```
Alright, we can see there are actually two bytes there but they represent a single number, how should we combine them?
The documentation tells us that all "multibyte fields"
are "big-endian". If you are unfamiliar with "endianness", you might want to look
over [this series](/blog/binary-pt1/index.html) on binary number representations, though
it isn't super important since Rust's standard library provides a `from_be_bytes`
function for creating a bunch of the number types (`be` meaning big-endian).
Let's use the one for making a `u16`

```rust
// To convert from a slice to an array we
// are going to use this trait, so we will
// bring it into scope with the following.
use std::convert::TryInto;

fn main() {
    //...
    // We need value to be an array so we try to convert it
    // panicking if it fails
    let page_size_bytes: [u8;2] = contents[16..18].try_into().unwrap();
    // Now we can convert the value into a `u16`
    let page_size = u16::from_be_bytes(page_size_bytes);
    println!("{:?}", page_size);
}
```

So let's run this.

```sh$
cargo run
4096
```

Cool, we converted our 2 bytes into a single number! Let's validate the other things
that will tell us if we did it right. The docs say it should be at least 512 and
at most 32,768, check. The next thing we need to check is if this value is a power of
1. the nice thing about this requirement is that the largest possible power of 2 a u16 can hold, 
is the same as our max value 32,768. 

To determining if our value is a power of two, the standard library provides a method on `u16` for us!
Using that we can now add in a couple of `assert!`s to validate our value is correct.

```rust
// To convert from a slice to an array we
// are going to use this trait, so we will
// bring it into scope with the following.
use std::convert::TryInto;

fn main() {
    //...
    // We need value to be an array so we try to convert it
    // panicking if it fails
    let page_size_bytes: [u8;2] = contents[16..18].try_into().unwrap();
    // Now we can convert the value into a `u16`
    let page_size = u16::from_be_bytes(page_size_bytes);
    // assert! is a standard library macro that will 
    // panic if the input isn't `true`. We are going to
    // use that to test for our 2 validation requirements
    assert!(page_size >= 512, "Value must be at least 512");
    assert!(page_size.is_power_of_two(), "Value must be a power of 2");
    println!("{:?}", page_size);
}
```

This gets us very close, though there is one more thing we need to account for. The docs say
that this value could also be 1 representing 65,536. This complicates things for us
though, because the maximum value for a `u16` is 65,535. To handle this, we are going to
need to convert this into a `u32`. To better control the value we'll
wrap it its own struct and move our asserts into a constructor for that.

```rust
/// This struct will wrap our 32bit number allowing us
/// to control how it gets used later. this #[derive]
/// at the top just allows us to print this value
/// to the terminal using debug ({:?}) print
#[derive(Debug)]
struct PageSize(u32);

impl PageSize {
    /// This will convert a u16 into a valid PageSize
    /// panicking if the input is invalid
    fn from(v: u16) -> Self {
        // Remember 1 is our special case
        // we return early here if we find it
        if v == 1 {
            return PageSize(65_536)
        }
        // Since it isn't 1, we need it to be at least 512
        assert!(v >= 512);
        // We also check to see if it is a power of 2
        assert!(v.is_power_of_two());
        // Since v can't be greater than our maximum value
        // we can simply convert it to a u32 now
        // by using the `into` method on u16, and wrap it
        // in the PageSize constructor we defined above.
        return PageSize(v.into())
    }
}

```
Now let's add this into our `main`

```rust
use std::convert::TryInto;

fn main() {
    //...
    let page_size_bytes: [u8;2] = contents[16..18].try_into().unwrap();
    // Now we can convert the value into a `u16`
    let raw_page_size = u16::from_be_bytes(page_size_bytes);
    let page_size = PageSize::from(raw_page_size);
    println!("{:?}", page_size);
}
```
When we run this we should see something like the following.

```sh$
cargo run
PageSize(4096)
```
Nice, That looks pretty good!

So far we have made it though the first 18 bytes but our program isn't very robust and
if we keep only working in `main.rs` it is going to get a little difficult to manage.
So let's refactor our application a little. First, we are going to add a `lib.rs`
that will be the base for our library. While we are at it, lets create
a few modules to help organize things. Our new `src` folder should look like this.

```sh
$ tree ./src
./src
├── error.rs
├── header.rs
├── lib.rs
└── main.rs
```
Let's start with the `lib.rs`

```rust
// lib.rs

pub mod error;
pub mod header;
```

Here we are defining two modules we created files for `error` and `header`. 
Since we used the `pub` keyword on each of them, they will be exported to anyone who consumes
our library. Next, let's fill out what our error module is going to look like, this is where we
are going to define all of the places that we know our parser might encounter an error.

```rust
// error.rs

/// Representation of our possible errors.
/// Each variant will contain a string for more
/// detailed description
#[derive(Debug)]
pub enum Error {
    /// An error related to the first 16 bytes in a Sqlite3 file
    HeaderString(String),
    /// An error parsing the PageSize of a Sqlite3
    InvalidPageSize(String),
}

// impl Trait for Struct is a way to comply with
// a trait's definition
impl std::fmt::Display for Error {
    /// This will be called whenever we use display ({}) print
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        // the write! macro here works a lot like `format!` though it takes a first argument
        // that can be written to, which the argument `f` fulfils for us
        match self {
            Self::HeaderString(v) => write!(f, "Unexpected bytes at start of file, expected the magic string 'SQLite format 3\u{0}', found {:?}", v),
            Self::InvalidPageSize(msg) => write!(f, "Invalid page size, {}", msg),
        }
    }
}
// Error doesn't have any required methods
// so we can use an empty `impl` block to satisfy
// this trait's implementation
impl std::error::Error for Error {}
```

Alright, let's unpack that a bit. We are going to define our own `Error` enum, one for each
of our possible failure points. Right now there are 2 failure points, first is if the header
string is invalid, the second is if the page size is invalid. Each of the variants will contain
a `String` so we can provide some context at the point we encounter an issue. For example, the
bytes that failed to match our header string, or the u16 page size that wasn't a power of 2.

Ultimately, we want to comply with the `std::error::Error` trait, and to do this 
we first need to implement `Display` and `Debug`. These two traits control how something gets
printed to the terminal when we use the `println!` or `format!` macros. Here is an example of each using our new `Error` enum.

```rust
// Display
println!("{}", Error::InvalidPageSize("expected 2 bytes found []".to_string()));
// $ Invalid page size, expected 2 bytes found []
// Debug
println!("{:?}", Error::InvalidPageSize("value must be >= 512, found: 11".to_string()));
// $ InvalidPageSize("value must be >= 512, found: 11")
```

Notice though that we didn't explicitly implement the `Debug` version
instead we used `#[derive(Debug)]`, which gets us the syntax you see above by default without having to write
any code, which is nice.
We do have to implement `Display` manually so, we will use an exhaustive `match` over each of our enum variants.
Once those are in place, we can then add the trait `std::error::Error` which doesn't have any required methods,
so it will just hang out there at the bottom. With all that done, let's get back to our parsing functions, we are going
to move all the logic from `main.rs` into the `header.rs` file we created.

```rust
// header.rs
// we import that Error enum we just defined
use crate::error::Error;
// we are still going to use `TryInto` for converting
// a slice to an array, we just move it from main.rs into here
// however we are going to leverage `TryFrom` to convert a `u16`
// into a `PageSize` so we bring that into scope here as well.
use std::convert::{TryFrom, TryInto};
/// The magic string at the start of all Sqlite3 database files is
/// `Sqlite format 3\{0}`, we keep this as a static slice of bytes since it 
/// shouldn't ever change and the file we are reading is already bytes so 
/// converting it to a string is unnecessary
static HEADER_STRING: &[u8] = &[
 //  S   q   l    i    t    e  ` `   f    o    r    m   a    t  ` `  3  \u{0}
    83, 81, 76, 105, 116, 101, 32, 102, 111, 114, 109, 97, 116, 32, 51, 0,
];

#[derive(Debug)]
pub struct PageSize(u32);

/// Validate that the bytes provided match the special string
/// at the start of Sqlite3 files
pub fn validate_header_string(bytes: &[u8]) -> Result<(), Error> {
    let buf = &bytes[0..16];
    // if the provided bytes don't match the static HEADER_STRING,
    // we return early
    if buf != HEADER_STRING {
        // since we only head this way on the error case, we convert the provided
        // value into a string. We don't want to error in our error path if it isn't valid utf8
        // so we again use `from_utf8_lossy` and then convert that into a string. 
        return Err(Error::HeaderString(String::from_utf8_lossy(buf).to_string()))
    }
    Ok(())
}
/// Parse the page size bytes the header into a `PageSize`
pub fn parse_page_size(bytes: &[u8]) -> Result<PageSize, Error> {
    // first we try and covert the slice into an array. This returns a `Result`
    // so we can use the `map_err` method on that to convert a possible error here
    // into _our_ error. Doing it this way allows us to use the `?` operator at the 
    // end which will return early if this fails.
    let page_size_bytes: [u8;2] = bytes[16..18].try_into().map_err(|_| {
        Error::InvalidPageSize(format!("expected a 2 byte slice, found: {:?}", bytes))
    })?;
    // Now we can convert the value into a `u16`
    let raw_page_size = u16::from_be_bytes(page_size_bytes);
    // lastly we are going to use the `try_into` method defined below
    // to finish the job
    raw_page_size.try_into()
}

// Another trait implementation, similar to `Display`
// This one though, takes a generic argument that says
// what the input should be. 
impl TryFrom<u16> for PageSize {
    // We also have to add an "associated type" here that will
    // define the error we will return from the one method we 
    // have to define
    type Error = Error;
    // This is the single requirement for conforming to `TryFrom`
    fn try_from(v: u16) -> Result<PageSize, Self::Error> {
        // This looks a little different than what we had before. Instead
        // of having a series of `if`s, we instead use a single `match` statement
        match v {
            // if 1, we have a special case, we can return the `Ok`
            // value with the maximum page size
            1 => Ok(PageSize(65_536u32)),
            // If we find 0 or 2-511, we found and invalid page size
            // we use the `format!` macro to include the provided value in the
            // error message
            0 | 2..=511 => Err(Error::InvalidPageSize(format!(
                "value must be >= 512, found: {}",
                v
            ))),
            // This will catch all values >= 512
            _ => {
                // Since we know it is large enough, we check if it is a power of 2
                if v.is_power_of_two() {
                    // success, we can cast the provided value to a `u32` and be done
                    Ok(PageSize(v as u32))
                } else {
                    // failed, return an error with an additional explanation
                    Err(Error::InvalidPageSize(format!(
                        "value must be a power of 2 found: {}",
                        v
                    )))
                }
            }
        }
    }
}
```
That one was a doosy, let's go over a few of the parts. First, we had to update our imports, bringing in our new `Error`
as well as `TryFrom`. Next we just moved the logic from `main.rs` into our new file, adjusting it so each step is its own function.

You may have noticed that `parse_page_size` uses `v.try_into()` at the very end,
one of the cool things about `TryFrom` and `TryInto` is that by implementing 1 you get the other for free. This means that our
implementation of `TryFrom<u16> for PageSize` automatically sets up `TryInto<PageSize> for u16` for us!

Now that we have our library setup, lets update `main.rs` to use our it.

```rust
// main.rs
// First we need to import our library like it is a dependency
// since it isn't officially part of our binary project. For right
// now we are going to just import all of the things individually
use sqlite_parser::{
    header::{validate_magic_string, parse_page_size},
    error::Error,  
};

fn main() -> Result<(), Error> {
    // Still reading the whole file into a `Vec<u8>` and panicking if that fails
    let contents = std::fs::read("data.sqlite").expect("Failed to read data.sqlite");
    // Check that the first 16 bytes match the header string
    validate_header_string(&contents)?;
    // capture the page size
    let page_size = parse_page_size(&contents)?;
    // print that out to the terminal
    println!("{:?}", page_size);
}
```
Notice, that we have updated `main` to return a `Result`, this will allow us
to use the `?` operator to fail for us if we encounter an error.

Let's run this and see what happens.

```sh$
$ cargo run
PageSize(4096)
```

Success!

At this stage, we have all the plumbing in the right place to tackle the rest of
the our first 100 bytes. In the next post, we'll do just that finish parsing the
database header.

<!-- [Part 2](/blog/sqlite2/index.html) -->
