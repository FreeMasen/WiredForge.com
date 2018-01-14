extern crate futures;
extern crate hyper;

use futures::future::Future;
use futures::future::ok;

use hyper::{Get, Post, StatusCode};
use hyper::server::{Service, NewService, Request, Response};
use std::collections::HashMap;

use std::io;

type Callback = fn(Request) -> Box<Future<Item = Response, Error = hyper::Error>>;
pub struct WiredForge {
    pub gets: HashMap<String, Callback>,
    pub posts: HashMap<String, Callback>,
}

impl Service for WiredForge {
    type Request = Request;
    type Response = Response;
    type Error = hyper::Error;
    type Future = Box<Future<Item = Self::Response, Error = Self::Error>>;

    fn call(&self, req: Request) -> Self::Future {
        println!("{:?}: {:?}", req.method(), req.path());
        match req.method() {
            &Get => {
                match self.gets.get(req.path()) {
                    Some(cb) => {
                        cb(req)
                    },
                    None => WiredForge::not_found()
                }
            },
            &Post => {
                match self.posts.get(req.path()) {
                    Some(cb) => cb(req),
                    None => WiredForge::not_found()
                }
            },
            _ => {
                WiredForge::not_found()
            }
        }
    }
}



impl WiredForge {
    fn not_found() -> Box<Future<Item = hyper::Response, Error = hyper::Error>> {
        Box::new(ok(Response::new()
            .with_status(StatusCode::NotFound)))
    }
    fn new() -> WiredForge {
        WiredForge {
            gets: HashMap::new(),
            posts: HashMap::new(),
        }
    }
}

pub struct WiredForgeBuilder {
    server: WiredForge,
}

impl WiredForgeBuilder {
    pub fn get(&mut self, route: String,
        callback: Callback) -> &WiredForgeBuilder {
        self.server.gets.insert(route, callback);
        self
    }

    pub fn post(&mut self, route: String, callback: Callback) -> &WiredForgeBuilder {
        self.server.posts.insert(route, callback);
        self
    }

    pub fn new() -> WiredForgeBuilder {
        WiredForgeBuilder {
            server: WiredForge::new()
        }
    }
}


impl NewService for WiredForgeBuilder {
    type Request = Request;
    type Response = Response;
    type Error = hyper::Error;
    type Instance = WiredForge;

    fn new_service(&self) -> Result<Self::Instance, io::Error> {
        Ok(WiredForge {
            gets: self.server.gets.clone(),
            posts: self.server.posts.clone(),
        })
    }
}