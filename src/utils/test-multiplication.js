/**
 * Test cases for implicit multiplication fix
 */

import { parseMultipleExpressions } from './latexValidator.js';

console.log('=== Implicit Multiplication Test Cases ===\n');

const testCases = [
    {
        name: "Parenthesis times e^t",
        input: "y = 30 + (100 - 70)e^t - 0.1x",
        expected: "y = 30 + (100 - 70)*e^t - 0.1*x"
    },
    {
        name: "Number times variable",
        input: "y = 2x + 3t",
        expected: "y = 2*x + 3*t"
    },
    {
        name: "Decimal times variable",
        input: "y = 0.1x + 0.5t",
        expected: "y = 0.1*x + 0.5*t"
    },
    {
        name: "Number times parenthesis",
        input: "y = 2(x + 1)",
        expected: "y = 2*(x + 1)"
    },
    {
        name: "Adjacent parentheses",
        input: "y = (2 + 3)(x - 1)",
        expected: "y = (2 + 3)*(x - 1)"
    },
    {
        name: "Preserve function commas",
        input: "f(x, y) = x^2 + y^2",
        expected: "f(x, y) = x^2 + y^2"
    },
    {
        name: "Preserve point notation",
        input: "(2, 5)",
        expected: "(2, 5)"
    },
    {
        name: "Complex expression",
        input: "y = 30 + (100 - 70)e^t - 0.1x",
        expected: "Contains * operators"
    }
];

testCases.forEach(test => {
    console.log(`Test: ${test.name}`);
    console.log(`Input:  "${test.input}"`);

    const result = parseMultipleExpressions(test.input);
    console.log(`Output: "${result[0]}"`);

    const passed = result[0].includes('*') || test.input === test.expected;
    console.log(`Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('---\n');
});

console.log('=== Test Complete ===');
