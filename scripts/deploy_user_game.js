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

let merged = ss.slice(0, idx) + bgCode + '\n' + ss.slice(idx);

// Replace w-screen h-screen with w-full h-full so it fits perfectly in any viewport or window
merged = merged.replace('w-screen h-screen', 'w-full h-full');

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

// Normalize CRLF to LF
merged = merged.replace(/\r\n/g, '\n');

fs.writeFileSync('src/game/GameComponent.jsx', merged);
console.log('Successfully deployed GameComponent.jsx from ss.txt, length:', merged.length);
