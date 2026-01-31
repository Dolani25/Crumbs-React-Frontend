/**
 * Test Suite for LaTeX Validator - Function Call Syntax Fix
 * Run this to verify frac()() and isqrt() patterns are fixed
 */

import { validateDesmosExpression, parseMultipleExpressions } from './latexValidator.js';

console.log('🧪 Testing LaTeX Validator - Function Call Syntax Fixes\n');

// Test cases from the screenshot and other common AI errors
const testCases = [
    {
        name: 'Normal Distribution (Screenshot Issue)',
        input: 'y = frac(1)(isqrt(2π))e^(−frac((x−0)^2)(2(cdot1^2)))',
        expectedContains: ['\\frac', '\\sqrt', '\\cdot']
    },
    {
        name: 'Simple Fraction',
        input: 'y = frac(1)(2)',
        expectedContains: ['\\frac{1}{2}']
    },
    {
        name: 'Nested Fraction',
        input: 'y = frac(frac(a)(b))(c)',
        expectedContains: ['\\frac']
    },
    {
        name: 'Square Root with isqrt',
        input: 'y = isqrt(x^2 + 1)',
        expectedContains: ['\\sqrt{']
    },
    {
        name: 'cdot without backslash',
        input: 'y = a cdot b',
        expectedContains: ['\\cdot']
    },
    {
        name: 'Multiple issues combined',
        input: 'y = frac(a)(b) + isqrt(c) cdot x',
        expectedContains: ['\\frac', '\\sqrt', '\\cdot']
    },
    {
        name: 'Already correct LaTeX (should not break)',
        input: 'y = \\frac{1}{\\sqrt{2\\pi}}',
        expectedContains: ['\\frac', '\\sqrt']
    }
];

let passed = 0;
let failed = 0;

testCases.forEach(({ name, input, expectedContains }) => {
    console.log(`\n📝 Test: ${name}`);
    console.log(`   Input:  ${input}`);

    const result = validateDesmosExpression(input);
    console.log(`   Output: ${result}`);

    // Check if all expected patterns are in the output
    const allFound = expectedContains.every(pattern => result.includes(pattern));

    if (allFound) {
        console.log('   ✅ PASSED');
        passed++;
    } else {
        console.log(`   ❌ FAILED - Missing patterns: ${expectedContains.filter(p => !result.includes(p)).join(', ')}`);
        failed++;
    }
});

console.log('\n' + '='.repeat(50));
console.log(`📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
console.log('='.repeat(50));

if (failed === 0) {
    console.log('✨ All tests passed! The validator is working correctly.');
} else {
    console.error(`⚠️  ${failed} test(s) failed. Please review the output above.`);
}
