const fs = require('fs');

function scan(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = dir + '/' + f;
    if (fs.statSync(p).isDirectory()) {
      if (f !== 'node_modules' && f !== 'dist' && f !== '.git') scan(p);
    } else if (p.endsWith('.js') || p.endsWith('.jsx')) {
      const content = fs.readFileSync(p, 'utf8');
      if (content.includes('preventDefault') && (content.includes('Space') || content.includes('space') || content.includes('code =='))) {
        console.log('Match in:', p);
      }
    }
  }
}
scan('src');
