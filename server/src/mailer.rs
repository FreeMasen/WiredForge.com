use lettre::{SimpleSendableEmail, EmailTransport, EmailAddress, SmtpTransport};
use std::time::{SystemTime, UNIX_EPOCH};
use models::Email;

pub fn send(email: Email) {
    let body = format!("name: {:?}\n\nemail: {:?}\n\nmessage\n----------\n{:?}",
                email.name,
                email.address,
                email.message);
    let msg = SimpleSendableEmail::new(
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
    let result = mailer.send(&msg);
    match result {
        Ok(_) => println!("send mail"),
        Err(e) => println!("Error sending mail: {:?}", e),
    }
}
