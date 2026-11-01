const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        const els = document.querySelectorAll('*');
        const matches = [];
        for (const el of els) {
          if (el.className && typeof el.className === 'string') {
            if (el.className.includes('hud-glass') || el.className.includes('font-rpg') || el.className.includes('gold-line-fade')) {
              matches.push({ tag: el.tagName, class: el.className });
            }
          }
        }
        return { count: matches.length, matches: matches.slice(0, 10) };
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
  res.on('end', () => console.log('Matches:', d));
});
req.write(payload);
req.end();
