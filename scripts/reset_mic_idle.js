const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `(async () => {
      const isListening = () => !!document.querySelector('.muse-wave-bar') || !!document.querySelector('span.text-red-500');
      const getBtn = () => Array.from(document.querySelectorAll('button')).find(b => b.title?.includes('Muse Transcriber'));

      // If currently listening, click to turn off so user starts fresh
      if (isListening()) {
        getBtn()?.click();
      }
      // Clear textarea prompt
      const ta = document.querySelector('textarea');
      if (ta) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(ta, '');
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return 'idle ready';
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
  res.on('end', () => console.log('Reset ready:', d));
});
req.write(payload);
req.end();
