const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        try {
          const code = localStorage.getItem('spider-active-jsx-code');
          if (!code) return { err: 'no code' };
          // Check if window.__lastDynamicJsxError is set
          let compError = null;
          // In app.jsx, activeJsxCode is in state. Let's inspect react root or active component
          const act = window.spiderEngine.getActiveComponent();
          return {
            actName: act.name,
            actLen: act.length,
            lastErr: window.__lastDynamicJsxError
          };
        } catch(e) {
          return { err: e.message, stack: e.stack };
        }
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
  res.on('end', () => console.log('Mount debug:', d));
});
req.write(payload);
req.end();
