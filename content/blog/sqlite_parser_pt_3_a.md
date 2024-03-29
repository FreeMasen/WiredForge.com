+++
title = "SQLite Parser Pt. 3 Correction!"
date = 2022-11-06
draft = false
tags = ["sqlite", "integer-storage", "decoding"]
[extra]
snippet = "We all miss stuff sometimes"
+++

This is a correction to the third part in a series of posts describing the process of building a
SQLite file parser. If you haven't read part 3, the correction has already been made on
[that page](@/blog/sqlite_parser_pt_3.md) feel free to just hop over there. If you have been following
along, you will want to re-visit
[this new section](@/blog/sqlite_parser_pt_3.md#incremental-vacuum-correction) because I missed a value
in our database file header. The issue is that instead of the application id being at bytes 64
through 68, it is actually at bytes 68 through 72. This means that call to `validate_reserved_zeros`
was validating too many bytes.

A small code change to include this new value has also been made in [part 4](@/blog/sqlite_parser_pt4.md)

A huge thank you to github user [Neopallium](https://github.com/Neopallium) for opening an [issue](https://github.com/FreeMasen/WiredForge.com/issues/49) to point this out.
