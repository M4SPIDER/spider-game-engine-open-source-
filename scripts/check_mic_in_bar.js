const http = require('http');
const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `(() => {
      const container = document.querySelector('aside form .relative');
      if (!container) return { ok: false, error: 'container not found' };
      const ta = container.querySelector('textarea');
      const micBtn = container.querySelector('button');
      const waves = container.querySelectorAll('.muse-wave-bar');
      return {
        ok: true,
        taPlaceholder: ta?.placeholder,
        hasMicInside: !!micBtn,
        micTitle: micBtn?.title,
        waveBarsCount: waves.length
      };
    })()`
  }
});
const req = http.request({
  hostname: '127.0.0.1', port: 9287, path: '/mcp', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
}, res => {
  let d = ''; res.on('data', c => d += c); res.on('end', () => console.log(JSON.parse(d)));
});
req.write(payload);
req.end();
