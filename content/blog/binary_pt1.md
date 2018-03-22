+++
title = "Understanding Binary, Pt 1"
draft = true
date = "2018-1-10"
[extra]
snippet = "A guide to understanding binary from a programmer's perspective"
+++

If you have been interested in computers for any length of time, someone has probably told you that computers “think” in binary. I am going to try and explain what that means and why you should care. 

## Quick Definition

As humans, we typically count in base 10 which means that every position can have up to 10 different values (0-9). A binary number system each position would only have up to 2 different values, zero or one. To deal with this limitation, a system for counting was created where each position has a value assigned to it and the total is calculated by adding all of values where the position was 1. 

To illustrate how this works, consider this table:

<table id="binary-counting-table">
    <tr>
        <th>128</th>
        <th>64</th>
        <th>32</th>
        <th>16</th>
        <th>8</th>
        <th>4</th>
        <th>2</th>
        <th>1</th>
        <th>total</th>
    </tr>
    <tr>
        <td class="digit" id="128">0</td>
        <td class="digit" id="64">0</td>
        <td class="digit" id="32">0</td>
        <td class="digit" id="16">0</td>
        <td class="digit" id="8">0</td>
        <td class="digit" id="4">0</td>
        <td class="digit" id="2">0</td>
        <td class="digit" id="1">0</td>
        <th id="total">0</td>
    </tr>
</table>
<button id="start-counting">Start counting</button>
<script type="text/javascript" src="/js/binaryPt1.js"></script>

If you click on any of the cells in the second row, it will add the number in the header to the total value. You can also click the `start counting` button to watch it count from 0 to 255.

An interesting thing to point out is that each value is exactly 1 greater than all of the values to the right of that value.


```1 + 2 = 3 = 4 - 1
1 + 2 + 4 = 7 = 8 - 1
1 + 2 + 4 + 8 = 15 = 16 - 1
...
```
 It is also true that each number is twice the size of its right hand neighbor (baring the first position).

```
2 = 1 * 2
4 = 2 * 2
8 = 4 * 2
...
```

Even if that doesn't seem very interesting, I promise it will at least be useful as we move forward. 

So, now that we have a working understanding of how to count in binary, Let's see how to use this information in a more useful manner.

Far before my time, the computer community decided that 8 was a good number to use as a building block. You have probably heard that there are 8 bits in a byte. If we consider the table above, each of the columns would represent one bit meaning that the whole table represents one byte. Most of the examples below will be 8 bit numbers, however there may be 16 bit number examples as well, just be aware that the same concept applies to both 16 bit numbers are just able to get a lot larger than 255. 

## Binary Operators

Since all numbers in programming languages boil down to binary, we have access to some powerful ways to combine numbers beyond add, subtrackt, multiply and divide. The first one I want to cover is referred to a `bit shifting`.

### Bit Shifting

Bit shifting is when we take all of the bits for a number and move them either left or right. Since each bit has a value twice the size of its right neighbor, it leads to some pretty interesting results. Bit shifting is typically noted with the operators `<<` and `>>` each pointing in the direction of the shift. Here are some examples of what bit shifting looks like, note the binary representation is above the base 10 for each example.

```
0000 0001 << 1 = 0000 0010
    1     << 1 =     2
0000 0010 << 3 = 0001 0000
    2     << 3 =    16
0001 0000 >> 1 = 0000 1000
   16     >> 1 =     8
0000 1000 >> 2 = 0000 0010
    8     >> 2 =     2
```

I put together this little tool to illustrate this a little more interactively, it is setup for 16 bit numbers but the concept is the same.

{{ shifter() }}

### Bitwise Or

Up next, we have the `Bitwise or` operation. When we use this operation what we are doing is taking all of the 1 bits from two numbers to create a new number. This operation is typically noted with the `|` operator, it might look familiar from writing if statements. Here are a few examples, again the binary is on top, the base 10 is below it.

```
0000 0001 | 0000 0010 = 0000 0011
    1     |     2     =     3
0000 0010 | 0001 0000 = 0001 0010
    2     |     16    =     18
0001 0000 | 0000 1000 = 0001 1000
   16     |     8     =     24
0000 1000 | 0000 0010 = 0000 1010
    8     |     2     =     10
1100 0000 | 1000 1000 = 1100 1000
   192    |    136    =    200
```

At first, it almost looks like we are just always doing the same that that `+` would do, but look at the last example. The left most bit is 1 for both numbers which but it will only be included in the result once, not twice.

### Bitwise And

Close friend of the `bitwise or` is `bitwise and`, two similar concepts but one major differece. The big difference with the `and` is that our result should only include the 1 bits from each number when both numbers have a 1. This operation is noted with the `&` operator. Here are a few more examples.

```
1010 1010 & 0101 0101 = 0000 0000
   170    &     85    =     0
1111 1111 & 0101 0101 = 0101 0101
   255    &     85    =     85
1100 0000 & 1000 1000 = 1000 0000
   192    &    136    =    128
```

