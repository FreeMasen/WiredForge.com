extern crate rouille;
#[macro_use]
use rouille::{Request, Response, ResponseBody, RequestBody};

extern crate lettre;
use std::io::Read;
use lettre::{SimpleSendableEmail, EmailTransport, EmailAddress, SmtpTransport};

use std::time::{SystemTime, UNIX_EPOCH};
use std::io::{BufReader, Lines, BufWriter};
use std::fs::{File};
use std::path::{PathBuf};

fn main() {
    rouille::start_server("localhost:1111", move |request| {
        match request.url().as_str() {
            "/send" => {
                println!("/send");
                let mut data = request.data().expect("unable to read request body");
                let mut buf = Vec::new();
                data.read_to_end(&mut buf).expect("unable to read request body");
                println!("read buffer");
                let body = String::from_utf8(buf).expect("unable to decode body");
                let email = Email::from_url_params(body);
                contact(email.name, email.address, email.message);
                println!("sent email");
                Response::redirect_301("/")
            },
            "/gh" => {
                Response::text("")
                },
            "/bday" => {
                match request.method() {
                    "GET" => {
                        Response::text(getAllRSVPs())
                    },
                    "POST" => {
                        match request.data() {
                            Ok(body) => {
                                saveRsvp(body);
                            },
                            Err(_) => Response::empty_404()
                        }
                    },
                    _ => Response::empty_404
                }
                if (method == "GET") {

                }
                else if (method == "POST")
            },
            _ => Response::empty_404()
        }
    });
}

struct RSVP {
    name: string,
    mustard: string
}

fn getAllRSVPs() -> String {
    let ret = String::new();
    let path = PathBuf::from("rsvps.csv");
    let file = File::open(path);
    let content = BufReader::new(file);
    ret.push("[");
    for line in content.lines {
        ret.push('{');
        ret.push('"');
        let quoted = line.replace(",", "\",\"")
                        .replace(":", "\":\"");
        ret.push(quoted);
        ret.push("\"");
        ret.push("}");
        ret.push(",");
    }
    let _ = ret.pop();
    ret.push("]");
    ret
}

fn saveRsvp(body: RequestBody) {
    match body.read_to_string() {
        Ok(text) => {
            let path = PathBuf::from("rsvps.csv");
            let file = File::open(path);
            let writer = BufWriter::new(file);
            let params = text.split(",");
            let name = params[0].split(":")[1];
            let mustard = params[1].split(":")[1];
            let _ = writer.write("{:?},{:?}", name, mustard).expect("things");
        },
        _ => ;
    }
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
    match result {
        Ok(_) => println!("send mail"),
        Err(e) => println!("Error sending mail: {:?}", e),
    }
}
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