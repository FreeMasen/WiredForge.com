+++
title = "Express.[rj]s"
date = 2018-04-15
draft = false
tags = ["rust", "http"]
[extra]
snippet = "Building on top of Hyper.rs"
image = "hyper.png"
image_desc = "hyper-rs"
+++

If you are interested in the web stack and Rust, you have probably been directed to [Are We Web Yet](http://www.arewewebyet.org/) to help you pick which web framework is right for you. While each of the options here have their advantages, I personally have found learning their systems that abstract away Hyper's semantics is really no much less difficult than learning Hyper itself. In this post I am going to cover why Hyper works for me and maybe it will work for you too.

My introduction into web server building was an `express.js` server. The best thing about `express` is how easy it is to define endpoints for your server.

```js
const express = require('express');
let app = express();

app.get('/', (req, res) => {
    res.send('Hello from /');
});

app.get('/world', (req, res) => {
    res.send('Hello from /world');
});
app.listen(8888, () => {
    console.log('Listening on 8888');
})
```

If you don't need an authentication mechanisim or a static file server, this would work just fine. So, how can we build the same thing but use `rust` instead. Any of the options on AWWY would get you here, for sure, I have test-driven a few of them and didn't really find them to be as ergonomic as I wanted. I am sure there is one of that that might fit for me but I got sick of trying and instead tried to just work with hyper directly.

The guides section of [hyper.rs](https://hyper.rs/guides/server/hello-world/) have a few examples that I found nice when getting started but they don't go much past the very basic. To start they illustrate how the cetral pattern you will probably use is a `Service`, this is a `trait` that you need to implement on a struct you will construct. A basic service `impl` looks like this

```rust
///main.rs
use futures::future::{ok, Future};
use hyper::{
    server::{Service, 
            Request, 
            Response
            Http},
    Error
};
///A nicer way to refer to the return of an endpoint
type HyperResult = Box<Future<Item = Response, Error = Error>>;

struct Express {

}

impl Service for Express {
    type Request = Request;
    type Response = Response;
    type Error = Error;
    type Future = HyperResult;

    fn call(&self, req: Request) -> Self::Future {
        Box::new(
            ok(
                Response::new()
                    .with_body("Hello World".as_bytes())
            )
        )
    }
}

fn main() {
    let addr = "127.0.0.1:8888".parse().expect("Unable to parse url");
    let hyper = Http::new().bind(&addr, || Ok(Express)).expect("Unable to create server");
    let _ = hyper.run();
}
```

The basic idea here is that you will hand over this service to hyper and it will execute the `call` method passing in the `Request` every time the server gets a request. There are a few other confusing things along the way. First is they type alias I added below the `use` statements for `HyperResult`, since hyper uses futures, the call function needs to return that complicated type. To break it down we first have a `Box`, this will make sure that the inner type is heap allocated, inside the box we have a `Future`, which operates like a js `Promise`. Futures need to have their types defined, `Item` refers to the resolve return type and `Error` the catch return type.  To construct this return type we are going to fist create a new `Box`, and then use `::futures::future::ok` to create a resolving future, and inside that we are going to put our `Response`.

Now that we have defined a service, we can pass that off to hyper. In the `main` function we are doing just that, first parsing our `url` to listen on, then handing off our service. Hyper will then will construct out service and execute `call` on each http requst.

Overall, not too painful to get things started. Now lets add some routing.

```rust
///main.rs
use futures::future::{ok, Future};
use hyper::{
    server::{Service, 
            Request, 
            Response
            Http},
    Error
};
///A nicer way to refer to the return of an endpoint
type HyperResult = Box<Future<Item = Response, Error = Error>>;

struct Express {

}

impl Service for Express {
    type Request = Request;
    type Response = Response;
    type Error = Error;
    type Future = HyperResult;

    fn call(&self, req: Request) -> Self::Future {
        match req.path() {
            "/world" => Box::new(ok(Response::new().with_body("Hello from /world".as_bytes()))),
            "/" => Box::new(ok(Response::new().with_body("Hello from /"))),
            _ => Box::new(ok(Response::new().with_body("Hello from somewhere")))
        }
    }
}

fn main() {
    let addr = "127.0.0.1:8888".parse().expect("Unable to parse url");
    let hyper = Http::new().bind(&addr, || Ok(Express)).expect("Unable to create server");
    let _ = hyper.run();
}
```

Really, that is all it took to get to the same function as our express server, maybe not as obvious but functional none the less. If we wanted to go futher, we could totaly make this more ergonomic. To do that we are going to want to use another trait in the hyper crate `NewService`, this takes advantage of the "Builder Pattern", since we don't get to construct the service ourselves, we can't really keep anything in the fields of that struct. Sure you could just write each function you wanted to use as a stand alone function but that might get a little messy. Here is what a `NewService` builder for our `Express` struct would look like.

```rust
// express.rs
use std::collections::{HashMap};
use futures::future::{ok, Future};
use hyper::{
    server::{Service,
            NewService,
            Request, 
            Response
            Http},
    Error,
    Get, 
    Post, 
    Put, 
    Delete, 
    StatusCode
};
pub type HyperResult = Box<Future<Item = Response, Error = Error>>;
pub type CallBack = fn(Request) -> HyperResult;
pub struct ExpressBuilder {
    gets: HashMap<String, Callback>,
    posts: HashMap<String, Callback>,
    puts: HashMap<String, Callback>,
    deletes: HashMap<String, Callback>,
}

impl ExpressBuilder {
    pub fn new() -> Self {
        ExpressBuilder {
            gets: HashMap::new(),
            posts: HashMap::new(), 
            puts: HashMap::new(),
            deletes: HashMap::new(),
        }
    }

    pub fn get(mut self, path: &str, cb: Callback) -> Self {
        self.gets.insert(path, cb);
        self
    }
    pub fn post(mut self, path: &str, cb: Callback) -> Self {
        self.posts.insert(path, cb);
    }
    pub fn put(mut self, path: &str, cb: Callback) -> Self {
        self.puts.insert(path, cb);
        self
    }
    pub fn delete(mut self, path: &str, cb: Callback) -> Self {
        self.deletes.insert(path, cb);
        self
    }

    fn done(self) -> Express {
        Express {
            ..self
        }
    }
}

impl NewService for ExpressBuilder {
    type Request = Request;
    type Response = Response;
    type Error = Error;
    type Instance = Express;

    fn new_service(&self) -> Result<Self::Instance, io::Error> {
        Ok(self.done())
    }
}
```
The first thing we did was I added another type alias `Callback` since it is easier to type that then to type out the whole thing. Next we needed to create a struct called `ExpressBuilder` which has 4 <code title="dictionary's">HashMap</code>s on it one for each major HTTP method. The key for these hashmaps will be the route and the value in it will be the function that will respond. Each of the methods on `ExpressBuilder` takes itself mutably and returns itself, allowing us to chain these methods together when we are building it. Finally there is a done method, this is only going to be used by the `NewService` `impl` it essentially just turns our `NewService` into our `Service` and returns that.

```rust
///express.rs
struct Express {
    gets: HashMap<String, Callback>,
    posts: HashMap<String, Callback>,
    puts: HashMap<String, Callback>,
    deletes: HashMap<String, Callback>, 
}

impl Express {
    fn not_found() -> HyperResult {
        Box::new(
            ok(
                Response::new()
                    .with_status(StatusCode::NotFound)
            )
        )
    }
}

impl Service for Express {
    type Request = Request;
    type Response = Response;
    type Error = Error;
    type Future = HyperResult;
    fn call() -> Self::Future {
        match req.method() {
            &Get => {
                match self.gets(req.path()) {
                    Some(cb) => cb(req),
                    None => self.not_found(),
                }
            },
            &Post => {
                match self.posts(req.path()) {
                    Some(cb) => cb(req),
                    None => self.not_found(),
                }
            },
            &Put => {
                match self.puts(req.path()) {
                    Some(cb) => cb(req),
                    None => self.not_found(),
                }
            },
            &Delete => {
                match self.deletes(req.path()) {
                    Some(cb) => cb(req),
                    None => self.not_found(),
                }
            },
            _ => self.not_found(),
        }
    }
}
```

We also need to add our new hash maps to the `Express` struct, since it will be the one that needs to actually know these values. We also want to make user of these so we have a more complicated `call` function. The first thing we do is match on the http method of the incoming request, each match arm then check's its respective `HashMap` for the request's route if it is there it will execute the callback. We also added a convience function for when we want to send a `404` called `not_found`. 

With all of those changes, our `main.rs` file is going to look like this.

```rust
///main.rs
extern crate hyper;
extern crate futures;
use futures::future::{ok};
mod express;
use express::{ExpressBuilder, HyperResult};
use hyper::server::{Http, NewService, Response};

fn main() {
    let addr = "127.0.0.1:8888".parse().expect("Unable to parse url");
    let app = ExpressBuilder::new()
        .get("/", |_r| {
            Box::new(
                ok(
                    Response()
                        .with_body("Hello from /")
                )
            )
        })
        .get("/world", |_r| {
            Box::new(
                ok(
                    Response()
                        .with_body("Hello from /world")
                )
            )
        });
    
    let hyper = Http::new().bind(&addr, move || app.new_service()).expect("Unable to create server");
    let _ = hyper.run();
}
```

Just like before, we are going to parse our address, next we are going to define our routes. Here I am using closures, though you could easily use `fn`s, maybe defined in a `routes` module. At this point, we have gotten as close to the `express.js` ergonomics as possible in rust. I know this example isn't nearly as close to feature parity, that you might get out of another rust web framework but it hopefully has made hyper feel a little less intimidating.