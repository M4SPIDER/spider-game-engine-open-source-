const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        try {
          const canvases = document.querySelectorAll('canvas');
          return Array.from(canvases).map((c, idx) => {
            let ctx2d = null;
            try { ctx2d = c.getContext('2d'); } catch(e){}
            return {
              idx,
              w: c.width,
              h: c.height,
              has2d: !!ctx2d,
              className: c.className
            };
          });
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
  res.on('end', () => console.log('Canvases:', d));
});
req.write(payload);
req.end();
