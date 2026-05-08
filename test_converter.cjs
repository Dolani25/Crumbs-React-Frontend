const { convertPythonToTypeScript } = require('./backend/tools/manim-converter.js');

const code = `
class Test(Scene):
    def construct(self):
        i = 1
        # 1. Double braces in f-string (LaTeX)
        t1 = f"E_{{{i}}}"
        
        # 2. Raw f-string with backslashes
        t2 = rf"\\\\frac{1}{2}"
        
        # 3. Raw f-string with double braces
        t3 = rf"E_{{{i}}}"
        
        # 4. Standard f-string
        t4 = f"Value: {i}"
`;

const res = convertPythonToTypeScript(code);
console.log(res);
