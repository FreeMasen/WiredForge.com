+++
title = "Resume TUI"
date = 2025-01-19
draft = false
[extra]
snippet = "Re-imagining my resume"
+++

In the last couple of years I stumbled upon a
["resume"](https://github.com/JSLegendDev/2d-portfolio-kaboom) for a 2d animation designer and was
so taken by the concept of encoding my work experience using a medium that is also an example of my
work. For nearly 5 years now I have had the pleasure of writing Rust professionally so I thought a
Text User Interface (TUI) application might be a fun way to show off my expertise. 

As I started to develop this application I reached for the [`ratatui`](https://ratatui.rs/)
crate to provide the TUI facilities and started to think about how I wanted to organize this information.

I opted for a tab based layout with a side-bar on the left for the tabs and the following sections

- Home: Name, tagline and links to Github, LinkedIn
- Work
  - At the top level a list of jobs
  - Each job should have a list of "details" describing the things I wanted to highlight
- Open Source Work:
  - At the top level a list of Projects
  - Each Project should have a description
  - To Support Organizations, Projects should have an optional list of sub-projects
- Education: A list of schools with start/end dates

So, that would look something like this:

![asciicast preview as an animated gif](/images/tui.gif)

> [Install](http://gh.freemasen.com/resume-tui/) or [Preview](http://gh.freemasen.com/resume-tui/live-preview/)

That already looks pretty good! So now how to populate these tabs?

To start I created some structures to represent the data.

```Rust
/// All of the data needed to run
pub struct Database {
    /// My Name
    pub name: &'static str,
    /// A short statement about myself
    pub tag_line: &'static str,
    /// A github URL
    pub github: Option<&'static str>,
    /// A linkedin URL
    pub linkedin: Option<&'static str>,
    /// List of jobs in order
    pub jobs: &'static [Workplace],
    /// List of open source projects
    pub open_source: &'static [Project],
    /// List of school
    pub education: &'static [School],
}

/// A single job
pub struct Workplace {
    /// Where did I work?
    pub name: &'static str,
    /// What was my title?
    pub title: &'static str,
    /// When did I start?
    pub start: &'static str,
    /// If not there, when did I stop?
    pub end: Option<&'static str>,
    /// What work did I do?
    pub details: &'static [Detail],
}

/// A detail about a job
pub struct Detail {
    /// A bullet point description of the work
    pub headline: &'static str,
    /// A longer description that is still short
    pub snippet: &'static str,
    /// An in depth overview of the work
    pub detail: &'static str,
}

/// An open source project
pub struct Project {
    /// What is the name of the project/org?
    pub name: &'static str,
    /// What is the project for?
    pub short_desc: &'static str,
    /// How does it solve the above problem?
    pub long_desc: &'static str,
    /// If an organization, any projects to highlight
    pub sub_projects: &'static [Project],
}

/// An educational institution
pub struct School {
    /// The school's name
    pub name: &'static str,
    /// If graduated, when?
    pub graduated: Option<&'static str>,
    /// Maybe a degree or description of the coursework?
    pub desc: &'static str,
}
```

With those structures we can display each of the goals defined above but how is the application
going to read those? There seems to be 3 "easy" solutions here.

First would be to write the contents with the literal constructor syntax and maintain some `.rs`
files of the contents.

```rust
static WORK: &[Workplace] = &[
  Workplace {
    name: "some job",
    title: "software monkey",
    start: "March 2020",
    end: None,
    details: &[Detail {
      headline: "Developed software",
      snippet: "I wrote some code",
      detail: "nothing to see here
      I just typed into a keyboard
      and the computer did some magic."
    }],
  }
]
```

That _would_ work but it just feels clunky to have to write all the contents in-line like that. Once
a `detail` reaches a certain size things start to get really ugly. For example, what exactly would
be rendered in the `detail` in the above example? Would that padding on lines 2 and 3 of the field
be removed or included? What about line breaks, should those three lines be combined into a single
line? Last but not least, writing the recursive `Project` would end up either shifting left a bunch
or would require a lot of `const`s.

```rust
const PROJECTS = &[Project {
        name: "Some Organization",
        short_desc: "Open source can be powerful",
        long_desc: "A collection of open source projects that are related in some way",
        sub_projects: &[Project {
          name: "Some Project",
          short_desc: "Some small part of the organization",
          long_desc: "Fulling the missions in some way ends up \
    being and important part of the organization.

    For some folks, the task isn't easy but with our project it
    becomes not only easy but fun!"
          sub_projects: &[],
        }, Project {
          name: "Some Project 2"
          short_desc: "Some other part of the organization",
          long_desc: "Fulling the missions in some other way ends up
    being and important part of the organizational existence.

    For some folks, the task isn't possible but with our second project it
    becomes fully possible!"
          sub_projects: &[],
        }],
    }, Project {
      name: "Some Stand Alone Project",
      short_desc: "This one is not in an organization",
      long_desc: "Can you tell that?

      I struggle to parse this all out quickly.",
      sub_projects: &[],
    }]
```

The above consists of just 1 organization with 2 projects and 1 stand alone project and I'm already
having a hard time telling where the organization ends and the stand alone project starts.

So then, I want to pick a serialization format to author the contents. I chose `toml` for
that since it can be mostly flat and handles multi-line strings well.

```toml
# data.toml
[workplace]
name = "some job"
title = "software monkey"
start = "March 2020"
details = [
  {
    headline = "Developed software"
    snippet = "I wrote some code"
    detail = """nothing to see here
    I just typed into a keyboard
    and the computer did some magic."""
  }
]

```

So then, how do we get this data into the application. One option would be to require the files to
be installed on disk and read them at run-time but ensuring the files are on the system after
install time is a bit too complicated for what I wanted. The next option would be to use something
like `include_str!` and then use a `OnceLock` to convert the string into the structured data.


```rust
const DATA: OnceLock<Data> = OnceLock::new();
const TOML: &str = include_str!("work.toml");
struct Data {
  workplace: Vec<Workplace>,
}

pub fn get_data() -> &Data {
  DATA.get_or_init(|| {
    toml::from_str(TOML).unwrap()
  })
}
```

This also works but I don't really love it because almost all of the fields of our structs
are strings, meaning we have some data duplication. Also, trying to get `serde` to avoid allocation
on arrays is not as simple as I had hoped.

This approach also works best with a single input which is going to be a bit of a headache to edit.
An alternative might be to manage a bunch of `include_str` calls to assign `const` variables for
each file which is something I didn't really want to do. 

What if it was possible to combine the inline constructors and the serialized files?

I ended up reaching for a build script, which in Rust has a _ton_ of power, some might say too much
but I think it works fairly well for the goals I've outlined.

To start, I created a directory structure for organizing the information.

To start, there should be a root `info.toml` which would include the data displayed on the home
page. Next would be a `jobs.toml` which I started with a single file but that started to get too
complicated so to break that up, I thought the `Detail`s would be a good place to break. That would
mean `jobs.toml` would include something like.

```toml
# jobs.toml
[[workplace]]
name = "some job"
title = "software monkey level 2"
start = "Mar. 2020"

[[workplace]]
name = "some other job"
title = "software monkey"
start = "Jan. 2018"
end = "Feb. 2020"

```

That would be a very easy to manage, so then now to associate the details with a job? I settled
on the approach of having a directory that would hold a file per `Detail`. To keep things organized
I thought it would be helpful to keep these in their own directory named `job_details`.

```console
$ tree ./data
./data
├── jobs.toml
└── job_details
      ├── some job
      │     ├── detail1.toml
      │     └── detail2.toml
      └── some other job
            ├── detail1.toml
            └── detail2.toml
```

Where the `detail*.toml` might look like.

```toml
# detail1.toml
headline = "Developed software",
snippet = "I wrote some code",
detail = """nothing to see here
I just typed into a keyboard
and the computer did some magic.
"""
```

This seems like it would be easy for me to manage and has the added benefit of removing
distractions of either other jobs or details.

Similar for Open source, a top level oss.toml can collect the project/organizations while
using directories to break the details up.

```toml
# oss.toml
[[project]]
name = "Some OSS Organization"
short_desc = "Things I developed in the open."
long_desc = """This organization has a dedicated purpose that is outlined here.

On may lines, with a lot of details.
"""

```

which would have a `oss_details/Some OSS Organization` directory with sub-projects defined in their
toml files.

```toml
# oss_details/Some OSS Organization/project1.toml
name = "Project1"
short_desc = "A single part of the organization"
long_desc = """
A longer description of the project and/or process of development
"""
```

Lastly, the education details will live in an `edu.toml` file.

```toml
# edu.toml
[[school]]
name = "Some School"
graduated = "3030"
desc = "Bachelor of Internet"
```

Ok, so then we need a build script that will slurp up this data and deserialize it at build time. To
do that, I wrote some structs in the build file that look nearly identical to the ones defined above
which is probably the biggest draw-back that I need to maintain two versions of these structures.

So, the build script will read these files, deserialize them and then use `syn` and `quote` to 
generate some rust code where all of the properties are filled in by the deserialized content.
This code is then emitted to a temporary file that only exists in the `target` directory and is
included in the project via

```rust
include!(concat!(env!("OUT_DIR"), "/source_data.rs"));
```

This feels like a good balance to me between a dynamic data source and an easy to package binary.

Next I started looking at how to distribute this "resume", and thankfully the folks at
[axo.dev](https://axo.dev/) have a wonderful tool named
[`cargo dist`](https://opensource.axo.dev/cargo-dist/) which makes packaging and distributing
Rust CLI applications a breeze!

To start, running `cargo dist init` in the root of the project will ask some questions about how you
want to build/distribute the application. I chose to use github-actions CI and github releases/git
tags to do this. Once you've answered those questions running `cargo dist generate` will create a
`.github/workflows/release.yml`. This will run a build for you on pushes and PRs but if the
triggering event is a new tag will package your binaries and upload them to the release page.

When coupled with their tool `oranda` which has a similar flow, run `oranda init` and
`oranda generate` will create a new github workflow that automatically publishes a static site with
the install instructions for your application. This makes the whole process incredibly easy, kudos 
to the Axo devs!

After getting that to work reliably, I noticed that the `ratatui` crate supports web-assembly and
thought it might be fun to put the TUI on a website as a preview. I was able to coble together a
version using [xterm](https://xtermjs.org/) on a static site.

If you're curious about any of this, here are some links

- [Github Repo](https://github.com/FreeMasen/resume-tui)
  - the `browser` sub-crate has the wasm wrapper using xterm for ratatui
- [Oranda Page](http://gh.freemasen.com/resume-tui/)
- [WASM Preview](http://gh.freemasen.com/resume-tui/live-preview/)
