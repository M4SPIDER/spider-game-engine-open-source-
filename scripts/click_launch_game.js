const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const launchBtn = buttons.find(b => b.textContent.includes('Launch Game') || b.textContent.includes('Start Journey'));
        if (launchBtn) {
          launchBtn.click();
          return 'Clicked Launch Game!';
        }
        return 'Launch Game button not found';
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
