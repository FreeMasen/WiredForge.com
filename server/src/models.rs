#[derive(Serialize, Deserialize)]
pub struct Rsvp {
    pub id: u32,
    pub name: String,
    pub mustard: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Email {
    pub name: String,
    pub address: String,
    pub message: String,
}