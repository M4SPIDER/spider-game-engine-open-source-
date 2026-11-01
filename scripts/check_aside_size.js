const http = require('http');

function evalInEngine(expr) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      tool: 'eval',
      args: { expr }
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
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch(e) { resolve(d); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  const res = await evalInEngine(`
    (() => {
      const asides = Array.from(document.querySelectorAll('aside'));
      return asides.map(a => {
        const rect = a.getBoundingClientRect();
        return {
          title: a.querySelector('span')?.textContent || 'aside',
          width: rect.width,
          height: rect.height,
          className: a.className
        };
      });
    })()
  `);
  console.log('Asides in page:', res);
}

run();
