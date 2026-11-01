const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        try {
          const c = document.querySelectorAll('canvas')[1];
          if (!c) return { err: 'Canvas 1 not found' };
          const ctx = c.getContext('2d');
          // Sample pixel at 100, 100 (sky) and 100, 700 (ground)
          const pSky = Array.from(ctx.getImageData(100, 100, 1, 1).data);
          const pGround = Array.from(ctx.getImageData(100, 700, 1, 1).data);
          return { pSky, pGround };
        } catch(e) {
          return { err: e.message };
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
  res.on('end', () => console.log('Sampled 2D canvas pixels:', d));
});
req.write(payload);
req.end();
