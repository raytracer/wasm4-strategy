import * as w4 from "./wasm4";

const zero: usize = memory.data<u8>([
    0b11100011,
    0b11101011,
    0b11101011,
    0b11101011,
    0b11100011,
]);

const one: usize = memory.data<u8>([
    0b11111011,
    0b11111011,
    0b11111011,
    0b11111011,
    0b11111011,
]);

const two: usize = memory.data<u8>([
    0b11100011,
    0b11111011,
    0b11100011,
    0b11101111,
    0b11100011,
]);

const three: usize = memory.data<u8>([
    0b11100011,
    0b11111011,
    0b11100011,
    0b11111011,
    0b11100011,
]);

const four: usize = memory.data<u8>([
    0b11101011,
    0b11101011,
    0b11100011,
    0b11111011,
    0b11111011,
]);

const five: usize = memory.data<u8>([
    0b11100011,
    0b11101111,
    0b11100011,
    0b11111011,
    0b11100011,
]);

const six: usize = memory.data<u8>([
    0b11101111,
    0b11101111,
    0b11100011,
    0b11101011,
    0b11100011,
]);

const seven: usize = memory.data<u8>([
    0b11100011,
    0b11111011,
    0b11110001,
    0b11111011,
    0b11111011,
]);

const eight: usize = memory.data<u8>([
    0b11100011,
    0b11101011,
    0b11100011,
    0b11101011,
    0b11100011,
]);

const nine: usize = memory.data<u8>([
    0b11100011,
    0b11101011,
    0b11100011,
    0b11111011,
    0b11111011,
]);

const plus: usize = memory.data<u8>([
    0b11111111,
    0b11110111,
    0b11100011,
    0b11110111,
    0b11111111,
]);

const minus: usize = memory.data<u8>([
    0b11111111,
    0b11111111,
    0b11100011,
    0b11111111,
    0b11111111,
]);

const numbers = new Map<string, usize>();
numbers.set("0", zero);
numbers.set("1", one);
numbers.set("2", two);
numbers.set("3", three);
numbers.set("4", four);
numbers.set("5", five);
numbers.set("6", six);
numbers.set("7", seven);
numbers.set("8", eight);
numbers.set("9", nine);
numbers.set("+", plus);
numbers.set("-", minus);

export function drawNumber(x: u8, y: u8, number: u16, right: boolean = false): void {
    const asString = number.toString()

    for (let i = 0; i < asString.length; i++) {
        const char = asString.charAt(i);
        w4.blit(numbers.get(char), (right ? x - (asString.length - 1) * 5 : x) + i * 5, y, 8, 5, 0);
    }
}

export function drawPlus(x: u8, y: u8): void {
    w4.blit(numbers.get("+"), x, y, 8, 5, 0);
}

export function drawMinus(x: u8, y: u8): void {
    w4.blit(numbers.get("-"), x, y, 8, 5, 0);
}