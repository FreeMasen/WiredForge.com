use mailer::{send};
use warp::{Reply, http::Response, reply::json};

use models::Email;
use ser_test::get_res;

pub fn contact(e: Email) -> impl Reply {
    match send(e) {
        Ok(msg) => {
            println!("{:?}", msg);
            Response::builder()
                .status(303)
                .header("Location", "/contact/success")
                .body("")
        },
        Err(msg) => {
            println!("{:?}", msg);
            Response::builder()
                .status(303)
                .header("Location", "/contact/failure")
                .body("")
        }
    }
}

pub fn get_wasm_results() -> impl Reply {
    let results = get_res(Box::new(now), "ms");
    json(&results)
}

fn now() -> u32 {
    let start = ::std::time::SystemTime::now().duration_since(::std::time::UNIX_EPOCH);
    start.unwrap().subsec_millis()
}