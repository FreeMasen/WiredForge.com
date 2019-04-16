+++
title = "Using Wasmer for Plugins Part 3"
date = 2019-05-30
draft = true
[extra]
snippet = "Now with more ease"
image = "rust-logo-blk.png"
date_sort = 20190530
image_desc = "Made by Freepik from www.flaticon.com, licensed by CC-3.0-BY"
+++

In the last two posts of this series we covered all of the things we would need to use [`Wasmer`](http://wasmer.io) as the base for a plugin system. In [part one](/blog/wasmer-plugin-pt-1/index.html) we went over the basics of passing simple data in and out of a web assembly module, in [part two](/blog/wasmer-plugin-pt-2/index.html) we dug deeper into how you might do the same with more complicated data. In this part we are going to how we might ease the experience for people developing plugins for our application. After we get though easing that experience we will cover a couple of larger and more realistic examples.

