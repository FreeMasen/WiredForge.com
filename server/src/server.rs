extern crate futures;
extern crate hyper;

use futures::future::Future;
use futures::future::ok;

use hyper::{Get, Post, StatusCode};
use hyper::server::{Service, NewService, Request, Response};
use hyper::header::{ContentLength};
use std::collections::HashMap;

use std::io;
use std::io::{BufReader, Read};
use std::fs::{File};
use std::path::{PathBuf};

type Callback = fn(Request) -> Box<Future<Item = Response, Error = hyper::Error>>;
pub struct WiredForge {
    pub gets: HashMap<String, Callback>,
    pub posts: HashMap<String, Callback>,
    pub static_path: String,
    pub static_enabled: bool,
}

impl WiredForge {
    fn static_file(&self, path: &str) -> Box<Future<Item = Response, Error = hyper::Error>> {
        let mut incoming = String::from(path);
        if incoming.ends_with('/') {
            incoming += "index.html";
        } else if !WiredForge::has_know_extention(&incoming) {
            incoming += "/index.html";
        }
        
        if self.static_path.ends_with('/') && incoming.starts_with('/') {
            incoming.remove(0);
        }
        let static_path = self.static_path.clone() + &incoming;
        let pb = PathBuf::from(static_path);
        println!("path: {:?}", &pb);
        let file = if let Ok(f) = File::open(pb) {
            println!("File opened successfully");
            f
        } else {
            println!("File failed to open");
            return WiredForge::not_found()
        };
        
        let mut reader = BufReader::new(file);
        let mut contents: Vec<u8> = vec!();
        if let Ok(_) = reader.read_to_end(&mut contents) {
            println!("File successfully read");
            Box::new(
                ok(
                    Response::new()
                        .with_body(contents)
                )
            )
        } else {
            println!("Failed to read file as bytes");
            WiredForge::not_found()
        }
    }

    fn has_know_extention(path: &String) -> bool {
        let know_files: Vec<&str> = vec![
            ".html",
            ".js",
            ".css",
            ".ico",
            ".jpg",
            ".png",
            ".woff2",
            ".ttf",
            ".txt",
            ".xml"
        ];
        for ext in know_files {
            if path.ends_with(ext) {
                return true;
            }
        }
        false
    }
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
                    None => {
                        if self.static_enabled {
                            println!("using static and no routes match, checking for fallback");
                            self.static_file(req.path())
                        } else {
                            WiredForge::not_found()
                        }
                    },
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
        println!("WiredForge::not_found");
        let path = PathBuf::from("public/404/index.html");
        let file = if let Ok(f) = File::open(path) {
            println!("opened filed");
            f
        } else {
            println!("Failed to open file");
            return Box::new(ok(Response::new()
            .with_status(StatusCode::NotFound)));
        };
        let mut reader = BufReader::new(file);
        let mut bytes: Vec<u8> = vec!();
        if let Ok(size) = reader.read_to_end(&mut bytes) {
            println!("read file to end");
            Box::new(
                ok(
                    Response::new()
                    .with_status(StatusCode::Ok)
                    .with_header(ContentLength(size as u64))
                    .with_body(bytes)
                )
            )
        } else {
            println!("failed to read file to end");
            Box::new(
                ok(
                    Response::new()
                        .with_status(StatusCode::NotFound)
                )
            )
        }
    }
    fn new() -> WiredForge {
        WiredForge {
            gets: HashMap::new(),
            posts: HashMap::new(),
            static_path: String::new(),
            static_enabled: false,
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

    pub fn set_static(&mut self, path: String) {
        let pb = PathBuf::from(&path);
        if pb.exists() && pb.is_dir() {
            self.server.static_path = path;
            self.server.static_enabled = true;
        } else {
            panic!(format!("Static path does not exist\n{:?}", &path));
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
            static_path: self.server.static_path.clone(),
            static_enabled: self.server.static_enabled == true,
        })
    }
}