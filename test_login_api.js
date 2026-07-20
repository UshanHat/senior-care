const http = require('http');

async function testLogin() {
    console.log("Testing login...");
    const data = JSON.stringify({
        identifier: 'ushanhathurusinghe@gmail.com',
        password: 'Ushan@123',
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
            'Origin': 'http://localhost:3000'
        }
    };

    const req = http.request(options, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            console.log('Status Code:', res.statusCode);
            console.log('Response Body:', body);
        });
    });

    req.on('error', error => {
        console.error('Error:', error);
    });

    req.write(data);
    req.end();
}

testLogin();
