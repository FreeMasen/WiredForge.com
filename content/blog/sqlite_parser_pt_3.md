+++
title = "SQLite Parser Pt. 3"
date = 2022-10-12
draft = false
tags = ["sqlite", "integer-storage", "decoding"]
[extra]
snippet = "The Header... keeps going"
+++

This is the third in a series of posts describing the process of building a SQLite file parser.
If you missed the last part you can find it [here](./sqlite_parser_pt_2.md).

In the last post, we left off having just parsed the "in header database size" which started
at byte 28. Our next value is the page number of the first free page. Back in part one, we
covered how our actual data is going to be stored in equal sections called pages. If, for some
reason, we have any pages that are empty or "free" this value will help us find the first
one. Free pages are connected like a linked list, that is to say, each free page will have
the page number of the next free page if there is one. If there aren't any free pages
this value will be 0.

After the first free page number, we would find the length of this list, since these two values
are so closely related we should probably create a struct for them. While we are at it,
let's also add a constructor for this value.

```rust
// header.rs

/// The in header representation
/// of the Free Page List
#[derive(Debug)]
pub struct FreePageListInfo {
    /// The page number of the first 
    /// free page
    pub start_page: NonZeroU32,
    /// The total count of free pages
    pub length: u32,
}

impl FreePageListInfo {
    // Remember a 0 would mean there are no free
    // pages so we can setup our constructor to
    // return None if the start_page is 0
    fn new(start_page: u32, length: u32) -> Option<Self> {
        // This will return None early if passed 0
        let start_page = NonZeroU32::new(start_page)?;
        Some(Self {
            start_page,
            length,
        })
    }
}

```

Remember, the rest of our values are going to be 4 bytes, and we put together a helper
function to convert a 4-byte slice into a `u32` so let's use that. But first, we need to
add a new error to our `Error` enum. Initially, we set up our helper to return a `Result<u32, String>` but in retrospect, this was probably a mistake. Instead, let's add a new error for
the one case where our conversion can fail. While we are at it we can remove one
of our error cases `InvalidChangeCounter` since that can only happen when `try_parse_u32`
fails.

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
    /// Invalid conversion from &[u8] to u32
    InvalidU32(String),   
}

impl std::fmt::Display for Error {
 fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
  Self::HeaderString(v) => write!(f,
                "Unexpected bytes at start of file, \
                expected the magic string 'SQLite format 3\u{0}',\
                found {:?}", v),
            Self::InvalidPageSize(msg) => write!(f,
                "Invalid page size, {}", msg),
            Self::InvalidFraction(msg) => write!(f, "{}", msg),
            Self::InvalidU32(msg) => write!(f, "Invalid u32: {}", msg),
 }
}
```

Now we can update our `try_parse_u32` to return the proper `Result`

```rust
// lib.rs

// Let's update this to take the name of the value, this way we
// can provide a slightly more helpful error message if we encounter
// a problem
fn try_parse_u32(bytes: &[u8], name: &str) -> Result<u32, Error> {
    use std::convert::TryInto;
    let arr: [u8;4] = bytes.try_into()
        .map_err(|_| {
            Error::InvalidU32(format!(
                "expected a 4 byte slice, found a {} byte slice for {}",
                bytes.len(), name))
        })?;
    // Finally we use the `from_be_bytes` constructor for a u32
    Ok(u32::from_be_bytes(arr))
}
```

Now we need to update our `DatabaseHeader` to include our next two values.

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
    pub database_size: Option<NonZeroU32>,
    pub free_page_list_info: Option<FreePageListInfo>,
} 

```

Let's update our `parse_header` to account for these changes and handle our new values.

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
    let change_counter = crate::try_parse_u32(&bytes[24..28], "change counter")?;
    let database_size = crate::try_parse_u32(&bytes[28..32])
        .map(NonZeroU32::new)
        .ok()
        .flatten();
    // Here is our new values
    let first_free_page = crate::try_parse_u32(&bytes[32..36], "first free page")?;
    let free_page_len = crate::try_parse_u32(&bytes[36..40], "free page list length")?;
    let free_page_list_info = FreePageListInfo::new(first_free_page, free_page_len);
    Ok(DatabaseHeader {
        page_size,
        write_version,
        read_version,
        reserved_bytes,
        change_counter,
        database_size,
        first_free_page,
        free_page_list_info,
    })
}

```

Looking pretty good, let's run it and see what it looks like.

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
    free_page_list_info: None,
}
```

Since we haven't really done much with our database, the value is going to be `None`. If
we wanted to see the value filled in, we would have to insert enough data to create a
second page. That is going to be a pretty big sql statement you can find
[one here](https://gist.github.com/FreeMasen/d7242d7dc82b51d1b5952ea220df21ba).

If you were to run that, and then our application again you would see something like
this.

```sh
DatabaseHeader {
    page_size: PageSize(
        4096,
    ),
    write_version: Legacy,
    read_version: Legacy,
    reserved_bytes: 0,
    change_counter: 4,
    database_size: Some(
        6,
    ),
    free_page_list_info: Some(
        FreePageListInfo {
            start_page: 5,
            length: 2,
        },
    ),
}
```

Notice that our database size is now 2 pages larger and the free_page_list_info's length
is 2 which is exactly what we want!

---

Our next byte is the "schema cookie", this is a counter that gets increased every time
a change is made to the database "schema". A database schema is the current set of tables
_and_ their respective columns. This means we should see this number change when we execute
a `CREATE TABLE`, `DROP TABLE`, or `ALTER TABLE` statement.

The reason we need to keep track of this value is because the the sqlite C API allows
for preparing sqlite statements in advance. The process of preparing a statement converts it into a [bytecode](https://en.wikipedia.org/wiki/Bytecode) which will be used for executing.
In truth, all sqlite statements have to go through this process so a preparing a statement
saves some time and energy if you were to use it more than once. The important part of all
this is, a prepared statement might not be valid any longer if the database's schema has
changed. Let's go over an example, first say we want to use the following sql as a prepared
statement.

```sql
INSERT INTO user (name, email)
-- The ?s here allow us to provide values as arguments
-- when we execute
VALUES (?, ?)
```

This is a pretty useful query to have prepared, if we were creating users often, it
would be unfortunate to have to pay for the text to bytecode processing each time.
But now what happens if we wanted to add a new column our user table.

```sql
ALTER TABLE user ADD COLUMN deleted BOOL;
```

This might cause a problem with our prepared statement since it wouldn't know what
to do with this new column. To handle this sqlite will automatically recompile the
prepared statement if this number has changed since it was last used and report an
error to those processes.

Alright, now we know what it does, let's parse it. This one is going to again use
our helper since it is another `u32`, we first want to add that to our struct
and then to `parse_header`.

```rust
// header.rs

#[derive(Debug)]
pub struct DatabaseHeader {
    pub page_size: PageSize,
    pub write_version: FormatVersion,
    pub read_version: FormatVersion,
    pub reserved_bytes: u8,
    pub change_counter: u32,
    pub database_size: Option<NonZeroU32>,
    pub free_page_list_info: Option<FreePageListInfo>,
    pub schema_cookie: u32,
}

pub fn parse_header(bytes: &[u8]) -> Result<DatabaseHeader, Error> {
    validate_header_string(&bytes[0..16])?;
    let page_size = parse_page_size(&bytes[16..18])?;
    let write_version = FormatVersion::from(bytes[18]);
    let read_version = FormatVersion::from(bytes[19]);
    let reserved_bytes = bytes[20];
    validate_fraction(bytes[21], 64, "Maximum payload fraction")?;
    validate_fraction(bytes[22], 32, "Minimum payload fraction")?;
    validate_fraction(bytes[23], 32, "Leaf fraction")?;
    let change_counter =
        crate::try_parse_u32(&bytes[24..28], "change counter")?;
    let database_size = crate::try_parse_u32(&bytes[28..32], "database size")
        .map(NonZeroU32::new)
        .ok()
        .flatten();
    let first_free_page = crate::try_parse_u32(&bytes[32..36], "first free page")?;
    let free_page_len = crate::try_parse_u32(&bytes[36..40], "free page list length")?;
    let free_page_list_info = FreePageListInfo::new(first_free_page, free_page_len);
    // New stuff!
    let schema_cookie = crate::try_parse_u32(&bytes[40..44], "schema cookie")?;
    Ok(DatabaseHeader {
        page_size,
        write_version,
        read_version,
        change_counter,
        reserved_bytes,
        database_size,
        free_page_list_info,
        schema_cookie,
    })
}
```

---

Our next value is going to be the schema format number, this will indicate what version
of sqlite was used to create the file and is used by sqlite to determine if the version
running can understand the file. Currently, there are only 4 schema format numbers (1-4)
and the default has been 4 since 2006. It is possible to set this to 1 by either
compiling sqlite directly or running a special statement but versions 2 and 3 would only
be found if you were using an older version of sqlite. Version 1 is going to be the
baseline all versions of sqlite can handle this format. Version 2 adds the ability
for a table's rows to each have their own number of columns. The docs say that this
is what enables `ALTER TABLE ... ADD COLUMN`, which would mean those statements
aren't available in Version 1 database files. Version 3 builds upon the changes in
version 2 by allowing declaring default values when using this new add column statement.
Version 4 adds the ability for indexes to be created in descending order, previous to this
version, indexes were _always_ ascending.

Just like we did with the read/write format version, let's create an enum for representing
this value. Unlike the previous, a zero here would be an error, so let's add a new variant
to our `Error` enum. Similar to our `Error::InvalidU32`, let's generalize for an unexpected
zero, we will have it carry a string for the name of the value that caused the error.

```rust
// error.rs

#[derive(Debug)]
pub enum Error {
    /// An error with the magic string
    /// at index 0 of all SQLite 3 files
    HeaderString(String),
    /// An error with the page size
    InvalidPageSize(String),
    /// An error parsing the maximum/minimum payload fraction
    /// or leaf fraction
    InvalidFraction(String),
    /// An invalide u32 was found
    InvalidU32(String),
    /// Encountered a 0 when NonZero was expected
    UnexpectedZero(String),
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            Self::HeaderString(v) => write!(f, "Unexpected bytes at start of file, expected the magic string 'SQLite format 3\u{0}', found {:?}", v),
            Self::InvalidPageSize(msg) => write!(f, "Invalid page size, {}", msg),
            Self::InvalidFraction(msg) => write!(f, "{}", msg),
            Self::InvalidU32(msg) => write!(f, "{}", msg),
            Self::UnexpectedZero(what) => write!(f, "Expected non-zero value for {}", what),
        }
    }
}

```

With that, we can now define our enum and the `TryFrom` implementation we are going to use
to create this value.

```rust
// header.rs
use crate::error::Error;
// First we need to update our imports to include
// TryFrom
use std::{convert::TryFrom, num::NonZeroU32};

#[derive(Debug)]
pub enum SchemaVersion {
    /// Baseline usable by all sqlite versions
    One,
    /// Usable from sqlite version 3.1.3 and above
    Two,
    /// Usable from sqlite version 3.1.4 and above
    Three,
    /// Usable from sqlite version 3.3.0 and above
    Four,
    /// Version > 4
    Unknown(NonZeroU32),
}

impl TryFrom<u32> for SchemaVersion {
    // Set the associated type to our error enum
    type Error = Error;

    fn try_from(v: u32) -> Result<Self, Self::Error> { 
        Ok(match v {
            1 => Self::One,
            2 => Self::Two,
            3 => Self::Three,
            4 => Self::Four,
            _ => {
                let value = NonZeroU32::new(v)
                    // ok_or_else will convert our Option to a Result
                    .ok_or_else(|| {
                        Error::UnexpectedZero("Schema Version".to_string())
                    })?;
                Self::Unknown(value)
            },
        })
    }
}

```

Now the last step is to add it to our struct and parsing function.

```rust
// header.rs

#[derive(Debug)]
pub struct DatabaseHeader {
    pub page_size: PageSize,
    pub write_version: FormatVersion,
    pub read_version: FormatVersion,
    pub reserved_bytes: u8,
    pub change_counter: u32,
    pub database_size: Option<NonZeroU32>,
    pub free_page_list_info: Option<FreePageListInfo>,
    pub schema_cookie: u32,
    pub schema_version: SchemaVersion,
}

pub fn parse_header(bytes: &[u8]) -> Result<DatabaseHeader, Error> {
    validate_header_string(&bytes[0..16])?;
    let page_size = parse_page_size(&bytes[16..18])?;
    let write_version = FormatVersion::from(bytes[18]);
    let read_version = FormatVersion::from(bytes[19]);
    let reserved_bytes = bytes[20];
    validate_fraction(bytes[21], 64, "Maximum payload fraction")?;
    validate_fraction(bytes[22], 32, "Minimum payload fraction")?;
    validate_fraction(bytes[23], 32, "Leaf fraction")?;
    let change_counter =
        crate::try_parse_u32(&bytes[24..28], "change counter")?;
    let database_size = crate::try_parse_u32(&bytes[28..32], "database size")
        .map(NonZeroU32::new)
        .ok()
        .flatten();
    let first_free_page = crate::try_parse_u32(&bytes[32..36], "first free page")?;
    let free_page_len = crate::try_parse_u32(&bytes[36..40], "free page list length")?;
    let free_page_list_info = FreePageListInfo::new(first_free_page, free_page_len);
    let schema_cookie = crate::try_parse_u32(&bytes[40..44], "schema cookie")?;
    // Our new value is here
    let raw_schema_version = crate::try_parse_u32(&bytes[44..48], "schema format version")?;
    let schema_version = SchemaVersion::try_from(raw_schema_version)?;
    Ok(DatabaseHeader {
        page_size,
        write_version,
        read_version,
        change_counter,
        reserved_bytes,
        database_size,
        free_page_list_info,
        schema_cookie,
        schema_version,
    })
}
```

And now let's see what that looks like.

```sh
$ cargo run
DatabaseHeader {
    page_size: PageSize(
        4096,
    ),
    write_version: Legacy,
    read_version: Legacy,
    reserved_bytes: 0,
    change_counter: 5,
    database_size: Some(
        6,
    ),
    free_page_list_info: Some(
        FreePageListInfo {
            start_page: 5,
            length: 1,
        },
    ),
    schema_cookie: 4,
    schema_version: Four,
}
```

That is exactly what we were expecting!

---

Our next value is going to be the suggested cache size, which is a value that can be set
by the user with something called a "pragma". A pragma is a special sqlite statement for
configuring a database. We have covered a few values that can be adjusted by pragmas
so it's high time we covered them. As of now, there are a
[total of 73](https://sqlite.org/pragma.html) pragmas, 7 of these are deprecated,
5 are only available with custom build options and 3 are only for testing.
An example of a pragma statement that adjusts our suggested cache size would look like this.

```sql
-- Set the cache size to 10 pages
PRAGMA default_cache_size = 10
```

This value will be used as part of the calculation of how many pages should be kept
in memory at a given time. Interestingly enough, `default_cache_size` is one of those
7 deprecated pragmas, regardless we need to parse it anyway. This one is going to
just be a simple `u32`, let's add that to our struct and `parse_header`.

```rust
// header.rs
#[derive(Debug)]
pub struct DatabaseHeader {
    pub page_size: PageSize,
    pub write_version: FormatVersion,
    pub read_version: FormatVersion,
    pub reserved_bytes: u8,
    pub change_counter: u32,
    pub database_size: Option<NonZeroU32>,
    pub free_page_list_info: Option<FreePageListInfo>,
    pub schema_cookie: u32,
    pub schema_version: SchemaVersion,
    pub cache_size: u32,
}

pub fn parse_header(bytes: &[u8]) -> Result<DatabaseHeader, Error> {
    validate_header_string(&bytes[0..16])?;
    let page_size = parse_page_size(&bytes[16..18])?;
    let write_version = FormatVersion::from(bytes[18]);
    let read_version = FormatVersion::from(bytes[19]);
    let reserved_bytes = bytes[20];
    validate_fraction(bytes[21], 64, "Maximum payload fraction")?;
    validate_fraction(bytes[22], 32, "Minimum payload fraction")?;
    validate_fraction(bytes[23], 32, "Leaf fraction")?;
    let change_counter =
        crate::try_parse_u32(&bytes[24..28], "change counter")?;
    let database_size = crate::try_parse_u32(&bytes[28..32], "")
        .map(NonZeroU32::new)
        .ok()
        .flatten();
    let first_free_page = crate::try_parse_u32(&bytes[32..36], "first free page")?;
    let free_page_len = crate::try_parse_u32(&bytes[36..40], "free page list length")?;
    let free_page_list_info = FreePageListInfo::new(first_free_page, free_page_len);
    let schema_cookie = crate::try_parse_u32(&bytes[40..44], "schema cookie")?;
    let raw_schema_version = crate::try_parse_u32(&bytes[44..48], "schema format version")?;
    let schema_version = SchemaVersion::try_from(raw_schema_version)?;
    // New value!
    let cache_size = crate::try_parse_u32(&bytes[48..52], "cache size")?;
    Ok(DatabaseHeader {
        page_size,
        write_version,
        read_version,
        change_counter,
        reserved_bytes,
        database_size,
        free_page_list_info,
        schema_cookie,
        schema_version,
        cache_size,
    })
}
```

and when we run it.

```rust
$ cargo run
DatabaseHeader {
    page_size: PageSize(
        4096,
    ),
    write_version: Legacy,
    read_version: Legacy,
    reserved_bytes: 0,
    change_counter: 5,
    database_size: Some(
        6,
    ),
    free_page_list_info: Some(
        FreePageListInfo {
            start_page: 5,
            length: 1,
        },
    ),
    schema_cookie: 4,
    schema_version: Four,
    cache_size: 0,
}
```

Looking good!

---

Up next, we have the auto vacuum setting. Auto vacuum is a setting that will allow for
automatically deleting unused pages. Vacuuming is a term used here to mean that all of
the free pages will be moved to the end of the file and the file will be shrunk (or
"truncated") to remove them.

When a page becomes empty (aka "free"), there are a few options for what might happen, if auto vacuum is
set to 0, the free list will be updated to include this new free page and nothing is deleted;
if auto vacuum is not zero then the page is moved to the end and the file is truncated.
Moving things around can get kind of messy so this value is used to keep track of the "largest
root page" allowing SQLite to know where to look after things got moved around.

To parse this, we are going to wrap the value in our own enum which will have 1 variant for
right now. This is going to come up again very soon, so don't put it entirely out of
your mind.

We will also add that to our `DatabaseHeader` struct while we are at it.

```rust
// header.rs

#[derive(Debug, Clone, Copy)]
pub enum VacuumSetting {
    /// Incremental vacuum is set to full
    Full(NonZeroU32)
}

impl VacuumSetting {
    /// A constructor that returns an optional
    /// VacuumSetting
    pub fn full(v: u32) -> Option<Self> {
        let non_zero = NonZeroU32::new(v)?;
        Some(VacuumSetting::Full(non_zero))
    }
}

#[derive(Debug)]
pub struct DatabaseHeader {
    pub page_size: PageSize,
    pub write_version: FormatVersion,
    pub read_version: FormatVersion,
    pub reserved_bytes: u8,
    pub change_counter: u32,
    pub database_size: Option<NonZeroU32>,
    pub free_page_list_info: Option<FreePageListInfo>,
    pub schema_cookie: u32,
    pub schema_version: SchemaVersion,
    pub cache_size: u32,
    pub vacuum_setting: Option<VacuumSetting>,
}

pub fn parse_header(bytes: &[u8]) -> Result<DatabaseHeader, Error> {
    validate_header_string(&bytes[0..16])?;
    let page_size = parse_page_size(&bytes[16..18])?;
    let write_version = FormatVersion::from(bytes[18]);
    let read_version = FormatVersion::from(bytes[19]);
    let reserved_bytes = bytes[20];
    validate_fraction(bytes[21], 64, "Maximum payload fraction")?;
    validate_fraction(bytes[22], 32, "Minimum payload fraction")?;
    validate_fraction(bytes[23], 32, "Leaf fraction")?;
    let change_counter =
        crate::try_parse_u32(&bytes[24..28], "change counter")?;
    let database_size = crate::try_parse_u32(&bytes[28..32], "")
        .map(NonZeroU32::new)
        .ok()
        .flatten();
    let first_free_page = crate::try_parse_u32(&bytes[32..36], "first free page")?;
    let free_page_len = crate::try_parse_u32(&bytes[36..40], "free page list length")?;
    let free_page_list_info = FreePageListInfo::new(first_free_page, free_page_len);
    let schema_cookie = crate::try_parse_u32(&bytes[40..44], "schema cookie")?;
    let raw_schema_version = crate::try_parse_u32(&bytes[44..48], "schema format version")?;
    let schema_version = SchemaVersion::try_from(raw_schema_version)?;
    let cache_size = crate::try_parse_u32(&bytes[48..52], "cache size")?;
    // new!
    let raw_vacuum = crate::try_parse_u32(&bytes[52..56], "auto vacuum")?;
    let vacuum_setting = VacuumSetting::full(raw_vacuum);
    Ok(DatabaseHeader {
        page_size,
        write_version,
        read_version,
        change_counter,
        reserved_bytes,
        database_size,
        free_page_list_info,
        schema_cookie,
        schema_version,
        cache_size,
        vacuum_setting,
    })
}

```

One of the keys to how auto vacuum works is that it has to be set up _before_ any tables
are created and by default, it is turned off. The only other way to adjust this value
is to use the `VACUUM` command, which will re-build our database file entirely.
Let's take a look at how we would set this value but first let's run our program and see
the current output.

```sh
cargo run
DatabaseHeader {
    page_size: PageSize(
        4096,
    ),
    write_version: Legacy,
    read_version: Legacy,
    reserved_bytes: 0,
    change_counter: 10,
    database_size: Some(
        6,
    ),
    free_page_list_info: Some(
        FreePageListInfo {
            start_page: 5,
            length: 2,
        },
    ),
    schema_cookie: 5,
    schema_version: Four,
    cache_size: 0,
    vacuum_setting: None,
}
```

Now let's use the following 2 statements to make the update.

```sql
--Update the configuration
PRAGMA auto_vacuum=1;
--Rebuild the database
VACUUM;
```

```sh
cargo run
DatabaseHeader {
    page_size: PageSize(
        4096,
    ),
    write_version: Legacy,
    read_version: Legacy,
    reserved_bytes: 0,
    change_counter: 11,
    database_size: Some(
        5,
    ),
    free_page_list_info: None,
    schema_cookie: 5,
    schema_version: Four,
    cache_size: 0,
    vacuum_setting: Some(
        Full(
            5,
        ),
    ),
}
```

Notice there are a few changes, first is that our `database_size` is smaller,
next is that we no longer have a `free_page_list_info` value (free pages were all removed)
and finally we have a `vacuum_setting` that is pointing to page 5.

---

Our next value is going to tell us how the text is encoded in our database,
it will have to be either 1, 2, or 3. If 1 then the text is encoded as [UTF-8](https://en.wikipedia.org/wiki/UTF-8). If it isn't 1 will be [UTF-16](https://en.wikipedia.org/wiki/UTF-16) with 2 being
the UTF-16 is layed out as little endian while 3 is layed out as big endian.

Once again we will use an enum to capture this value,

```rust
pub enum TextEncoding {
    Utf8,
    Utf16Le,
    Utf16Be,
    Unknown(u32),
}

impl TryFrom<u32> for TextEncoding {
    type Error = Error;
    
    fn try_from(v: u32) -> Result<Self, Self::Error> {
        match v {
            1 => Ok(Self::Utf8),
            2 => Ok(Self::Utf16Le),
            3 => Ok(Self::Utf16Be),
            _ => Ok(Self::Unknown(v)),
        }
    }
}

struct DatabaseHeader {
    // ...
    text_encoding: TextEncoding,
}

pub fn parse_header(bytes: &[u8]) -> Result<DatabaseHeader, Error> {
    validate_header_string(&bytes[0..16])?;
    let page_size = parse_page_size(&bytes[16..18])?;
    let write_version = FormatVersion::from(bytes[18]);
    let read_version = FormatVersion::from(bytes[19]);
    let reserved_bytes = bytes[20];
    validate_fraction(bytes[21], 64, "Maximum payload fraction")?;
    validate_fraction(bytes[22], 32, "Minimum payload fraction")?;
    validate_fraction(bytes[23], 32, "Leaf fraction")?;
    let change_counter =
        crate::try_parse_u32(&bytes[24..28], "change counter")?;
    let database_size = crate::try_parse_u32(&bytes[28..32], "")
        .map(NonZeroU32::new)
        .ok()
        .flatten();
    let first_free_page = crate::try_parse_u32(&bytes[32..36], "first free page")?;
    let free_page_len = crate::try_parse_u32(&bytes[36..40], "free page list length")?;
    let free_page_list_info = FreePageListInfo::new(first_free_page, free_page_len);
    let schema_cookie = crate::try_parse_u32(&bytes[40..44], "schema cookie")?;
    let raw_schema_version = crate::try_parse_u32(&bytes[44..48], "schema format version")?;
    let schema_version = SchemaVersion::try_from(raw_schema_version)?;
    let cache_size = crate::try_parse_u32(&bytes[48..52], "cache size")?;
    let raw_vacuum = crate::try_parse_u32(&bytes[52..56], "auto vacuum")?;
    let vacuum_setting = VacuumSetting::full(raw_vacuum);
    // new!
    let raw_text_enc = crate::try_parse_u32(&bytes[56..60], "text encoding")?;
    let text_encoding = TextEncoding::try_from(raw_text_enc)?;
    Ok(DatabaseHeader {
        page_size,
        write_version,
        read_version,
        change_counter,
        reserved_bytes,
        database_size,
        free_page_list_info,
        schema_cookie,
        schema_version,
        cache_size,
        vacuum_setting,
        text_encoding,
    })
}
```

```sh
DatabaseHeader {
    page_size: PageSize(
        4096,
    ),
    write_version: Legacy,
    read_version: Legacy,
    reserved_bytes: 0,
    change_counter: 13,
    database_size: Some(
        5,
    ),
    free_page_list_info: None,
    schema_cookie: 6,
    schema_version: Four,
    cache_size: 1,
    vacuum_setting: Some(
        Full(
            5,
        ),
    ),
    text_encoding: Utf8,
}
```

---

Up next we have the User Version Number, this value is not actually used by SQLite at all but instead
is around for an application to make use of it as needed. It can be adjusted via a pragma in those cases.
Since the documentation doesn't place any restrictions on the value this means we need to treat it as
a signed integer. That means to start, we will need to add a new helper for parsing a signed integer.

First we'll add another error variant.

```rust
// error.rs

pub enum Error {
    /// An error with the magic string
    /// at index 0 of all SQLite 3 files
    HeaderString(String),
    /// An error with the page size
    InvalidPageSize(String),
    /// An error parsing the maximum/minimum payload fraction
    /// or leaf fraction
    InvalidFraction(String),
    /// An invalid u32 was found
    InvalidU32(String),
    /// An invalid i32 was found
    InvalidI32(String), // <-- new!!
    /// Encountered a 0 when NonZero was expected
    UnexpectedZero(String),
}
```

Now we can create our `i32` version of the `try_parse` method.

```rust
// lib.rs

fn try_parse_i32(bytes: &[u8], name: &str) -> Result<i32, Error> {
    use std::convert::TryInto;
    // Just like with our u32, we are going to need to convert
    // a slice into an array of 4 bytes. Using the `try_into`
    // method on a slice, we will fail if the slice isn't exactly
    // 4 bytes.
    let arr: [u8;4] = bytes.try_into()
        .map_err(|_| {
            Error::InvalidI32(format!(
                "expected a 4 byte slice, found a {} byte slice for {}",
                bytes.len(), name))
        })?;
    // Finally we use the `from_be_bytes` constructor for an i32
    Ok(i32::from_be_bytes(arr))
}
    
```

This is almost identical to our other helper, we could probably reduce the duplication but for the time being,
we can just leave it. Now we'll update the struct.

```rust
// header.rs
pub struct DatabaseHeader {
    pub page_size: PageSize,
    pub write_version: FormatVersion,
    pub read_version: FormatVersion,
    pub reserved_bytes: u8,
    pub change_counter: u32,
    pub database_size: Option<NonZeroU32>,
    pub free_page_list_info: Option<FreePageListInfo>,
    pub schema_cookie: u32,
    pub schema_version: SchemaVersion,
    pub cache_size: u32,
    pub vacuum_setting: Option<VacuumSetting>,
    pub text_encoding: TextEncoding,
    pub user_version: i32,
}
```

And finally, update `parse_header

```rust
pub fn parse_header(bytes: &[u8]) -> Result<DatabaseHeader, Error> {
    validate_header_string(&bytes[0..16])?;
    let page_size = parse_page_size(&bytes[16..18])?;
    let write_version = FormatVersion::from(bytes[18]);
    let read_version = FormatVersion::from(bytes[19]);
    let reserved_bytes = bytes[20];
    validate_fraction(bytes[21], 64, "Maximum payload fraction")?;
    validate_fraction(bytes[22], 32, "Minimum payload fraction")?;
    validate_fraction(bytes[23], 32, "Leaf fraction")?;
    let change_counter =
        crate::try_parse_u32(&bytes[24..28], "change counter")?;
    let database_size = crate::try_parse_u32(&bytes[28..32], "")
        .map(NonZeroU32::new)
        .ok()
        .flatten();
    let first_free_page = crate::try_parse_u32(&bytes[32..36], "first free page")?;
    let free_page_len = crate::try_parse_u32(&bytes[36..40], "free page list length")?;
    let free_page_list_info = FreePageListInfo::new(first_free_page, free_page_len);
    let schema_cookie = crate::try_parse_u32(&bytes[40..44], "schema cookie")?;
    let raw_schema_version = crate::try_parse_u32(&bytes[44..48], "schema format version")?;
    let schema_version = SchemaVersion::try_from(raw_schema_version)?;
    let cache_size = crate::try_parse_u32(&bytes[48..52], "cache size")?;
    let raw_vacuum = crate::try_parse_u32(&bytes[52..56], "auto vacuum")?;
    let vacuum_setting = VacuumSetting::full(raw_vacuum);
    // new!
    let raw_text_enc = crate::try_parse_u32(&bytes[56..60], "text encoding")?;
    let text_encoding = TextEncoding::try_from(raw_text_enc)?;
    let user_version = crate::try_parse_i32(&bytes[60..64], "user version")?;
    Ok(DatabaseHeader {
        page_size,
        write_version,
        read_version,
        change_counter,
        reserved_bytes,
        database_size,
        free_page_list_info,
        schema_cookie,
        schema_version,
        cache_size,
        vacuum_setting,
        text_encoding,
        user_version,
    })
}
```

---

The next value is called an "Application ID", this value is used when a sqlite database file is used for a specific
application. Primarily, this is used to drive the behavior of the [`file` command](https://www.man7.org/linux/man-pages/man1/file.1.html).
Let's try that on our current database.

```sh
file ./data.sqlite
./data.sqlite: SQLite 3.x database, last written using SQLite version 3032003
```

Now, if we set it to one of the [magic values](https://www.sqlite.org/src/artifact?ci=trunk&filename=magic.txt)
we can try that again.

```sql
PRAGMA application_id = 252006675;
```

```sh
file ./data.sqlite   
./data.sqlite: SQLite 3.x database (Fossil global configuration), last written using SQLite version 3032003
```

Now that we know why it's there, let's add it to our struct.

```rust
pub struct DatabaseHeader {
    pub page_size: PageSize,
    pub write_version: FormatVersion,
    pub read_version: FormatVersion,
    pub reserved_bytes: u8,
    pub change_counter: u32,
    pub database_size: Option<NonZeroU32>,
    pub free_page_list_info: Option<FreePageListInfo>,
    pub schema_cookie: u32,
    pub schema_version: SchemaVersion,
    pub cache_size: u32,
    pub vacuum_setting: Option<VacuumSetting>,
    pub text_encoding: TextEncoding,
    pub user_version: i32,
    pub application_id: u32,
}
```

And with that, we can update `parse_header`

```rust
pub fn parse_header(bytes: &[u8]) -> Result<DatabaseHeader, Error> {
    validate_header_string(&bytes[0..16])?;
    let page_size = parse_page_size(&bytes[16..18])?;
    let write_version = FormatVersion::from(bytes[18]);
    let read_version = FormatVersion::from(bytes[19]);
    let reserved_bytes = bytes[20];
    validate_fraction(bytes[21], 64, "Maximum payload fraction")?;
    validate_fraction(bytes[22], 32, "Minimum payload fraction")?;
    validate_fraction(bytes[23], 32, "Leaf fraction")?;
    let change_counter =
        crate::try_parse_u32(&bytes[24..28], "change counter")?;
    let database_size = crate::try_parse_u32(&bytes[28..32], "")
        .map(NonZeroU32::new)
        .ok()
        .flatten();
    let first_free_page = crate::try_parse_u32(&bytes[32..36], "first free page")?;
    let free_page_len = crate::try_parse_u32(&bytes[36..40], "free page list length")?;
    let free_page_list_info = FreePageListInfo::new(first_free_page, free_page_len);
    let schema_cookie = crate::try_parse_u32(&bytes[40..44], "schema cookie")?;
    let raw_schema_version = crate::try_parse_u32(&bytes[44..48], "schema format version")?;
    let schema_version = SchemaVersion::try_from(raw_schema_version)?;
    let cache_size = crate::try_parse_u32(&bytes[48..52], "cache size")?;
    let raw_vacuum = crate::try_parse_u32(&bytes[52..56], "auto vacuum")?;
    let vacuum_setting = VacuumSetting::full(raw_vacuum);
    // new!
    let raw_text_enc = crate::try_parse_u32(&bytes[56..60], "text encoding")?;
    let text_encoding = TextEncoding::try_from(raw_text_enc)?;
    let user_version = crate::try_parse_i32(&bytes[60..64], "user version")?;
    let application_id = crate::try_parse_u32(&bytes[64..68], "application id")?;
    Ok(DatabaseHeader {
        page_size,
        write_version,
        read_version,
        change_counter,
        reserved_bytes,
        database_size,
        free_page_list_info,
        schema_cookie,
        schema_version,
        cache_size,
        vacuum_setting,
        text_encoding,
        user_version,
        application_id,
    })
}
```

And when we run our program, we should see something like the following.

```sh
DatabaseHeader {
    page_size: PageSize(
        4096,
    ),
    write_version: Legacy,
    read_version: Legacy,
    reserved_bytes: 0,
    change_counter: 13,
    database_size: Some(
        5,
    ),
    free_page_list_info: None,
    schema_cookie: 6,
    schema_version: Four,
    cache_size: 1,
    vacuum_setting: Some(
        Full(
            5,
        ),
    ),
    text_encoding: Utf8,
    user_version: 0,
    application_id: 0,
}
```

That looks about right.

---

Finally, we are going to pick up the pace a bit. The next 20 bytes, are reserved for future header values
and must be `0`. Let's add a new error variant for an unexpected non-zero.

```rs
// error.rs

pub enum Error {
    /// An error with the magic string
    /// at index 0 of all SQLite 3 files
    HeaderString(String),
    /// An error with the page size
    InvalidPageSize(String),
    /// An error parsing the maximum/minimum payload fraction
    /// or leaf fraction
    InvalidFraction(String),
    /// An invalid u32 was found
    InvalidU32(String),
    /// An invalid i32 was found
    InvalidI32(String),
    /// Encountered a 0 when NonZero was expected
    UnexpectedZero(String),
    /// Encountered a non-zero when zero was expected
    UnexpectedNonZero(String),
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            Self::HeaderString(v) => write!(f, "Unexpected bytes at start of file, expected the magic string 'SQLite format 3\u{0}', found {:?}", v),
            Self::InvalidPageSize(msg) => write!(f, "Invalid page size, {}", msg),
            Self::InvalidFraction(msg) => write!(f, "{}", msg),
            Self::InvalidU32(msg) => write!(f, "{}", msg),
            Self::InvalidI32(msg) => write!(f, "{}", msg),
            Self::UnexpectedZero(what) => write!(f, "Expected non-zero value for {}", what),
            Self::UnexpectedNonZero(what) => write!(f, "Expected zero value for {}", what),
        }
    }
}

```

```rs
// header.rs
fn validate_reserved_zeros(bytes: &[u8]) -> Result<(), Error> {
    for (i, &byte) in bytes.iter().enumerate() {
        if byte != 0 {
            return Err(Error::UnexpectedNonZero(format!("Reserved space byte: {}", i)));
        }
    }
    Ok(())
}
```

```rs
// header.rs
pub fn parse_header(bytes: &[u8]) -> Result<DatabaseHeader, Error> {
    validate_header_string(&bytes[0..16])?;
    let page_size = parse_page_size(&bytes[16..18])?;
    let write_version = FormatVersion::from(bytes[18]);
    let read_version = FormatVersion::from(bytes[19]);
    let reserved_bytes = bytes[20];
    validate_fraction(bytes[21], 64, "Maximum payload fraction")?;
    validate_fraction(bytes[22], 32, "Minimum payload fraction")?;
    validate_fraction(bytes[23], 32, "Leaf fraction")?;
    let change_counter =
        crate::try_parse_u32(&bytes[24..28], "change counter")?;
    let database_size = crate::try_parse_u32(&bytes[28..32], "")
        .map(NonZeroU32::new)
        .ok()
        .flatten();
    let first_free_page = crate::try_parse_u32(&bytes[32..36], "first free page")?;
    let free_page_len = crate::try_parse_u32(&bytes[36..40], "free page list length")?;
    let free_page_list_info = FreePageListInfo::new(first_free_page, free_page_len);
    let schema_cookie = crate::try_parse_u32(&bytes[40..44], "schema cookie")?;
    let raw_schema_version = crate::try_parse_u32(&bytes[44..48], "schema format version")?;
    let schema_version = SchemaVersion::try_from(raw_schema_version)?;
    let cache_size = crate::try_parse_u32(&bytes[48..52], "cache size")?;
    let raw_vacuum = crate::try_parse_u32(&bytes[52..56], "auto vacuum")?;
    let vacuum_setting = VacuumSetting::full(raw_vacuum);
    let raw_text_enc = crate::try_parse_u32(&bytes[56..60], "text encoding")?;
    let text_encoding = TextEncoding::try_from(raw_text_enc)?;
    let user_version = crate::try_parse_i32(&bytes[60..64], "user version")?;
    let application_id = crate::try_parse_u32(&bytes[64..68], "application id")?;
    // new!
    validate_reserved_zeros(&bytes[68..92]).map_err(|e| {
        // We probably don't want to error if a new header value gets added
        // and we haven't had a chance to update our application so we print
        // to standard error and move along
        eprintln!("{}", e);
    }).ok();
    Ok(DatabaseHeader {
        page_size,
        write_version,
        read_version,
        change_counter,
        reserved_bytes,
        database_size,
        free_page_list_info,
        schema_cookie,
        schema_version,
        cache_size,
        vacuum_setting,
        text_encoding,
        user_version,
        application_id,
    })
}
```

These last two values don't have a ton of information provided for how sqlite uses them but first is the
"version valid for" number. Any time the `change_counter` is incremented, we should also see these values
get updated, the "version valid for" will be updated to the same value as the `change_counter` and the
"library write version" will be set to the `SQLITE_VERSION_NUMBER` a u32 value defined in the sqlite source
code that maps to the version of the library.

```rs
// header.rs

pub struct DatabaseHeader {
    pub page_size: PageSize,
    pub write_version: FormatVersion,
    pub read_version: FormatVersion,
    pub reserved_bytes: u8,
    pub change_counter: u32,
    pub database_size: Option<NonZeroU32>,
    pub free_page_list_info: Option<FreePageListInfo>,
    pub schema_cookie: u32,
    pub schema_version: SchemaVersion,
    pub cache_size: u32,
    pub vacuum_setting: Option<VacuumSetting>,
    pub text_encoding: TextEncoding,
    pub user_version: i32,
    pub application_id: u32,
    pub version_valid_for: u32,
    pub library_write_version: u32,
}

pub fn parse_header(bytes: &[u8]) -> Result<DatabaseHeader, Error> {
    validate_header_string(&bytes[0..16])?;
    let page_size = parse_page_size(&bytes[16..18])?;
    let write_version = FormatVersion::from(bytes[18]);
    let read_version = FormatVersion::from(bytes[19]);
    let reserved_bytes = bytes[20];
    validate_fraction(bytes[21], 64, "Maximum payload fraction")?;
    validate_fraction(bytes[22], 32, "Minimum payload fraction")?;
    validate_fraction(bytes[23], 32, "Leaf fraction")?;
    let change_counter =
        crate::try_parse_u32(&bytes[24..28], "change counter")?;
    let database_size = crate::try_parse_u32(&bytes[28..32], "")
        .map(NonZeroU32::new)
        .ok()
        .flatten();
    let first_free_page = crate::try_parse_u32(&bytes[32..36], "first free page")?;
    let free_page_len = crate::try_parse_u32(&bytes[36..40], "free page list length")?;
    let free_page_list_info = FreePageListInfo::new(first_free_page, free_page_len);
    let schema_cookie = crate::try_parse_u32(&bytes[40..44], "schema cookie")?;
    let raw_schema_version = crate::try_parse_u32(&bytes[44..48], "schema format version")?;
    let schema_version = SchemaVersion::try_from(raw_schema_version)?;
    let cache_size = crate::try_parse_u32(&bytes[48..52], "cache size")?;
    let raw_vacuum = crate::try_parse_u32(&bytes[52..56], "auto vacuum")?;
    let vacuum_setting = VacuumSetting::full(raw_vacuum);
    let raw_text_enc = crate::try_parse_u32(&bytes[56..60], "text encoding")?;
    let text_encoding = TextEncoding::try_from(raw_text_enc)?;
    let user_version = crate::try_parse_i32(&bytes[60..64], "user version")?;
    let application_id = crate::try_parse_u32(&bytes[64..68], "application id")?;
    validate_reserved_zeros(&bytes[68..92]).map_err(|e| eprintln!("{}", e)).ok();
    // new!
    let version_valid_for = crate::try_parse_u32(&bytes[92..96], "version valid for")?;
    let library_write_version = crate::try_parse_u32(&bytes[96..100], "library write version")?;
    Ok(DatabaseHeader {
        page_size,
        write_version,
        read_version,
        change_counter,
        reserved_bytes,
        database_size,
        free_page_list_info,
        schema_cookie,
        schema_version,
        cache_size,
        vacuum_setting,
        text_encoding,
        user_version,
        application_id,
        version_valid_for,
        library_write_version,
    })
}
```

```sh
cargo run
DatabaseHeader {
    page_size: PageSize(
        4096,
    ),
    write_version: Legacy,
    read_version: Legacy,
    reserved_bytes: 0,
    change_counter: 13,
    database_size: Some(
        5,
    ),
    free_page_list_info: None,
    schema_cookie: 6,
    schema_version: Four,
    cache_size: 1,
    vacuum_setting: Some(
        Full(
            5,
        ),
    ),
    text_encoding: Utf8,
    user_version: -1,
    application_id: 0,
    version_valid_for: 13,
    library_write_version: 3032003,
}
```

And with that, we have completed the parsing of a sqlite file's header.

<!-- [part 4](./sqlite_parser_pt4.md) -->
