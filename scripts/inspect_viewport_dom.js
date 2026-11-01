const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        // Find all elements with className containing 'font-rpg' or 'canvas' or 'hud'
        const matches = [];
        document.querySelectorAll('*').forEach(el => {
          if (el.className && typeof el.className === 'string') {
            if (el.className.includes('rpg') || el.className.includes('hud') || el.className.includes('objective')) {
              const r = el.getBoundingClientRect();
              matches.push({
                tag: el.tagName,
                class: el.className,
                rect: { x: r.x, y: r.y, w: r.width, h: r.height },
                display: window.getComputedStyle(el).display,
                visibility: window.getComputedStyle(el).visibility,
                opacity: window.getComputedStyle(el).opacity,
                transform: window.getComputedStyle(el).transform
              });
            }
          }
        });
        return matches;
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
  res.on('end', () => console.log('DOM Elements in viewport:', d));
});
req.write(payload);
req.end();
