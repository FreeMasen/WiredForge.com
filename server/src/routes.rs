use futures::{Future, Stream};
use futures::future::ok;
use std::collections::HashMap;
use hyper::server::{Request, Response};
use hyper::{StatusCode, Error};
use hyper::header::{ContentLength, ContentType, Location};
use url::form_urlencoded;
use serde_json;
use mailer::{send};
use models::Email;
use data::Data;

pub fn contact(req: Request) -> Box<Future<Item = Response, Error = Error>> {
        Box::new(req.body().concat2().map(|b| {
            let params = form_urlencoded::parse(b.as_ref()).into_owned().collect::<HashMap<String, String>>();
            let name = if let Some(n) = params.get("your-name-input") {
                n
            } else {
                return bad_params(String::from("No name included in request"));
            };

            let address = if let Some(a) = params.get("your-email-address-input") {
                a
            } else {
                return bad_params(String::from("No email included in request"))
            };
            let msg = if let Some(m) = params.get("your-message-input") {
                m
            } else {
                return bad_params(String::from("No msg included in request"))
            };
            let e = Email {
                address: address.clone(),
                name: name.clone(),
                message: msg.clone(),
            };
            match send(e) {
                Ok(msg) => {
                    println!("{:?}", msg);
                    Response::new()
                        .with_status(StatusCode::SeeOther)
                        .with_header(Location::new("/contact/success/"))
                },
                Err(msg) => {
                    println!("{:?}", msg);
                    Response::new()
                        .with_status(StatusCode::SeeOther)
                        .with_header(Location::new("/contact/failure/"))
                }
            }
        })
    )
}

pub fn rsvp(req: Request) -> Box<Future<Item = Response, Error = Error>> {
    println!("rsvp");
    Box::new(
            req.body().concat2().map(|b| {
                let params = if let Ok(p) = serde_json::from_slice::<HashMap<String, String>>(b.as_ref()) {
                    p
                } else {
                    return bad_params(String::from("unable to parse params"));
                };
                println!("{:?}", params);
                let name = if let Some(n) = params.get("name") {
                    n
                } else {
                    return bad_params(String::from("No name included in request"));
                };
                let mustard = if let Some(m) = params.get("mustard") {
                    m
                } else {
                    return bad_params(String::from("No mustard included in request"));
                };

                let rsvps: String;
                if params.contains_key("id") {
                    println!("Found ID");
                    let id_str = params.get("id").unwrap();
                    if let Ok(i) = id_str.parse::<i32>() {
                        println!("Parsed ID");
                        rsvps = Data::update_rsvp(
                                    i,
                                    name.to_string(),
                                    mustard.to_string()
                            );
                        println!("Updated ID");
                    } else {
                        println!("Unable to parse ID");
                        rsvps = Data::save_rsvp(
                            name.to_string(),
                            mustard.to_string()
                        );
                    };
                } else {
                    println!("Did not find ID");
                    rsvps = Data::save_rsvp(
                        name.to_string(),
                        mustard.to_string()
                    );
                    println!("Inserted rsvp");
                }

                Response::new()
                    .with_status(StatusCode::Ok)
                    .with_header(ContentLength(rsvps.len() as u64))
                    .with_header(ContentType::json())
                    .with_body(rsvps)
            })
    )
}

pub fn rsvps(_req: Request) -> Box<Future<Item = Response, Error = Error>> {
    let rsvps = Data::get_all_rsvps();
    Box::new(ok(
        Response::new()
            .with_status(StatusCode::Ok)
            .with_header(ContentLength(rsvps.len() as u64))
            .with_header(ContentType::json())
            .with_body(rsvps)
    ))
}

fn bad_params(msg: String) -> Response {
    Response::new()
        .with_status(StatusCode::UnprocessableEntity)
        .with_header(ContentLength(msg.len() as u64))
        .with_body(msg)
}
#[allow(dead_code)]
fn r500() -> Response {
    Response::new().with_status(StatusCode::BadRequest)
}