const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `(() => {
      // Look for Ask AI header button or Ask AI panel
      const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText?.trim()).filter(Boolean);
      return JSON.stringify({ buttons: buttons.slice(0, 30) });
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
  res.on('end', () => console.log('Buttons:', d));
});
req.write(payload);
req.end();
