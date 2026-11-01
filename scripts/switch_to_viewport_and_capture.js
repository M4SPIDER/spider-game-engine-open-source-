const http = require('http');
const fs = require('fs');

function evalInEngine(expr) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ tool: 'eval', args: { expr } });
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
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function capture() {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ tool: 'captureWindow', args: {} });
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
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  const res = await evalInEngine(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const vpBtn = btns.find(b => b.textContent.includes('3D View') || b.textContent.includes('3D Viewport'));
      if (vpBtn) {
        vpBtn.click();
        return 'Clicked 3D Viewport';
      }
      return 'No 3D Viewport button';
    })()
  `);
  console.log('Toggle:', res);

  await new Promise(r => setTimeout(r, 1000));
  const snap = await capture();
  if (snap.ok && snap.result?.dataUrl) {
    const b64 = snap.result.dataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
    fs.writeFileSync('C:/Users/vvvr8/.gemini/antigravity/brain/d205d344-3bbb-4178-bd9f-04ce44a024d4/exact_game_live_view.jpg', Buffer.from(b64, 'base64'));
    console.log('Saved exact_game_live_view.jpg, bytes:', fs.statSync('C:/Users/vvvr8/.gemini/antigravity/brain/d205d344-3bbb-4178-bd9f-04ce44a024d4/exact_game_live_view.jpg').size);
  }
}

run().catch(console.error);
