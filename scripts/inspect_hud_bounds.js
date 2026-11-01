const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        const hudEl = document.querySelector('.hud-glass') || document.querySelector('.font-rpg-title');
        if (!hudEl) return 'No hudEl found';
        const rect = hudEl.getBoundingClientRect();
        const computed = window.getComputedStyle(hudEl);
        // Also find parent hierarchy
        let p = hudEl;
        const parents = [];
        while (p && p !== document.body) {
          const pr = p.getBoundingClientRect();
          parents.push({
            tag: p.tagName,
            class: p.className?.baseVal || p.className || '',
            rect: { top: pr.top, left: pr.left, width: pr.width, height: pr.height },
            opacity: window.getComputedStyle(p).opacity,
            display: window.getComputedStyle(p).display,
            visibility: window.getComputedStyle(p).visibility,
            transform: window.getComputedStyle(p).transform
          });
          p = p.parentElement;
        }
        return { rect, parents: parents.slice(0, 6) };
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
  res.on('end', () => console.log('Bounds:', d));
});
req.write(payload);
req.end();
