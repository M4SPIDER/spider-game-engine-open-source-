const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        const c = document.querySelector('canvas');
        if (!c) return 'No canvas found';
        const ctx = c.getContext('2d');
        return {
          w: c.width,
          h: c.height,
          clientWidth: c.clientWidth,
          clientHeight: c.clientHeight
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
  res.on('end', () => console.log('Canvas info:', d));
});
req.write(payload);
req.end();
