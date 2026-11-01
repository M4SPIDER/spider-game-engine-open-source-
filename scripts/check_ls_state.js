const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        try {
          const code = localStorage.getItem('spider-active-jsx-code');
          return {
            hasCode: !!code,
            codeLen: code ? code.length : 0,
            includesEmp: code ? code.includes('[E] EMP') : false,
            includesCollision: code ? code.includes('SOLID COLLISION') : false,
            first200: code ? code.slice(0, 200) : ''
          };
        } catch(e) {
          return { error: e.message };
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
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => console.log('LocalStorage state:', d));
});
req.write(payload);
req.end();
