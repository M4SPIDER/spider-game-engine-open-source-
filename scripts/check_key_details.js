const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `(async () => {
      let key = localStorage.getItem('spider-meta-key-raw');
      if (!key && window.spiderShell?.decryptString) {
        const c = localStorage.getItem('spider-meta-key');
        if (c) {
          const r = await window.spiderShell.decryptString(c);
          key = r?.plain?.result || r?.plain;
        }
      }
      return JSON.stringify({
        hasKey: !!key,
        length: key ? key.length : 0,
        prefix: key ? key.slice(0, 6) : null,
        isGoogle: key ? key.startsWith('AIza') : false,
        isOpenAI: key ? key.startsWith('sk-') : false,
        isGroq: key ? key.startsWith('gsk_') : false
      });
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
  res.on('end', () => console.log('Result:', d));
});
req.write(payload);
req.end();
