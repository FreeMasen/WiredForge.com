+++
title = "Resume TUI"
date = 2025-01-01
draft = true
+++

In the last couple of years I stumbled upon a
["resume"](https://github.com/JSLegendDev/2d-portfolio-kaboom) for a 2d animation designer and was
so taken by the concept of encoding my work experience using a medium that is also an example of my
work. For nearly 5 years now I have had the pleasure of writing Rust professionally so I thought a
Text User Interface (TUI) application might be a fun way to show off my experience. 

As I started to develop this application I reached for the [`ratatui`](https://ratatui.rs/)
crate to provide the TUI facilities and started to think about how I wanted to organize this information.

> TLDR
> [Install or Preview](http://gh.freemasen.com/resume-tui/)


I settled on a tab based layout with a side-bar on the left for the tabs and the following tabs

- Home: Name, tagline and links to Github, LinkedIn
- Work
  - At the top level a list of jobs
  - Each job should have a list of "details" describing the things I wanted to highlight
- Open Source Work
  - At the top level a list of Projects
  - Each Project should have a description
  - To Support Organizations, Projects should have an optional list of sub-projects
- Education: Just a list of schools with start/end dates

So, that would look something like this:

```plaintext
┌───Menu────┬─────────────────────────Home──────────────────────────┐
│Home       │                                                       │
│Work       │                                                       │
│Open Source│                                                       │
│Education  │                                                       │
│           │                                                       │
│           │                                                       │
│           │                                                       │
│           │                                                       │
│           │                                                       │
│           │                                                       │
│           │                                                       │
│           │                                                       │
│           │                                                       │
│           │                                                       │
│           │                                                       │
│           │                                                       │
│           │                                                       │
└───────────┴───────────────────────────────────────────────────────┘
```

Once that was in place I started to think about how to package both the data and the binary in one
easy to use package but I also didn't want to have to write out the content inline in code. I also
didn't want to have to lookup any files at runtime. 
