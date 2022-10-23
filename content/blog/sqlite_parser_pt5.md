+++
title = "SQLite Parser Pt. 5"
date = 2020-10-12
draft = true
tags = ["sqlite", "parsing", "decoding", "streaming"]
[extra]
snippet = "Pages, Pages, Pages"
+++

This is the third in a series of posts describing the process of building a SQLite file parser. If
you missed the last part you can find it [here](./sqlite_parser_pt4.md).

Now that we've gotten the header fully parsed, we can now start parsing the rest of the file. As
covered in previous posts, we covered that the files is broken into pages and each page being a
fixed size. Looking at the output of our last run back in [part 3](./sqlite_parser_pt_3.md), we see
the following.

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
    user_version: -1,
    application_id: 0,
    version_valid_for: 13,
    library_write_version: 3032003,
}

```

We can see that `page_size` property tells us each page will be 4096 bytes, we also know that the
property `database_size` is in pages, so we should have a total database size of 20480 bytes or 20
kb. You may be asking, "what about the database header, shouldn't we add that to our pages?", the
answer is no, the first page includes the database header. For us that means we just need to keep in
mind what page number we are parsing to avoid misreading the header as page information.

There are officially 53 types of pages, free list pages, b-tree pages, cell payload overflow pages,
pointer map pages, and the lock page. Since the first page is always a b-tree page, we are going to
start with those but we will eventually cover each.

### B-Tree Pages

If you are not familiar with b-trees, that's ok, we don't need to be experts in how they work to
parse them. Just know that a b-tree is a type of collection that maintains its order, so if you
insert an item into it doesn't just tack it on the end but instead finds the spot between values
lower and higher than the new value. B-trees typically do this by having each entry in the collection
point to the next higher entry and next lower entry if they exist. Typically, the higher entry is
called the "right" entry and the lower entry is called the "left" entry.

A lot of what we have covered is pretty abstract, so let's start parsing! Each b-tree page starts
with a page header, which will tell us some important information about the page. Since we know
where each page starts in our file, let's set our program up to parse the header of each page.

To begin, we are going to add a new module to our library, we do this by creating a new file
named `page.rs` in our `src` directory and then update `lib.rs` to declare that module.

```rust
// lib.rs
pub mod error;
pub mod header;
pub mod page;

//...
```

Now we are going to define a new function that will parse our page header. Let's start
defining our page module.

```rust
// page.rs
use std::io::Read;
use crate::Error;

/// A B-Tree Page Header
pub struct BTreePageHeader {

}

pub fn parse_btree_page_header(reader: &mut impl Read) -> Result<BTreePageHeader, Error> {
    todo!("We will fill this in very soon");
}

```

```rust
#[derive(Debug)]
enum BTreePageType {
    InteriorIndex,
    InteriorTable,
    LeafIndex,
    LeafTable,
    Unknown(u8),
}

```
