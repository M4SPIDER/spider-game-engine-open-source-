const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        const canvases = document.querySelectorAll('canvas');
        return {
          count: canvases.length,
          canvases: Array.from(canvases).map(c => ({
            width: c.width,
            height: c.height,
            className: c.className,
            dataUrlLen: c.toDataURL('image/jpeg', 0.5).length
          }))
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
}, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => console.log('Canvases in page:', d));
});
req.write(payload);
req.end();
