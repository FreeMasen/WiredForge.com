+++
title = "LLVM IR Pt. 2"
date = 2024-01-01
draft = true
[extra]
snippet = "Playing around with LLVM IR a little more"
+++

In the [last post](@/blog/llvm_ir.md) we covered some basics of the LLVM-IR language ultimately
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
    ; if we've just come from the `entry` block `iter`
    ; will be `0`, if we've come from the `loopbody`
    ; block `iter` with be one more than the previous
    ; pass through
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
`load` takes 2 arguments, the first is the type of the value and the second is a `ptr` (in our case `i`).

These instructions are going to be valuable when working with structs since structs are almost always
behind a pointer in LLVM-IR. So, how do we declare a struct?

```llvm
; Data type representing a location in 3 dimensions
%Vec3 = type { i32, i32, i32 }
```

Interestingly, we use the same syntax for local variables as we do for named structs, this is
because named structs are _technically_ just an alias for the literal struct syntax. We can use the
`type` keyword followed by each of the property types surrounded by curly braces. The above code
then defines a struct named `Vec3` that has 3 properties, each of which are an `i32`.

There isn't any syntax to allow for creating a struct, instead we have to use `alloca`, a typical
pattern is to provide a function that will initialize a pointer to a struct with some defaults.

```llvm
; Data type representing a location in 3 dimensions
%Vec3 = type { i32, i32, i32 }

; Initialize a Vec3 with 0 for each property
define void @init_vec3(ptr %vec3) {
entry:
    ; TODO: fill this in
    ret void
}

define i32 @main() {
entry:
    ; Allocate a chunk of memory the size of %Vec3 on the stack
    %vec3 = alloca %Vec3
    call void @init_vec3(ptr %vec3)
    ret i32 0
}
```

With that, we now have a valid llvm-ir program that allocates a chunk of stack memory for our `Vec3`
and passes the pointer off to be initialized. Before we can dig in on `init_vec3` we need to go over
a new instruction `getelementptr`. This instruction is the primary way to interact with th members
of a struct, array or vector. Let's start by actually writing one out and then we can go over each
of the arguments.

```llvm
; Data type representing a location in 3 dimensions
%Vec3 = type { i32, i32, i32 }

; Initialize a Vec3 with 0 for each property
define void @init_vec3(ptr %vec3) {
entry:
    ; Get a pointer to the first field of the provided %Vec3
    %x_ptr = getelementptr %Vec3, ptr %vec3, i32 0, i32 0
    ret void
}

define i32 @main() {
entry:
    %vec3 = alloca %Vec3
    call void @init_vec3(ptr %vec3)
    ret i32 0
}
```

The new line we've added to `@init_vec3` is using `getelementptr` to get a pointer to the first
property of our struct. The first two arguments are pretty straight forward, the first is the type
our pointer represents and the second is the pointer. The third argument is where things start to
get a little confusing because LLVM-IR views pointers in the same way the C views pointers, any
pointer _can_ be the first element in an array. The 3rd argument is actually which element in this
potential array do we want to access but for non-array pointers this will always be `i32 0`. Finally
the 4th argument is the 0-based index for the property we want to access.

Ok, so now we have a pointer to the `x` property of our `Vec3`, that means we can use the `store`
instruction to set that value. While we're at it we can add the other 2 properties as well.

```llvm
; Data type representing a location in 3 dimensions
%Vec3 = type { i32, i32, i32 }

; Initialize a Vec3 with 0 for each property
define void @init_vec3(ptr %vec3) {
entry:
    ; Get a pointer to the `x` property
    %x_ptr = getelementptr %Vec3, ptr %vec3, i32 0, i32 0
    ; Store the default value to `x`
    store i32 0, ptr %x_ptr
    ; Get a pointer to the `y` property
    %y_ptr = getelementptr %Vec3, ptr %vec3, i32 0, i32 1
    ; Store the default value to `y`
    store i32 0, ptr %y_ptr
    ; Get a pointer to the `z` property
    %z_ptr = getelementptr %Vec3, ptr %vec3, i32 0, i32 2
    ; Store the default value to `z`
    store i32 0, ptr %z_ptr
    ret void
}

define i32 @main() {
entry:
    %vec3 = alloca %Vec3
    call void @init_vec3(ptr %vec3)
    ret i32 0
}
```

But, right now we don't have a way to inspect our code to confirm it is working the way we want
so we should add a helper to print a `%Vec3`.

```llvm
declare i32 @printf(ptr, ...)

; Define the format string for `printf`
@fmt = global [ 14 x i8 ] c"[%i, %i, %i]\0A\00"

; Data type representing a location in 3 dimensions
%Vec3 = type { i32, i32, i32 }

; Initialize a Vec3 with 0 for each property
define void @init_vec3(ptr %vec3) {
entry:
    %x_ptr = getelementptr %Vec3, ptr %vec3, i32 0, i32 0
    store i32 0, ptr %x_ptr
    %y_ptr = getelementptr %Vec3, ptr %vec3, i32 0, i32 1
    store i32 0, ptr %y_ptr
    %z_ptr = getelementptr %Vec3, ptr %vec3, i32 0, i32 2
    store i32 0, ptr %z_ptr
    ret void
}

; Print a `%Vec3` to stdout as `[x, y, z]`
define void @print_vec3(ptr %vec3) {
entry:
    %x_ptr = getelementptr %Vec3, ptr %vec3, i32 0, i32 0
    %x = load i32, ptr %x_ptr
    %y_ptr = getelementptr %Vec3, ptr %vec3, i32 0, i32 1
    %y = load i32, ptr %y_ptr
    %z_ptr = getelementptr %Vec3, ptr %vec3, i32 0, i32 2
    %z = load i32, ptr %z_ptr
    call i32 @printf(ptr @fmt, i32 %x, i32 %y, i32 %z)
    ret void
}

define i32 @main() {
entry:
    %vec3 = alloca %Vec3
    call void @init_vec3(ptr %vec3)
    call void @print_vec3(ptr %vec3)
    ret i32 0
}

```
