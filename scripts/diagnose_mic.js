const http = require('http');

function evalInEngine(expr) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({ tool: 'eval', args: { expr } });
    const req = http.request({
      hostname: '127.0.0.1', port: 9287, path: '/mcp', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve(d); } });
    });
    req.write(payload); req.end();
  });
}

async function run() {
  const diag = await evalInEngine(`
    (async () => {
      const results = {};
      results.hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      results.hasSpeechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

      // 1. Test getUserMedia
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        results.getUserMediaSuccess = true;
        results.audioTracksCount = stream.getAudioTracks().length;
        results.audioTrackLabel = stream.getAudioTracks()[0]?.label;
        stream.getTracks().forEach(t => t.stop());
      } catch (err) {
        results.getUserMediaSuccess = false;
        results.getUserMediaError = err.name + ': ' + err.message;
      }

      // 2. Test SpeechRecognition
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        try {
          const rec = new SR();
          results.srInstantiated = true;
          // check what happens when starting
          let started = false;
          let error = null;
          rec.onstart = () => { started = true; };
          rec.onerror = (e) => { error = e.error || e.message; };
          try {
            rec.start();
            await new Promise(r => setTimeout(r, 800));
            rec.stop();
            results.srStarted = started;
            results.srError = error;
          } catch(startErr) {
            results.srStartException = startErr.message;
          }
        } catch(e) {
          results.srInstantiateError = e.message;
        }
      }

      return results;
    })()
  `);

  console.log("Mic Diagnosis in Engine:", diag);
}

run();
