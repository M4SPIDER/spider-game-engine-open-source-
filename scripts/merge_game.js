const fs = require('fs');

const ss = fs.readFileSync('C:/Users/vvvr8/Downloads/New folder (4)/ss.txt', 'utf8');

const target = '// 5. THE PROTAGONIST';
const idx = ss.indexOf(target);
if (idx === -1) {
  console.error('Target not found in ss.txt!');
  process.exit(1);
}

const bgCode = `
      // =========================================================================
      // 1. MIDNIGHT SKY & STARS
      // =========================================================================
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#040813');
      skyGrad.addColorStop(0.5, '#081224');
      skyGrad.addColorStop(1, '#0e1d35');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, horizonY + 20);

      // Subtle twinkling stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 70; i++) {
        const sx = (i * 47 + 80) % width;
        const sy = (i * 29 + 30) % (horizonY - 140);
        const sa = 0.2 + ((Math.sin(time * 3 + i * 2) + 1) * 0.35);
        ctx.globalAlpha = sa;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }
      ctx.globalAlpha = 1;

      // =========================================================================
      // 2. CITY SKYLINE & SKYSCRAPERS WITH LIT WINDOWS
      // =========================================================================
      buildingDefs.forEach((b, bIdx) => {
        const bx = b.x + camX * 0.3;
        const by = b.y + camY * 0.3;

        // Building mass
        ctx.fillStyle = b.color;
        ctx.fillRect(bx, by, b.w, b.h);

        // Edge structure lines
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, b.w, b.h);

        // Rounded glowing amber crown for iconic cylindrical tower
        if (b.roundedCrown) {
          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.ellipse(bx + b.w / 2, by + 12, b.w / 2, 16, 0, 0, Math.PI * 2);
          ctx.fill();
          // Glowing horizontal amber rings
          for (let ring = 0; ring < 4; ring++) {
            ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
            ctx.fillRect(bx + 6, by + 16 + ring * 14, b.w - 12, 4);
          }
        }

        // Office Windows Grid
        const cellW = (b.w - 18) / b.cols;
        const cellH = (b.h - 55) / b.rows;
        const matrix = windowMatrix[bIdx];

        if (matrix) {
          for (let r = 0; r < b.rows; r++) {
            for (let c = 0; c < b.cols; c++) {
              const wInfo = matrix[r] && matrix[r][c];
              if (wInfo && wInfo.lit) {
                const wx = bx + 9 + c * cellW + cellW * 0.12;
                const wy = by + 40 + r * cellH + cellH * 0.18;
                const ww = cellW * 0.76;
                const wh = cellH * 0.64;
                ctx.fillStyle = wInfo.warm ? b.winColor1 : b.winColor2;
                ctx.globalAlpha = wInfo.brightness * 0.8;
                ctx.fillRect(wx, wy, ww, wh);
              }
            }
          }
          ctx.globalAlpha = 1;
        }
      });

      // Pedestrian Skybridge across the boulevard
      const bridgeY = horizonY - 142 + camY * 0.42;
      const bridgeH = 36;
      ctx.fillStyle = '#08101e';
      ctx.fillRect(440 + camX * 0.4, bridgeY, 830, bridgeH);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(440 + camX * 0.4, bridgeY, 830, bridgeH);

      // Skybridge illuminated interior windows
      ctx.fillStyle = 'rgba(254, 240, 138, 0.7)';
      for (let bw = 0; bw < 19; bw++) {
        ctx.fillRect(455 + camX * 0.4 + bw * 42, bridgeY + 8, 26, 20);
      }

      // Bright Glowing 'KNOWLEDGE PARK' Facade Sign
      const signX = 890 + camX * 0.42;
      const signY = bridgeY - 30;
      ctx.fillStyle = '#020617';
      ctx.fillRect(signX - 14, signY - 8, 380, 36);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(signX - 14, signY - 8, 380, 36);

      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.fillStyle = '#e0f2fe';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 18;
      ctx.fillText('KNOWLEDGE PARK', signX + 16, signY + 18);
      ctx.shadowBlur = 0;

      // =========================================================================
      // 3. TREE CANOPIES WITH GOLDEN FAIRY LIGHTS
      // =========================================================================
      const drawBoulevardTree = (tx, ty, scale) => {
        ctx.save();
        ctx.translate(tx, ty);
        ctx.scale(scale, scale);
        // Foliage
        ctx.fillStyle = '#09131a';
        ctx.beginPath();
        ctx.arc(0, -90, 68, 0, Math.PI * 2);
        ctx.arc(-36, -72, 52, 0, Math.PI * 2);
        ctx.arc(36, -72, 52, 0, Math.PI * 2);
        ctx.fill();
        // Warm golden fairy lights
        for (let f = 0; f < 36; f++) {
          const fx = Math.sin(f * 2.3) * 62;
          const fy = -102 + Math.cos(f * 1.7) * 46;
          const fa = 0.45 + Math.sin(time * 3.5 + f) * 0.55;
          ctx.fillStyle = '#fde047';
          ctx.globalAlpha = fa;
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 7;
          ctx.beginPath();
          ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.restore();
      };

      drawBoulevardTree(270 + camX * 0.6, horizonY + 25, 0.68);
      drawBoulevardTree(385 + camX * 0.7, horizonY + 48, 0.88);
      drawBoulevardTree(1450 + camX * 0.7, horizonY + 48, 0.88);
      drawBoulevardTree(1620 + camX * 0.6, horizonY + 25, 0.68);

      // =========================================================================
      // 4. THE WET ROAD: RAIN-SLICKED BOULEVARD, BOLLARDS & SPORTS CAR
      // =========================================================================
      // Wet asphalt dark base
      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      roadGrad.addColorStop(0, '#0e1726');
      roadGrad.addColorStop(0.35, '#0a0f19');
      roadGrad.addColorStop(0.7, '#070b13');
      roadGrad.addColorStop(1, '#04060a');
      ctx.fillStyle = roadGrad;
      ctx.fillRect(0, horizonY, width, height - horizonY);

      // Perspective pavement grid seams converging to vpX, vpY
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.24)';
      ctx.lineWidth = 1.3;
      for (let lane = -6; lane <= 6; lane++) {
        const bottomX = width / 2 + lane * 225 + camX;
        ctx.beginPath();
        ctx.moveTo(vpX, vpY);
        ctx.lineTo(bottomX, height);
        ctx.stroke();
      }

      // Horizontal pavement seams in perspective
      for (let hStep = 1; hStep <= 18; hStep++) {
        const py = horizonY + Math.pow(hStep / 18, 2.2) * (height - horizonY);
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(width, py);
        ctx.stroke();
      }

      // Specular Golden Light Reflections stretching down the wet asphalt
      const lightPillars = [
        { x: 385 + camX * 0.65, color: 'rgba(251, 191, 36, 0.38)', w: 90 },
        { x: 575 + camX * 0.6, color: 'rgba(245, 158, 11, 0.45)', w: 125 },
        { x: 790 + camX * 0.55, color: 'rgba(253, 224, 71, 0.35)', w: 90 },
        { x: 1045 + camX * 0.55, color: 'rgba(56, 189, 248, 0.35)', w: 110 },
        { x: 1285 + camX * 0.65, color: 'rgba(251, 191, 36, 0.42)', w: 145 },
        { x: 1515 + camX * 0.7, color: 'rgba(245, 158, 11, 0.35)', w: 105 },
      ];

      lightPillars.forEach(p => {
        const refGrad = ctx.createLinearGradient(0, horizonY, 0, height);
        refGrad.addColorStop(0, p.color);
        refGrad.addColorStop(0.4, p.color.replace(/[\\d.]+\\)$/, '0.22)'));
        refGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = refGrad;
        ctx.fillRect(p.x - p.w / 2, horizonY, p.w, height - horizonY);
      });

      // Roadside Amber Lantern Bollards (Glowing Light Cubes)
      const bollardList = [
        { x: 335, y: horizonY + 22, s: 0.38 },
        { x: 415, y: horizonY + 65, s: 0.52 },
        { x: 505, y: horizonY + 125, s: 0.72 },
        { x: 615, y: horizonY + 215, s: 0.95 },
        { x: 1325, y: horizonY + 215, s: 0.95 },
        { x: 1435, y: horizonY + 125, s: 0.72 },
        { x: 1525, y: horizonY + 65, s: 0.52 },
        { x: 1605, y: horizonY + 22, s: 0.38 },
      ];

      bollardList.forEach(b => {
        const bx = b.x + camX * (0.5 + b.s * 0.4);
        const by = b.y;
        const bw = 24 * b.s;
        const bh = 54 * b.s;

        // Dark Post
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(bx - bw / 2, by - bh, bw, bh);

        // Glowing Amber Cube
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 24 * b.s;
        ctx.fillRect(bx - bw * 0.6, by - bh - bw * 1.1, bw * 1.2, bw * 1.1);
        ctx.shadowBlur = 0;

        // Warm light cast on wet pavement
        const poolGrad = ctx.createRadialGradient(bx, by, 2, bx, by, 75 * b.s);
        poolGrad.addColorStop(0, 'rgba(251, 191, 36, 0.65)');
        poolGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.32)');
        poolGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = poolGrad;
        ctx.beginPath();
        ctx.ellipse(bx, by, 75 * b.s, 22 * b.s, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Black Sports Coupe parked on right side with Glowing Red LED Taillight
      const carX = 1420 + camX * 0.85;
      const carY = horizonY + 140;
      const carS = 0.88;
      ctx.save();
      ctx.translate(carX, carY);
      ctx.scale(carS, carS);

      // Car Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.beginPath();
      ctx.ellipse(0, 52, 145, 26, 0, 0, Math.PI * 2);
      ctx.fill();

      // Car Body
      const carGrad = ctx.createLinearGradient(-120, -50, 120, 50);
      carGrad.addColorStop(0, '#1e293b');
      carGrad.addColorStop(0.4, '#030712');
      carGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = carGrad;
      ctx.beginPath();
      ctx.roundRect(-110, -20, 220, 68, 14);
      ctx.fill();

      // Cabin Glass
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.moveTo(-75, -20);
      ctx.lineTo(-50, -52);
      ctx.lineTo(60, -52);
      ctx.lineTo(85, -20);
      ctx.closePath();
      ctx.fill();

      // Glowing Red LED Taillight Bar
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 18;
      ctx.fillRect(-95, 6, 190, 8);
      ctx.shadowBlur = 0;

      // Red reflection on wet pavement
      const carRefGrad = ctx.createRadialGradient(0, 52, 5, 0, 52, 95);
      carRefGrad.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
      carRefGrad.addColorStop(0.6, 'rgba(185, 28, 28, 0.22)');
      carRefGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = carRefGrad;
      ctx.beginPath();
      ctx.ellipse(0, 52, 95, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
`;

// Insert the Web Audio Engine and Three.js hooks at the top of the file
const audioAndThreeImports = `
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// --- SYNTHESIZED SOUND EFFECTS (WET ASPHALT RAIN, FOOTSTEPS & JUMP) ---
class WetAvenueAudio {
  constructor() {
    this.ctx = null;
    this.rainGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Soft rain ambient buffer
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const out = noiseBuffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        out[i] = (last + 0.02 * white) / 1.02;
        last = out[i];
        out[i] *= 1.2;
      }
      const rainSrc = this.ctx.createBufferSource();
      rainSrc.buffer = noiseBuffer;
      rainSrc.loop = true;

      const rainFilter = this.ctx.createBiquadFilter();
      rainFilter.type = 'lowpass';
      rainFilter.frequency.value = 950;

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(0.03, this.ctx.currentTime);

      rainSrc.connect(rainFilter);
      rainFilter.connect(this.rainGain);
      this.rainGain.connect(this.ctx.destination);
      rainSrc.start();

      this.initialized = true;
    } catch(e) {}
  }

  playStep(sprint) {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(sprint ? 140 : 100, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.08);
      g.gain.setValueAtTime(sprint ? 0.05 : 0.03, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.085);
    } catch(e) {}
  }

  playJump() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.2);
      g.gain.setValueAtTime(0.06, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.21);
    } catch(e) {}
  }
}

const wetAudio = new WetAvenueAudio();
`;

let merged = ss.replace(
  "import React, { useState, useEffect, useRef } from 'react';",
  "import React, { useState, useEffect, useRef } from 'react';" + audioAndThreeImports
);

// Insert background drawing code
const finalTarget = '// 5. THE PROTAGONIST';
const fIdx = merged.indexOf(finalTarget);
merged = merged.slice(0, fIdx) + bgCode + '\n' + merged.slice(fIdx);

// Add audio triggers to handleKeyDown
merged = merged.replace(
  "triggerJump();",
  "triggerJump(); wetAudio.playJump();"
);

// Add audio trigger to step
merged = merged.replace(
  "walkCycle: prev.walkCycle + (isSprinting ? 0.42 : 0.24)",
  "walkCycle: prev.walkCycle + (isSprinting ? 0.42 : 0.24)\n            }; if (Math.sin(prev.walkCycle * 2) < 0 && Math.sin((prev.walkCycle + 0.24) * 2) >= 0) { wetAudio.playStep(isSprinting); } return {"
);

// Add Menu exit button to HUD controls
merged = merged.replace(
  "{/* SPACE JUMP */}",
  `{/* EXIT TO ENGINE MENU */}
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('spider:return-to-menu'));
                }}
                className="pointer-events-auto px-3 h-6 sm:h-7 rounded-[3px] border border-rose-400/50 hover:border-rose-400 bg-rose-950/80 hover:bg-rose-900 text-rose-200 text-xs font-semibold uppercase flex items-center justify-center transition-all shadow cursor-pointer active:scale-95"
                title="Return to Spider Engine Menu (or press Esc)"
              >
                ✕ Menu
              </button>

              {/* SPACE JUMP */}`
);

// Inside App component, add Three.js scene background sync hook
const componentStart = 'export default function App() {';
const threeBackgroundHook = `export default function App() {
  // Sync 2D Canvas with Three.js scene.background for 3D Viewport capture
  const { scene } = useThree ? useThree() : { scene: null };
  const threeTextureRef = useRef(null);

  useEffect(() => {
    wetAudio.init();
    if (scene && canvasRef.current && !threeTextureRef.current) {
      try {
        const tex = new THREE.CanvasTexture(canvasRef.current);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        threeTextureRef.current = tex;
        scene.background = tex;
      } catch(e) {}
    }
    return () => {
      if (threeTextureRef.current) {
        try { threeTextureRef.current.dispose(); } catch(e) {}
        if (scene) scene.background = null;
      }
    };
  }, [scene]);

  if (typeof useFrame === 'function') {
    useFrame(() => {
      if (threeTextureRef.current) {
        threeTextureRef.current.needsUpdate = true;
      }
    });
  }
`;

merged = merged.replace(componentStart, threeBackgroundHook);

// Wrap return in <Html fullscreen> so Drei renders it flawlessly inside Fiber
const returnStart = 'return (\n    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none font-sans">';
const htmlWrapStart = `return (
    <>
      <Html fullscreen style={{ pointerEvents: 'auto', width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none font-sans">`;

merged = merged.replace(returnStart, htmlWrapStart);

// Close <Html> at the end
const returnEnd = '    </div>\n  );\n}';
const htmlWrapEnd = `    </div>
      </Html>
    </>
  );
}`;

merged = merged.replace(returnEnd, htmlWrapEnd);

// Also rename export to GameComponent for consistency
merged = merged.replace('export default function App()', 'export default function GameComponent()');

fs.writeFileSync('src/game/GameComponent.jsx', merged);
console.log('Successfully written src/game/GameComponent.jsx, length:', merged.length);
