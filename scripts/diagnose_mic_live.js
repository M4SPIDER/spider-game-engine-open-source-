const http = require('http');

const payload = JSON.stringify({
  tool: 'eval',
  args: {
    expr: `(async () => {
      const results = {};
      results.hasSpiderShell = !!window.spiderShell;
      results.hasStartSpeech = !!window.spiderShell?.startSpeechRecognition;
      results.hasStopSpeech = !!window.spiderShell?.stopSpeechRecognition;
      results.hasOnSpeech = !!window.spiderShell?.onSpeechStream;

      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        results.audioInputs = devs.filter(d => d.kind === 'audioinput').map(d => ({ label: d.label, id: d.deviceId }));
      } catch (e) {
        results.enumerateError = e.message;
      }

      if (window.spiderShell?.startSpeechRecognition) {
        try {
          const res = await window.spiderShell.startSpeechRecognition();
          results.startSpeechRes = res;
        } catch (e) {
          results.startSpeechError = e.message;
        }
      }

      return JSON.stringify(results);
    })()`
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
}, res => {
  let d = ''; res.on('data', c => d += c);
  res.on('end', () => console.log('Diagnostic result:', d));
});
req.write(payload);
req.end();
