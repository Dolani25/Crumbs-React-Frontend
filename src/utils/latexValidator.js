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

    // 2. Ensure backslashes are doubled (for JSON safety)
    // If already has double backslashes, don't double again
    // Check if expression has LaTeX commands (contains \ followed by letter)
    const hasLatex = /\\[a-zA-Z]+/.test(expr);

    if (hasLatex) {
        // Replace single backslash with double backslash ONLY if not already doubled
        expr = expr.replace(/([^\\])\\([a-zA-Z])/g, '$1\\\\$2');
        expr = expr.replace(/^\\([a-zA-Z])/g, '\\\\$1'); // Handle start of string
    }

    // 3. Common fixes for AI-generated expressions
    expr = expr
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
