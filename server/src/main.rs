extern crate rouille;
#[macro_use]
use rouille::{Request, Response, ResponseBody};

extern crate lettre;
use std::io::Read;
use lettre::{SimpleSendableEmail, EmailTransport, EmailAddress, SmtpTransport};

use std::time::{SystemTime, UNIX_EPOCH};

fn main() {
    rouille::start_server("localhost:8080", move |request| {
        match request.url().as_str() {
            "/contact" => {
                let mut data = request.data().expect("unable to read request body");
                let mut buf = Vec::new();
                data.read_to_end(&mut buf).expect("unable to read request body");
                let body = String::from_utf8(buf).expect("unable to decode body");

                Response::text(body)
            },
            "/gh" => {
                Response::text("")
                },
            _ => Response::empty_404()
        }
    });
}

fn contact(name: String, email: String, message: String) {
    let body = format!("name: {:?}\n\nemail: {:?}\n\nmessage\n----------\n{:?}", name, email, message);
    let email = SimpleSendableEmail::new(
                EmailAddress::new("rfm@robertmasen.pizza".to_string()),
                vec![EmailAddress::new("r.f.masen@gmail.com".to_string())],
                format!("{:?}", SystemTime::now()
                                .duration_since(UNIX_EPOCH)
                                .expect("unable to capture timestamp")
                                .as_secs()),
                body,
            );

    // Open a local connection on port 25
    let mut mailer =
        SmtpTransport::builder_unencrypted_localhost().unwrap().build();
    // Send the email
    let result = mailer.send(&email);
}

struct Email {
    name: String,
    address: String,
    message: String,
}