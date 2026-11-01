const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `(() => {
      const askBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim() === 'Ask AI');
      if (askBtn) {
        askBtn.click();
        return 'clicked Ask AI';
      }
      return 'Ask AI button not found';
    })()`
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
  let d = ''; res.on('data', c => d += c);
  res.on('end', () => console.log('Click result:', d));
});
req.write(payload);
req.end();
