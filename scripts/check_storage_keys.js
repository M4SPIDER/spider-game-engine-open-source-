const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `(() => {
      return JSON.stringify({
        metaKey: localStorage.getItem('spider-meta-key') ? (localStorage.getItem('spider-meta-key').slice(0, 8) + '...') : null,
        geminiKey: localStorage.getItem('spider-gemini-key') ? (localStorage.getItem('spider-gemini-key').slice(0, 8) + '...') : null,
        groqKey: localStorage.getItem('spider-groq-key') ? (localStorage.getItem('spider-groq-key').slice(0, 8) + '...') : null,
        openaiKey: localStorage.getItem('spider-openai-key') ? (localStorage.getItem('spider-openai-key').slice(0, 8) + '...') : null,
        keys: Object.keys(localStorage).filter(k => k.toLowerCase().includes('key') || k.toLowerCase().includes('api') || k.toLowerCase().includes('model'))
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
  res.on('end', () => console.log('Keys:', d));
});
req.write(payload);
req.end();
