const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        const tabs = ['Viewport', 'Cinematic', 'Game View', 'Title Menu', '3D View', '</> Code'];
        const buttons = Array.from(document.querySelectorAll('button'));
        const activeTabs = [];
        for (const t of tabs) {
          const btn = buttons.find(b => b.textContent.trim() === t);
          if (btn) {
            activeTabs.push({ name: t, class: btn.className });
          }
        }
        return activeTabs;
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
  res.on('end', () => console.log('Active tabs:', d));
});
req.write(payload);
req.end();
