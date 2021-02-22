#include <iostream>

template<int64_t n>
struct Factorial {
    const static int64_t value = Factorial<n - 1>::value * n;
};

template<>
struct Factorial<1> {
    const static int64_t value = 1;
};

int main() {
    std::cout << Factorial<10>::value << std::endl;
    return 0;
}
