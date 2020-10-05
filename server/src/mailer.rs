use lettre::{SmtpClient, SmtpTransport, Transport};
use lettre_email::EmailBuilder;
use models::Email;
use error::Res;

pub fn send(email: Email) -> Res<String>{
    let body = format!("name: {:?}\n\nemail: {:?}\n\nmessage\n----------\n{:?}",
                email.name,
                email.address,
                email.message);
    let msg = EmailBuilder::new()
        .from("rfm@robertmasen.pizza")
        .to(("r.f.masen@gmail.com", "Robert Masen"))
        .reply_to(email.address)
        .subject("New Message from WiredForge.com")
        .text(body)
        .build()?;

    // Open a local connection on port 25
    let mut mailer = SmtpTransport::new(SmtpClient::new_unencrypted_localhost()?);
    // Send the email
    mailer.send(msg.into())?;
    Ok(String::from("Sent message successfully"))
}
