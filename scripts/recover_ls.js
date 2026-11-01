const http = require('http');
const fs = require('fs');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: 'localStorage.getItem("spider-active-jsx-code")'
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
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(d);
      if (parsed.ok && parsed.result) {
        fs.writeFileSync('recovered_spider_active_code.jsx', parsed.result);
        console.log('SUCCESS! Recovered code length:', parsed.result.length);
        console.log('First 200 chars:', parsed.result.slice(0, 200));
        console.log('Includes BALL RUNNER:', parsed.result.includes('BALL RUNNER'));
      } else {
        console.log('Raw response:', d);
      }
    } catch(e) {
      console.log('Parse error:', e.message);
    }
  });
});
req.write(payload);
req.end();
