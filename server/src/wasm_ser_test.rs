use std::ops::Sub;
use std::fmt::Debug;

use rmp_serde::{to_vec as rmp_ser, from_slice as rmp_de};
use bincode::{serialize as bin_ser, deserialize as bin_de};

#[derive(Serialize, Deserialize,Debug,PartialEq, Clone)]
enum Message {
    Ping, Pong, Chat(String), Nick(String), Me(String)
}

pub fn get_res_vec<T:Sub<T>>(now: Box<Fn() -> T>, time_unit: &str) -> Vec<String> 
where <T as Sub>::Output: Debug
{
    let mut data: Vec<String> = vec!();
    let rmp_msgs = msgs();
    let rmp_start = (now)();
    let rmp_res = rmp_test(rmp_msgs);
    let rmp_end = (now)();
    let rmp_dur = rmp_end - rmp_start;
    let bin_msgs = msgs();
    let bin_start = (now)();
    let bin_res = bin_test(bin_msgs);
    let bin_end = (now)();
    let bin_dur = bin_end - bin_start;
    data.push(String::from("RMP"));
    data.push(String::from("----------"));
    data.push(format!("Largest serialized: {}", &rmp_res.0));
    data.push(format!("Total serialized: {}", &rmp_res.1));
    data.push(format!("Duration: {:?}{}", rmp_dur, &time_unit));
    data.push(String::from("Bincode"));
    data.push(String::from("----------"));
    data.push(format!("Largest serialized: {}", &bin_res.0));
    data.push(format!("Total serialized: {}", &bin_res.1));
    data.push(format!("Duration: {:?}{}", bin_dur, &time_unit));
    data
}

fn rmp_test(x: Vec<Message>) -> (usize, usize) {
    let mut total_size = 0;
    let mut max = 0;
    for msg in x {
        let serialized = rmp_ser(&msg).expect("Unable to serialize");
        let size = serialized.len();
        total_size += size;
        if max < size {
            max = size;
        }
        let _: Message = rmp_de(&serialized).expect("Unable to deserialize");
    }
    (max, total_size)
}

fn bin_test(x: Vec<Message>) -> (usize, usize) {
    let mut total_size = 0;
    let mut max = 0;
    for msg in x {
        let serialized = bin_ser(&msg).expect("Unable to serialize");
        let size = serialized.len();
        total_size += size;
        if max < size {
            max = size;
        }
        let _: Message = bin_de(&serialized).expect("Unable to deserialize");
    }
    (max, total_size)
}

fn msgs() -> Vec<Message> {
    let mut ret = vec!();
    let one_of_each = vec![
        Message::Ping,
        Message::Pong,
        Message::Chat(String::from("Hello World!")),
        Message::Nick(String::from("CoolDood2001")),
        Message::Me(String::from("Me!"))
    ];
    for _ in 0..1000 {
        ret.extend(one_of_each.clone());
    }
    ret
}