/**
 * Enhanced LaTeX Validator for Desmos
 * Handles commas, semicolons, equals signs, and piecewise expressions contextually
 */

/**
 * Split multi-statement expressions into separate Desmos expressions
 */
const splitStatements = (expression) => {
    if (!expression) return [];

    // First, split by semicolons (not supported by Desmos)
    let statements = expression.split(/;/).map(s => s.trim()).filter(Boolean);

    // Then, split by commas ONLY if they're statement separators (not in functions or points)
    const finalStatements = [];

    statements.forEach(stmt => {
        // Check if this looks like multiple assignments: "a=1, b=2"
        // Pattern: variable=value, variable=value
        const assignmentPattern = /([a-zA-Z_]\w*\s*=\s*[^,]+),\s*([a-zA-Z_]\w*\s*=)/;

        if (assignmentPattern.test(stmt)) {
            // Split by comma, but preserve commas in parentheses (points/functions)
            const parts = smartSplitByComma(stmt);
            finalStatements.push(...parts);
        } else {
            finalStatements.push(stmt);
        }
    });

    return finalStatements.map(s => s.trim()).filter(Boolean);
};

/**
 * Split by comma but preserve commas inside parentheses
 */
const smartSplitByComma = (text) => {
    const parts = [];
    let current = '';
    let depth = 0;
    let inBraces = 0;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (char === '(') depth++;
        else if (char === ')') depth--;
        else if (char === '{') inBraces++;
        else if (char === '}') inBraces--;
        else if (char === ',' && depth === 0 && inBraces === 0) {
            // This comma is a separator, not inside parens/braces
            const trimmed = current.trim();
            // Only split if this looks like assignment/equation or function definition
            // Match: variable= OR function(params)=
            if (trimmed && /[a-zA-Z_]\w*(?:\([^)]*\))?\s*=/.test(trimmed)) {
                parts.push(trimmed);
                current = '';
                continue;
            }
        }

        current += char;
    }

    if (current.trim()) parts.push(current.trim());
    return parts.length > 1 ? parts : [text];
};

/**
 * Validate and fix equals signs, handle chained equations
 */
const validateEqualsSign = (expr) => {
    // Remove double equals (common typo)
    let fixed = expr.replace(/\s*=\s*=\s*/g, '=');

    // Check for equals at the start (invalid)
    if (/^\s*=/.test(fixed)) {
        console.warn('⚠️ Equation starts with =, invalid syntax');
        return null; // Invalid
    }

    // Count equals signs
    const equalsCount = (fixed.match(/=/g) || []).length;

    if (equalsCount > 1) {
        // Chained equation detected: "y = sin(x)L_1(x) = f(a) + ..."
        // Split by equals and take only the first valid part
        console.warn('⚠️ Chained equation detected, taking first part only');
        const parts = fixed.split('=');

        // If first part is a single variable (like "y"), keep "y = [second part]"
        if (parts[0].trim().match(/^[a-zA-Z]$/)) {
            fixed = `${parts[0].trim()} = ${parts[1].trim()}`;
        } else {
            // Otherwise just take the first equation
            fixed = `${parts[0].trim()} = ${parts[1].trim()}`;
        }
    }

    // Ensure spaces around equals for readability
    fixed = fixed.replace(/\s*=\s*/g, ' = ');

    return fixed;
};

/**
 * Fix piecewise expressions
 * Desmos piecewise syntax: {condition: expression, condition: expression}
 */
const fixPiecewiseExpression = (expr) => {
    // Check if this looks like a piecewise attempt
    // Common patterns: "y = {x > 0: x^2, x <= 0: -x^2}" or malformed versions

    if (!expr.includes('{') || !expr.includes('}')) {
        return expr;
    }

    // Extract the piecewise part
    const piecewiseMatch = expr.match(/\{([^}]+)\}/);
    if (!piecewiseMatch) return expr;

    const piecewiseContent = piecewiseMatch[1];

    // Check if it has the correct format: condition: expression
    // If it's just {...} without conditions, it might be set notation
    if (!piecewiseContent.includes(':')) {
        // Might be set notation or malformed piecewise
        console.warn('⚠️ Curly braces without conditions - might be invalid piecewise');
        return expr;
    }

    // Validate piecewise conditions
    const conditions = piecewiseContent.split(',').filter(Boolean);
    const validConditions = conditions.filter(c => c.includes(':'));

    if (validConditions.length === 0) {
        console.error('❌ Piecewise expression has no valid conditions');
        return null; // Invalid
    }

    // Rebuild with validated conditions
    const fixed = expr.replace(/\{[^}]+\}/, `{${validConditions.join(', ')}}`);
    return fixed;
};

/**
 * Add explicit multiplication operators where needed
 * Handles: )( → )*(  , )x → )*x , 2x → 2*x , )e^ → )*e^
 */
const addExplicitMultiplication = (expr) => {
    let result = expr;

    // 1. )( → )*(  - multiply between closing and opening parens
    result = result.replace(/\)\s*\(/g, ')*(');

    // 2. )letter → )*letter - closing paren followed by variable (but not LaTeX commands)
    // Don't match )\command - preserve LaTeX
    result = result.replace(/\)(?!\s*[*+\-/^=<>:,;}])\s*([a-zA-Z])/g, (match, letter) => {
        // Check if this letter is start of LaTeX command (preceded by backslash)
        if (result[result.indexOf(match) - 1] === '\\') {
            return match; // Keep as is
        }
        return `)*${letter}`;
    });

    // 3. number+letter → number*letter (e.g. 2x, 0.1x, 5t)
    // But not in cases like "e10" (scientific notation) or part of LaTeX
    result = result.replace(/(\d+\.?\d*)\s*([a-zA-Z])(?![a-zA-Z])/g, (match, num, letter) => {
        // Don't touch e in scientific notation (1e-5)
        if (letter === 'e' && /\d[eE][+-]?\d/.test(result)) {
            return match;
        }
        return `${num}*${letter}`;
    });

    // 4. )e^ → )*e^ or )\e^ - Handle Euler's number multiplication
    // This covers (100-70)e^t case
    result = result.replace(/\)\s*(\\?e)\^/g, ')*$1^');

    // 5. number+( → number*( (e.g. 2(x+1))
    result = result.replace(/(\d+\.?\d*)\s*\(/g, '$1*(');

    return result;
};

/**
 * Remove invalid LaTeX commands that Desmos doesn't understand
 * Examples: \L_1, \V_2, \uppercase letters
 */
const cleanInvalidLatexCommands = (expr) => {
    let result = expr;

    // 1. Remove \LETTER (capital letters are not valid LaTeX commands in Desmos)
    // \L_1 → L_1, \V_2 → V_2
    result = result.replace(/\\([A-Z])/g, '$1');

    // 2. Remove \text{} wrapper - Desmos doesn't support it
    result = result.replace(/\\text\{([^}]+)\}/g, '$1');

    // 3. Remove \mathrm{} wrapper
    result = result.replace(/\\mathrm\{([^}]+)\}/g, '$1');

    // 4. Remove \left and \right delimiters (Desmos doesn't need them)
    result = result.replace(/\\left|\\right/g, '');

    // 5. Convert angle brackets to parentheses
    // \langle x,y \rangle → (x,y)
    result = result.replace(/\\langle/g, '(');
    result = result.replace(/\\rangle/g, ')');

    // 6. Convert domain restrictions from parentheses to curly braces
    // y = f(x) (x > 0) → y = f(x) {x > 0}
    // Match pattern: equation/expression followed by (variable comparison value)
    result = result.replace(/\)\s*\(([a-z]\s*[<>=≤≥]\s*[^)]+)\)/g, ') {$1}');

    return result;
};

/**
 * Fix function-call style LaTeX syntax (common AI error)
 * Converts: frac(a)(b) → \frac{a}{b}, isqrt(x) → \sqrt{x}, etc.
 */
const fixFunctionCallSyntax = (expr) => {
    let result = expr;

    // 0. Normalize unicode characters that cause issues
    result = result
        .replace(/−/g, '-')  // Unicode minus to regular minus
        .replace(/×/g, '*')  // Multiplication sign
        .replace(/÷/g, '/')  // Division sign
        .replace(/≤/g, '<=')
        .replace(/≥/g, '>=');

    // 1. Fix isqrt(content) → \sqrt{content}
    // Match: isqrt followed by parentheses
    result = result.replace(/\bisqrt\s*\(([^()]+(?:\([^()]*\))*[^()]*)\)/g, '\\sqrt{$1}');

    // 2. Fix frac(numerator)(denominator) → \frac{numerator}{denominator}
    // Need to apply multiple times for nested fractions
    let prevResult = '';
    let iterations = 0;
    const maxIterations = 5; // Prevent infinite loops

    while (result !== prevResult && iterations < maxIterations) {
        prevResult = result;
        // Match frac followed by two sets of parentheses with content
        // This regex handles simple nested parentheses
        const fracPattern = /\bfrac\s*\(([^()]+(?:\([^()]*\))*[^()]*)\)\s*\(([^()]+(?:\([^()]*\))*[^()]*)\)/g;
        result = result.replace(fracPattern, '\\frac{$1}{$2}');
        iterations++;
    }

    // 3. Fix cdot (often appears without backslash)
    // Match cdot as standalone word or followed by number/symbol
    result = result.replace(/\bcdot(?=[^a-zA-Z]|$)/g, '\\cdot');

    // 4. Ensure common math commands have backslashes if they don't already
    // This catches cases where AI forgets the backslash
    const mathCommands = ['frac', 'sqrt', 'sin', 'cos', 'tan', 'log', 'ln'];
    mathCommands.forEach(cmd => {
        // Match the command NOT preceded by backslash or letter
        const pattern = new RegExp(`(^|[^\\\\a-zA-Z])${cmd}(?=[\\s({])`, 'g');
        result = result.replace(pattern, `$1\\${cmd}`);
    });

    return result;
};

/**
 * Fix malformed LaTeX braces and parentheses
 * Common AI errors: e^{(}x) → e^{x}, {(} → {, }( → }
 */
const fixMalformedBraces = (expr) => {
    let result = expr;

    // 1. Fix ^{(} pattern - should be ^{ or ^(
    // e^{(}x) → e^{x}, e^{(}x+1) → e^{x+1}
    result = result.replace(/\^\{\\?\(\}/g, '^{');

    // 2. Fix {(} at start of braces - just use {
    result = result.replace(/\{\\?\(\}/g, '{');

    // 3. Fix }( pattern - should be separate or combined
    result = result.replace(/\}\\?\(/g, '}*(');

    // 4. Fix unmatched opening brace+paren: {( without closing both
    // This is trickier - look for {( followed by content and only )
    result = result.replace(/\{\\?\(([^{}()]+)\)(?!\})/g, '{$1}');

    // 5. Handle derivative() - Desmos uses d/dx notation, not derivative()
    // Convert derivative(expr) to \frac{d}{dx}(expr) - though this is complex
    // For now, just remove the derivative() wrapper as Desmos has built-in derivative
    // Actually, Desmos doesn't support derivative() function directly in expressions
    // Just leave it for now as it might be handled by Desmos differently

    return result;
};

/**
 * Main validation function
 */
export const validateDesmosExpression = (expression) => {
    if (!expression || typeof expression !== 'string') {
        return 'y=x';
    }

    // 1. Trim whitespace
    let expr = expression.trim();

    // 2. Fix function-call style syntax FIRST (before other processing)
    // This catches AI errors like frac()() and isqrt()
    expr = fixFunctionCallSyntax(expr);

    // 3. Clean invalid LaTeX commands (e.g., \L_1 → L_1)
    expr = cleanInvalidLatexCommands(expr);

    // 4. Fix malformed braces (before other processing)
    expr = fixMalformedBraces(expr);

    // 5. Check for piecewise expressions
    if (expr.includes('{') && expr.includes('}')) {
        const fixed = fixPiecewiseExpression(expr);
        if (!fixed) {
            console.error('Invalid piecewise expression');
            return 'y=x'; // Fallback
        }
        expr = fixed;
    }

    // 6. Add explicit multiplication operators (BEFORE LaTeX fixes)
    expr = addExplicitMultiplication(expr);

    // 7. Common LaTeX fixes for AI-generated expressions
    expr = expr
        // Functions that need backslash
        .replace(/(^|[^\\])\b(sin|cos|tan|log|ln)(?![a-zA-Z])/g, '$1\\$2')
        // sqrt() needs braces: sqrt(x) -> \sqrt{x}
        .replace(/(^|[^\\])\bsqrt\(([^)]+)\)/g, '$1\\sqrt{$2}')
        // Greek letters
        .replace(/(^|[^\\])\b(pi|theta|alpha|beta|gamma|lambda|mu|sigma|phi|omega)(?![a-zA-Z])/g, '$1\\$2');

    // 8. Validate parentheses balance
    const openParens = (expr.match(/\(/g) || []).length;
    const closeParens = (expr.match(/\)/g) || []).length;

    if (openParens !== closeParens) {
        console.warn(`⚠️ Unbalanced parentheses: ${expr}`);
        // Try to fix by adding missing parens
        if (openParens > closeParens) {
            expr += ')'.repeat(openParens - closeParens);
        }
    }

    // 9. Validate equals sign
    const equalsFixed = validateEqualsSign(expr);
    if (!equalsFixed) {
        return 'y=x'; // Invalid equation
    }
    expr = equalsFixed;

    // 10. Remove invalid characters for Desmos
    // Allow: letters, numbers, operators, parentheses, LaTeX commands, Greek symbols
    const allowedPattern = /[a-zA-Z0-9\s\(\)\+\-\*\/\=\^\.\,\:\\<\>\{\}\[\]_\|πθαβγλμσφω]/g;
    const filtered = expr.match(allowedPattern)?.join('') || expr;

    return filtered || 'y=x';
};

/**
 * Split expression into multiple Desmos statements if needed
 * Returns array of expressions
 */
export const parseMultipleExpressions = (expression) => {
    if (!expression || typeof expression !== 'string') {
        return ['y=x'];
    }

    // Split by statement separators
    const statements = splitStatements(expression);

    if (statements.length === 0) {
        return ['y=x'];
    }

    if (statements.length === 1) {
        // Single expression, just validate
        return [validateDesmosExpression(statements[0])];
    }

    // Multiple expressions, validate each
    return statements.map(stmt => validateDesmosExpression(stmt)).filter(Boolean);
};

/**
 * Check if expression is valid
 */
export const isValidDesmosExpression = (expression) => {
    if (!expression || typeof expression !== 'string') return false;

    // Check for obviously broken expressions
    const suspiciousPatterns = [
        /^\s*=/, // Starts with equals
        /function|const|let|var|=>|import|export/i, // JavaScript keywords
        /\{\s*\}/, // Empty braces (invalid piecewise)
    ];

    return suspiciousPatterns.every(pattern => !pattern.test(expression));
};
