const fs = require('fs');
let code = fs.readFileSync('src/game/GameComponent.jsx', 'utf8');

const oldHead = `  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none font-sans">`;

const newHead = `  return (
    <Html fullscreen style={{ pointerEvents: 'auto', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div className="relative w-full h-full overflow-hidden bg-slate-950 select-none font-sans">`;

if (code.includes(oldHead)) {
  code = code.replace(oldHead, newHead);
  console.log('Replaced oldHead (LF)');
} else {
  const oldHeadCRLF = oldHead.replace(/\n/g, '\r\n');
  if (code.includes(oldHeadCRLF)) {
    code = code.replace(oldHeadCRLF, newHead);
    console.log('Replaced oldHead (CRLF)');
  } else {
    console.log('oldHead not found!');
  }
}

const oldTail = `      </div>
    </div>
  );
}`;

const newTail = `      </div>
    </div>
    </Html>
  );
}`;

if (code.includes(oldTail)) {
  code = code.replace(oldTail, newTail);
  console.log('Replaced oldTail (LF)');
} else {
  const oldTailCRLF = oldTail.replace(/\n/g, '\r\n');
  if (code.includes(oldTailCRLF)) {
    code = code.replace(oldTailCRLF, newTail);
    console.log('Replaced oldTail (CRLF)');
  } else {
    console.log('oldTail not found!');
  }
}

fs.writeFileSync('src/game/GameComponent.jsx', code);
console.log('Updated GameComponent.jsx successfully!');
