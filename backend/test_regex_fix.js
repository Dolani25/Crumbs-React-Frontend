
const http = require('http');

const pythonCode = `
class Test(Scene):
    def construct(self):
        # This was causing syntax error ...2
        y = ((x - center) / width)**2
        # This should also work
        z = x ** 2
        # This is unpacking (should be ...kwargs)
        func(**kwargs)
`;

const data = JSON.stringify({
    code: pythonCode
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/convert-manim',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log('Success:', JSON.parse(responseData).code);
        } else {
            console.error('Error Status:', res.statusCode);
            console.error('Error Body:', responseData);
        }
    });
});

req.on('error', (error) => {
    console.error('Request Error:', error);
});

req.write(data);
req.end();
