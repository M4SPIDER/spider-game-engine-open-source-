const http = require('http');

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
  await new Promise(r => setTimeout(r, 1000));
  
  // 1. Click CONTINUE or Launch Game
  let res = await evalInEngine(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const contBtn = buttons.find(b => b.textContent.includes('CONTINUE'));
      if (contBtn) {
        contBtn.click();
        return 'Clicked CONTINUE';
      }
      return 'No continue button';
    })()
  `);
  console.log('1. Continue:', res);

  await new Promise(r => setTimeout(r, 600));

  // 2. Click Launch Game modal button
  res = await evalInEngine(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const launchBtn = buttons.find(b => b.textContent.includes('Launch Game') || b.textContent.includes('Start Journey'));
      if (launchBtn) {
        launchBtn.click();
        return 'Clicked Launch Game!';
      }
      return 'Launch Game button not found';
    })()
  `);
  console.log('2. Launch:', res);

  await new Promise(r => setTimeout(r, 1000));

  // 3. Click Fullscreen
  res = await evalInEngine(`
    (() => {
      const fullBtn = document.querySelector('button[title="Fullscreen Mode"]');
      if (fullBtn) {
        fullBtn.click();
        return 'Clicked Fullscreen';
      }
      return 'Fullscreen button not found';
    })()
  `);
  console.log('3. Fullscreen:', res);
}

run();
