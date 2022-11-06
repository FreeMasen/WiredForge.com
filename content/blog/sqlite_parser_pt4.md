+++
title = "SQLite Parser Pt. 4"
date = 2022-10-25
draft = false
tags = ["sqlite", "parsing", "decoding", "streaming"]
[extra]
snippet = "Let's start streaming"
+++

This is the fourth in a series of posts describing the process of building a SQLite file parser. If
you missed the last part you can find it [here](./sqlite_parser_pt_3.md).

Now that we have the header parsing finished for a sqlite database, we are well on our way to
getting through the whole file. In the next post we will start parsing the pages that a database is
divided into, however before we get to to that, we should talk about one concern that will be more
difficult to address if we continue down our current path: memory usage.

Looking at our `DatabaseHeader` we can expect that the 100 bytes of our file will translate to about
72 bytes in memory, when we add that together we get a total of 172 bytes and while that isn't a ton
of usage, imagine what will happen if we tried read the full file in before parsing a 1gb sqlite
database? The header size wouldn't be too bad but the rest of the file would fill up our memory
pretty quick. Rust provides a few options dealing with raw bytes that we may or may not want to read
into memory all at once. The most basic option would be the `Read` trait, this allows us to call
`Read::read(&mut self, &mut buf)` which will attempt to fill up the provided `buf` which is
a slice of `u8`s, it then returns the number of bytes actually read. For example.


```rust
use std::io::Read;

fn main() {
    // Open a file on disk
    let file = std::fs::File::open("some_file.txt");
    // allocate a buffer of 512 bytes to read part of the file into
    let mut buf = [0u8;512];
    loop {
        let bytes_read = file.read(&mut buf).expect("Something went wrong when reading!");
        if bytes_read == 0 {
            // Reached the end of the file
            return;
        }
        println!("Read {} bytes as:\n{:?}", bytes_read, &buf[..bytes_read]);
    }

}
```

This is pretty nice, we could say try and read in the first 100 bytes of our file and then our
`parse_header` would just work, since it takes a slice of bytes as well. However this could be a bit
problematic since the `buf` we are providing is a fixed size but `read` doesn't always fill `buf`
even if there are enough bytes in the file to do so, we would need to _maybe_ make multiple calls to
`read` before we reached 100. On the other side of the same problem, calling `read` with just 100
bytes could be expensive, since that will result in a
[system call](https://en.wikipedia.org/wiki/System_call) which is never free.

To solve this problem, Rust provides another interface, this one carries its own buffer internally
and actually solves both problems above, it will call `read` multiple times for us if needed and it
will also read into its buffer ahead of what we want to avoid multiple calls to `read` if not
needed. This struct is called
[`BufReader`](https://doc.rust-lang.org/std/io/struct.BufReader.html), we could adjust our previous
example to use this instead and end up with something like

```rust
use std::io::{BufReader, Read};

fn main() {
    // Open a file on disk
    let file = std::fs::File::open("some_file.txt");
    // Wrap this impl Read in a BufReader
    let buf_reader = BufReader::new(file);
    // allocate a buffer of 512 bytes to read part of the file into
    let mut buf = [0u8;512];
    loop {
        let bytes_read = buf_reader.read(&mut buf).expect("Something went wrong when reading!");
        if bytes_read == 0 {
            // Reached the end of the file
            return;
        }
        println!("Read {} bytes as:\n{:?}", bytes_read, buf[..bytes_read]);
    }

}
```

Notice, things don't change very much, we still need to provide a buffer when calling `read` and we
still need to make sure that it gets filled appropriately. The key difference here is that we are
far more likely to fill `buf` if the underlying file is large enough to do so. It doesn't _look_
like much of a win but it really does help. Another interesting thing about `BufReader` is that it
implements the trait `BufRead` which gives you access to things like `read_line` or `read_until`
which ends up being incredibly helpful in a lot of common file reading tasks.

The one big issue we haven't yet addressed about these two interfaces is that if we ever needed to
re-parse something we would have to essentially just start from the beginning again. Since our
header contains a few different ways to tell us if any of our pages have changed, it seems
reasonable that we would want to periodically re-read the header eventually. This brings us to the
last rust standard library type that we are going to discuss the `Seek` trait which defines how
users can move from their current position in the implementor (for us a `BufReader`) to some other
position.

Say we wanted to have our `main` re-read the header of our file every second and print the result,
we _could_ just open and close the file each time through the loop, or we could use `BufReader`'s
implementation of `Seek` to reset the open file back to 0 and re-read first 100 bytes each
iteration.

```rust
use sqlite_parser::header::parse_header;
use std::io::{BufReader, Read, Seek, SeekFrom};

fn main() {
    let file = std::fs::File::open("database.sqlite").unwrap();
    let reader = BufReader::new(file);
    
    loop {
        let new_offset = reader.seek(SeekFrom::Start(0)).unwrap();
        assert_eq!(new_offset, 0);
        let mut buf = [0u8; 100];
        let ct = reader.read(&mut buf).unwrap();
        assert_eq!(
            ct, 100,
            "Unable to read the first 100 bytes of database.sqlite"
        );
        let header = parse_header(&buf).unwrap();
        println!("{:#?}", header);
        std::thread::sleep(std::time::Duration::from_secs(1));
    }
}
```

Notice how the method `seek` takes an enum `SeekFrom`, the variants here are `Start`, `End` and
`Current`, so our code above is moving to byte 0 when counting from the start of the file. This is
going to come in handy when we get our page parsing in line since we are probably going to want to
jump from one page start to another and `seek` would be a nice way to do that.

Now that we have our reader setup, we should probably re-visit our header parsing to take advantage
of this interface. We are going to convert our `try_parse_*` helper functions to work with an
`impl Read` instead of taking a byte slice but before doing this we need to add a new variant of our
`Error` enum. Let's start by updating that.

```rust
// error.rs

pub enum Error {
    //...
    /// Failure to read bytes from the sqlite file
    /// The string will provide a context for where
    /// reading failed.
    IoError(std::io::Error, &'static str),
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            // ...
            Self::IoError(inner, what) => write!(f, "Io Error parsing {}: {}", what, inner),
        }
    }
}
```

This is going to end up doing a lot of the same work that our `Invalid*32` variants did before so we
will include not only the `Error` provided by the `io` library but also the name of where we failed
as a string literal.

Before we start in on the update to our `lib.rs` we should take care of one other thing, updating
this project from the 2018 edition to use the 2021 edition. Thankfully this just means updating the
value in our `Cargo.toml`.

```toml
# ./Cargo.toml
[package]
name = "sqlite_parser"
version = "0.1.0"
authors = ["freemasen"]
# This is the value we need to update
edition = "2021"
```

With that we can now take advantage of the new "const generics" feature to help streamline our read
operations, we are going to do this in a new function named `read_bytes`

```rust
// lib.rs

// first we need to add this new import
use std::io::{
    Read,
    // the `as` here allows us to avoid creating a conflict with our
    // `error::Error` enum.
    Error as IoError
};

// now we can define this new function.

/// Read an exact number of bytes from the provider reader
fn read_bytes<const N: usize>(reader: &mut impl Read) -> Result<[u8;N], IoError> {
    let mut buf = [0u8; N];
    // This will actually end up erroring both when something goes wrong with the
    // IO operation and when the reader reaches the end of file before our buf is
    // filled
    reader.read_exact(&mut buf)?;
    Ok(buf)
}
```

Ok, there is some new syntax here that we should probably go over. Similar to how we might make a
function generic over some `T` by putting that in the angle brackets, we can now use the
`const N: usize` where `N` can be any valid Rust identifier and `usize` can be any "integral" (aka
whole number) type. For us, that means we are saying that this function will return some
caller-defined array length. Just like type generics this benefits from type inference which is
super nice! Now we can update our `try_parse_u32` to `read_u32`

```rust
// lib.rs

fn read_u32(reader: &mut impl Read, name: &'static str) -> Result<u32, Error> {
    let buf = read_bytes(reader).map_err(|io_err| {
        Error::Io(io_err, name)
    })?;
    Ok(u32::from_be_bytes(buf))
}
```

Notice how we don't have to provide the `N` to `read_bytes`, because we pass `buf` to
`u32::from_be_bytes` which requires a `[u8;4]` so the compiler can figure out that `N` is 4.

What we have here is pretty nice, but we are going to have to use quite a bit of duplicated
code, what if we could some how simplify this further? Maybe we could define something like

```rust
// lib.rs

fn read<T, const N: usize>(reader: &mut impl Read) -> Result<T, IoError> {
    let buf = read_bytes(reader)?;
    Ok(T::from_be_bytes(buf))
}
```

This would take that extra boilerplate and centralize it, however the compiler will complain because
we don't have any value for N in this scenario _and_ that `T` doesn't have and associated function
`from_be_bytes` so what if we unified all of the types that we want to use this function with? That
would solve our problems, let's introduce a trait for this.

```rust
// lib.rs

/// A trait to unify the behavior or the primitive number types
/// which all provide a constructor named `from_be_bytes` which
/// take an array of `u8`s of the appropriate size. 
/// 
/// This trait leverages the const generic N to define the size of the
/// array needed to construct that type
pub trait FromBigEndian<const N: usize>: Sized {
    fn from_be_bytes(bytes: [u8; N]) -> Self;
}
```

Ok, now we have a single trait that we can leverage, which also uses const generics by defining
the same `N` we used in `read_bytes`. Now, let's implement this for `u32`.

```rust
// lib.rs
impl FromBigEndian<4> for u32 {
    fn from_be_bytes(bytes: [u8; 4]) -> Self {
        u32::from_be_bytes(bytes)
    }
}
```

Notice, `impl` we needs to provide a value for `N` which means we would have to provide this value
manually for any type we wanted to implement. This isn't probably too painful but if we can make
this happen automatically, why don't we? To start we can use a macro to ease our pain.

```rust
// lib.rs
macro_rules! impl_from_big_endian {
    ($t:ty, $n:expr) => {
        impl FromBigEndian<$n> for $t {
            fn from_be_bytes(bytes: [u8; $n]) -> Self {
                <$t>::from_be_bytes(bytes)
            }
        }
    };
}
```

Here we are using the "old" style of macros which comes with a bit of a learning curve since it has
its own syntax. First, we are defining a new macro named `impl_from_big_endian` which takes 2
arguments, the first argument (`$t`) is designated as a `ty` or "type", the second argument (`$n`)
is designated as an `expr` or "expression". After the fat arrow, inside the curly braces, we define
what code our macro should produce which is very similar to our original implementation of
`FromBigEndian` for `u32` except we swap our `u32` for `$t` and `4` for `$n`. Now let's replace our
`u32` implementation with our macro.

> For more on "old" style macros,
> [Rust By Example](https://doc.rust-lang.org/rust-by-example/macros.html) chapter on macros is
> great.

```rust
// lib.rs
impl_from_big_endian!(u32, {std::mem::size_of::<u32>()});
```

This is a lot nicer but this could still be simpler. Instead of making the caller provide both
arguments, we should be able to use `std::mem::size_of` to define that value for us since it is a
`const fn` (which means it can run at compile time). To do that, we will need to add a new variant of
our macro.

```rust
// lib.rs
macro_rules! impl_from_big_endian {
    ($t:ty, $n:expr) => {
        impl FromBigEndian<$n> for $t {
            fn from_be_bytes(bytes: [u8; $n]) -> Self {
                <$t>::from_be_bytes(bytes)
            }
        }
    };
    ($t:ty) => {
        impl_from_big_endian!($t, {std::mem::size_of::<$t>()});
    };
}
```

Here, we use some syntax very similar to a `match` statement where we can define any unique set of
inputs (in this case we aren't defining `$n`). We then recursively call our macro with the second
argument provided by `std::mem::size_of`. So we can change our call for `u32` to be

```rust
// lib.rs
impl_from_big_endian!(u32);
```

That is nice and concise! Let's add all of our currently used types.

```rust
// lib.rs
impl_from_big_endian!(u32);
impl_from_big_endian!(i32);
impl_from_big_endian!(u16);
impl_from_big_endian!(i16);
impl_from_big_endian!(u8);
```

If we were to use the wonderful [`cargo expand` utility](https://github.com/dtolnay/cargo-expand) we
would see this expand into the following

```rust
// lib.rs
impl FromBigEndian<{ std::mem::size_of::<u32>() }> for u32 {
    fn from_be_bytes(bytes: [u8; { std::mem::size_of::<u32>() }]) -> Self {
        <u32>::from_be_bytes(bytes)
    }
}
impl FromBigEndian<{ std::mem::size_of::<i32>() }> for i32 {
    fn from_be_bytes(bytes: [u8; { std::mem::size_of::<i32>() }]) -> Self {
        <i32>::from_be_bytes(bytes)
    }
}
impl FromBigEndian<{ std::mem::size_of::<u16>() }> for u16 {
    fn from_be_bytes(bytes: [u8; { std::mem::size_of::<u16>() }]) -> Self {
        <u16>::from_be_bytes(bytes)
    }
}
impl FromBigEndian<{ std::mem::size_of::<i16>() }> for i16 {
    fn from_be_bytes(bytes: [u8; { std::mem::size_of::<i16>() }]) -> Self {
        <i16>::from_be_bytes(bytes)
    }
}
impl FromBigEndian<{ std::mem::size_of::<u8>() }> for u8 {
    fn from_be_bytes(bytes: [u8; { std::mem::size_of::<u8>() }]) -> Self {
        <u8>::from_be_bytes(bytes)
    }
}
```

It is much nicer for us to not have written that all manually!

Ok, now that we have our trait defined, let's update our `read` function to make `T`
require an implementation of `FromBigEndian`.

```rust
// lib.rs

/// Read the number of bytes needed to construct T with the `FromBigEndian`
/// implementation for T
fn read<T, const N: usize>(reader: &mut impl Read) -> Result<T, IoError> 
where T: FromBigEndian<N> {
    let bytes = read_bytes(reader)?;
    Ok(T::from_be_bytes(bytes))
}
```

Now by simply adding a `where T: FromBigEndian<N>`, we take care of the 2 compiler errors from our
last look at this function. With that in place we can now revisit `read_u32`.

```rust
// lib.rs
fn read_u32(reader: &mut impl Read, name: &'static str) -> Result<u32, Error> {
    read(reader).map_err(|e| {
        Error::IoError(e, name)
    })
}
```

There is still some boiler plate but unfortunately there isn't a ton we can do, the error
construction with the name of what failed to be read is going to happen wherever
`read` is called and this will look a little nicer than having to use the generic arguments to `read` in our `parse_header` function along with the `map_err`. Now, let's update the rest of `lib.rs`.

```rust
// lib.rs
fn read_i32(reader: &mut impl Read, name: &'static str) -> Result<i32, Error> {
    read(reader).map_err(|e| Error::IoError(e, name))
}

fn read_u16(reader: &mut impl Read, name: &'static str) -> Result<u16, Error> {
    read(reader).map_err(|e| Error::IoError(e, name))
}

fn read_u8(reader: &mut impl Read, name: &'static str) -> Result<u8, Error> {
    read(reader).map_err(|e| Error::IoError(e, name))
}
```

Phew! Now that we finally have our `lib.rs` updates made, let's update `header.rs` to work with our
changes. First we are going to update `validate_header_string` to use an `impl Read` instead of an array.

```rust
//header.rs

/// Validate that the bytes provided match the special string
/// at the start of Sqlite3 files
pub fn validate_header_string(reader: &mut impl Read) -> Result<(), Error> {
    let buf = crate::read_bytes::<16>(reader).map_err(|e| {
        Error::IoError(e, "header string")
    })?;
    // if the provided bytes don't match the static HEADER_STRING,
    // we return early
    if buf != HEADER_STRING {
        // since we only head this way on the error case, we convert the provided
        // value into a string. We don't want to error in our error path if it isn't valid utf8
        // so we again use `from_utf8_lossy` and then convert that into a string.

        return Err(Error::HeaderString(
            String::from_utf8_lossy(&buf).to_string(),
        ));
    }
    Ok(())
}
```

Notice here we are using the new `read_bytes` where we are explicitly providing `16` as `N`
which will get us a 16 byte array that we can compare with our `HEADER_STRING`. Up next is
`parse_page_size`.

```rust
// header.rs
pub fn parse_page_size(reader: &mut impl Read) -> Result<PageSize, Error> {
    let raw_page_size = crate::read_u16(reader, "page size")?;
    raw_page_size.try_into()
}
```

Here we are updating the argument from a byte slice to a `reader` and using the `read_u16` helper
along with our `try_into` helper. Up next is `validate_fraction`.

```rust
// header.rs
fn validate_fraction(reader: &mut impl Read, target: u8, name: &'static str) -> Result<(), Error> {
    let byte = crate::read_u8(reader, name)?;
    if byte != target {
        Err(Error::InvalidFraction(format!(
            "{} must be {}, found: {}",
            name, target, byte
        )))
    } else {
        Ok(())
    }
}
```

More of the same here, we are updating the argument to take a `reader` instead of a single byte and
use our new helper to read this value. The last helper in `header.rs` is `validate_reserved_zeros`.

```rust
// header.rs
fn validate_reserved_zeros(reader: &mut impl Read) -> Result<(), Error> {
    let bytes = crate::read_bytes::<20>(reader).map_err(|e| {
        Error::IoError(e, "reserved zeros")
    })?;
    for (i, &byte) in bytes.iter().enumerate() {
        if byte != 0 {
            return Err(Error::UnexpectedNonZero(format!(
                "Reserved space byte: {}",
                i
            )));
        }
    }
    Ok(())
}
```

Once again, we are just updating the argument and then using `read_bytes` to read our `20`
reserved zero bytes in the header. Now for the big lift here, we are going to update
`parse_header`.

```rust
// header.rs
pub fn parse_header(reader: &mut impl Read) -> Result<DatabaseHeader, Error> {
    validate_header_string(reader)?;
    let page_size = parse_page_size(reader)?;
    // These versions have been updated to use `into` instead of `from`
    let write_version = crate::read_u8(reader, "write version")?.into();
    let read_version = crate::read_u8(reader, "read version")?.into();
    let reserved_bytes = crate::read_u8(reader, "reserved bytes length")?;
    validate_fraction(reader, 64, "Maximum payload fraction")?;
    validate_fraction(reader, 32, "Minimum payload fraction")?;
    validate_fraction(reader, 32, "Leaf fraction")?;
    let change_counter = crate::read_u32(reader, "change counter")?;
    let database_size = crate::read_u32(reader, "database size")
        .map(NonZeroU32::new)
        .ok()
        .flatten();
    let first_free_page = crate::read_u32(reader, "first free page")?;
    let free_page_len = crate::read_u32(reader, "free page list length")?;
    let free_page_list_info = FreePageListInfo::new(first_free_page, free_page_len);
    let schema_cookie = crate::read_u32(reader, "schema cookie")?;
    let raw_schema_version = crate::read_u32(reader, "schema format version")?;
    let schema_version = SchemaVersion::try_from(raw_schema_version)?;
    let cache_size = crate::read_u32(reader, "cache size")?;
    let raw_vacuum = crate::read_u32(reader, "auto vacuum")?;
    let raw_text_enc = crate::read_u32(reader, "text encoding")?;
    let text_encoding = TextEncoding::try_from(raw_text_enc)?;
    let user_version = crate::read_i32(reader, "user version")?;
    let is_incremental = crate::read_u32(reader, "incremental vacuum")?;
    let vacuum_setting = VacuumSetting::new(raw_vacuum, is_incremental);
    let application_id = crate::read_u32(reader, "application id")?;
    validate_reserved_zeros(reader)
        .map_err(|e| eprintln!("{}", e))
        .ok();
    let version_valid_for = crate::read_u32(reader, "version valid for")?;
    let library_write_version = crate::read_u32(reader, "library write version")?;
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

For the most part, we are just updating the argument from a byte slice to a `reader` and each usage
of our helpers to use the new helpers we just defined. One of the really nice thing about this
is that we no longer have to maintain the manual indexing of our header bytes instead we can just
read the next set of bytes as we need it.

And with that we are in a much better place to start in on our page parsing.

<!-- [part 5](./sqlite_parser_pt5.md) -->
