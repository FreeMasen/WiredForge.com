+++
title = "LLVM IR"
date = 2024-01-01
draft = true
[extra]
snippet = "Playing around with LLVM IR"
image = "bin.png"
date_sort = 20240101
image_desc = ""
+++

Over the past few months in my free time I have been trying to learn how to build a compiler
and as it stands today one of the easiest places to start is with [LLVM](https://llvm.org/).

A brief overview of LLVM is that it is a compiler framework that is designed very explicitly to be
modular. This means that the
[front-end, middle-end, and back-end](https://en.wikipedia.org/wiki/Compiler#Three-stage_compiler_structure)
are all just components that can be swapped in and out as needed. This means that a project author
could build just the part of the compiler that goes from source text into a format that LLVM's
middle and back ends can consume and they would get all the optimizations and target platform
support that LLVM's eco-system can provide.

[My initial project](https://github.com/FreeMasen/luminary) has been a toy front-end using the
[Lua programming language](https://www.lua.org/manual/5.3/) as the input format. After a few weeks
of learning I was able to get a very small sub-set of Lua compiling using the wonderful Rust library
[Inkwell](https://thedan64.github.io/inkwell/inkwell/debug_info/index.html). While Inkwell does a
great job making the process of interacting with the LLVM C-API from Rust, I found myself quite
often generating the LLVM IR text format to try and figure out why the code I was generating wasn't
working the way I expected. Along the way I became a little bit fascinated with the language itself
and I started a "playground" project to experiment with the semantics of the language and see how
much I could end up building with it and really ended up enjoying it way more that I had expected
so I thought I'd share what I've learned.

To start let's go over the tools we are going to be using to work with the LLVM IR. The two primary
CLI tools we are going to need are the interpreter `lli` and a linker `llvm-link`, a compiler `llc`
and lastly `clang` to do the work to get us a runnable executable. These unfortunately don't come
with the default llvm installs from package managers like `apt`, `brew` or `choco`, which means we
would need to build LLVM from source to get them included and that is a _huge chore_ since most
computers will take multiple hours to generate an LLVM build. Up until version 14 or so a noble
volunteer was doing that work for us and uploading them to the LLVM repository but unfortunately
that doesn't seem to be happening any more. If you want to avoid building LLVM, I have a
[github repo](https://github.com/FreeMasen/llvm-builds/releases) with a few versions available to
download. Once you have your llvm build in place, you'll probably want to add the `bin` directory to
your path which will allow us to use the above commands to build or execute our programs.

Now that we have our system setup to execute some code, let's go over the some basics of the
language. To start, llvm uses a special starting character to differentiate between variable
names and keywords, the two prefixes are `@` for global variables and `%` for local variables.
All functions are considered to be global variables so if we wanted to create a main function
it would look something like this.

```llvm
define i32 @main() {
    ret i32 0
}
```

There is actually quite a bit going on here even though this program does absolutely nothing. First
we have the keyword `define`, this will be used to define all the functions we will write, next we
have `i32` which is the return type for our function, the language is strongly typed but the type
system is both very small and very flexible. To start all integers are written `i<size>`, from
booleans as `i1`, to odd sizes like `i4` or `i256`. It is also worth noting that integers
aren't signed or unsigned.

So to overview, that first line above is declaring a c-style main function that returns a 32 bit
integer. Now the body of that function we encounter our first "instruction" `ret` which is
essentially the `return` keyword you might be familiar with from other languages, `ret` takes 1
argument, the value to return (note that the type of that value must be provided). Now, this program
does nothing but let's just get in the habit of using `lli`, we are going to assume the file above
is called `a.ll`

```shell
lli ./a.ll
echo $?
0
```

Now, if we update that to return a number other than 0, we should see that change.

```llvm
define i32 @main() {
    ret i32 1
}
```

this should produce the following

```shell
shell
lli ./a.ll
echo $?
1
```

Now, let's take a shot at the perennial favorite hello world program. First, we are going to need
a way to print something to the terminal, thankfully all of libc is available when we are using
`lli` so we can actually use `printf` from C's `<stdio.h>` but first we need to use a new keyword
`declare` to declare a function w/o providing the full definition. To add this declaration we'll
update our example to have a new line at the top.

```llvm
declare i32 @printf(ptr, ...)
```

This essentially imports this function into our module. There is one oddity about `printf` is that
it can take any number of arguments and we can use the `...` placeholder to indicate this.

Now that `printf` is imported, we want to declare our second global variable to hold our
hello world string.

```llvm
declare i32 @printf(ptr, ...)
@hw = global [ 14 x i8 ] c"Hello World!\0A\00"
```

We have a few new pieces of syntax in this addition, the first is the use of the `global` keyword,
which flags the following expression to define the global variable. The other new syntax is the
array, which uses the format `[ <size> x <type> ]` where `<size>` is the number of elements and the
`<type>` is any previously defined type, in this case we are declaring a 14 element array of 8 bit
integers. While llvm-ir doesn't have a string type, it does have a nice way to create an array of
bytes using the `c"..."` syntax, in our example we are defining a 14 byte array because
`Hello World!` is 12 bytes and then we need to add the `\0A` (`\n`) and `\00` (`NUL`) bytes
to the end, which is what `printf` will expect. With that out of the way, let's update our
`@main` function to use these two new additions.

```llvm
declare i32 @printf(ptr, ...)
@hw = global [ 14 x i8 ] c"Hello World!\0A\00"

define i32 @main() {
    call i32 @printf(ptr @hw)
    ret i32 0
}
```

Now we have our second instruction the `call` instruction which is used to call a function which
requires the type that function will return first and then the function name and any arguments that
might be required. For us the function is `@printf` which returns an `i32`, which we are ignoring.
The arguments to `@printf` is at least 1 pointer, here we are using the global we declared `@hw`,
notice we use the same type prefix we use for function declarations and definitions, `ptr @hw` but
why does `@hw` have the type `ptr`, we declared it with the type `[14 x i8]`, this is because all
global variables must be accessed as pointers. This may seem strange but the reason for this is that
typically compilers emit all global/static/constant values as part of the binary's `.data` section
so when we refer to the variable we are actually referring to the byte offset of the binary file.
To make this clear, let's compile our `a.ll` file into an object file using the following.

```sh
llc --filetype=obj ./a.ll
```

This is telling the llvm ir compiler to read in `a.ll` and output an object file, which should result
in a new file named `a.o` in the working directory. We can now use a tool like `objdump` to inspect the
contents of this binary. In our case we want to just read the `.data` section so we will pass
the argument `-j .data` to only show the section we care about and the `-s` flag to make sure it
outputs the entire contents of that section.

```sh
objdump -s -j .data ./a.o 

./blog/a.o:     file format elf64-x86-64

Contents of section .data:
 0000 48656c6c 6f20576f 726c6421 0a00      Hello World!..
 ```

Here we can see that that the data section contains 1 entry at the address `0000` with the
value `Hello World!` followed by 2 unrenderable characters (`\n\0`).

Now, our application is always exiting with the code `0` but what if we wanted to return the same
value that is provided by our call to `@printf`, this would mean we need to assign that value to a
variable. To do that we can use the `%` prefix used to name local variables and then refer to that
in our `ret` instruction. That would look something like this

```llvm
define i32 @main() {
entry:
    %ret = call i32 @printf(ptr @hw)
    ret i32 %ret
}
```

With those changes we are now returning the same value that `printf` would return, let's see what
that looks like when we run it!

```sh
lli ./a.ll
Hello World!
echo $?
13
```

So, it looks like our `printf` call is returning the number of characters written to stdout but by
returning that number our exit code is an error. What if we wanted to ensure that we return `0` unless
`printf` didn't print our whole string?

So far, the language looks a lot like C, however instead of the control flow syntax we might be used
to, like `if`, `for`, and `while` it uses something called basic blocks and an instruction for
moving from one block to another. Any function can omit the first basic block but if we wanted to be
explicit we could write our last example like this.

```llvm
define i32 @main() {
entry:
    %ret = call i32 @printf(ptr @hw)
    ret i32 %ret
}
```

In this, it becomes clear that the `@main` function has a single basic block named `entry`, this was
essentially true before, except the single basic block didn't have a name. So then, how can we use
this to operate like an `if` statement would? Well, we are going to need to use two new instructions
the `icmp` instruction which compares integers and the `br` function which is how we jump from one
basic block to another.

`icmp` is an instruction used for all integer comparisons, it will always return an `i1` so we can
assign that to a variable. It takes a first argument indicating what comparison we want to perform
for example `eq` for equality which in our case the `eq` should be enough.

```llvm
define i32 @main() {
entry:
    %ret = call i32 @printf(ptr @hw)
    %success = icmp eq i32 %ret, 13
    ret i32 %ret
}
```

In this update, we've added a new assignment for the result of our `icmp eq`, which takes 2
arguments; the first requires a type, in this case `i32`, the second needs to have the same type but
we don't write that one out. Breaking down our addition here is we are assigning to the variable
`%success` the result of comparing `%ret` with `13`, if `%ret` is `13` then `%success` will be `1`
otherwise it will be `0`. So now let's update our code return `0` when `%success` is `1` and `%ret`
when it is `0`. To do that we are going to add 2 new basic blocks and a `br` instruction to perform
the jump to the appropriate block.

```llvm
define i32 @main() {
entry:
    %ret = call i32 @printf(ptr @hw)
    %success = icmp eq i32 %ret, 13
    br i1 %success, label %succ, label %fail
succ:
    ret i32 0
fail:
    ret i32 %ret
}
```

Alright, quite a bit has changed here which is a pretty typical experience when working with llvm-ir
it takes a lot more code to do what most programming languages can achieve with a single expression
or statement. To start, we've added a new instruction after our `icmp`, the `br` instruction which is
taking the first argument of our comparison's result as `i1 %success` this is telling the `br` to
choose the second argument if `1` or the third argument if `0`, next we provide our two options
for jumping by using the `label` keyword (or type name?) followed by the local variable name
of the basic block we've declared. Notice that we need to use the `%` prefix when we refer to
a block's name but we don't when we declare the basic block. 

Next we can see that there are 2 new basic blocks declared, one named `succ` or our success case
and one named `fail` for our failure case. There are a few interesting things about basic blocks
to note, first si that we can refer to `%ret` from `fail` which means that the scope of a variable
in a basic block can be accessed from outside of that block, this is actually even more interesting
than it seems because basic blocks are internally converted into a directional graph ours is pretty
simple and might look like the following.

```plaintext
entry ─┬─> success
       └─> fail
```

Where the entry block can jump to either of the `success` or `fail` block and then the graph is
complete. So long as the value is assigned _before_ our block in the graph then it is accessible.
This doesn't seem all that interesting now because the lexical scope of our code matches the
order of the graph but when we get into the process of creating loops this is going to become
far more interesting.

At this point though, let's go ahead and run our program to make sure it works like we expected.

```sh
lli ./a.ll && echo "success" || echo "failed!"
Hello World!
success
```

Nice! That works as expected. Now let's explore the statement above about creating a loop. We can
update our program to print 5 times. To do this we are going to need to use a few new instructions,
first is an alternative version of the `br` instruction which just takes 1 argument that is a label
which will unconditionally jump to the provided basic block. The second is the `add` instruction
which adds two integers together. The third is a `phi` (pronounced fee) instruction which is super
weird but allows us to assign a variable based on which basic block we've just jump _from_. Before
we dig into the why, let's see what the code looks like.

```llvm
define i32 @main() {
entry:
    br label %looptop
looptop:
    %iter = phi i32 [0, %entry], [%next, %loopbody]
    %done = icmp eq i32 %iter, 5
    br i1 %done, label %succ, label %loopbody
loopbody:
    %ret = call i32 @printf(ptr @hw)
    %success = icmp eq i32 %ret, 13
    %next = add i32 %iter, 1
    br i1 %success, label %looptop, label %fail
succ:
    ret i32 0
fail:
    ret i32 %ret
}
```

Ok, we have quite a bit to unpack here. To start, our entry block now only has this new version
of `br` that will always jump to the `looptop` block, this is needed to allow the `phi` instruction
to work for us. Let's break down the `phi` instruction, this takes a type and then a series of
value/label pairs indicating what value to use based on where we just came from. In our case
if we've come from the `entry` block then we want `%iter` to be `0` however if we've come from
the `loopbody` block, we want to use whatever value might be assigned to `%next`. Next we
check to see if `%iter` is the number `5` and assign that to the `%done` variable, if `%done`
is `1` then we jump to the `succ` block, if it is `0` then we jump to the `loopbody` block.
At this point we've reached the code we had written before, calling `printf` and seeing if
that returns `13`, if it doesn't then we exit with that number as the exit code except this
time, instead of jumping to `succ` when `%success` is `1`, we jump back to `looptop` but before
we do, we need to define `%next` which is always set to be 1 more than `%iter` by using the `add`
instruction to add `1` to whatever value comes out of our `phi` instruction.

This can be a little difficult to follow, especially because `%next` is absolutely undefined when we
are writing `looptop` but we are able to use `%next` in the first instruction in that block. This
has to do with the fact that llvm needs to use code that is in
[single static assignment](https://en.wikipedia.org/wiki/Static_single-assignment_form) (aka SSA)
form which is a fancy way to say that all variable names can only every be assigned by 1 expression.
This doesn't mean that each variable name needs to always have the same value but that the
expression that defines that variable needs to never change. SSA is something that helps out with
some compiler optimizations that I don't really understand but are apparently important enough to
require the need for a `phi` node over re-assigning to the same variables.
