keks
====

Code snippets curious to (at least) non-expert programmers

Snippets
--------

* **C:** [Generate functions at runtime](01-c-closures/closure_x86.c)

    It is not obvious how to create new functions at runtime in pure C
    (e.g. implement [closures](https://en.wikipedia.org/wiki/Closure_(computer_programming)#)),
    however it's possible with some assembly code.

* **Javascript:** [Arbitrary-precision floating-point arithmetic](03-js-big-float/big_float.js)

    Impements [floating-point](https://en.wikipedia.org/wiki/Single-precision_floating-point_format#IEEE_754_single-precision_binary_floating-point_format:_binary32)
    arithmetic for any given number of bits for exponent and fraction
    (including [denormalized numbers](https://en.wikipedia.org/wiki/Denormal_number), NaNs, etc.).
    Supports comparison, `+`, `-`, `*`, `/`, `sqrt`, `sin`, `cos`.
    Calculation methods are not optimal (this is a proof-of-concept).

* **Bash, Windows CMD:** [Arbitrary-precision unsigned integer arithmetic](02-shell-big-unsigned)

    Implements `+`, `-`, `*`, `div`, `mod`, and `sqrt` operations for arbitrary-precision
    unsigned integers in pure Bash and in pure Windows CMD script (*.bat).

* **Python:** [Add methods to built-in types](https://github.com/borzunov/dontasq#adding-methods-to-built-ins)

    That's possible with either a hack with garbage collector references or Python C API.
    See [forbiddenfruit](https://github.com/clarete/forbiddenfruit) and
    [dontasq](https://github.com/borzunov/dontasq) for practical use.

* **C++:** [Calculate factorial at compile-time](04-cpp-factorial/factorial.cpp)

    Uses [template specialization](https://en.cppreference.com/w/cpp/language/template_specialization).

Author
------

Copyright © 2014-2015 Alexander Borzunov