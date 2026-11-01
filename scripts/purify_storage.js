const http = require('http');

function evalInEngine(expr) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({ tool: 'eval', args: { expr } });
    const req = http.request({
      hostname: '127.0.0.1', port: 9287, path: '/mcp', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d));
    });
    req.write(payload); req.end();
  });
}

async function run() {
  // Purify stored chat messages of all asterisks and remove blender cards
  await evalInEngine(`
    (() => {
      try {
        const raw = localStorage.getItem("spider-ai-sessions");
        if (raw) {
          const arr = JSON.parse(raw);
          const cleaned = arr.map(s => ({
            ...s,
            messages: (s.messages || []).map(m => {
              let a = String(m.a || '').replace(/\\*\\*(.*?)\\*\\*/g, '$1').replace(/\\*(.*?)\\*/g, '$1').replace(/\\*\\*/g, '');
              let q = String(m.q || '').replace(/\\*\\*(.*?)\\*\\*/g, '$1').replace(/\\*(.*?)\\*/g, '$1').replace(/\\*\\*/g, '');
              return { ...m, a, q, isBlenderCard: false };
            })
          }));
          localStorage.setItem("spider-ai-sessions", JSON.stringify(cleaned));
        }
      } catch(e) {}
      location.reload();
    })()
  `);
  console.log("Purified localStorage and reloaded engine");
}

run();
