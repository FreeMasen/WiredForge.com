extern crate hyper;
extern crate futures;
extern crate lettre;
extern crate url;
extern crate rusqlite;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate serde_json;

mod server;
mod routes;
mod mailer;
mod models;
mod data;

use std::path::{PathBuf};

use hyper::server::Http;
use hyper::server::NewService;

use server::{WiredForgeBuilder};

fn main() {
    let addr = "127.0.0.1:1111".parse().unwrap();
    let mut wf = WiredForgeBuilder::new();
    wf.post(String::from("/contact"), routes::contact);
    wf.post(String::from("/rsvp"), routes::rsvp);
    wf.get(String::from("/rsvp"), routes::rsvps);
    wf.set_static(String::from("../public/"));
    let handler = Http::new().bind(&addr, move || wf.new_service()).unwrap();
    match handler.run() {
        Ok(_) => println!("Listening on 1111"),
        Err(e) => println!("Error starting server\n{:?}", e),
    };
}