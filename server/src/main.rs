extern crate hyper;
extern crate futures;
extern crate lettre;
extern crate url;
extern crate rusqlite;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate serde_json;
extern crate pony;

mod routes;
mod mailer;
mod models;
mod data;

use std::env;

use hyper::server::Http;
use hyper::server::NewService;
use pony::pony_builder::PonyBuilder;

fn main() {
    let environ = env::args().last().expect("Unable to get last arg");
    let static_path = match environ.as_str() {
        "prod" => "public/",
        _ => "../public/"
    };
    let addr = "127.0.0.1:1111".parse().unwrap();
    let mut wf = PonyBuilder::new();
    wf.post("/send", routes::contact);
    wf.post("/rsvp", routes::rsvp);
    wf.get("/rsvp", routes::rsvps);
    wf.use_static(static_path);
    let handler = Http::new().bind(&addr, move || wf.new_service()).unwrap();
    match handler.run() {
        Ok(_) => println!("Listening on 1111"),
        Err(e) => println!("Error starting server\n{:?}", e),
    };
}