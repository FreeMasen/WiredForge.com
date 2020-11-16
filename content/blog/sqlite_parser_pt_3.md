+++
title = "SQLite Parser Pt. 3"
date = 2018-01-02
draft = true
tags = ["sqlite", "integer-storage", "decoding"]
[extra]
snippet = "The Header... finally"
+++

This is the third in a series of posts describing the process of building a SQLite file parser. 
If you missed the last part you can find it [here](http://freemasen.com/blog/sqlite-parser-pt-2/index.html).

In the last post we left off having just parsed the "in header database size" which started
at byte 28. Our next value is the page number of the first free page. Back in part one we
covered how our actual data is going to be stored equal sections called pages. If, for some
reason, we have any pages that are empty or "free" this value will help us find the first
one. Free pages are connected like a linked list, that is to say each free page will have
the page number of the next free page, if there is one. If there aren't any free pages
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
function to convert a 4 byte slice into a `u32` so let's use that. But first we need to
add a new error to our `Error` enum. Initially we setup our helper to return a `Result<u32, String>` but in retrospect, this was probably a mistake. Instead let's add a new error for
the one case that our conversion can fail. While we are at it we can actually remove one
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
            // For our new case, we are just
            // going to print the inner message
            Self::InvalidFraction(msg) => write!(f, "{}", msg),
            Self::InvalidU32(msg) => write!(f, "Invalid u32: {}", msg),
	}
}
```

Now we can update our `try_parse_u32` to return a proper `Result`

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

With that out of the way, we have a much clearer path through the rest of our values.
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




<!-- 1.3.9. Schema cookie

The schema cookie is a 4-byte big-endian integer at offset 40 that is incremented whenever the database schema changes. A prepared statement is compiled against a specific version of the database schema. When the database schema changes, the statement must be reprepared. When a prepared statement runs, it first checks the schema cookie to ensure the value is the same as when the statement was prepared and if the schema cookie has changed, the statement either automatically reprepares and reruns or it aborts with an SQLITE_SCHEMA error. -->

<!-- 1.3.10. Schema format number

The schema format number is a 4-byte big-endian integer at offset 44. The schema format number is similar to the file format read and write version numbers at offsets 18 and 19 except that the schema format number refers to the high-level SQL formatting rather than the low-level b-tree formatting. Four schema format numbers are currently defined:

    Format 1 is understood by all versions of SQLite back to version 3.0.0 (2004-06-18).
    Format 2 adds the ability of rows within the same table to have a varying number of columns, in order to support the ALTER TABLE ... ADD COLUMN functionality. Support for reading and writing format 2 was added in SQLite version 3.1.3 on 2005-02-20.
    Format 3 adds the ability of extra columns added by ALTER TABLE ... ADD COLUMN to have non-NULL default values. This capability was added in SQLite version 3.1.4 on 2005-03-11.
    Format 4 causes SQLite to respect the DESC keyword on index declarations. (The DESC keyword is ignored in indexes for formats 1, 2, and 3.) Format 4 also adds two new boolean record type values (serial types 8 and 9). Support for format 4 was added in SQLite 3.3.0 on 2006-01-10.

New database files created by SQLite use format 4 by default. The legacy_file_format pragma can be used to cause SQLite to create new database files using format 1. The format version number can be made to default to 1 instead of 4 by setting SQLITE_DEFAULT_FILE_FORMAT=1 at compile-time. -->

<!-- 1.3.11. Suggested cache size

The 4-byte big-endian signed integer at offset 48 is the suggested cache size in pages for the database file. The value is a suggestion only and SQLite is under no obligation to honor it. The absolute value of the integer is used as the suggested size. The suggested cache size can be set using the default_cache_size pragma. -->

<!-- 1.3.12. Incremental vacuum settings

The two 4-byte big-endian integers at offsets 52 and 64 are used to manage the auto_vacuum and incremental_vacuum modes. If the integer at offset 52 is zero then pointer-map (ptrmap) pages are omitted from the database file and neither auto_vacuum nor incremental_vacuum are supported. If the integer at offset 52 is non-zero then it is the page number of the largest root page in the database file, the database file will contain ptrmap pages, and the mode must be either auto_vacuum or incremental_vacuum. In this latter case, the integer at offset 64 is true for incremental_vacuum and false for auto_vacuum. If the integer at offset 52 is zero then the integer at offset 64 must also be zero. -->

<!-- 1.3.13. Text encoding

The 4-byte big-endian integer at offset 56 determines the encoding used for all text strings stored in the database. A value of 1 means UTF-8. A value of 2 means UTF-16le. A value of 3 means UTF-16be. No other values are allowed. The sqlite3.h header file defines C-preprocessor macros SQLITE_UTF8 as 1, SQLITE_UTF16LE as 2, and SQLITE_UTF16BE as 3, to use in place of the numeric codes for the text encoding. -->

<!-- 1.3.14. User version number

The 4-byte big-endian integer at offset 60 is the user version which is set and queried by the user_version pragma. The user version is not used by SQLite. -->

<!-- 1.3.15. Application ID

The 4-byte big-endian integer at offset 68 is an "Application ID" that can be set by the PRAGMA application_id command in order to identify the database as belonging to or associated with a particular application. The application ID is intended for database files used as an application file-format. The application ID can be used by utilities such as file(1) to determine the specific file type rather than just reporting "SQLite3 Database". A list of assigned application IDs can be seen by consulting the magic.txt file in the SQLite source repository. -->

<!-- 1.3.16. Write library version number and version-valid-for number

The 4-byte big-endian integer at offset 96 stores the SQLITE_VERSION_NUMBER value for the SQLite library that most recently modified the database file. The 4-byte big-endian integer at offset 92 is the value of the change counter when the version number was stored. The integer at offset 92 indicates which transaction the version number is valid for and is sometimes called the "version-valid-for number". -->

<!-- 1.3.17. Header space reserved for expansion

All other bytes of the database file header are reserved for future expansion and must be set to zero. -->
