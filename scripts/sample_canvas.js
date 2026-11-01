const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        const c = document.querySelector('canvas');
        if (!c) return 'No canvas found';
        const ctx = c.getContext('2d');
        // Sample 5 pixels: center, top, bottom, left, right
        const pCenter = ctx.getImageData(Math.round(c.width/2), Math.round(c.height/2), 1, 1).data;
        const pTop = ctx.getImageData(Math.round(c.width/2), 50, 1, 1).data;
        const pBottom = ctx.getImageData(Math.round(c.width/2), c.height - 50, 1, 1).data;
        return {
          center: Array.from(pCenter),
          top: Array.from(pTop),
          bottom: Array.from(pBottom)
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
  res.on('end', () => console.log('Sampled pixels:', d));
});
req.write(payload);
req.end();
