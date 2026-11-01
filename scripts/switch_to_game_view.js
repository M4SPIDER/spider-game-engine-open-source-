const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        // Find 'CONTINUE' button in Title Menu and click it
        const buttons = Array.from(document.querySelectorAll('button'));
        const continueBtn = buttons.find(b => b.textContent.includes('CONTINUE'));
        if (continueBtn) {
          continueBtn.click();
          return 'Clicked CONTINUE';
        }
        // Or find 'Game View' tab button
        const gameViewTab = buttons.find(b => b.textContent.includes('Game View'));
        if (gameViewTab) {
          gameViewTab.click();
          return 'Clicked Game View tab';
        }
        return 'No button found';
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
  res.on('end', () => console.log('Result:', d));
});
req.write(payload);
req.end();
