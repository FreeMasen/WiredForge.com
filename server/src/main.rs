extern crate hyper;
extern crate futures;

use hyper::server::{Http, Request, Response, Service};
use hyper::{Method, StatusCode, Body};
use hyper::header::Location;

extern crate lettre;
use lettre::{SimpleSendableEmail, EmailTransport, EmailAddress, SmtpTransport};

use std::time::{SystemTime, UNIX_EPOCH};

use std::sync::mpsc;
use std::sync::{Arc, Mutex};
use futures::sync::oneshot;
use futures::sync::mpsc;
use futures::{Future, Stream};


struct Listener {
    send: Option<oneshot::Sender<()>>,
}

impl Service for Listener {
    // boilerplate hooking up hyper's server types
    type Request = Request;
    type Response = Response;
    type Error = hyper::Error;
    // The future representing the eventual Response your call will
    // resolve to. This can change to whatever Future you need.
    type Future = Box<Future<Item=Self::Response, Error=Self::Error>>;

    fn call(&self, req: Request) -> Self::Future {
        println!("new req: {:?}", &req);
        let mut res = Response::new();
        if req.method() != &Method::Get {
            res.set_status(StatusCode::NotFound);
        } else {
            match req.path() {
                "/gh" => {
                    res.set_body(Body::empty());
                },
                "/send" => {
                    res.set_status(StatusCode::TemporaryRedirect);
                    res.headers_mut().set(Location::new("/"));
                },
                _ => {
                    res.set_status(StatusCode::NotFound);
                }
            }
        }
        Box::new(futures::future::ok(res))
    }
}

fn end() -> Box<Future<Item = (), Error = ()>> {
    println!("Closing server");
    Box::new(futures::future::ok(()))
}

fn main() {
    let (shutdown_tx, shutdown_rx) = oneshot::channel();
    let addr = "127.0.0.1:1111".parse().unwrap();
    let server = Http::new().bind(&addr, || Ok(Listener {
        send: Some(shutdown_tx),
    })).unwrap();
    server.run_until(shutdown_rx.then(|_| Ok(()))).unwrap();
    // let server = Server::new("localhost:1111", move | req | {
    //     let send = send.clone();
    //     let url = req.url();
    //     let body = req.data();
    //     match send.send(&url == "/gh") {
    //         Ok(_) => {
    //             println!("Send successful");
    //         },
    //         Err(e) => {
    //             println!("Send failed {:?}", e);
    //         },
    //     };
    //     serve(url, body)
    // }).expect("Unable to start server");
    // loop {
    //     match recv.recv() {
    //         Ok(stop) => {
    //             if stop {
    //                 break;
    //             } else {
    //                 server.poll();
    //             }
    //         },
    //         Err(e) => {
    //             println!("Error in recv. {:?}", e);
    //         }
    //     }
    // }
}

// fn serve(url: String, body: Option<RequestBody>) -> Response {
//     match url.as_str() {
//         "/send" => {
//             println!("/send");
//             let mut data = body.expect("unable to read request body");
//             let mut buf = Vec::new();
//             data.read_to_end(&mut buf).expect("unable to read request body");
//             println!("read buffer");
//             let body = String::from_utf8(buf).expect("unable to decode body");
//             let email = Email::from_url_params(body);
//             contact(email.name, email.address, email.message);
//             println!("sent email");
//             Response::redirect_301("/")
//         },
//         "/gh" => {
//             Response::text("")
//         },
//         _ => Response::empty_404()
//     }
// }

// fn contact(name: String, email: String, message: String) {
//     let body = format!("name: {:?}\n\nemail: {:?}\n\nmessage\n----------\n{:?}", name, email, message);
//     let email = SimpleSendableEmail::new(
//                 EmailAddress::new("rfm@robertmasen.pizza".to_string()),
//                 vec![EmailAddress::new("r.f.masen@gmail.com".to_string())],
//                 format!("{:?}", SystemTime::now()
//                                 .duration_since(UNIX_EPOCH)
//                                 .expect("unable to capture timestamp")
//                                 .as_secs()),
//                 body,
//             );

//     // Open a local connection on port 25
//     let mut mailer =
//         SmtpTransport::builder_unencrypted_localhost().unwrap().build();
//     // Send the email
//     let result = mailer.send(&email);
//     match result {
//         Ok(_) => println!("send mail"),
//         Err(e) => println!("Error sending mail: {:?}", e),
//     }
// }
#[derive(Debug)]
struct Email {
    name: String,
    address: String,
    message: String,
}

impl Email {
    fn from_url_params(url: String) -> Email {
        let mut ret = Email {
            name: String::from(""),
            address: String::from(""),
            message: String::from(""),
        };
        let split = url.split("&");
        println!("parsing: {:?}", split);
        for section in split {
            let parts: Vec<&str> = section.split("=").collect();
            println!("key: {:?}\nvalue: {:?}\n", parts[0], parts[1]);
            match parts[0] {
                "your-name-input" => {
                    ret.name = String::from(parts[1]).replace("+", " ");
                },
                "your-email-address-input" => {
                    ret.address = String::from(parts[1]).replace("%40", "@");
                },
                "your-message-input" => {
                    ret.message = String::from(parts[1]).replace("+", " ")
                                                        .replace("\\'", "'")
                                                        .replace("%2C", ",")
                                                        .replace("%0A", "\n");
                },
                _ => ()
            }
        }
        ret
    }
}