const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (() => {
        // Search all elements for text 'NEW OBJECTIVE'
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const matches = [];
        let node;
        while (node = walker.nextNode()) {
          if (node.nodeValue && (node.nodeValue.includes('OBJECTIVE') || node.nodeValue.includes('WAYFARER') || node.nodeValue.includes('Investigate'))) {
            let p = node.parentElement;
            matches.push({
              text: node.nodeValue.trim(),
              tag: p.tagName,
              class: p.className,
              rect: p.getBoundingClientRect()
            });
          }
        }
        return matches;
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
  res.on('end', () => console.log('Text search in page:', d));
});
req.write(payload);
req.end();
