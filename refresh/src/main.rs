extern crate toml;
#[macro_use]extern crate serde_derive;

use std::io::*;
use std::path::{PathBuf};
use std::fs::{File};
use std::process::{Command, Stdio};

#[derive(Serialize, Deserialize, Debug)]
struct Info {
  pid: u32
}

fn main() {
    println!("Refreshing");
    let last_path = PathBuf::from("last_info.toml");
    match File::open(last_path) {
        Ok(file) => {
            last_info_exists(file);
        },
        Err(e) => {
            println!("Unable to open last_info: {:?}", e);
            start();
        }
    }
}

fn last_info_exists(file: File) {
    println!("Last info exists");
    let mut reader = BufReader::new(file);
    let mut content = String::new();
    match reader.read_to_string(&mut content) {
        Ok(_size) => {
            successful_read(content);
        },
        Err(e) => {
            println!("Unable to read last info file as a string {:?}", e);
        },
    };
}

fn successful_read(contents: String) {
    println!("Read in last info");
    match toml::from_str(&contents) {
        Ok(info) => {
            stop(info);
        },
        Err(e) => {
            println!("unable to convert contents to struct {:?}", e);
        }
    };
}
  
fn stop(info: Info) {
    println!("Stopping {:?}", info);
    wait_for_process(String::from("kill"), Command::new("kill")
        .args(&[&format!("{:?}", info.pid)]));
}

fn start() {
    wait_for_process(String::from("git"), Command::new("git")
        .args(&["pull"])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped()));
    wait_for_process(String::from("gutenberg"), Command::new("gutenberg")
        .args(&["build"])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped()));
    if let Ok(run) = Command::new("./server/target/release/server")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn() {
            let pid = run.id();
            write_new_info(pid);
        }
}

fn wait_for_process(name: String, process: &mut Command) {
    println!("Waiting for {:?}", name);
    match process.spawn() {
        Ok(mut child) => {
            match child.wait() {
                Ok(_status) => {
                    println!("{:?} completed", name);
                },
                Err(_e) => {
                    println!("failed to wait for {:?}", name);
                },
            };
        },
        Err(_e) => {
            println!("failed to spawn {:?}", name);
        },
    };
}

fn write_new_info(pid: u32) {
    println!("Writing new info {:?}", &pid);
    let info = Info { pid: pid };
    let info_str = toml::to_string(&info).expect("Unable to TOMLize struct");
    let mut f = File::create("last_info.toml").expect("Unable to create last_info.toml");
    f.write_all(info_str.as_bytes()).expect("Unable to write new info file");
    println!("new info written");
}