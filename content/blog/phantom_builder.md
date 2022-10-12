+++
title = "The Phantom Builder"
date = 2019-03-24
draft = false
tags = ["rust"]
[extra]
snippet = "Building yourself when you don't know the half of it"
image = "rust-logo-blk.png"
image_desc = "phantom builder"
+++

A very popular method for constructing data structures in rust is referred to as the _builder pattern_. Essentially, you create a second `struct` that acts as an interface for the creation of another `struct`. A quick example would look like this.

```rust
struct ConfigurableThing {
    option_one: u8,
    option_two: String,
    option_three: Option<usize>,
    option_four: f32,
}

struct ThingBuilder {
    option_one: u8,
    option_two: String,
    option_three: Option<usize>,
    option_four: f32,
}

impl ThingBuilder {
    pub fn new() -> Self {
        Self {
            option_one: 0,
            option_two: String::new(),
            option_three: None,
            option_four: 0.0
        }
    }
    pub fn option_one(&mut self, value: u8) -> &mut Self {
        self.set_option_one(value);
        self
    }

    pub fn set_option_one(&mut self, value: u8) {
        self.option_one = value
    }

    pub fn option_two(&mut self, value: String) -> &mut Self {
        self.set_option_two(value);
        self
    }
    
    pub fn set_option_two(&mut self, value: String) {
        self.option_two = value;
    }
    
    pub fn option_three(&mut self, value: Option<usize>) -> &mut Self {
        self.set_option_three(value);
        self
    }
    
    pub fn set_option_three(&mut self, value: Option<usize>) {
        self.option_three = value;
    }

    pub fn option_four(&mut self, value: f32) -> &mut Self {
        self.set_option_four(value);
        self
    }

    pub fn set_option_four(&mut self, value: f32) {
        self.option_four = value;
    }
    pub fn build(&self) -> ConfigurableThing {
        ConfigurableThing {
            option_one: self.option_one,
            option_two: self.option_two.clone(),
            option_three: self.option_three,
            option_four: self.option_four
        }
    }
}
```

This is nice from an api design perspective because it allows the designer to set some logical default values while providing a convenient interface for construction. Using the above example would look something like this.

```rust
use library::{ConfigurableThing, ThingBuilder};
fn main() {
    let _thing = ThingBuilder::new()
                            .option_one(8)
                            .option_three(Some(100))
                            .option_four(32.2)
                            .build();
}

fn use_thing(thing: ConfigurableThing) {
    // Something complicated goes here
}
```

Notice how easy it is to set some values and even to skip over `option_two`, it is a clever solution not having access variadic parameters.

One slightly annoying thing about it is that the user needs to know about both the `struct` they want to build and also the `struct` that builds it. Looking at the above we needed to import both `struct`s to be able to make that pattern work which isn't a huge barrier but it would be nicer to just import one of those things. A popular option for this is to add an associated function on the first `struct` called `builder` that returns that `struct`'s builder, which might look like this.

```rust
impl ConfigurableThing {
    pub fn builder() -> ThingBuilder {
        ThingBuilder::new()
    }
}
```

When this is provided, we get the ability to use our builder without having to import it!

```rust
use library::ConfigurableThing;

fn main() {
    let _thing = ConfigurableThing::builder()
                                    .option_three(None)
                                    .build()
}
```

While at first it may seem like a trivial change, it really cleans up the api. One hitch in this whole pattern shows up when you end up working with generics. An example might look like this.

```rust
struct Thing<T> {
    option_one: u8,
    option_two: T
}

struct Builder {
    option_one: u8
}

impl Builder {
    pub fn new() -> Self {
        Self {
            option_one: 0
        }
    }

    pub fn option_one(&mut self, value: u8) -> &mut Self {
        self.set_option_one(value);
        self
    }

    pub fn set_option_one(&mut self, value: u8) {
        self.option_one = value;
    }

    pub fn build<T>(&self, option_two: T) -> Thing<T> {
        Thing {
            option_one: self.option_one,
            option_two,
        }
    }
}
```

This should look almost identical to the previous example, the only difference being `build` which now takes an  argument that will ultimately end up defining `T`.

```rust
use library::{Thing, Builder};

fn main() {
    let _thing = Builder::new()
                    .option_one(3)
                    .build(4.3f32);
}

fn use_thing(thing: Thing) {
    // Something complicated goes here
}
```

This all works just like it did before but remember we want to be able to allow our users to use this pattern without having to import the builder. Let's try and add that same `builder` method to `Thing` like we did before.

```rust
impl<T> Thing<T> {
    pub fn builder() -> Builder {
        Builder::new()
    }
}
```

Seems simple enough, let's try and use this to clean up our example.

```rust
use library::Thing;

fn main() {
    let _thing = Thing::builder().option_one(199).build(4.5f64);
}
```

If we were to compile this the compiler would give us the following error message.

```sh
error[E0282]: type annotations needed
  --> src/main.rs:36:18
   |
36 |     let _thing = Thing::builder().option_one(199).build(4.5f64);
   |                  ^^^^^^^^^^^^^^ cannot infer type for `T`
```

That seems crazy, right? The builder doesn't have a type for `T`, why can't `rustc` infer that `T` is an `f32`?
The reason we run into this problem is due to the `impl<T> Thing<T>` scope needs to know what `T` is even though we are not using it in that scope at all. 

The way [hyper](https://docs.rs/http/0.1.16/src/http/response.rs.html#213-233) chose to solve this problem is to put the `builder` associated function in it's own impl block where `T` is defined.

```rust
impl Thing<()> {
    pub fn builder() -> Builder {
        Builder::new()
    }
}
```

In the above we are using the unit type as a placeholder for `T` since `T` is unused. This is great so long as you don't have type constraints. What if `Thing` looked like this?

```rust
struct Thing<T> 
where T: ::std::io::Write {

}
```

What would you make the placeholder for `T`?

Another thought might be to add `T` to the builder, this would solve our problem, since the definition of `T` would follow a path `rustc` could map. The problem we have then is that we need to provide a `T` to construct `Builder` making this pattern far less flexible. 

```rust
impl<T> Thing<T> {
    pub fn builder(inner_type: T) -> Builder<T> {
        Builder {
            option_one: 0,
            inner_type,
        }
    }
}
```

While we could make this work, it doesn't provide as clean of a usage pattern as before. 

We can get around this by using [`PhantomData`](https://doc.rust-lang.org/std/marker/struct.PhantomData.html), a datatype in the standard library that most rust developers don't see very often. `PhantomData` allows us to tell the compiler that this struct is going to be dealing with some `T` but will never really use that `T`. 

```rust
struct Thing<T> 
    where T: ::std::io::Write {
    option_one: u8,
    option_two: T
}

impl<T> Thing<T> {
    pub fn builder() -> Builder<T> {
        Builder::new()
    }
}

struct Builder<T> 
    where T: ::std::io::Write {
    option_one: u8,
    p: PhantomData<T>,
}

impl<T> Builder<T> 
    where T: ::std::io::Write {
    
    pub fn new() -> Builder<T> {
        Builder {
            option_one: 0,
            p: PhantomData<T>
        }
    }

    pub fn option_one(&mut self, value: u8) -> &mut Self {
        self.set_option_one(value);
        self
    }

    pub fn set_option_one(&mut self, value: u8) {
        self.option_one = value;
    }

    pub fn build(&self, option_two: T) -> Thing<T> {
        Thing {
            option_one: self.option_one,
            option_two
        }
    }
}
```

With those changes we can now use the `builder` method on `Thing` and `rustc` can draw a line between all of the `T`s to the `build` method on `Builder`.

```rust
use library::Thing;
use std::{io::Write, fs::File}

fn main() {
    let f = File::create("foo.txt").expect("Faield to open foo.txt");
    let _thing = Thing::builder().option_one(77).build(f)
}
```

If you want to read more about [`PhantomData` you can checkout the standard library docs](https://doc.rust-lang.org/std/marker/struct.PhantomData.html), there is also a page in the [nomicon dedicated to it](https://doc.rust-lang.org/nomicon/phantom-data.html). Twitter user [@Gankro](https://twitter.com/Gankro) pointed out that there is a newer [nightly version](https://doc.rust-lang.org/nightly/nomicon/subtyping.html) of that page as well. 
