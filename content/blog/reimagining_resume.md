+++
draft = true
title = "Re-imagining My Resume"
date = 2024-12-17
+++

Earlier this year a collegue shared a game animator's project that re-imagine's their resume as a 2d
game. I thought this was such a cool idea that I wanted to see if I could come up with an idea that
would work for my own resume to highlight the type of work I do. I've been in my current role for
past 4ish years and that work has been a lot more "systems programming" than all of my previous
roles and I have been lucy enough to write almost exclusively Rust. From my experience, system
programmers and Rustaceans love CLI tools, so why not try an build a TUI (text user interface) as an
interactive version of my resume.

To start, I wanted to make sure that this would be something easy to modify and install. To be easy
to modify I expected that the contents displayed in the TUI would need to be defined outside of any
`.rs` files but to be easy to install, all that data would need to be included in the binary itself.
With those two goals in mind, I started thinking through what structs I might need to render the
contents of a resume. At the top level, we are going to want to capture some information about the
author.

```rust
pub struct Author {
    /// The author's name
    pub name: String,
    /// A phrase to set the author apart
    pub tag_line: String,
    /// The author's github username
    pub github: String,
    /// the author's linkedin username
    pub linkedin: String,
}
```

That seems like it should do, next we will want to be able to represent professional experience.

```rust
pub struct Workplace {
    /// The company name
    pub company: String,
    /// The job title of the author
    pub title: String,
    /// The start date
    pub start: String,
    /// The end date
    pub end: Option<String>,
    /// A list of highlights from this job
    pub highlights: Ve<Highlight>,
}

pub struct Highlight {
    /// A very short description
    pub headline: String,
    /// A slightly longer description
    pub short_desc: String,
    /// A very long description
    pub long_desc: String,
}
```

We also probably want to represent open source contributions.

```rust
pub struct Project {
    /// The name of the project/organization
    pub name: String,
    /// A short description of the project
    pub short_desc: String,
    /// A long description of the project
    pub long_desc: String,
    /// Any sub-projects worth highlighting
    pub sub_projects: Vec<Project>,
}
```

This one is a little more complicated since I wanted to be able to represent both projects and
organizations, so the struct is recursive, this allows outlining both projects in one's personal git
repository account and also work on an organization. Lastly we probably want to represent education.

```rust
struct School {
    /// The institution name
    pub name: String,
    /// A description of the study/credential
    pub description: String,
    /// Graduation date if completed
    pub graduated: Option<String>,
}
```

Now, we should add those to the `Author` struct.

```rust
pub struct Author {
    /// The author's name
    pub name: String,
    /// A phrase to set the author apart
    pub tag_line: String,
    /// The author's github username
    pub github: String,
    /// The author's linkedin username
    pub linkedin: String,
    /// The author's employment history
    pub jobs: Vec<Workplace>,
    /// The author's open source contributions
    pub oss: Vec<Project>,
    /// The author's education
    pub education: Vec<School>,
}
```
