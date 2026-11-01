const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `(async () => {
      const results = {};
      try {
        results.spiderShell = !!window.spiderShell;
        if (window.spiderShell?.startSpeechRecognition) {
          const res = await window.spiderShell.startSpeechRecognition();
          results.startSpeechRes = res;
        }
      } catch (e) {
        results.error = e.message;
      }
      return JSON.stringify(results);
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
  res.on('end', () => console.log('Diagnostic result:', d));
});
req.write(payload);
req.end();
