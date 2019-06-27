+++
title = "RESS 0.7.0!"
draft = false
date = 2019-06-26
[extra]
image = "rust-ecma.svg"
image_desc = "Rusty ECMA"
snippet = "So much has changed"

+++

Over the past month or two I have spent a large amount of my free time trying to improve ress's (Rusty EcmaScript Scanner) performance. As of today, version 7.0.0 does that and so much more! 

Because I am too excited about the performance wins in this release, we are going to start that. The table below is a side by side comparison of the 6.x.x version of ress and 7.0.0, things got a lot faster, 28 times faster on average! 

| Name                        | Old bench | New bench | Old +/- | New +/- |
| :------------               | -----------: | -----------: | ------: | ------: |
| angular.js                  |      229.510 |       11.125 |   0.312 |   0.058 |
| angular.js (min)            |      175.290 |        5.653 |   0.493 |   0.062 |
| jquery                      |      109.447 |        4.213 |   0.231 |   0.009 |
| jquery (min)                |       89.959 |        2.825 |   0.227 |   0.031 |
| react                       |       29.917 |        1.201 |   0.091 |   0.030 |
| react (min)                 |       11.300 |        0.370 |   0.035 |   0.001 |
| react-dom                   |      233.810 |        9.144 |   0.443 |   0.015 |
| react-dom (min)             |       98.406 |        3.198 |   0.189 |   0.003 |
| vue.js                      |      135.810 |        5.251 |   0.296 |   0.034 |
| vue.js (min)                |       95.597 |        2.988 |   0.187 |   0.019 |
| everything.js es5           |        3.163 |        0.099 |   0.004 |   0.001 |
| everything.js es2015-script |        5.690 |        0.174 |   0.020 |   0.002 |
| everything.js es2015-module |        6.121 |        0.212 |   0.013 |   0.004 |

> Benchmarks performed on a Ryzen 7 3.2GHz 8 Core, 32Gb RAM, Ubuntu Disco (pop!_os)

A big part of this is do to a big re-write in the underlying tokenization mechanism, previously ress was using a wonderful parser crate called [combine](https://github.com/Marwes/combine), I was very sad to remove this dependency but I really don't think I was using it correctly and it ended up being a lot simpler to build a custom tokenizer (also lots of fun).

With this new tokenizer comes a few more ease of life improvements. First I have re-worked the Punct enum to have a more consistent and memorable naming scheme. No longer would you need to remember what I called DoubleAmpersand (LogicalAnd previously) vs Ampersand (BitwiseAnd previously) now they represent the actual characters.

The next big change is the addition of the SourceLocation (line/column start and end) of any given token. Where previously you would need to calculate that information after it was parsed, it now just comes for free!

Now the Token enum is generic, this makes things far more flexible, it also removes the need for the RefToken enum (which never had any references anyway). Now, the Scanner will return `Token<&str>` though there are a bunch of shared impl's for `Token<String>`. 

The Scanner is now a failable iterator (meaning it returns `Option<Result>` on calls to next), instead of panicking when encountering something strange it will return an Err with much nicer error messaging.


Another big win came from re-working the regular expression detection logic. Javascript is a pretty strange language at the syntax level, probably the strangest of all parts of the language is that you can divide anything by anything. For example the following is valid.

```js
let x = function why() {} / 100; //x === NaN
```
I'm not entirely sure why but because of this, it is hard to know if a `/` means that start of a regular expression literal or the middle of division. To see the rules about it I highly recommend [this writeup](https://github.com/sweet-js/wiki/design). Previously, the Scanner kept the complete history of starts and ends of all tokens found, it would then use these to re-parse specific parts to determine if it met the criteria. Both the cost of keeping that much data around and the cost of re-parsing made things move pretty slow. All of this has been re-worked to use two 3 element arrays that work sort of like queues. This makes things nice and fast!

The last change I want to include here is that there are now tests that validate everything is getting parsed as expected. Specifically I worked through the 3 files in the wonderful [everything.js](https://github.com/michaelficarra/everything.js), and created tests that validate each. Which means that making changes is a lot less risky.

I can't tell you how excited I am to share this! I hope you enjoy!

