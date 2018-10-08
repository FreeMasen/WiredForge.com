#[derive(Serialize, Deserialize)]
pub struct Rsvp {
    pub id: u32,
    pub name: String,
    pub mustard: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Email {
    #[serde(rename = "your-name-input")]
    pub name: String,
    #[serde(rename = "your-email-address-input")]
    pub address: String,
    #[serde(rename = "your-message-input")]
    pub message: String,
}