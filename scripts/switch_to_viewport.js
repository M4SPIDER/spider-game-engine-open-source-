const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const vpBtn = buttons.find(b => b.textContent.trim() === 'Viewport');
        if (vpBtn) {
          vpBtn.click();
          return 'Clicked Viewport tab';
        }
        return 'Viewport tab not found';
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
