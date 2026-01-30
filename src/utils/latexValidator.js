/**
 * Validates and sanitizes LaTeX expressions for Desmos
 * Ensures backslashes are properly escaped
 */

export const validateDesmosExpression = (expression) => {
    if (!expression || typeof expression !== 'string') {
        return 'y=x';
    }

    // 1. Trim whitespace
    let expr = expression.trim();

    // 2. Ensure backslashes are NOT doubled (Desmos expects single backslash for commands)
    // Removed faulty logic that doubled backslashes here.
    // We assume JSON.parse handles the initial escape.

    // 3. Common fixes for AI-generated expressions (Text -> LaTeX)
    expr = expr
        // Functions that need backslash
        .replace(/(^|[^\\])\b(sin|cos|tan|log|ln)(?![a-zA-Z])/g, '$1\\$2')
        // sqrt() needs braces: sqrt(x) -> \sqrt{x}
        // Simple regex for non-nested parens first
        .replace(/(^|[^\\])\bsqrt\(([^)]+)\)/g, '$1\\sqrt{$2}')
        // Greek letters
        .replace(/(^|[^\\])\b(pi|theta|alpha|beta|gamma|lambda|mu|sigma|phi|omega)\b/g, '$1\\$2')
        // Explicit fixes for already-backslashed but malformed
        .replace(/\\sin\(/g, '\\sin(') // Ensure sin is recognized
        .replace(/\\cos\(/g, '\\cos(')
        .replace(/\\tan\(/g, '\\tan(')
        .replace(/\\log\(/g, '\\log(')
        .replace(/\\ln\(/g, '\\ln(')
        .replace(/\\sqrt/g, '\\sqrt')
        .replace(/\\frac/g, '\\frac');

    // 4. Validate parentheses balance
    const openParens = (expr.match(/\(/g) || []).length;
    const closeParens = (expr.match(/\)/g) || []).length;

    if (openParens !== closeParens) {
        console.warn(`⚠️ Unbalanced parentheses in Desmos expression: ${expr}`);
        // Don't crash, just warn - Desmos might auto-fix
    }

    // 5. Remove any characters Desmos doesn't understand
    // Keep: letters, numbers, operators, parentheses, Greek letters, LaTeX commands
    const allowedPattern = /[a-zA-Z0-9\s\(\)\+\-\*\/\=\^\.\,\;\\{}\[\]_π∞]/g;
    const filtered = expr.match(allowedPattern)?.join('') || expr;

    return filtered || 'y=x'; // Fallback to safe expression
};

export const isValidDesmosExpression = (expression) => {
    if (!expression || typeof expression !== 'string') return false;

    // Check for obviously broken expressions
    const suspiciousPatterns = [
        /\\(sin|cos|tan|sqrt|frac|log|ln)(?![a-zA-Z])/, // Incomplete LaTeX
        /[{}]/, // Unescaped braces (might be JS code)
        /function|const|let|var|=>|import|export/i // JavaScript keywords
    ];

    return suspiciousPatterns.every(pattern => !pattern.test(expression));
};
