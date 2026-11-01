const http = require('http');
const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `(() => {
      const aside = Array.from(document.querySelectorAll('aside')).find(a => a.innerText.includes('Chat') || a.innerText.includes('Spider AI'));
      if (!aside) return 'No AI aside';
      const form = aside.querySelector('form');
      const header = aside.querySelector('div.flex.items-center');
      const btns = Array.from(form ? form.querySelectorAll('button') : []).map(b => ({ title: b.title, class: b.className }));
      return {
        formExists: !!form,
        buttons: btns
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
