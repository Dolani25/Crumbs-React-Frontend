
const regex = /(^|(?<=[,({[\s]))\*\*\s*([a-zA-Z_]\w*)/g;

const text1 = "((x - center) / width)**2";
const text2 = "func(**kwargs)";
const text3 = "const y = x ** 2";
const text4 = "Math.pow(x, 2)";

console.log(`Regex: ${regex}`);
console.log(`Original 1: ${text1}`);
console.log(`Replaced 1: ${text1.replace(regex, '$1...$2')}`);

console.log(`Original 2: ${text2}`);
console.log(`Replaced 2: ${text2.replace(regex, '$1...$2')}`);

console.log(`Original 3: ${text3}`);
console.log(`Replaced 3: ${text3.replace(regex, '$1...$2')}`);
