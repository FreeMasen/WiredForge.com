+++
title = "SQLite Parser Pt. 2"
date = 2017-12-29
draft = true
tags = ["sqlite", "integer-storage", "decoding"]
[extra]
snippet = "The Header... continues"
+++

This is the second in a series of posts describing the process of building a SQLite file parser. 
If you missed the first part you can find it [here](http://freemasen.com//blog/sqlite-parser-pt-1/index.html).

Continuing from where we left off, we need to figure out what the rest of the
first 100 bytes are supposed to look like. Our next entry in the header is
the "file format write version". That is a pretty vague name...

According to the docs, this byte and the next byte ("file format read version")
will control if the database will use "rollback journalling" or a "write ahead journalling".
This is the second time we have seen the term "journal", let's go over what it means.

A Sqlite journal is a separate file used to allow for recovering after something goes wrong
while making a change to the database. Sqlite supports 2 different versions of this file.

### Rollback Journal

With this method of journalling, any time a process wants to change the data in the database
Sqlite will make a copy of all of the pages that would be affected before it changes the
main database file and put them in the journal file. If something were to go wrong before
the change was complete, Sqlite would copy those pages from the journal and overwrite
any possible changes made to the main database file. When the change is complete, it will
either delete the journal file or just delete the contents in the journal file.

### Wite Ahead Log

With this method of journalling, any time a process wants to change the database, Sqlite
will make a copy of the pages being changed and again put them in the journal file.
The main difference is that it will not actually change the main database file but instead
change the journal file. This means that any time someone wants to read information from
the database, Sqlite first has to check if the data being requested has changes
in the journal before looking in the main database file. When all database connections
are closed, or a configurable number of pages are modified, the changes are then
applied to the main database file.


Now that we have covered what these next 2 bytes mean, let's setup our library to 
parse them. Right now, Sqlite supports 2 values here, 1 for rollback journalling
or legacy mode and 2 for write ahead log or WAL mode however the docs say that
this could be extended to include additional values in the future. In our `header.rs`
let's start with setting up an enum to represent this value.


```rust
// header.rs

/// A value stored as a Write Format Version or
/// Read Format Version
#[derive(Debug, PartialEq, Eq, PartialOrd, Ord)]
enum FormatVersion {
    /// Represents the rollback journal mode
    Legacy,
    /// Represents the Write Ahead Log mode
    WriteAheadLog,
    /// Represents any mode not 1 or 2, the value
    /// will be provided
    Unknown(u8),
}

impl From<u8> for FormatVersion {
    fn from(v: u8) -> Self {
        match v {
            1 => Self::Legacy,
            2 => Self::WriteAheadLog,
            _ => Self::Unknown(v),
        }
    }
}
```

Let's just check in on a few things here. First we are `derive`ing a few more items,
`PartialEq` and `Eq` allow for using the `==` operator with 2 `FormatVersion`s while
the `PartialOrd` and `Ord` allow for the use of `>`, `<`, `<=`, or `>=`. We want to 
go the extra mile here because the docs tell us that if the read format is 1 or 2
but the write format is greater than 2 we have a read only database, when we get to 
that validation it will be nice to use these operators. 

After we define our 3 possible values, we also can define `From<u8>` for our enum.
If that value is 1 we return the `Legacy` mode, if 2 the `WriteAheadLog` otherwise
we return the `Unknown` mode. This will allow for flexibility in parsing these values
since the Sqlite authors may change the values available here moving forward. With
our enum defined and that `From` implementation, it seems silly to add another
parsing function since it will just wrap `FormatVersion::from`. Instead, let's
add a main entry point for this module called `parse_header`.

```rust
// header.rs

pub fn parse_header(bytes: &[u8]) -> Result<(PageSize, FormatVersion, FormatVersion), Error> {
    // Check that the first 16 bytes match the header string
    validate_header_string(&contents)?;
    // capture the page size
    let page_size = parse_page_size(&contents)?;
    // capture the write format version
    let write_version = FormatVersion::from(bytes[18]);
    // capture the read format version
    let read_version = FormatVersion::from(bytes[19]);
    Ok((page_size, write_version, read_version))
}
```

In the above, we essentially just moved the contents of our old `fn main` into this
function and then appended our 2 new values. This new function returns a tuple with
the three values we parsed, let's update `main` to use this.

```rust
// main.rs
use sqlite_parser::{
    header::parse_header,
    error::Error,  
};

fn main() -> Result<(), Error> {
    // Still reading the whole file into a `Vec<u8>` and panicking if that fails
    let contents = std::fs::read("data.sqlite").expect("Failed to read data.sqlite");
    // We call our new `parse_header` function providing only the first 100 bytes
    // since that is the exact size of our header. We "destructure" the tuple
    // returned into 3 variables.
    let (page_size, write_format, read_format) = parse_header(&contents[0..100])?;
    println!("page_size {:?}, write_format {:?}, read_format {:?}");
}

```

Notice, we don't have to import as much from our library and we can use destructuring
to assign our multiple return values to variables. When we get to a point where we are
also parsing pages, it will be nice to have this encapsulated.

Moving right along, we have a few more single byte entries. The first is the number of
reserved bytes on each page. This is to allow extensions to Sqlite to reserve space
to store additional information. We'll just add this as a variable inside of our `parse_header`

```rust
// header.rs

pub fn parse_header(bytes: &[u8]) -> Result<(PageSize, FormatVersion, FormatVersion), Error> {
    // Check that the first 16 bytes match the header string
    validate_header_string(&contents)?;
    // capture the page size
    let page_size = parse_page_size(&contents)?;
    // capture the write format version
    let write_version = FormatVersion::from(bytes[18]);
    // capture the read format version
    let read_version = FormatVersion::from(bytes[19]);
    let reserved_bytes = bytes[20];
    Ok((page_size, write_version, read_version))
}
```

The next 3 bytes are similarly uninteresting, they are the maximum and minimum
"embedded payload fraction", and the "leaf payload fraction". Originally the
Sqlite authors had expected these values to be configurable but gave up on that
and say they have no interest in implementing it. Their values will always be
64 (max), 32 (min), and 32 (leaf). Let's add an error case for this to our
`error` module.

```rust
/// Representation of our possible errors.
/// Each variant will contain a string for more
/// detailed description
#[derive(Debug)]
pub enum Error {
    /// An error related to the first 16 bytes in a Sqlite3 file
    HeaderString(String),
    /// An error parsing the PageSize of a Sqlite3
    InvalidPageSize(String),
    /// An error parsing the maximum/ payload fraction
    /// or leaf fraction
    InvalidFraction(String),
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            Self::HeaderString(v) => write!(f, "Unexpected bytes at start of file, expected the magic string 'SQLite format 3\u{0}', found {:?}", v),
            Self::InvalidPageSize(msg) => write!(f, "Invalid page size, {}", msg),
            // For our new case, we are just going to print the inner message
            Self::InvalidFraction(msg) => write!(f, "{}", msg),
        }
    }
}
```

With that defined we can implement our next three parsing functions.


```rust
// header.rs

/// Validate one of the payload/leaf fractions. If byte doesn't match
/// target will create an error with the provided name.
fn validate_fraction(byte: u8, target: u8, name: &str) -> Result<(), Error> {
    if byte != target {
        Err(Error::InvalidFraction(format!("{} must be {}, found: {}", name, target, byte)))
    } else {
        Ok(())
    }
}
```

Instead of writing 3 separate functions or if statements, we can easily perform all three
validations in a single function. We just need to past the name as a `&str` to build our
error if something has gone wrong. Let's add those to our `parse_header` function.

```rust
// header.rs
pub fn parse_header(bytes: &[u8]) -> Result<(PageSize, FormatVersion, FormatVersion), Error> {
    // Check that the first 16 bytes match the header string
    validate_header_string(&contents)?;
    // capture the page size
    let page_size = parse_page_size(&contents)?;
    // capture the write format version
    let write_version = FormatVersion::from(bytes[18]);
    // capture the read format version
    let read_version = FormatVersion::from(bytes[19]);
    let reserved_bytes = bytes[20];
    validate_fraction(bytes[21], 64, "Maximum payload fraction")?;
    validate_fraction(bytes[21], 32, "Minimum payload fraction")?;
    validate_fraction(bytes[21], 32, "Leaf fraction")?;

    Ok((page_size, write_version, read_version))
}

```

Now we are moving right a long! Our next value is going to be 4 bytes wide and represents
the file change counter. This is used by a Sqlite to detect if the database has been modified
and it needs to re-fetch the data from the disk. There is a note in the docs that if you are
in WAL mode, the counter may not be updated because that system doesn't require it. 
Let's get to parsing 4 bytes wide means it is going to be a `u32`, in fact, all of the
remaining values we have to parse are going to end up being `u32`s, let's generalize this
process in our `lib.rs` file.

```rust
// lib.rs

// A little strange but since this might end up being
// used in a large number of places, we can use a 
// String in the error position of our result. This
// will allow the caller to insert their own error
// with the more context.
fn try_parse_u32(bytes: &[u8]) -> Result<u32, String> {
    use std::convert::TryInto;
    // Just like with our u16, we are going to need to convert
    // a slice into an array of 4 bytes. Using the `try_into`
    // method on a slice, we will fail if the slice isn't exactly
    // 4 bytes. We can use `map_err` to build our string only if
    // it fails
    let arr: [u8;4] = bytes.try_into()
        .map_err(|_| {
            format!("expected a 4 byte slice, found a {} byte slice", bytes.len())
        })?;
    // Finally we use the `from_be_bytes` constructor for a u32
    Ok(u32::from_be_bytes(arr))
}

```


