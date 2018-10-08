use std::{
    error::Error as StdError,
    fmt::{
        Display,
        Formatter,
        Result as FmtResult,
    }
};

use lettre::smtp::error::Error as SmtpError;
use lettre_email::error::Error as EmailError;

pub type Res<T> = Result<T, Error>;

#[derive(Debug)]
pub enum Error {
    Other(String),
    Smtp(SmtpError),
    Email(EmailError)
}

impl StdError for Error {
    fn cause(&self) -> Option<&StdError> {
        match self {
            Error::Smtp(ref inner) => Some(inner),
            Error::Email(ref inner) => Some(inner),
            Error::Other(_) => None,
        }
    }
}

impl Display for Error {
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        if let Some(inner) = self.cause() {
            return write!(f, "{}", inner)
        }
        match self {
            Error::Other(msg) => msg.fmt(f),
            _ => unreachable!()
        }
    }
}

impl From<SmtpError> for Error {
    fn from(other: SmtpError) -> Self {
        Error::Smtp(other)
    }
}

impl From<EmailError> for Error {
    fn from(other: EmailError) -> Self {
        Error::Email(other)
    }
}