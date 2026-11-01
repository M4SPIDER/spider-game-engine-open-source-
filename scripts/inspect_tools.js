const fs = require('fs');
const lines = fs.readFileSync('app.jsx', 'utf8').split('\n');
console.log(lines.slice(8280, 8330).join('\n'));
