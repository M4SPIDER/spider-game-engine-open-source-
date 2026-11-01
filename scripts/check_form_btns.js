const http = require('http');
const payload = JSON.stringify({
  tool: 'eval',
  args: { expr: "(() => { const form = document.querySelector('aside form'); return form ? Array.from(form.querySelectorAll('button')).map(b => ({ title: b.title, text: b.innerText })) : null; })()" }
});
const req = http.request({
  hostname: '127.0.0.1', port: 9287, path: '/mcp', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
}, res => {
  let d = ''; res.on('data', c => d += c); res.on('end', () => console.log(JSON.parse(d)));
});
req.write(payload);
req.end();
