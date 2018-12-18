// extern crate futures;
// extern crate hyper;
extern crate lettre;
extern crate lettre_email;
extern crate url;
// extern crate pony;
extern crate rusqlite;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate serde_json;
extern crate ser_test;
#[macro_use]
extern crate warp;
extern crate env_logger;

mod routes;
mod mailer;
mod models;
mod error;

use warp::{Filter};
use std::path::PathBuf;

fn main() {
    ::std::env::set_var("RUST_LOG", "info");
    env_logger::init();
    let contact = warp::post2()
                .and(warp::path("send"))
                .and(warp::filters::body::form())
                .map(routes::contact);
    let ser_test = warp::get2()
                .and(path!("sertest" / "native"))
                .map(routes::get_wasm_results);
    let static_route = warp::fs::dir(find_static_path());
    let routes = warp::any()
                    .and(contact)
                    .or(ser_test)
                    .or(static_route)
                    .with(warp::log("wiredforge"));
    warp::serve(routes)
        .run(([0,0,0,0], 1111));
}

fn find_static_path() -> PathBuf {
    let path = PathBuf::from("../public/");
    if path.exists() {
        return path
    }
    let path = PathBuf::from("./public/");
    if path.exists() {
        return path
    }
    panic!("Unable to find static path, should be either ./public or ../public");
}

