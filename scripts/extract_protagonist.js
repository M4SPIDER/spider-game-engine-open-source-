// Construct the complete, 30+ min open-world GameComponent.jsx
const fs = require('fs');

const ss = fs.readFileSync('C:/Users/vvvr8/Downloads/New folder (4)/ss.txt', 'utf8');

// Extract the exact Hooded Protagonist rendering block from ss.txt
const startMarker = '// 5. THE PROTAGONIST';
const endMarker = 'ctx.restore();\n\n      // --- 6. FLOATING DYNAMIC PARTICLES';
const startIdx = ss.indexOf(startMarker);
const endIdx = ss.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found! start:', startIdx, 'end:', endIdx);
  process.exit(1);
}

const protagonistCode = ss.slice(startIdx, endIdx + 'ctx.restore();'.length);
console.log('Extracted protagonist code length:', protagonistCode.length);

fs.writeFileSync('scripts/extracted_protagonist.txt', protagonistCode, 'utf8');
