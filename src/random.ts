export let seed = Math.random() * 100000;
const a = 16807;
const m = 2147483647;

export function random(min: u32, max: u32): u32 {
    seed = (a * seed) % m;
    return <u32>((<f64>(seed) / <f64>m) * (max - min) + min);
}