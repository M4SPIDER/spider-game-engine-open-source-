const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        const hud = document.querySelector('.font-rpg-title');
        const canvases = Array.from(document.querySelectorAll('canvas'));
        return {
          hudFound: !!hud,
          canvases: canvases.map(c => ({
            w: c.width,
            h: c.height,
            class: c.className,
            parent: c.parentElement?.tagName + '.' + c.parentElement?.className
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
  res.on('end', () => console.log('Canvas debug:', d));
});
req.write(payload);
req.end();
