use rusqlite::Connection;
use models::*;
use serde_json;

pub struct Data;

impl Data {
    pub fn save_rsvp(name: String, mustard: String) -> String {
        Data::ensure_tables();
        let conn = Data::get_connection();
        let mut stmt = conn.prepare("INSERT INTO rsvp (name, mustard)
                            VALUES (?1, ?2)").expect("unable to prepare insert");
        if let Ok(i) = stmt.insert(&[&name, &mustard]) {
            Data::get_rsvp(i as i32)
        } else {
            String::new()
        }
    }

    pub fn update_rsvp(id: i32, name: String, mustard: String) -> String {
        Data::ensure_tables();
        let conn = Data::get_connection();
        let mut test = conn.prepare("SELECT id FROM rsvp WHERE id = (?1)")
                        .expect("Unable to prepare test");
        if let Ok(_) = test.exists(&[&id]) {
            let _ = conn.execute("UPDATE rsvp
                                SET id = (?1),
                                name = (?2),
                                mustard = (?3)",
                                &[&id, &name, &mustard]);
            Data::get_rsvp(id)
        } else {
            Data::save_rsvp(name, mustard)
        }
    }

    pub fn get_rsvp(id: i32) -> String {
        let conn = Data::get_connection();
        let mut stmt = conn.prepare("SELECT id, name, mustard FROM rsvp WHERE id = (?1)")
                            .expect("Unabel to prepare single select");
        let mut q = stmt.query(&[&id]).expect("Unable to execute single find query");
        if let Some(row) = q.next() {
            let row = row.expect("Unable to get single row");
            let r = Rsvp {
                id: row.get(0),
                name: row.get(1),
                mustard: row.get(2),
            };
            serde_json::to_string(&r).expect("Unable to get rsvp for id")
        } else {
            String::new()
        }
    }

    pub fn get_all_rsvps() -> String {
        Data::ensure_tables();
        let mut list: Vec<Rsvp> = vec!();
        let conn = Data::get_connection();
        let mut stmt = conn.prepare("SELECT id, name, mustard FROM rsvp")
                            .expect("Unable to prepare select");
        let mut q = stmt.query(&[]).expect("Unable to execute query");
        while let Some(result_row) = q.next() {
            let row = result_row.expect("Unable to get row");
            let r = Rsvp {
                id: row.get(0),
                name: row.get(1),
                mustard: row.get(2),
            };
            list.push(r);
        }
        serde_json::to_string(&list).expect("Unable to serialize rsvps")
    }

    fn ensure_tables() {
        let conn = Data::get_connection();
        let mut stmt = conn.prepare("SELECT name FROM sqlite_master").expect("Unable to prepare sqlite_master");
        let mut q = stmt.query(&[]).expect("Unable to get sqlite_master");
        let mut found_rsvp = false;
        while let Some(row) = q.next() {
            let row = row.expect("Unable to get sqlite_master row");
            let col: String = row.get(0);
            if col.to_lowercase() == String::from("rsvp") {
                found_rsvp = true;
            }
        }
        if !found_rsvp {
            let _ = conn.execute("CREATE TABLE rsvp
                                (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
                                name TEXT, mustard TEXT)", &[]);
        }
    }

    pub fn get_connection() -> Connection {
        Connection::open("WiredForge.sqlite").expect("Unable top open connection")
    }
}