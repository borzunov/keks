/*
 * Compile this with GNU C:
 *
 *     $ gcc closure_x86.c -o closure_x86 -z execstack
 * */

#include <stdio.h>
#include <stdlib.h>

typedef int (*FunctionThatReturnsInt)();

FunctionThatReturnsInt GenerateAFunctionThatReturnsX(int x) {
    void *buf = malloc(6);

    // mov eax, x
    *(unsigned char *) buf = 0xb8;
    *(int *) (buf + 1) = x;

    // ret
    *(unsigned char *) (buf + 5) = 0xc3;

    return (FunctionThatReturnsInt) buf;
}

int main() {
    int i;
    for (i = 0; i < 10; i++) {
        FunctionThatReturnsInt f = GenerateAFunctionThatReturnsX(i);
        printf("%d\n", f());
        free(f);
    }
    return 0;
}