const http = require('http');
const fs = require('fs');

const code = fs.readFileSync('src/game/GameComponent.jsx', 'utf8');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `
      (async () => {
        try {
          const freshCode = ${JSON.stringify(code)};

          // 1. Update localStorage
          localStorage.setItem('spider-active-jsx-code', freshCode);
          localStorage.setItem('spider-active-jsx-name', 'GameComponent.jsx');

          // 2. Open IndexedDB and update active-jsx-code
          const req = indexedDB.open('spider-engine-db', 2);
          await new Promise((resolve, reject) => {
            req.onsuccess = (e) => {
              const db = e.target.result;
              const tx = db.transaction(['scenes', 'scripts'], 'readwrite');
              const scenesStore = tx.objectStore('scenes');
              const scriptsStore = tx.objectStore('scripts');

              scenesStore.put({ id: 'active-jsx-code', code: freshCode, name: 'GameComponent.jsx', updatedAt: Date.now() });
              scriptsStore.put({
                name: 'GameComponent.jsx',
                path: 'src/game/GameComponent.jsx',
                content: freshCode,
                lines: freshCode.split('\\n').length,
                updatedAt: Date.now()
              });

              tx.oncomplete = () => resolve();
              tx.onerror = (err) => reject(err);
            };
            req.onerror = reject;
          });

          location.reload();
          return 'Successfully synced fresh code to IndexedDB & localStorage, and reloaded!';
        } catch(e) {
          return 'Sync error: ' + e.message;
        }
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
  res.on('end', () => console.log('Sync result:', d));
});
req.write(payload);
req.end();
