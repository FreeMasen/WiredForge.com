+++
title = "LLVM IR Pt. 2"
date = 2024-01-01
draft = true
[extra]
snippet = "Playing around with LLVM IR a little more"
+++

In the [last post](@/blog/llvm_ir.md) we covered some basics of the LLVM-IR language ultimatly
writing a program that would print `"hello world!"` 5 times and exit. In this post, we are going to
start to dig into two major parts of the type system, `ptr`s and structs.

Before we dig in, I want to add 1 new piece of syntax and that is comments. LLVM-IR comments start with
a `;` character and continue to the end of the line. I am going to start using comments in the code blocks
to help localize the description of each operation. Just as an example, here is our last example with
comments describing each line.

```llvm
; Import the libc function `printf`
declare i32 @printf(ptr, ...)
; Declare a global variable byte array with our string
@hw = global [ 14 x i8 ] c"Hello World!\0A\00"

; Define a C-Style main function
define i32 @main() {
entry:
    ; Always jump to `looptop` (this makes the phi instruction work)
    br label %looptop
looptop:
    ; Assign iter with the current index in our loop
    %iter = phi i32 [0, %entry], [%next, %loopbody]
    ; Check if we have reached the number 5
    %done = icmp eq i32 %iter, 5
    ; If we have reached 5, jump to `succ` otherwise jump to `loopbody`
    br i1 %done, label %succ, label %loopbody
loopbody:
    ; Call `printf` assigning the return value to `ret`
    %ret = call i32 @printf(ptr @hw)
    ; Check if `ret` was 13
    %success = icmp eq i32 %ret, 13
    ; Compute the next index by adding 1 to `iter`
    %next = add i32 %iter, 1
    ; If `printf` failed, jump to `fail` otherwise jump to `looptop`
    br i1 %success, label %looptop, label %fail
succ:
    ; Return the success exit code
    ret i32 0
fail:
    ; Return the number of bytes written by `printf` as our exit code
    ret i32 %ret
}
```

Hopefully this will help make some of the code easier to follow.

Now, let's get started learning a little bit about pointers. In our last example, we used a `phi`
instruction to allow us to emulate an incrementing loop but sometimes `phi` instructions are hard to
follow so let's re-write our loop to use a stack allocated pointer instead of a `phi`.

```llvm
; ./b.ll
declare i32 @printf(ptr, ...)
@hw = global [ 14 x i8 ] c"Hello World!\0A\00"

define i32 @main() {
entry:
    ; Allocate a chunk of stack memory the size of an i32 and
    ; assign it to `i`
    %i = alloca i32
    ; store the initial value 0 in `i`
    store i32 0, ptr %i
    br label %looptop
looptop:
    ; Load the current value of `i` into the variable `iter`
    %iter = load i32, ptr %i
    %done = icmp eq i32 %iter, 5
    br i1 %done, label %succ, label %loopbody
loopbody:
    %ret = call i32 @printf(ptr @hw)
    %success = icmp eq i32 %ret, 13
    %next = add i32 %iter, 1
    ; Overwrite our last `iter` with our next `iter` value
    store i32 %next, ptr %i
    br i1 %success, label %looptop, label %fail
succ:
    ret i32 0
fail:
    ret i32 %ret
}

```

<blockquote>
Note: I've only commented the lines that have changed
</blockquote>

This update has introduced 3 new instructions, `alloca`, `store`, and `load` each for interacting
with pointers. First, `alloca` allocates a chunk of stack memory, the memory provided by an `alloca`
is always deallocated at the end of the function it is a part of. This means it's important we don't
return the result of `alloca` from our function but internally we can use it freely. The only
required argument for this new instruction is a type which will be used to determine how big the
memory chunk should be (in our case 32 bits).

After we `alloca`, we then need to store some value in that variable, to do that we use the `store`
instruction. `store` takes 2 required arguments, the first is the value to store with its type and
the second is the destination to store that value. For the code above, the value is `i32 0`
initially and then `i32 %next` at the bottom of each loop iteration and the destination is `ptr %i`,
notice that the type of `i` is `ptr`.

Lastly, the `load` instruction, this is how we can load a value that is stored behind a pointer.
`load` takes 2 arguments, the first is the type of the value and the second is a `ptr`.
