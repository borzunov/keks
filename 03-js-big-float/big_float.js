Array.generate = function (count, value) {
    var res = new Array(count);
    for (var i = 0; i < count; i++)
        res[i] = value;
    return res;
}

Array.prototype.map = function (func) {
    var res = new Array(this.length);
    for (var i = 0; i < this.length; i++)
        res[i] = func(this[i]);
    return res;
}

Array.prototype.allAre = function (value) {
    for (var i = 0; i < this.length; i++)
        if (this[i] != value)
            return false;
    return true;
}

Array.prototype.anyIs = function (value) {
    for (var i = 0; i < this.length; i++)
        if (this[i] == value)
            return true;
    return false;
}


function UnsignedInt(bits) {
    this._bits = bits.slice();
    this._popZeros();
}

UnsignedInt._Base = 2;

UnsignedInt.prototype._popZeros = function () {
    while (this._bits[this._bits.length - 1] == 0)
        this._bits.pop();
};

UnsignedInt.add = function (a, b) {
    var a_bits = a._bits;
    var b_bits = b._bits;
    var bits = new Array(Math.max(a_bits.length, b_bits.length) + 1);
    for (var i = 0; i < bits.length; i++)
        bits[i] = 0;
    for (var i = 0; i < bits.length; i++) {
        if (i < a_bits.length)
            bits[i] += a_bits[i];
        if (i < b_bits.length)
            bits[i] += b_bits[i];
        if (bits[i] >= UnsignedInt._Base) {
            bits[i + 1]++;
            bits[i] -= UnsignedInt._Base;
        }
    }
    return new UnsignedInt(bits);
};

UnsignedInt.sub = function (a, b) {
    if (UnsignedInt.compare(a, b) < 0)
        throw new Error("Can't subtract an unsigned number from a lesser unsigned number");
    var a_bits = a._bits;
    var b_bits = b._bits;
    var bits = new Array(a_bits.length);
    for (var i = 0; i < bits.length; i++)
        bits[i] = 0;
    for (var i = 0; i < bits.length; i++) {
        bits[i] += a_bits[i];
        if (i < b_bits.length)
            bits[i] -= b_bits[i];
        if (bits[i] < 0) {
            bits[i + 1]--;
            bits[i] += UnsignedInt._Base;
        }
    }
    return new UnsignedInt(bits);
};

UnsignedInt.mul = function (a, b) {
    var a_bits = a._bits;
    var b_bits = b._bits;
    var bits = new Array(a_bits.length + b_bits.length);
    for (var i = 0; i < bits.length; i++)
        bits[i] = 0;
    for (var i = 0; i < a_bits.length; i++)
        for (var j = 0; j < b_bits.length; j++) {
            var k = i + j;
            bits[k] += a_bits[i] * b_bits[j];
            if (bits[k] >= UnsignedInt._Base) {
                bits[k + 1] += Math.floor(bits[k] / UnsignedInt._Base);
                bits[k] %= UnsignedInt._Base;
            }
        }
    return new UnsignedInt(bits);
};

UnsignedInt.fromBits = function (bits) {
    return new UnsignedInt(bits);
};

UnsignedInt.prototype.toBits = function (count) {
    var bits = this._bits.slice();
    if (count !== undefined) {
        while (bits.length < count)
            bits.push(0);
    }
    return bits;
};

UnsignedInt.prototype.shiftLeftBy = function (positions) {
    return new UnsignedInt(Array.generate(positions, 0).concat(this._bits));
}

UnsignedInt.prototype.shiftRightBy = function (positions) {
    return new UnsignedInt(this._bits.slice(positions));
}

UnsignedInt.compare = function (a, b) {
    var a_bits = a._bits;
    var b_bits = b._bits;
    if (a_bits.length != b_bits.length)
        return (a_bits.length < b_bits.length) ? -1 : 1;
    for (var i = a_bits.length - 1; i != -1; i--)
        if (a_bits[i] != b_bits[i])
            return (a_bits[i] < b_bits[i]) ? -1 : 1;
    return 0;
}

UnsignedInt.prototype.isZero = function () {
    return this._bits.length == 0;
}

UnsignedInt.Zero = new UnsignedInt([]);
UnsignedInt.One = new UnsignedInt([1]);


function Float(fraction, exponent, sign) {
    this._fraction = fraction;
    this._exponent = exponent;
    this._sign = sign;
}

Float._ExponentBits = 8;
Float._FractionBits = 23;

Float.prototype.isPositive = function () {
    return this._sign == 0;
};

Float.prototype.isNegative = function () {
    return !this.isPositive();
};

Float.prototype.negate = function () {
    if (this.isNaN())
        return this;

    return new Float(this._fraction, this._exponent, this._sign ? 0 : 1);
}

Float.prototype.abs = function () {
    if (this.isNaN())
        return this;

    return new Float(this._fraction, this._exponent, 0);
}

Float.compare = function (a, b) {
    if (a._sign != b._sign)
        return a.sign == 1 ? -1 : 1;
    var res = UnsignedInt.compare(a._exponent, b._exponent);
    if (res)
        return res;
    return UnsignedInt.compare(a._fraction, b._fraction);
}

Float._FractionImplicitPart = new UnsignedInt(Array.generate(Float._FractionBits, 0).concat([1]));
Float._ExponentZeroLevel = new UnsignedInt(Array.generate(Float._ExponentBits - 1, 1));

Float.prototype._getExplicitFractionOfNonZeroNumber = function () {
    if (this._exponent.isZero()) // Denormalized number
        return this._fraction;
    return UnsignedInt.add(Float._FractionImplicitPart, this._fraction);
}

Float.prototype._getExplicitExponentOfNonZeroNumber = function () {
    if (this._exponent.isZero()) // Denormalized number
        return UnsignedInt.One;
    return this._exponent;
}

Float._ShiftedFractionImplicitPart = Float._FractionImplicitPart.shiftLeftBy(1);

Float._addNonZeroNumbers = function (a, b) {
    var a_fraction = a._getExplicitFractionOfNonZeroNumber();
    var b_fraction = b._getExplicitFractionOfNonZeroNumber();
    var a_exponent = a._getExplicitExponentOfNonZeroNumber();
    var b_exponent = b._getExplicitExponentOfNonZeroNumber();
    while (UnsignedInt.compare(a_exponent, b_exponent) < 0) {
        a_exponent = UnsignedInt.add(a_exponent, UnsignedInt.One);
        a_fraction = a_fraction.shiftRightBy(1);
    }
    while (UnsignedInt.compare(a_exponent, b_exponent) > 0) {
        b_exponent = UnsignedInt.add(b_exponent, UnsignedInt.One);
        b_fraction = b_fraction.shiftRightBy(1);
    }

    var res_fraction = UnsignedInt.add(a_fraction, b_fraction);
    var res_exponent = a_exponent;
    if (UnsignedInt.compare(res_fraction, Float._ShiftedFractionImplicitPart) >= 0) {
        res_exponent = UnsignedInt.add(res_exponent, UnsignedInt.One);
        res_fraction = res_fraction.shiftRightBy(1);
    }
    // Check overflow
    if (UnsignedInt.compare(res_exponent, Float._ExponentOfInfinity) >= 0)
        return a._sign ? Float.NegativeInfinity : Float.PositiveInfinity;
    // Check if the result is denormalized
    if (UnsignedInt.compare(res_exponent, UnsignedInt.One) == 0 &&
            UnsignedInt.compare(res_fraction, Float._FractionImplicitPart) < 0)
        return new Float(res_fraction, UnsignedInt.Zero, a._sign);
    return new Float(
        UnsignedInt.sub(res_fraction, Float._FractionImplicitPart), res_exponent, a._sign);
};

Float._subNonZeroNumbers = function (a, b) {
    var a_fraction = a._getExplicitFractionOfNonZeroNumber();
    var b_fraction = b._getExplicitFractionOfNonZeroNumber();
    var a_exponent = a._getExplicitExponentOfNonZeroNumber();
    var b_exponent = b._getExplicitExponentOfNonZeroNumber();
    while (UnsignedInt.compare(a_exponent, b_exponent) < 0) {
        a_exponent = UnsignedInt.add(a_exponent, UnsignedInt.One);
        a_fraction = a_fraction.shiftRightBy(1);
    }
    while (UnsignedInt.compare(a_exponent, b_exponent) > 0) {
        b_exponent = UnsignedInt.add(b_exponent, UnsignedInt.One);
        b_fraction = b_fraction.shiftRightBy(1);
    }

    var res_fraction = UnsignedInt.sub(a_fraction, b_fraction);
    var res_exponent = a_exponent;
    while (
        UnsignedInt.compare(res_exponent, UnsignedInt.One) > 0 &&
        UnsignedInt.compare(res_fraction, Float._FractionImplicitPart) < 0
    ) {
        res_exponent = UnsignedInt.sub(res_exponent, UnsignedInt.One);
        res_fraction = res_fraction.shiftLeftBy(1);
    }
    // Check if the result is denormalized
    if (UnsignedInt.compare(res_exponent, UnsignedInt.One) == 0 &&
            UnsignedInt.compare(res_fraction, Float._FractionImplicitPart) < 0)
        return new Float(res_fraction, UnsignedInt.Zero, a._sign);
    return new Float(
        UnsignedInt.sub(res_fraction, Float._FractionImplicitPart), res_exponent, a._sign);
};

Float.add = function (a, b) {
    if (a.isNaN())
        return a;
    if (b.isNaN())
        return b;

    if (a.isInfinity())
        return (b.isInfinity() && a.isPositive() != b.isPositive()) ? Float.NaN : a;
    if (b.isInfinity())
        return b;

    if (a.isZero()) {
        if (b.isZero())
            return (a.isNegative() && b.isNegative()) ? a : Float.PositiveZero;
        return b;
    }
    if (b.isZero())
        return a;

    if (a.isPositive() != b.isPositive()) {
        if (Float.compare(a.abs(), b.abs()) >= 0)
            return Float._subNonZeroNumbers(a, b.negate());
        else
            return Float._subNonZeroNumbers(b.negate(), a).negate();
    }
    return Float._addNonZeroNumbers(a, b);
};

Float.sub = function (a, b) {
    if (a.isNaN())
        return a;
    if (b.isNaN())
        return b;

    return Float.add(a, b.negate());
}

Float._ExponentOneLevel = UnsignedInt.add(Float._ExponentZeroLevel, UnsignedInt.One);
Float._FractionImplicitPartSquare = UnsignedInt.mul(
    Float._FractionImplicitPart, Float._FractionImplicitPart);

Float._mulNonZeroNumbers = function (a, b) {
    var a_fraction = a._getExplicitFractionOfNonZeroNumber();
    var b_fraction = b._getExplicitFractionOfNonZeroNumber();
    var a_exponent = a._getExplicitExponentOfNonZeroNumber();
    var b_exponent = b._getExplicitExponentOfNonZeroNumber();

    var res_exponent = UnsignedInt.add(a_exponent, b_exponent);
    var res_fraction = UnsignedInt.mul(a_fraction, b_fraction);
    while (
        UnsignedInt.compare(res_exponent, Float._ExponentOneLevel) > 0 &&
        UnsignedInt.compare(res_fraction, Float._FractionImplicitPartSquare) < 0
    ) {
        res_exponent = UnsignedInt.sub(res_exponent, UnsignedInt.One);
        res_fraction = res_fraction.shiftLeftBy(1);
    }
    res_fraction = res_fraction.shiftRightBy(Float._FractionBits);
    if (UnsignedInt.compare(res_fraction, Float._ShiftedFractionImplicitPart) >= 0) {
        res_exponent = UnsignedInt.add(res_exponent, UnsignedInt.One);
        res_fraction = res_fraction.shiftRightBy(1);
    }
    // Check if the result is denormalized
    if (
        UnsignedInt.compare(res_exponent, Float._ExponentZeroLevel) <= 0 || (
            UnsignedInt.compare(res_exponent, Float._ExponentOneLevel) == 0 &&
            UnsignedInt.compare(res_fraction, Float._FractionImplicitPart) < 0
        )
    ) {
        while (UnsignedInt.compare(res_exponent, Float._ExponentZeroLevel) <= 0) {
            res_exponent = UnsignedInt.add(res_exponent, UnsignedInt.One);
            res_fraction = res_fraction.shiftRightBy(1);
        }
        return new Float(res_fraction, UnsignedInt.Zero, 0);
    }
    res_fraction = UnsignedInt.sub(res_fraction, Float._FractionImplicitPart);
    res_exponent = UnsignedInt.sub(res_exponent, Float._ExponentZeroLevel);
    return new Float(res_fraction, res_exponent, 0);
};

Float.mul = function (a, b) {
    if (a.isNaN())
        return a;
    if (b.isNaN())
        return b;

    if (a.isNegative() && b.isNegative())
        return Float.mul(a.negate(), b.negate());
    if (a.isNegative())
        return Float.mul(a.negate(), b).negate();
    if (b.isNegative())
        return Float.mul(a, b.negate()).negate();

    if (a.isInfinity())
        return b.isZero() ? Float.NaN : Float.PositiveInfinity;
    if (b.isInfinity())
        return a.isZero() ? Float.NaN : Float.PositiveInfinity;

    if (a.isZero() || b.isZero())
        return Float.PositiveZero;

    return Float._mulNonZeroNumbers(a, b);
};

Float.Half = new Float(
    new UnsignedInt(Array.generate(Float._FractionBits, 0)),
    UnsignedInt.sub(Float._ExponentZeroLevel, UnsignedInt.One),
    0
);

Float._BinSearchIters = (1 << Float._ExponentBits) + Float._FractionBits + 10;

Float._divNonZeroNumbers = function (a, b) {
    var l = Float.PositiveZero;
    var r = Float.MaxValue;
    for (var i = 0; i < Float._BinSearchIters; i++) {
        var middle = Float.add(l, Float.mul(Float.sub(r, l), Float.Half));
        if (Float.compare(Float.mul(middle, b), a) < 0)
            l = middle;
        else
            r = middle;
    }
    return r;
};

Float.div = function (a, b) {
    if (a.isNaN())
        return a;
    if (b.isNaN())
        return b;

    if (a.isNegative() && b.isNegative())
        return Float.div(a.negate(), b.negate());
    if (a.isNegative())
        return Float.div(a.negate(), b).negate();
    if (b.isNegative())
        return Float.div(a, b.negate()).negate();

    if (a.isInfinity())
        return b.isInfinity() ? Float.NaN : Float.PositiveInfinity;
    if (b.isInfinity())
        return Float.PositiveZero;

    if (a.isZero())
        return Float.PositiveZero;
    if (b.isZero())
        return Float.PositiveInfinity;

    return Float._divNonZeroNumbers(a, b);
};

Float.prototype._sqrtFromNonZeroNumber = function () {
    var l = Float.PositiveZero;
    var r = Float.MaxValue;
    for (var i = 0; i < Float._BinSearchIters; i++) {
        var middle = Float.add(l, Float.mul(Float.sub(r, l), Float.Half));
        if (Float.compare(Float.mul(middle, middle), this) < 0)
            l = middle;
        else
            r = middle;
    }
    return r;
}

Float.prototype.sqrt = function () {
    if (this.isNaN())
        return this;

    if (this.isZero())
        return Float.PositiveZero;

    if (this.isNegative())
        return Float.NaN;

    if (this.isInfinity())
        return Float.PositiveInfinity;

    return this._sqrtFromNonZeroNumber();
}

Float._RowSummands = 64;

Float.prototype.sin = function () {
    if (this.isNaN())
        return this;

    if (this.isInfinity())
        return Float.NaN;

    var res = this;
    var numerator = this;
    var denomFactor = Float.One;
    var denom = Float.One;
    for (var i = 0; i < Float._RowSummands; i++) {
        numerator = Float.mul(Float.mul(numerator, this), this);
        denomFactor = Float.add(denomFactor, Float.One);
        denom = Float.mul(denom, denomFactor);
        denomFactor = Float.add(denomFactor, Float.One);
        denom = Float.mul(denom, denomFactor);
        var summand = Float.div(numerator, denom);
        if (i % 2 == 0)
            summand = summand.negate();
        res = Float.add(res, summand);
    }
    return res;
}

Float.prototype.cos = function () {
    if (this.isNaN())
        return this;

    if (this.isInfinity())
        return Float.NaN;

    var res = Float.One;
    var numerator = Float.One;
    var denomFactor = Float.PositiveZero;
    var denom = Float.One;
    for (var i = 0; i < Float._RowSummands; i++) {
        numerator = Float.mul(Float.mul(numerator, this), this);
        denomFactor = Float.add(denomFactor, Float.One);
        denom = Float.mul(denom, denomFactor);
        denomFactor = Float.add(denomFactor, Float.One);
        denom = Float.mul(denom, denomFactor);
        var summand = Float.div(numerator, denom);
        if (i % 2 == 0)
            summand = summand.negate();
        res = Float.add(res, summand);
    }
    return res;
}

Float.fromBits = function (bits) {
    if (bits.length !== Float._ExponentBits + Float._FractionBits + 1)
        throw new Error("Incorrect bits count in Float representation");
    return new Float(
        new UnsignedInt(bits.slice(0, Float._FractionBits)),
        new UnsignedInt(bits.slice(Float._FractionBits, Float._FractionBits + Float._ExponentBits)),
        bits[Float._FractionBits + Float._ExponentBits]
    );
};

Float.prototype.toBits = function () {
    return this._fraction.toBits(Float._FractionBits)
                         .concat(this._exponent.toBits(Float._ExponentBits)).concat([this._sign]);
};

Float.fromBinary = function (str) {
    return Float.fromBits(str.replace(/\s/g, '').split('').reverse().map(function (bit) {
        return +bit;
    }));
}

Float.prototype.toBinary = function (str) {
    return (
        this._sign + " " +
        this._exponent.toBits(Float._ExponentBits).reverse().join("") + " " +
        this._fraction.toBits(Float._FractionBits).reverse().join("")
    );
}

Float._ExponentOfInfinity = new UnsignedInt(Array.generate(Float._ExponentBits, 1));

Float.prototype.isNaN = function () {
    return !this._fraction.isZero() &&
        UnsignedInt.compare(this._exponent, Float._ExponentOfInfinity) == 0;
};

Float.NaN = new Float(
    new UnsignedInt(Array.generate(Float._FractionBits, 1)),
    Float._ExponentOfInfinity,
    1
);

Float.prototype.isInfinity = function () {
    return this._fraction.isZero() &&
        UnsignedInt.compare(this._exponent, Float._ExponentOfInfinity) == 0;
};

Float.MaxValue = new Float(
    new UnsignedInt(Array.generate(Float._FractionBits, 1)),
    UnsignedInt.sub(Float._ExponentOfInfinity, UnsignedInt.One),
    0
);

Float.PositiveInfinity = new Float(
    new UnsignedInt(Array.generate(Float._FractionBits, 0)),
    Float._ExponentOfInfinity,
    0
);
Float.NegativeInfinity = Float.PositiveInfinity.negate();

Float.prototype.isZero = function () {
    return this._fraction.isZero() && this._exponent.isZero();
}

Float.PositiveZero = new Float(
    new UnsignedInt(Array.generate(Float._FractionBits, 0)),
    new UnsignedInt(Array.generate(Float._ExponentBits, 0)),
    0
);
Float.NegativeZero = Float.PositiveZero.negate();

Float.One = new Float(
    new UnsignedInt(Array.generate(Float._FractionBits, 0)),
    Float._ExponentZeroLevel,
    0
);

Float._DecimalBase = 10;
Float._Digits = new Array(Float._DecimalBase);
Float._Digits[0] = Float.PositiveZero;
Float._Digits[1] = Float.One;
for (var i = 2; i < Float._DecimalBase; i++)
    Float._Digits[i] = Float.add(Float._Digits[i - 1], Float.One);

Float._Ten = Float.add(Float._Digits[Float._DecimalBase - 1], Float.One);
Float._OneTenth = Float.div(Float.One, Float._Ten);

Float.fromDecimal = function (str) {
    if (str.length > 2 && str.charAt(0) == '[' && str.charAt(str.length - 1) == ']')
        return Float.fromBinary(str.substr(1, str.length - 2));

    if (str.charAt(0) == '-')
        return Float.fromDecimal(str.substr(1)).negate();

    str = str.toLowerCase();
    if (str == 'nan')
        return Float.NaN;
    if (str == 'inf')
        return Float.PositiveInfinity;

    var match = str.match(/^(\d+)[,.]?(\d*)?$/);
    if (match === null)
        throw new Error('Incorrect decimal format');
    var res = Float.PositiveZero;
    for (var i = 0; i < str.length; i++) {
        if (str.charAt(i) == ',' || str.charAt(i) == '.')
            continue;
        res = Float.mul(res, Float._Ten);
        res = Float.add(res, Float._Digits[str.charCodeAt(i) - '0'.charCodeAt(0)]);
    }
    if (match[2] !== undefined) {
        var digitsAfterDecimalPoint = match[2].length;
        for (var i = 0; i < digitsAfterDecimalPoint; i++)
            res = Float.mul(res, Float._OneTenth);
    }
    return res;
}


function print_bits(comment, number) {
    WSH.echo(comment + ' = ' + number.toBinary());
}

var fso = new ActiveXObject("Scripting.FileSystemObject");
var ts = fso.OpenTextFile("input.txt", 1, true);
var a = Float.fromDecimal(ts.ReadLine());
var b = Float.fromDecimal(ts.ReadLine());
ts.Close();

WSH.echo('FLOAT');
WSH.echo('Using ' + Float._ExponentBits + ' bits for exponent, ' + Float._FractionBits + ' bits for fraction\n');

print_bits("A      ", a);
print_bits("B      ", b);
WSH.echo();

var compared = Float.compare(a, b);
if (compared < 0)
    WSH.echo('A < B');
else
if (compared > 0)
    WSH.echo('A > B');
else
    WSH.echo('A = B');
WSH.echo();

print_bits("A + B  ", Float.add(a, b));
print_bits("A - B  ", Float.sub(a, b));
print_bits("A * B  ", Float.mul(a, b));
print_bits("A / B  ", Float.div(a, b));
print_bits("sqrt(A)", a.sqrt());
print_bits("sin(A) ", a.sin());
print_bits("cos(A) ", a.cos());
