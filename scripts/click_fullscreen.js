const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        const fullBtn = document.querySelector('button[title="Fullscreen Mode"]');
        if (fullBtn) {
          fullBtn.click();
          return 'Clicked Fullscreen button';
        }
        return 'Button not found';
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
  res.on('end', () => console.log('Response:', d));
});
req.write(payload);
req.end();
