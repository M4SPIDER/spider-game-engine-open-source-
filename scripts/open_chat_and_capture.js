const http = require('http');
const fs = require('fs');

function evalInEngine(expr) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      tool: 'eval',
      args: { expr }
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
        try { resolve(JSON.parse(d)); } catch(e) { resolve(d); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  // Click nav Ask AI button
  const openRes = await evalInEngine(`
    (() => {
      const btns = Array.from(document.querySelectorAll('nav button'));
      const askBtn = btns.find(b => b.textContent.includes('Ask AI'));
      if (askBtn) {
        askBtn.click();
        return 'Clicked Ask AI button';
      }
      return 'Ask AI button not found';
    })()
  `);
  console.log('Open status:', openRes);

  await new Promise(r => setTimeout(r, 1000));

  // Focus chat textarea and type sample message
  const typeRes = await evalInEngine(`
    (() => {
      const tas = Array.from(document.querySelectorAll('textarea'));
      const chatTa = tas.find(t => t.placeholder.includes('Type') || t.placeholder.includes('Working'));
      if (!chatTa) return { error: 'Chat textarea not found', totalTextareas: tas.length };

      chatTa.focus();
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(chatTa, 'Compact sleek chat box with hidden scrollbars and full scrolling active!');
      chatTa.dispatchEvent(new Event('input', { bubbles: true }));

      const aside = chatTa.closest('aside');
      const rect = aside?.getBoundingClientRect();

      return {
        ok: true,
        asideWidth: rect?.width,
        asideHeight: rect?.height,
        val: chatTa.value
      };
    })()
  `);
  console.log('Type status:', typeRes);

  await new Promise(r => setTimeout(r, 600));

  // Capture screenshot
  const payload = JSON.stringify({ tool: 'captureWindow', args: {} });
  const req = http.request({
    hostname: '127.0.0.1', port: 9287, path: '/mcp', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
  }, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      try {
        const json = JSON.parse(d);
        if (json.ok && json.result?.dataUrl) {
          const b64 = json.result.dataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
          fs.writeFileSync('C:/Users/vvvr8/.gemini/antigravity/brain/d205d344-3bbb-4178-bd9f-04ce44a024d4/exact_game_live_view.jpg', Buffer.from(b64, 'base64'));
          console.log('Saved screenshot, bytes:', fs.statSync('C:/Users/vvvr8/.gemini/antigravity/brain/d205d344-3bbb-4178-bd9f-04ce44a024d4/exact_game_live_view.jpg').size);
        }
      } catch(e) { console.error(e); }
    });
  });
  req.write(payload);
  req.end();
}

run();
