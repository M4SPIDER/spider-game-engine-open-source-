const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `(() => {
      const form = document.querySelector('form');
      if (!form) return 'no form found';
      const btns = Array.from(form.querySelectorAll('button')).map(b => ({
        html: b.innerHTML.slice(0, 100),
        className: b.className,
        title: b.title
      }));
      return JSON.stringify({ formFound: true, btns });
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
