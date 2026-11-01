const http = require('http');
const fs = require('fs');

const code = fs.readFileSync('src/game/GameComponent.jsx', 'utf8');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        try {
          const newCode = ${JSON.stringify(code)};
          localStorage.setItem('spider-active-jsx-code', newCode);
          localStorage.setItem('spider-active-jsx-name', 'GameComponent.jsx');
          location.reload();
          return 'Updated active JSX code & reloaded!';
        } catch(e) {
          return 'Error: ' + e.message;
        }
      })()
    `
  }
});

const req = http.request({
  hostname: '127.0.0.1',
  port: 9287,
  path: '/mcp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => console.log('Result:', d));
});
req.write(payload);
req.end();
