+++
draft = true
title = "Understanding Binary, Pt 2 number formats"
date = 2018-08-01
[extra]
snippet = "A guide to understanding binary from a programmer's perspective"
[[series]]
title = "Understanding Binary, Pt 1"
link = "/blog/binary_series/binary-pt1/index.html"
+++
In the last post of this series we covered the basic concept of how to count in binary, in truth we only covered one type of number; the unsigned 8 bit integer. Unsigned integers are whole number who's value is always positive. Using this type of number is a great place to start for learning how binary and more human friendly concepts intersect but what happens if you need to represent a negative number or a number bigger than 255? Hopefully by the end of this post you will be able to answer both of those questions.

As a refresher, lets look at our 8 bit unsigned integer (u8) again. Each u8 will be represented by 8 positions, each position will be either a 1 or a 0, moving right to left each position will represent 2x the number on its right (starting with 1 and ending with 255). Consider this table.

{{ counter() }}

Clicking on any of the lower row's cells will update the number in the total column by adding the value in the top row's cell. This way we can construct any value from 0 to 255. if that quick refresher didn't cover it head over to the first post in this series and hopefully it will jog your memory.

With that out of the way, now we can start to complicate things.

## Endianness

The first thing that I want to cover is the concept of larger unsigned integers which means we need to talk about `endianness`. Since the byte is a convenient little package, most programming languages interpret arbitrary data as a collection of u8s. So if we wanted to represent 256 we would need 2 bytes, but what order do we put those bytes in? If we just extended the examples from before it might look like this.

```
   256        0
0000 0001 0000 0000
```

However, this isn't always the case, the above example would be referred to as a big-endian 16bit unsigned integer since the larger valued u8 is to the left of the smaller valued u8, though the same value can be represented as little-endian which would just flip the position of each u8.

> fun fact, the term endian comes from the story Gulliver's Travels

```
    0        256
0000 0000 0000 0001
```

That is super confusing, right? The story goes that in the early days of computing, some people believed one way was right and some the other. [It was very much a sneeches kind of situation](https://www.ietf.org/rfc/ien/ien137.txt). Today, we live in a world where most of this is entirely abstracted away from us, unless you are writing low level networking code or reading in arbitrary data in a program most of the time you don't need to think about it but that's not why were here.

The tool below is an interactive example of how the same set of 2 u8s would be represented as either Big-Endian (BE) or Little-Endian (LE).

{{ endian() }}

The main take away here is how to interpret this when you see it in documentation. If you were reading the [SQLite File format document](https://sqlite.org/fileformat2.html#the_database_header) you would see that they store multi-byte integers in the file's header as big endian.

## A tale of two's complement

The other major question that was posed was how to represent negative numbers, for this I am going to cover one method which is referred to as `two's complement`.

If you look up the definition of `two's complement` you get the following. This is taken directly from the [wikipedia page](https://en.wikipedia.org/wiki/Two's_complement)

> The two's complement of an N-bit number is defined as its complement with respect to 2<sup>N</sup>. For instance, for the three-bit number 010, the two's complement is 110, because 010 + 110 = 1000

Personally, that definition seems like non-sense. Especially when you continue on.

> If the binary number 010<sub>2</sub> encodes the signed integer 2<sub>10</sub>, then its two's complement, 110<sub>2</sub>, encodes the inverse: -2<sub>10</sub>. In other words, to reverse the sign of any integer in this scheme, you can take the two's complement of its binary representation.

I simpler way to think about this that you are counting in both directions, the left side will be negative and the right side will be positive. This slider might help illustrate that.

{{ twos_comp() }}

As you move the indicator, to the left, it will increase the unsigned value as expected. About half way through, the signed value will switch (specifically from 127 to -128. It then counts *up* to -1. Just for fun, here is the same counter from above but with the signed result as well. There are two buttons, one will run though the counter as before, the other will start at -128 and count up to 127.

{{ twos_counter() }}

At the end of the day, why does this matter? For the most part, it doesn't. Rarely will you need to think about this concept, however most modern programming languages use two's compliment to represent signed integers. That means, if a specification says it encodes signed integers using two's compliment, you can pretty much just cast from a unsigned to an signed.