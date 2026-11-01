const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        const bodyText = document.body.innerText;
        return {
          hasText: bodyText.includes('Knowledge Park') || bodyText.includes('WAYFARER'),
          hasZ: bodyText.includes('Z:'),
          hasEmp: bodyText.includes('EMP'),
          bodySnippet: bodyText.slice(0, 400)
        };
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
  res.on('end', () => console.log('DOM check:', d));
});
req.write(payload);
req.end();
