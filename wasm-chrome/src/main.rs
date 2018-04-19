extern crate clap;

use std::fs::{File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use clap::{App, Arg};

fn main() {
    let matches = App::new("wasm-chrome")
        .about("Convert your outputed wasm-bindgen js file into a chrome+webpack compatable version")
        .arg(Arg::with_name("infile")
            .required(true)
            .short("i")
            .index(1)
            .help("The input file to be converted"))
        .arg(Arg::with_name("outfile")
            .required(false)
            .short("o")
            .index(2)
            .help("The output file to be written to, will be ./[filename].ch.js if not provided"))
        .get_matches();
    if let Some(infile) = matches.value_of("infile") {
        let module = Module::from(infile);
        let outfile = match matches.value_of("outfile") {
            Some(o) => PathBuf::from(o),
            None => {
                let mut inpath = PathBuf::from(infile);
                inpath.set_extension("ch.js");
                PathBuf::from(inpath.file_name().expect("inpath cannot be a directory"))
            }
        };
        write_file(outfile, module.to_string());
    } else {
        println!("infile argument is required");
    }
}
#[derive(Debug, Default)]
struct Module {
    name: String,
    path: String,
    exports: Vec<String>,
    body: String
}

impl Module {
    pub fn from<T>(infile: T) -> Module
    where T: AsRef<Path> {
        let mut buf = String::new();
        let mut f = File::open(infile).expect("Unable to open infile");
        let _ = f.read_to_string(&mut buf).expect("Unable to read file to a string");
        let mut module = Module::default();
        let lines: Vec<&str> = buf.lines().filter(|l| {
            if l.starts_with("import * as") {
                let import_line = l.replace("import * as ", "");
                let mut parts = import_line.split_whitespace();
                module.name = parts.next().expect("Unable to get module name from js file").to_string();
                let _from = parts.next();
                module.path = parts.next().expect("Unable to get module path from js file").replace(";", "");
                false
            } else {
                if l.starts_with("export") {
                    let trimmed = l.replace("export function ", "");
                    let open_idx = trimmed.find('(').unwrap_or(trimmed.len() - 1);
                    module.exports.push(trimmed[0..open_idx].to_string());
                }
                true
            }
        }).collect();
        module.body = lines.join("\n");
        module
    }

    pub fn to_string(self) -> String {
        let mut placeholder = "    {\n".to_string();
        let mut exports = "    {\n".to_string();
        for export in self.exports {
            placeholder += &format!("        {}: function() {{ }},\n", &export);
            exports += &format!("        {0}: {0},\n        ", &export);
        }
        placeholder += "    },";
        exports += "    }";

        format!("let {0};
let import_obj = {{
    './wasm': {1},
    __wbindgen_placeholder__: {2}
}};
export const booted = fetch({3})
    .then(res => arrayBuffer())
    .then(bytes => {{
        return WebAssembly.instantiate(bytes, import_obj)
            .then(obj => {{
            {0} = obj.instance.exports;
        }});
    }});
{4}", self.name, exports, placeholder, self.path, self.body)
    }
}

fn write_file<T>(outfile: T, content: String)
where T: AsRef<Path> {
    let mut f = File::create(outfile).expect("Unable to create outfile");
    f.write_all(content.as_bytes()).expect("Unable to write contents to outfile");
}