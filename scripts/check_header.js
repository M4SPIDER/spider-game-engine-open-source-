const http = require('http');
const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `(() => {
      const asides = Array.from(document.querySelectorAll('aside'));
      const aiAside = asides.find(a => a.innerText.includes('Spider AI'));
      if (!aiAside) return 'Spider AI aside not open';
      const header = aiAside.querySelector('div');
      return {
        headerText: header?.innerText,
        buttons: Array.from(header?.querySelectorAll('button') || []).map(b => b.innerText || b.title)
      };
    })()`
  }
});
const req = http.request({
  hostname: '127.0.0.1', port: 9287, path: '/mcp', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
}, res => {
  let d = ''; res.on('data', c => d += c); res.on('end', () => console.log(JSON.parse(d)));
});
req.write(payload);
req.end();
