+++
title = "Understanding Binary, Pt 1"
date = 2018-03-27
[extra]
snippet = "A guide to understanding binary from a programmer's perspective"
+++

If you have been interested in computers for any length of time, someone has probably told you that computers “think” in binary. I am going to try and explain what that means and why you should care. 

## Quick Definition

As humans, we typically count in base 10 which means that every position can have up to 10 different values (0-9). A binary number system each position would only have up to 2 different values, zero or one. To deal with this limitation, a system for counting was created where each position has a value assigned to it and the total is calculated by adding all of values where the position was 1. 

To illustrate how this works, consider this table:

{{ counter() }}

If you click on any of the cells in the second row, it will add the number in the header to the total value. You can also click the `start counting` button to watch it count from 0 to 255.

An interesting thing to point out is that each value is exactly 1 greater than all of the values to the right of that value.


```
1 + 2         =  3 =  4 - 1
1 + 2 + 4     =  7 =  8 - 1
1 + 2 + 4 + 8 = 15 = 16 - 1
```
 It is also true that as you move left, the number always doubles.

```
2 = 1 * 2
4 = 2 * 2
8 = 4 * 2
```

So, now that we have a working understanding of how to count in binary, Let's see how to use this information in a more useful manner.

Far before my time, the computer community decided that 8 was a good number to use as a building block. You have probably heard that there are 8 bits in a byte. If we consider the table above, each of the columns would represent one bit meaning that the whole table represents one byte. Most of the examples below will be 8 bit numbers, however there may be 16 bit number examples as well, just be aware that the same concept applies to both 16 bit numbers are just able to get a lot larger than 255. 

## Making this useful

So now that we all understand how binary numbers are constructed, let's make this new knowledge useful. My favorite use of this information is creating `Bit Flags`, which is when you assign meaning to each of the numbers in the headers of the table above. Because each of the numbers represents one of the bit positions, we now can use any combination of these numbers and get a unique value. Let's use this example.

```rust
//JobState Big Flags
const new_job = 1;
const assigned_job = 2;
const in_progress_job = 4;
const complete_job = 8;
const reopened_job = 16;
const archived_job = 32;
```

Since we used these special values to represent our `JobState` these values are no longer mutually exclusive. We could have a state that is a `complete_job` and also a `reopened_job` by using the value 24 (0001 1000) or a state that is both an `assigned_job` and an `in_progress_job` by using the value 6 (0000 0110). We are essentially representing a collection of things with a single number. 

The ability leverage this information is going to come with some special binary operations.

## Binary Operators

Since all numbers in programming languages boil down to binary, we have access to some powerful ways to combine numbers beyond add, subtract, multiply and divide. The first one I want to cover is referred to a `bit shifting`.

### Bit Shifting

Bit shifting is when we take all of the bits for a number and move them either left or right. Since each bit has a value twice the size of its right neighbor, it leads to some pretty interesting results. Bit shifting is typically noted with the operators `<<` and `>>` each pointing in the direction of the shift. Here are some examples of what bit shifting looks like, note: the binary representation is above the base 10 for each example.

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

To use our `JobState` bigflag example, we can use this operator to move this job from one state to the next.

```rust
job_state = new_job;
job_state = job_state << 1;
//job_state == assigned_job
job_state = job_state << 1;
//job_state == in_progress_job
job_state = job_state << 1;
//job_state == complete_job
job_state = job_state >> 3;
//job_state == new_job
```

I put together this little tool to illustrate this a little more interactively, it is setup for 16 bit numbers but the concept is the same.

{{ shifter() }}

### Bitwise Or

Up next, we have the `Bitwise or` operation. When we use this operation what we are doing is taking all of the 1 bits from two numbers to create a new number. This operation is typically noted with the `|` operator, commonly refered to as a pipe character. Here are a few examples, again the binary is on top, the base 10 is below it.

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

At first, it almost looks like we are getting the same result that `+` would but look at the last example. The left most bit is 1 for both numbers but 128 will only be included in the result once for our `|` while a `+` would include 128 twice (resulting in 328).

We can use this to combine two of our job_states.

```rust
job_state = reopened_job | assigned_job;
//job_state == 18
```

Now we can easily represent jobs that are in multiple states without having to define new states for the combination which could get out of hand. Look at how much larger our list of states becomes when we do this explicitly.

```rust
const new_job = 1;
const assigned_job = 2;
const new_assigned_job = 3;
const in_progress_job = 4;
const new_inprogress_job = 5
const assigned_in_progress_job = 6
const new_assigned_in_progress_job = 7
const complete_job = 8;
const new_complete_job = 9;
const assigned_complete_job = 10;
const new_assigned_complete_job = 11;
const in_progress_complete_job = 12;
const new_in_progress_complete_job = 13;
const assigned_in_progress_complete_job = 14;
const new_assigned_in_progress_complete_job = 15;
const reopened_job = 16;
const new_reopened_job = 17;
const assigned_reopened_job = 18;
const new_assigned_reopened_job = 19;
...
```

That is significantly more complicated, and the effort to some extent is wasted since it wouldn't make sense to have a new job that is also in progress or a job that is in progress and complete.

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

This allows us to check if a job is in a paticular state.

```rust
job_state = reopened_job | assigned_job;
if job_state & assigned_job > 0 {
    //put this job in the assignee's queue
}
```

In the above example we are trying to combine the job_state with our `assigned_job` constant using a `bitwise and` and then testing if that value is greater than 0. Since the result will only include 1 bits where both sides have a 1 bit we would get 0 if `job_state` did not include `assigned_job` otherwise we would get `assigned_job`.

Here is a little tool to illustrate how both And and Or work.

{{ andor() }}

### Binary Not

Another powerful tool is the ability to reverse any binary representation this is done through the `binary not` operation, typically noted with the `~` operator.

```
8    = 0000 1000
~8   = 1111 0111
136  = 1000 1000
~136 = 0111 0111
```

This makes it easy to check if a job is not in a specific state.

```rust
job_state = archived_job | complete_job;
if job_state & ~new_job > 0 {
    //deal with this old job
}
```

In all honesty, this isn't as useful since we could just check if `job_state | new_job == 0` and get the same result but it is another option. It could also be useful if we needed to invert a flag entirely, our job state example might not be the best practical use but consider the following.

```rust
const step1 = 1;
const step2 = 2;
const done = 4;
//start the activity
let mut activity = step1; //1
//move to the next step but keep the step1 bit for audit purposes
activity = activity | step2; //3
//complete activity and clear audit trail
activity = ~activity; //4
```

{{ binaryNot() }}


### Binary Xor

This last operation we are going to cover is `Xor` which is typically noted with the `^` operator. This operation is going to take two numbers and create a new number where the 1 bits are only on one side or the other but not both. 

```
1010 1010 ^ 0101 0101 = 1111 1111
   170    ^     85    =    255
1111 1111 ^ 0101 0101 = 1010 1010
   255    ^     85    =    170
1100 0000 ^ 1000 1000 = 0100 1000
   192    ^    136    =    72
```

We can use flip a bit to the oposite of its current value.

```rust
job_state = complete_job
job_state = job_state ^ complete_job;
//job_state & complete_job == 0
job_state = job_state ^ complete_job;
//job_state & complete_job == complete_job
```

While not the most useful thing, it for sure has its place. Here is an interactive tool to go along with this one.

{{ xor() }}

## Some userful features

Now I want to go over some things that might be language dependant. Make sure you read your documentation to see how these things might work in your language of choice.

### Bitflag Enum

A good number of languages allow you to create an `enum` variant that offer the same benefits we just went over. Often this variant can be created by using some sort of annotation, for example in c# allows you to do the following.

```c#
[Flags]
enum JobState {
    New = 1,
    Assigned = 2,
    InProgress = 4,
    Complete = 8,
    ReOpened = 16,
    Archived = 32
}
```

Which could be use like this.

```c#
if (job_state & JobState.Complete > 0) {
    //deal with a complete job
}
```

This can go a long way to making your code more readable.

### Assign operations

Most languages allow any operator to be combined with a trailing `=` to allow for performing an operation with a value and also assigning it to that value, think of `+=`. If we look at our `xor` example from above we can see it makes things nice a concise.

```
job_state = complete_job
job_state ^= complete_job;
//job_state & complete_job == 0
job_state ^= complete_job;
//job_state & complete_job == complete_job
```

## Conclusion

That wraps up this whirl-wind tour of binary's uses in general programming. Hopefully now you have some ideas about what you could use this for in your next project, it can feel intimidating at first but very powerful once you get the hang of it.

Next in this series will be an overview of how numbers are represented in binary, so stay tuned!