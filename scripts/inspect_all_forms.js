const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `(() => {
      const forms = Array.from(document.querySelectorAll('form'));
      return JSON.stringify(forms.map(f => ({
        inputs: Array.from(f.querySelectorAll('input,textarea')).map(i => i.placeholder || i.tagName),
        buttons: Array.from(f.querySelectorAll('button')).map(b => b.className + ' | ' + (b.title || b.innerText || 'icon'))
      })));
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
  res.on('end', () => console.log('Forms:', d));
});
req.write(payload);
req.end();
