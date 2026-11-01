const http = require('http');
const fs = require('fs');

const payload = JSON.stringify({
  tool: 'captureWindow',
  args: {}
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
  res.on('end', () => {
    try {
      const json = JSON.parse(d);
      if (json.ok && json.result?.dataUrl) {
        const b64 = json.result.dataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
        fs.writeFileSync('C:/Users/vvvr8/.gemini/antigravity/brain/d205d344-3bbb-4178-bd9f-04ce44a024d4/exact_game_live_view.jpg', Buffer.from(b64, 'base64'));
        console.log('Successfully saved full window capture to exact_game_live_view.jpg, bytes:', fs.statSync('C:/Users/vvvr8/.gemini/antigravity/brain/d205d344-3bbb-4178-bd9f-04ce44a024d4/exact_game_live_view.jpg').size);
      } else {
        console.log('Response:', json);
      }
    } catch(e) {
      console.error(e);
    }
  });
});
req.write(payload);
req.end();
