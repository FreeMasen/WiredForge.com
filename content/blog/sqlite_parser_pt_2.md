+++
title = "SQLite Parser Pt. 2"
date = 2020-10-01
draft = false
tags = ["sqlite", "integer-storage", "decoding"]
[extra]
snippet = "The Header... continues"
+++

This is the second in a series of posts describing the process of building a SQLite file parser. 
If you missed the first part you can find it [here](@/blog/sqlite_parser_pt_1.md).

Continuing from where we left off, we need to figure out what the
next few bytes of the headers are supposed to look like.
Our next entry in the header is called the "file format write version".
That is a pretty vague name...

According to the docs, this byte and the next byte ("file format read version")
will control if the database uses "rollback journaling" or a "write ahead log".
This is the second time we have seen the term "journal", so let's go over what it means.

A Sqlite journal is a separate file used to allow for recovering after something goes wrong
when making a change to the database. Sqlite supports 2 different versions of this file.

## Rollback Journal

With this method of journaling, any time a process wants to change the data in the database
Sqlite will make a copy of all of the pages that would be effected. It then writes those
pages into a "journal" file, typically next to where your database lives. Once the copy
is made, the original database is updated. If something were to go wrong before the change was complete,
Sqlite would "rollback" by re-copying the pages in the journal file over any partial changes made
to the main database file. If a change is successful, it will
either delete the journal file or just delete the contents in the journal file.

## Write Ahead Log

With this method of journaling, any time a process wants to change the database, Sqlite
will make a copy of the pages being changed and again put them in the journal file.
The main difference is it will not actually change the main database file but instead
change the journal file. This means any time someone wants to read information from
the database, Sqlite first has to check if the data being requested is on a page that has changes
in the journal before looking in the main database file. When all database connections
are closed, or a configurable number of pages are modified, the changes are then
applied to the main database file. This is scheme is sometimes referred to as 
[append only](https://en.wikipedia.org/wiki/Append-only), by other databases.

Now that we have covered what these next 2 bytes mean, let's setup our library to 
parse them. Right now, Sqlite supports 2 values here, 1 for rollback journaling
or "legacy mode" and 2 for write ahead log or WAL mode. The docs say
this could be extended to include additional values in the future. In our `header.rs`
let's start with setting up an enum to represent this value.


```rust
// header.rs

/// A value stored as a Write Format Version or
/// Read Format Version
#[derive(Debug, PartialEq, Eq, PartialOrd, Ord)]
pub enum FormatVersion {
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
go the extra mile here because the docs tell us if the read format is 1 or 2
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

pub fn parse_header(
        bytes: &[u8]
    ) -> Result<(PageSize, FormatVersion, FormatVersion), Error> {
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
    // Still reading the whole file into a `Vec<u8>`
    // and panicking if that fails
    let contents = std::fs::read("data.sqlite")
        .expect("Failed to read data.sqlite");
    // We call our new `parse_header` function
    // providing only the first 100 bytes
    // since that is the exact size of our header.
    // We "destructure" the tuple
    // returned into 3 variables.
    let (page_size,
        write_format,
        read_format) = parse_header(&contents[0..100])?;
    println!("page_size {:?}, write_format {:?}, read_format {:?}");
}

```

Notice, we don't have to import as much from our library. When we get beyond the header
it will be nice to have this encapsulated.

Moving right along, we have a few more single byte entries. The first is the number of
reserved bytes on each page. This is to allow extensions to Sqlite to reserve space
to store additional information. Some examples of extensions include [json1](https://www.sqlite.org/json1.html),
to query json from a `TEXT` field or [full text search](https://www.sqlite.org/fts5.html) for performing full text
search. Sometimes authors of these extensions may need to store additional information about the data on a
page and this value would tell us how much of each page has been reserved for that purpose. 


Since this value is a single entry in our slice we'll just add this as a variable inside of our `parse_header`.

```rust
// header.rs

pub fn parse_header(
        bytes: &[u8]    
    ) -> Result<(PageSize, FormatVersion, FormatVersion, u8), Error> {
    // Check that the first 16 bytes match the header string
    validate_header_string(&contents)?;
    // capture the page size
    let page_size = parse_page_size(&contents)?;
    // capture the write format version
    let write_version = FormatVersion::from(bytes[18]);
    // capture the read format version
    let read_version = FormatVersion::from(bytes[19]);
    let reserved_bytes = bytes[20];
    Ok((page_size, write_version, read_version, reserved_bytes))
}
```

The next 3 bytes are quite uninteresting, they are the maximum and minimum
"embedded payload fraction", and the "leaf payload fraction". Originally the
Sqlite authors had expected these values to be configurable but gave up on that, saying they have no interest in implementing it. Their values will always be
64 (max), 32 (min), and 32 (leaf). Let's add an error case for this to our
`error` module.

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
    /// An error parsing the maximum/minimum payload fraction
    /// or leaf fraction
    InvalidFraction(String),
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            Self::HeaderString(v) => write!(f,
                "Unexpected bytes at start of file, \
                expected the magic string 'SQLite format 3\u{0}',\
                found {:?}", v),
            Self::InvalidPageSize(msg) => write!(f,
                "Invalid page size, {}", msg),
            // For our new case, we are just
            // going to print the inner message
            Self::InvalidFraction(msg) => write!(f, "{}", msg),
        }
    }
}
```

With that defined we can implement a function to parse our next 3 values.
Instead of writing 3 separate functions or if statements, we can easily perform all three
validations in a single function. We just need to pass the name as a `&str` to build our
error if something has gone wrong. 

```rust
// header.rs

/// Validate one of the payload/leaf fractions. If byte doesn't match
/// target will create an error with the provided name.
fn validate_fraction(
        byte: u8,
        target: u8,
        name: &str
    ) -> Result<(), Error> {
    if byte != target {
        Err(Error::InvalidFraction(format!(
            "{} must be {}, found: {}", name, target, byte
        )))
    } else {
        Ok(())
    }
}
```

Let's add that to our `parse_header` function.

```rust
// header.rs
pub fn parse_header(
        bytes: &[u8]
    ) -> Result<(PageSize, FormatVersion, FormatVersion), Error> {
    // Check that the first 16 bytes match the header string
    validate_header_string(&bytes)?;
    // capture the page size
    let page_size = parse_page_size(&bytes)?;
    // capture the write format version
    let write_version = FormatVersion::from(bytes[18]);
    // capture the read format version
    let read_version = FormatVersion::from(bytes[19]);
    let reserved_bytes = bytes[20];
    validate_fraction(bytes[21], 64, "Maximum payload fraction")?;
    validate_fraction(bytes[22], 32, "Minimum payload fraction")?;
    validate_fraction(bytes[23], 32, "Leaf fraction")?;

    Ok((page_size, write_version, read_version))
}

```

Now we are moving right along! Our next value is going to be 4 bytes wide and represents
the file change counter. This is used by a Sqlite to detect if the database has been modified
and it needs to re-fetch the data from the disk. There is a note in the docs that if you are
in WAL mode, the counter may not be updated because that system doesn't require it. This ends
up working because, in WAL mode, a sqlite process will have to check the write ahead log
for any changes before it will read anything currently held in memory.


Let's get to parsing. 4 bytes wide means it is going to be a `u32`, in fact, all of the
remaining values we have to parse are going to end up being `u32`s, so we can generalize this
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
            format!(
                "expected a 4 byte slice, found a {} byte slice",
                bytes.len())
        })?;
    // Finally we use the `from_be_bytes` constructor for a u32
    Ok(u32::from_be_bytes(arr))
}

```

That looks pretty good, we still might run into an issue with the slice passed in
being the wrong size, so we set that up as the error case in our return value.
Let's update our error enum to handle this new change counter error.

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
    /// An error parsing the maximum/ payload fraction
    /// or leaf fraction
    InvalidFraction(String),
    /// The change counter failed to parse
	InvalidChangeCounter(String),
}

impl std::fmt::Display for Error {
	fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
		Self::HeaderString(v) => write!(f,
                "Unexpected bytes at start of file, \
                expected the magic string 'SQLite format 3\u{0}',\
                found {:?}", v),
            Self::InvalidPageSize(msg) => write!(f,
                "Invalid page size, {}", msg),
            // For our new case, we are just
            // going to print the inner message
            Self::InvalidFraction(msg) => write!(f, "{}", msg),
            Self::InvalidChangeCounter(msg) => write!(f, 
                "Invalid change counter: {}", msg),
	}
}
```
Lets start using it for the change counter. 

```rust
// header.rs

fn parse_header(
        contents: &[u8]
    ) -> Result<(PageSize, FormatVersion, FormatVersion, u8, u32), Error> {
    validate_header_string(&contents)?;
    let page_size = parse_page_size(&contents)?;
    let write_version = FormatVersion::from(bytes[18]);
    let read_version = FormatVersion::from(bytes[19]);
    let reserved_bytes = bytes[20];
    validate_fraction(bytes[21], 64, "Maximum payload fraction")?;
    validate_fraction(bytes[21], 32, "Minimum payload fraction")?;
    validate_fraction(bytes[21], 32, "Leaf fraction")?;
    // we'll use our helper from the `crate` to try and parse
    // these 4 bytes as the change counter. If that fails, we
    // put the message inside of our `Error` using the `map_err`
    // method on `Result`. This allows us to again use the 
    // ? to short circuit if it fails
    let change_counter = crate::try_parse_u32(&bytes[24..28])
    	.map_err(|msg| Error::InvalidChangeCounter(msg))?;
    Ok((page_size, write_version,
        read_version, reserved_bytes, change_counter))
}
```

That looks like what we are after but oof, that return value is starting to get a little unwieldy.
Let's setup a `struct` that we can put all these values into.

```rust
// header.rs

#[derive(Debug)]
pub struct DatabaseHeader {
    pub page_size: PageSize,
    pub write_version: FormatVersion,
    pub read_version: FormatVersion,
    pub reserved_bytes: u8,
    pub change_counter: u32,
} 

```

With this, we can update our `parse_header` to return our new struct instead of that giant tuple.

```rust
// header.rs 

fn parse_header(bytes; &[u8]) -> Result<DatabaseHeader, Error> {
    validate_header_string(&contents)?;
    let page_size = parse_page_size(&contents)?;
    let write_version = FormatVersion::from(bytes[18]);
    let read_version = FormatVersion::from(bytes[19]);
    let reserved_bytes = bytes[20];
    validate_fraction(bytes[21], 64, "Maximum payload fraction")?;
    validate_fraction(bytes[21], 32, "Minimum payload fraction")?;
    validate_fraction(bytes[21], 32, "Leaf fraction")?;
    let change_counter = crate::try_parse_u32(&bytes[24..28])
    	.map_err(|msg| Error::InvalidChangeCounter(msg))?;
    Ok(DatabaseHeader {
        page_size,
        write_version,
        read_version,
        reserved_bytes,
        change_counter,
    })
}
```

This is quite a bit nicer, let's update our main.rs now to use this new struct.

```rust
fn main() -> Result<(), Error> {
     let contents = std::fs::read("data.sqlite")
        .expect("Failed to read data.sqlite");
    let db_header = parse_header(&contents[0..100])?;
    // Using the format placeholder {:#?} gives us the 
    // debug print but pretty printed.
    println!("{:#?}", db_header)
}
``` 

And if we run this, it should print something like the following.

```sh
$ cargo run
DatabaseHeader {
    page_size: PageSize(4096),
    write_version: Legacy,
    read_version: Legacy,
    reserved_bytes: 0,
    change_counter: 1
}
```

Nice, that looks pretty good so far! Up next is another `u32`, this one
will represent our database size in pages. With this value we would be
able to determine the total size of the database by multiplying it by
the `page_size`. The unfortunate truth about this value is that
older version of Sqlite do not use it, which for us means that
it will often be invalid. Previous versions of Sqlite would examine the
file directly to determine its size so it doesn't invalidate the whole
file when this is invalid. There are two ways to tell if this value is invalid,
the first being if it is zero. The second way is going to have to wait until
we reach byte 92 because we don't have all the information yet.
The value at byte 92 there is supposed to match our `change_counter` value.

The strange thing here is that the documentation _just_ told us that
the change counter may not be updated if we are in Write Ahead Log 
mode. This still works because the Write Ahead Log mode and the
version-valid-for-number were both added in version 3.7.0. That means
if we were to use an older version of sqlite to modify our database
it couldn't be in WAL mode and would always update the change counter.
At the same time, it will not know about the "version valid for number",
which will cause these to fall out of sync. 

For us, that means we are going to need to hold off on an additional
piece of validation for this number until we get almost to the end
of our header. For right now, we will use an `Option` to represent
this value because if it was invalid, there is no point in filling the value
into our struct. We can also use a standard library type `NonZeroU32`
to enforce the fact that our value cannot be zero. Let's update our
struct to hold this new value.

```rust
// header.rs
use std::num::NonZeroU32;

#[derive(Debug)]
pub struct DatabaseHeader {
    pub page_size: PageSize,
    pub write_version: FormatVersion,
    pub read_version: FormatVersion,
    pub change_counter: u32,
    pub reserved_bytes: u8,
    /// If populated, the number of pages
    /// in this database
    pub database_size: Option<NonZeroU32>,
} 

```

Lastly, we can update `parse_header` to capture this value.

```rust
fn parse_header(bytes; &[u8]) -> Result<DatabaseHeader, Error> {
    validate_header_string(&contents)?;
    let page_size = parse_page_size(&contents)?;
    let write_version = FormatVersion::from(bytes[18]);
    let read_version = FormatVersion::from(bytes[19]);
    let reserved_bytes = bytes[20];
    validate_fraction(bytes[21], 64, "Maximum payload fraction")?;
    validate_fraction(bytes[21], 32, "Minimum payload fraction")?;
    validate_fraction(bytes[21], 32, "Leaf fraction")?;
    let change_counter = crate::try_parse_u32(&bytes[24..28])
    	.map_err(|msg| Error::InvalidChangeCounter(msg))?;
    // since parsing a u32 would indicate a much larger error
    // than this value just being invalid, we will still
    // return early if this fails
    let database_size = crate::try_parse_u32(&bytes[28..32])
        // Passing NonZeroU32::new to map will get
        // us a Result<Option<NonZeroU32>>
        .map(NonZeroU32::new)
        // Ok will convert the outer Result to an
        // Option<Option<NonZeroU32>>
        .ok()
        // Lastly flatten, will automatically reduce this to
        // Option<NonZeroU32> So if we encounter Some(None)
        // we would get None while Some(Some(NonZeroU32))
        // would become Some(NonZeroU32) which is exactly
        // what we want!
        .flatten();
   Ok(DatabaseHeader {
        page_size,
        write_version,
        read_version,
        reserved_bytes,
        change_counter,
        database_size,
   })
}
```

With that, we can again run this and get something like the following.

```sh
$ cargo run
DatabaseHeader {
    page_size: PageSize(
        4096,
    ),
    write_version: Legacy,
    read_version: Legacy,
    reserved_bytes: 0,
    change_counter: 2,
    database_size: Some(
        4,
    ),
}
```

We are getting very close to having this whole header knocked out! However,
since we are going to dig into the meaning of each of these values, we should
take a break here and pick this up in the next post.

[part 3](@/blog/sqlite_parser_pt_3.md)
