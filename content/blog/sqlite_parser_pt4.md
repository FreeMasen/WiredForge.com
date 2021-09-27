+++
title = "SQLite Parser Pt. 4"
date = 2018-01-02
draft = true
tags = ["sqlite", "parsing", "decoding", "streaming"]
[extra]
snippet = "Let's start streaming"
+++

Now that we have the header parsing finished for a sqlite database, we are well on our way to getting through the whole file. In the 
next post we will start parsing the pages that a database is divided into, however before we get to to that, we should talk about a couple
of miscellaneous concerns that will be more difficult to address if we continue down our current path. The first of which is memory usage.

Looking at our `DatabaseHeader` we can expect that the 100 bytes of our file will translate to about <!-- std::mem::sizeof<DatabaseHeader>() --> bytes
in memory, when we add that together we get a total of <!-- 100 + sizeof<DatabaseHeader>() --> and what that isn't a ton of usage, imagine what will
happen if we tried read the full file in before parsing a 1gb sqlite database? The header size wouldn't be too bad but the rest of the file would
fill up our memory pretty quick. Rust provides a few options dealing with raw bytes that we may or may not want to read into memory all at once.
The most basic option would be the `Read` trait, this allows us to call `Read::read(&mut buf)` which will attempt to fill up the provided `buf`
which is typically an array it then returns the number of bytes actually read. For example.


<!-- TODO is Read in core? -->
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
        println!("Read {} bytes as:\n{:?}", bytes_read, buf[..bytes_read]);
    }

}
```

This is pretty nice, we could say try an read in the first 100 bytes of our file and then our `parse_header` would just work, since it takes a slice
of bytes as well. However this could be a bit problematic since the `buf` we are providing is a fixed size but `read` doesn't always fill `buf` 
even if there are enough bytes in the file to do so, we would need to _maybe_ make multiple calls to `read` before we reached 100. On the other side
of the same problem, calling `read` with just 100 bytes could be expensive, since that will result in a [system call](todo-wikipedia-syscall-def) which is 
never free.

To solve this problem, Rust provides another interface, this one carries its own buffer internally and actually solves both problems above, it will call `read`
multiple times for us if needed and it will also read into its buffer ahead of what we want to avoid multiple calls to `read` if not needed. This trait is
called `BufRead`, we could adjust our previous example to use this instead and end up with something like

<!-- TODO is BufRead in core? -->

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

Notice, things don't change very much, we still need to provide a buffer when calling `read` and we still need to make sure that it gets filled appropriately.
The key difference here is that we are far more likely to fill `buf` if the underlying file is large enough to do so. It doesn't _look_ like much of a win but
it really does help. Another interesting thing about `BufReader` is that in implements the trait `BufRead` which gives you access to things like `read_line`
which ends up being incredibly helpful in the long run. The one big issue we haven't yet addressed about these two interfaces is that if we ever needed to
re-parse something we would have to essentially just start from the beginning again. Since our header contains a few different ways to tell us if any of our
pages have changed, it seems reasonable that we would want to periodically re-read the header eventually. This brings us to the last rust type that we are
going to discuss, this one is called `Cursor` which allows us the ability to seek from our current position into a file to any other position. Say we wanted
to have our `main` re-read the header of our file every second and print the result, we _could_ just open and close the file each time through the loop, or
we could use a `Cursor` to re-read the first 100 bytes in that loop. 

```rust
use sqlite_parser::header::parse_header;
use std::io::{BufReader, Read, Cursor, Seek};

fn main() {
    let file = std::fs::File::open("database.sqlite");
    let reader = BufReader::new(file);
    let cursor = Cursor::new(reader);
    
    loop {
        let header_byes = cursor::seek(Seek::FromStart(0));
        let header_bytes = [u8;100];
        let ct = cusor.read(&mut buf).unwrap();
        if ct != 100 {
            panic!("Unable to read the first 100 bytes of database.sqlite");
        }
        let header = parse_header(&header_bytes).unwrap();
        println!("{:#?}", header);
        std::thread::sleep(1);
    }
}
```


