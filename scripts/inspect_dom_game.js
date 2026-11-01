const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        const hud = document.querySelector('.font-rpg-title') || document.querySelector('svg');
        const allSvgs = Array.from(document.querySelectorAll('svg')).map(s => s.getAttribute('viewBox') || s.className?.baseVal || 'svg');
        const textElements = Array.from(document.querySelectorAll('*')).filter(el => el.textContent && (el.textContent.includes('NEW OBJECTIVE') || el.textContent.includes('WAYFARER') || el.textContent.includes('STAMINA'))).map(el => el.tagName + '.' + el.className);
        return {
          hasHud: !!hud,
          svgCount: allSvgs.length,
          svgs: allSvgs.slice(0, 10),
          matchingElements: textElements.slice(0, 10)
        };
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
  res.on('end', () => console.log('DOM check:', d));
});
req.write(payload);
req.end();
