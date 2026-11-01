const fs = require('fs');

const ss = fs.readFileSync('C:/Users/vvvr8/Downloads/New folder (4)/ss.txt', 'utf8').replace(/\r\n/g, '\n');

// 1. Extract SVG section
const svgStart = ss.indexOf('const DiamondIcon');
const svgEnd = ss.indexOf('export default function App()');
const svgSection = ss.slice(svgStart, svgEnd);

// 2. Extract Protagonist body
const pStart = ss.indexOf('// 5. THE PROTAGONIST');
const pEnd = ss.indexOf('// 6. ATMOSPHERIC RAIN & ROAD RIPPLES');
let protagonistBody = ss.slice(pStart, pEnd);

// Fix playerPos.y references and ensure character stays in third-person center
protagonistBody = protagonistBody.replace(
  'const charScale = Math.max(0.68, Math.min(1.18, 1 - playerPos.y * 0.0022));',
  'const charScale = 1.0;'
);
protagonistBody = protagonistBody.replace(
  'const charX = 785 + playerPos.x * 2.1;',
  'const charX = 785 + playerPos.x * 2.1;'
);
protagonistBody = protagonistBody.replace(
  'const charY = 668 - playerPos.y * 1.15 + (isJumping ? -55 : 0);',
  'const charY = 668 + (isJumping ? -55 : 0);'
);

const template = `import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Eye, 
  Sparkles, 
  RotateCcw,
  Zap,
  Radio,
  Shield,
  Volume2,
  VolumeX,
  Compass,
  Award,
  Terminal,
  Cpu,
  MapPin,
  ChevronRight,
  X
} from 'lucide-react';

// ============================================================================
// 1. WEB AUDIO SYNTHESIS ENGINE (Footsteps, Rain, Landing Audio)
// ============================================================================
class WayfarerAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.initialized = true;
    } catch {}
  }

  playFootstep(isSprint = false) {
    if (!this.ctx || this.muted) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime((isSprint ? 140 : 110) + Math.random() * 25, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.08);
      gain.gain.setValueAtTime(isSprint ? 0.08 : 0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }

  playJump() {
    if (!this.ctx || this.muted) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.22);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.23);
    } catch {}
  }

  playLanding() {
    if (!this.ctx || this.muted) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.14);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }
}

const audioEngine = new WayfarerAudio();

${svgSection}

// Hooded Avatar Icon for incoming transmission
const HoodedAvatarSVG = () => (
  <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
    <rect width="48" height="48" fill="#070a12" />
    <path d="M24 6 C14 6 10 16 10 28 C10 37 13 44 24 44 C35 44 38 37 38 28 C38 16 34 6 24 6 Z" fill="#111827" stroke="#e5c158" strokeWidth="1" />
    <path d="M24 10 C17 10 14 18 14 28 C14 36 17 41 24 41 C31 41 34 36 34 28 C34 18 31 10 24 10 Z" fill="#030712" />
    <ellipse cx="24" cy="26" rx="6" ry="8" fill="#020408" />
    <circle cx="21.5" cy="25" r="1" fill="#f59e0b" opacity="0.8" />
    <circle cx="26.5" cy="25" r="1" fill="#f59e0b" opacity="0.8" />
  </svg>
);

// 5 Expansive Districts for 30+ Minutes of Gameplay
const DISTRICTS = [
  {
    act: 1,
    name: 'District 1: Knowledge Park',
    district: 'Knowledge Park Boulevard',
    targetZ: 450,
    title: 'Investigate the signal in Knowledge Park',
    sender: 'INCOMING MESSAGE',
    transmission: 'Welcome back. Something has changed in Knowledge Park.',
    skybridgeSign: 'KNOWLEDGE PARK',
    roadLength: 500
  },
  {
    act: 2,
    name: 'District 2: Nexus Concourse',
    district: 'Nexus Elevated Expressway',
    targetZ: 1200,
    title: 'Bypass surveillance along Nexus Concourse',
    sender: 'ENCRYPTED TRANSMISSION',
    transmission: 'Corporate drones are patrolling the upper express lanes.',
    skybridgeSign: 'NEXUS HIGHWAY',
    roadLength: 1200
  },
  {
    act: 3,
    name: 'District 3: Aegis Plaza',
    district: 'Aegis Corporate Plaza',
    targetZ: 2100,
    title: 'Infiltrate Aegis central security core',
    sender: 'WAYFARER NETWORK',
    transmission: 'Security checkpoints active. Move swiftly through the plaza.',
    skybridgeSign: 'AEGIS CONCOURSE',
    roadLength: 2100
  },
  {
    act: 4,
    name: 'District 4: Cyber Bazaar',
    district: 'Old Cyber Bazaar',
    targetZ: 3200,
    title: 'Rendezvous with the broker in the Neon Alley',
    sender: 'UNDERGROUND RADIO',
    transmission: 'Look for the glowing lanterns beneath the elevated skyway.',
    skybridgeSign: 'CYBER BAZAAR',
    roadLength: 3200
  },
  {
    act: 5,
    name: 'District 5: Apex Spire',
    district: 'Apex Neural Spire',
    targetZ: 5000,
    title: 'Access the Neural Uplink at Apex Pinnacle',
    sender: 'COMMAND LINK',
    transmission: 'The apex spire uplink is within reach. Complete the journey.',
    skybridgeSign: 'APEX SPIRE',
    roadLength: 5000
  }
];

export default function GameComponent() {
  // Player Stats
  const [hp, setHp] = useState(100);
  const [stamina, setStamina] = useState(100);
  const [level, setLevel] = useState(12);
  const [xp, setXp] = useState(4820);
  const [actIndex, setActIndex] = useState(0);
  const currentAct = DISTRICTS[actIndex] || DISTRICTS[DISTRICTS.length - 1];

  // Continuous Open-World Coordinates (x: lateral boulevard, z: continuous forward travel)
  const [playerPos, setPlayerPos] = useState({
    x: 0,
    z: 0,
    vy: 0,
    isGrounded: true,
    angle: 0,
    walkCycle: 0
  });

  const [activeKeys, setActiveKeys] = useState({
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
    space: false
  });

  const [hudVisible, setHudVisible] = useState(true);
  const [rainIntensity, setRainIntensity] = useState(1.0);
  const [screenToast, setScreenToast] = useState(null);

  const canvasRef = useRef(null);
  const stepTimerRef = useRef(0);

  // Keyboard Listeners
  useEffect(() => {
    audioEngine.init();

    const handleKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(k)) {
        setActiveKeys((prev) => ({ ...prev, [k]: true }));
      } else if (e.key === 'Shift') {
        setActiveKeys((prev) => ({ ...prev, shift: true }));
      } else if (e.code === 'Space') {
        e.preventDefault();
        setActiveKeys((prev) => ({ ...prev, space: true }));
        setPlayerPos((p) => {
          if (p.isGrounded) {
            audioEngine.playJump();
            return { ...p, vy: 14, isGrounded: false };
          }
          return p;
        });
      } else if (k === 'arrowup') {
        setActiveKeys((prev) => ({ ...prev, w: true }));
      } else if (k === 'arrowdown') {
        setActiveKeys((prev) => ({ ...prev, s: true }));
      } else if (k === 'arrowleft') {
        setActiveKeys((prev) => ({ ...prev, a: true }));
      } else if (k === 'arrowright') {
        setActiveKeys((prev) => ({ ...prev, d: true }));
      }
    };

    const handleKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(k)) {
        setActiveKeys((prev) => ({ ...prev, [k]: false }));
      } else if (e.key === 'Shift') {
        setActiveKeys((prev) => ({ ...prev, shift: false }));
      } else if (e.code === 'Space') {
        setActiveKeys((prev) => ({ ...prev, space: false }));
      } else if (k === 'arrowup') {
        setActiveKeys((prev) => ({ ...prev, w: false }));
      } else if (k === 'arrowdown') {
        setActiveKeys((prev) => ({ ...prev, s: false }));
      } else if (k === 'arrowleft') {
        setActiveKeys((prev) => ({ ...prev, a: false }));
      } else if (k === 'arrowright') {
        setActiveKeys((prev) => ({ ...prev, d: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Continuous Physics & Forward Movement Game Loop (30+ minutes of travel)
  useEffect(() => {
    const interval = setInterval(() => {
      const isMoving = activeKeys.w || activeKeys.a || activeKeys.s || activeKeys.d;
      const isSprinting = isMoving && activeKeys.shift && stamina > 2;

      // Stamina Regeneration & Sprint Burn
      setStamina((prev) => {
        if (isSprinting) return Math.max(0, prev - 0.9);
        if (isMoving) return Math.min(100, prev + 0.15);
        return Math.min(100, prev + 0.65);
      });

      setPlayerPos((prev) => {
        let vy = prev.vy;
        let grounded = prev.isGrounded;

        // Gravity & Jump Physics
        if (!grounded) {
          vy -= 1.0;
          if (vy <= -14) {
            vy = 0;
            grounded = true;
            audioEngine.playLanding();
          }
        }

        // Speed Kinematics (Sprinting gives high speed forward!)
        const speed = isSprinting ? 2.6 : 1.35;
        let dx = 0;
        let dz = 0;

        if (activeKeys.w) dz += speed;
        if (activeKeys.s) dz -= speed * 0.7;
        if (activeKeys.a) dx -= speed * 0.95;
        if (activeKeys.d) dx += speed * 0.95;

        // Lateral Curb Boundaries (can walk freely across boulevard and both sidewalks)
        let nextX = Math.max(-175, Math.min(175, prev.x + dx));
        // INFINITE FORWARD TRAVEL: player can walk forward forever without any clamp!
        let nextZ = Math.max(0, prev.z + dz);

        // Gentle lateral deflection near parked sports coupe (x ~ 120, z ~ 45m)
        if (Math.abs(45 - nextZ) < 5.0 && nextX > 80 && nextX < 145) {
          if (activeKeys.d) nextX = 80;
        }

        // Footstep Audio
        if (grounded && isMoving) {
          stepTimerRef.current += (isSprinting ? 1.5 : 1.0);
          if (stepTimerRef.current > 18) {
            stepTimerRef.current = 0;
            audioEngine.playFootstep(isSprinting);
          }
        }

        let newAngle = prev.angle;
        if (dx !== 0 || dz !== 0) {
          newAngle = Math.atan2(dx, dz) * (180 / Math.PI);
        }

        return {
          x: nextX,
          z: nextZ,
          vy: vy,
          isGrounded: grounded,
          angle: newAngle,
          walkCycle: prev.walkCycle + (isMoving ? (isSprinting ? 0.38 : 0.22) : 0)
        };
      });
    }, 28);

    return () => clearInterval(interval);
  }, [activeKeys, stamina]);

  // District Checkpoint Progression
  useEffect(() => {
    if (playerPos.z >= currentAct.targetZ && actIndex < DISTRICTS.length - 1) {
      setActIndex((prev) => prev + 1);
      setLevel((l) => l + 1);
      setXp((x) => x + 1500);
      setScreenToast(`🎉 ENTERED ${DISTRICTS[actIndex + 1].district.toUpperCase()}!`);
      setTimeout(() => setScreenToast(null), 3500);
    }
  }, [playerPos.z, actIndex, currentAct.targetZ]);

  // Canvas Rendering (Wet Reflective Boulevard, High-Rise Skyline, Trees, Coupe & Protagonist)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const raindrops = Array.from({ length: 160 }, () => ({
      x: Math.random() * 1920,
      y: Math.random() * 1080,
      length: 14 + Math.random() * 16,
      speed: 16 + Math.random() * 10
    }));

    const ripples = Array.from({ length: 36 }, () => ({
      x: Math.random() * 1920,
      y: 600 + Math.random() * 460,
      radius: Math.random() * 16,
      maxRadius: 10 + Math.random() * 22,
      speed: 0.25 + Math.random() * 0.35
    }));

    // Skyscraper Definitions
    const buildingDefs = [
      { x: -30, y: -40, w: 330, h: 630, color: '#0a101d', winColor1: '#fde68a', winColor2: '#38bdf8', rows: 28, cols: 8 },
      { x: 465, y: 18, w: 245, h: 565, color: '#0c1626', winColor1: '#fef08a', winColor2: '#7dd3fc', rows: 32, cols: 12, roundedCrown: true },
      { x: 755, y: 115, w: 145, h: 470, color: '#0b1320', winColor1: '#fbd38d', winColor2: '#90cdf4', rows: 26, cols: 7, roundedCrown: true },
      { x: 915, y: 265, w: 85, h: 320, color: '#0f1b2d', winColor1: '#63b3ed', winColor2: '#fefcbf', rows: 18, cols: 5 },
      { x: 1020, y: 175, w: 78, h: 410, color: '#0c1524', winColor1: '#f6e05e', winColor2: '#63b3ed', rows: 22, cols: 4 },
      { x: 1115, y: -60, w: 540, h: 645, color: '#091322', winColor1: '#38bdf8', winColor2: '#fef08a', rows: 36, cols: 18 },
      { x: 1680, y: 35, w: 270, h: 550, color: '#080e1a', winColor1: '#fbbf24', winColor2: '#60a5fa', rows: 25, cols: 8 }
    ];

    const windowMatrix = buildingDefs.map((b, bIdx) => {
      const grid = [];
      for (let r = 0; r < b.rows; r++) {
        const row = [];
        for (let c = 0; c < b.cols; c++) {
          const hash = Math.sin(bIdx * 99 + r * 37 + c * 13) * 10000;
          const rand = hash - Math.floor(hash);
          row.push({
            lit: rand > 0.32,
            warm: rand > 0.65,
            brightness: 0.45 + rand * 0.55
          });
        }
        grid.push(row);
      }
      return grid;
    });

    let time = 0;

    const render = () => {
      time += 0.016;
      const width = 1920;
      const height = 1080;
      const horizonY = 582;

      const isMoving = activeKeys.w || activeKeys.a || activeKeys.s || activeKeys.d;
      const isSprinting = isMoving && activeKeys.shift && stamina > 2;
      const isJumping = !playerPos.isGrounded;

      const camX = -playerPos.x * 0.85;
      const camY = (isJumping ? -22 : 0) + (isMoving ? Math.sin(playerPos.walkCycle * 2) * 3.5 : Math.sin(time * 2) * 1.2);

      const vpX = 955 + camX * 0.55;
      const vpY = horizonY;

      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // 1. SKY & STARS
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#040813');
      skyGrad.addColorStop(0.5, '#081224');
      skyGrad.addColorStop(1, '#0e1d35');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, horizonY + 20);

      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 70; i++) {
        const sx = (i * 47 + 80) % width;
        const sy = (i * 29 + 30) % (horizonY - 140);
        const sa = 0.2 + ((Math.sin(time * 3 + i * 2) + 1) * 0.35);
        ctx.globalAlpha = sa;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }
      ctx.globalAlpha = 1;

      // 2. SKYSCRAPERS & LIT WINDOWS
      buildingDefs.forEach((b, bIdx) => {
        const bx = b.x + camX * 0.3;
        const by = b.y + camY * 0.3;

        ctx.fillStyle = b.color;
        ctx.fillRect(bx, by, b.w, b.h);

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, b.w, b.h);

        if (b.roundedCrown) {
          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.ellipse(bx + b.w / 2, by + 12, b.w / 2, 16, 0, 0, Math.PI * 2);
          ctx.fill();
          for (let ring = 0; ring < 4; ring++) {
            ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
            ctx.fillRect(bx + 6, by + 16 + ring * 14, b.w - 12, 4);
          }
        }

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

      // 3. PEDESTRIAN SKYBRIDGE (Elevated high above the road so road is 100% open!)
      const skybridgeRelZ = (140 - (playerPos.z % 400));
      if (skybridgeRelZ > -50 && skybridgeRelZ < 350) {
        const bridgeScale = Math.max(0.4, Math.min(1.8, 140 / Math.max(15, skybridgeRelZ + 140)));
        const bridgeY = horizonY - 260 * bridgeScale + camY * 0.42;
        const bridgeH = 38 * bridgeScale;

        ctx.fillStyle = '#08101e';
        ctx.fillRect(440 + camX * 0.4, bridgeY, 830 * bridgeScale, bridgeH);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.4;
        ctx.strokeRect(440 + camX * 0.4, bridgeY, 830 * bridgeScale, bridgeH);

        // Illuminated Skybridge Sign
        const signX = 890 + camX * 0.42;
        const signY = bridgeY - 30 * bridgeScale;
        ctx.fillStyle = '#020617';
        ctx.fillRect(signX - 14, signY - 8, 380 * bridgeScale, 36 * bridgeScale);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(signX - 14, signY - 8, 380 * bridgeScale, 36 * bridgeScale);

        ctx.font = `bold ${Math.round(22 * bridgeScale)}px Inter, sans-serif`;
        ctx.fillStyle = '#e0f2fe';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 18;
        ctx.fillText(currentAct.skybridgeSign, signX + 16, signY + 18 * bridgeScale);
        ctx.shadowBlur = 0;
      }

      // 4. TREES WITH WARM GOLDEN FAIRY LIGHTS
      const drawBoulevardTree = (tx, ty, scale) => {
        ctx.save();
        ctx.translate(tx, ty);
        ctx.scale(scale, scale);
        ctx.fillStyle = '#09131a';
        ctx.beginPath();
        ctx.arc(0, -90, 68, 0, Math.PI * 2);
        ctx.arc(-36, -72, 52, 0, Math.PI * 2);
        ctx.arc(36, -72, 52, 0, Math.PI * 2);
        ctx.fill();
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

      // 5. WET RAIN-SLICKED ROAD & PAVEMENT
      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      roadGrad.addColorStop(0, '#0e1726');
      roadGrad.addColorStop(0.35, '#0a0f19');
      roadGrad.addColorStop(0.7, '#070b13');
      roadGrad.addColorStop(1, '#04060a');
      ctx.fillStyle = roadGrad;
      ctx.fillRect(0, horizonY, width, height - horizonY);

      // Longitudinal perspective lane lines
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.24)';
      ctx.lineWidth = 1.3;
      for (let lane = -6; lane <= 6; lane++) {
        const bottomX = width / 2 + lane * 225 + camX;
        ctx.beginPath();
        ctx.moveTo(vpX, vpY);
        ctx.lineTo(bottomX, height);
        ctx.stroke();
      }

      // Transverse road lines scrolling smoothly forward as player walks!
      const roadForwardScroll = (playerPos.z * 18) % 180;
      for (let hStep = 1; hStep <= 22; hStep++) {
        const norm = (hStep * 32 - roadForwardScroll) / 704;
        if (norm <= 0) continue;
        const py = horizonY + Math.pow(norm, 2.2) * (height - horizonY);
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
        { x: 1515 + camX * 0.7, color: 'rgba(245, 158, 11, 0.35)', w: 105 }
      ];

      lightPillars.forEach((p) => {
        const refGrad = ctx.createLinearGradient(0, horizonY, 0, height);
        refGrad.addColorStop(0, p.color);
        refGrad.addColorStop(0.4, p.color.replace(/[\\d.]+\\)$/, '0.22)'));
        refGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = refGrad;
        ctx.fillRect(p.x - p.w / 2, horizonY, p.w, height - horizonY);
      });

      // Amber Lantern Bollards along both curbs
      const bollardList = [
        { x: 335, y: horizonY + 22, s: 0.38 },
        { x: 415, y: horizonY + 65, s: 0.52 },
        { x: 505, y: horizonY + 125, s: 0.72 },
        { x: 615, y: horizonY + 215, s: 0.95 },
        { x: 1395, y: horizonY + 215, s: 0.95 },
        { x: 1505, y: horizonY + 125, s: 0.72 },
        { x: 1595, y: horizonY + 65, s: 0.52 }
      ];

      bollardList.forEach((bl) => {
        const bx = bl.x + camX * 0.75;
        const by = bl.y + camY * 0.75;
        const s = bl.s;

        ctx.fillStyle = '#0b0f19';
        ctx.fillRect(bx - 12 * s, by, 24 * s, 68 * s);

        const glowGrad = ctx.createRadialGradient(bx, by - 4 * s, 2 * s, bx, by - 4 * s, 34 * s);
        glowGrad.addColorStop(0, '#fef08a');
        glowGrad.addColorStop(0.4, 'rgba(245, 158, 11, 0.85)');
        glowGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(bx, by - 4 * s, 34 * s, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(bx, by - 4 * s, 7 * s, 0, Math.PI * 2);
        ctx.fill();
      });

      // Parked Black Sports Coupe with glowing Red LED Tail Light Strip (on right curb)
      const carRelZ = 45 - playerPos.z;
      if (carRelZ > -30 && carRelZ < 220) {
        const carScale = Math.max(0.4, Math.min(1.6, 45 / Math.max(8, carRelZ + 45)));
        const carX = 1420 + camX * 0.8;
        const carY = horizonY + 175 * carScale + camY * 0.5;

        // Shadow under car
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.beginPath();
        ctx.ellipse(carX, carY + 35 * carScale, 140 * carScale, 20 * carScale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Car Body
        const coupeGrad = ctx.createLinearGradient(carX - 120 * carScale, carY, carX + 120 * carScale, carY);
        coupeGrad.addColorStop(0, '#020408');
        coupeGrad.addColorStop(0.5, '#090e17');
        coupeGrad.addColorStop(1, '#020408');
        ctx.fillStyle = coupeGrad;
        ctx.beginPath();
        ctx.roundRect(carX - 110 * carScale, carY - 25 * carScale, 220 * carScale, 55 * carScale, 18 * carScale);
        ctx.fill();

        // Glowing Red LED Tail Light
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 18;
        ctx.fillRect(carX - 85 * carScale, carY + 2 * carScale, 170 * carScale, 6 * carScale);
        ctx.shadowBlur = 0;
      }

      // =========================================================================
      // 6. THE HOODED WAYFARER PROTAGONIST (From ss.txt)
      // =========================================================================
      ${protagonistBody}

      // 7. RAINDROPS & RIPPLES
      if (rainIntensity > 0) {
        ctx.strokeStyle = 'rgba(224, 242, 254, 0.22)';
        ctx.lineWidth = 1;
        ripples.forEach((rip) => {
          rip.radius += rip.speed * rainIntensity;
          if (rip.radius > rip.maxRadius) {
            rip.radius = 1;
            rip.x = Math.random() * width;
          }
          ctx.beginPath();
          ctx.ellipse(rip.x, rip.y, rip.radius * 2.2, rip.radius * 0.55, 0, 0, Math.PI * 2);
          ctx.stroke();
        });

        ctx.strokeStyle = 'rgba(203, 213, 225, 0.28)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        raindrops.forEach((drop) => {
          drop.y += drop.speed * rainIntensity;
          drop.x -= 1.5 * rainIntensity;
          if (drop.y > height) {
            drop.y = -20;
            drop.x = Math.random() * width;
          }
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 2.5, drop.y + drop.length);
        });
        ctx.stroke();
      }

      // 8. CINEMATIC VIGNETTE
      const vigGrad = ctx.createRadialGradient(width / 2, height / 2, 540, width / 2, height / 2, 1100);
      vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vigGrad.addColorStop(1, 'rgba(0,0,0,0.52)');
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, width, height);

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [playerPos, activeKeys, rainIntensity, stamina, currentAct]);

  const handleVirtualKey = (key, state) => {
    if (key === 'space' && state) {
      setPlayerPos((p) => {
        if (p.isGrounded) {
          audioEngine.playJump();
          return { ...p, vy: 14, isGrounded: false };
        }
        return p;
      });
    }
    setActiveKeys((prev) => ({ ...prev, [key]: state }));
  };

  const distanceToTarget = Math.max(0, Math.round(currentAct.targetZ - playerPos.z));

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        .font-rpg-title { font-family: 'Cinzel', Georgia, serif; }
        .font-rpg-body { font-family: 'Cormorant Garamond', Georgia, serif; }
        .hud-glass {
          background: linear-gradient(90deg, rgba(12, 16, 24, 0.92) 0%, rgba(16, 21, 32, 0.82) 75%, rgba(16, 21, 32, 0.25) 100%);
          backdrop-filter: blur(10px);
        }
        .gold-line-fade {
          background: linear-gradient(90deg, rgba(229, 193, 88, 0.9) 0%, rgba(229, 193, 88, 0.4) 60%, rgba(229, 193, 88, 0) 100%);
        }
      `}</style>

      {/* FULLSCREEN CANVAS */}
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* DISTRICT NOTIFICATION */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center">
        <div className="bg-slate-950/90 border border-sky-400/80 px-6 py-2 rounded shadow-[0_0_22px_rgba(56,189,248,0.45)]">
          <span className="font-rpg-title text-sky-100 text-sm sm:text-base tracking-[0.3em] font-bold">
            {currentAct.district.toUpperCase()}
          </span>
          <span className="ml-3 text-xs text-amber-400 font-mono">Z: {Math.round(playerPos.z)}m</span>
        </div>
      </div>

      {/* TOAST MESSAGE */}
      {screenToast && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce">
          <div className="bg-amber-950/95 border border-amber-400/80 px-6 py-2.5 rounded shadow-2xl text-amber-200 font-semibold text-sm">
            {screenToast}
          </div>
        </div>
      )}

      {/* INTERACTIVE HUD OVERLAY */}
      {hudVisible && (
        <div className="relative z-20 w-full h-full pointer-events-none flex flex-col justify-between p-4 sm:p-7">
          {/* TOP ROW: OBJECTIVE, AVATAR MESSAGE & CREST */}
          <div className="flex justify-between items-start w-full">
            <div className="flex flex-col gap-2.5 max-w-md">
              {/* TOP-LEFT: OBJECTIVE PANEL */}
              <div className="pointer-events-auto group cursor-pointer hud-glass relative px-5 py-3 rounded-sm border-l-2 border-amber-400/70 shadow-xl">
                <div className="absolute top-0 left-0 right-0 h-[1px] gold-line-fade" />
                <div className="absolute bottom-0 left-0 right-0 h-[1px] gold-line-fade" />
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 shrink-0">
                    <DiamondIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-rpg-title text-[12px] tracking-[0.16em] text-[#e5c158] font-semibold uppercase">
                        ACT {currentAct.act} // NEW OBJECTIVE
                      </span>
                      <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                        🎯 {distanceToTarget}m
                      </span>
                    </div>
                    <div className="font-rpg-body text-white text-lg sm:text-[20px] font-medium leading-snug tracking-wide drop-shadow mt-0.5">
                      {currentAct.title}
                    </div>
                  </div>
                </div>
              </div>

              {/* INCOMING MESSAGE WITH HOODED AVATAR */}
              <div className="pointer-events-auto hud-glass relative px-4 py-2 rounded-sm border-l-2 border-amber-400/70 flex items-center gap-3.5 shadow-lg">
                <div className="w-10 h-10 rounded overflow-hidden border border-slate-600/60 shrink-0 bg-slate-900">
                  <HoodedAvatarSVG />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-rpg-title text-xs tracking-wider text-[#e5c158] font-semibold uppercase">
                    <StarSparkle className="w-3 h-3 text-[#e5c158]" />
                    <span>{currentAct.sender}</span>
                  </div>
                  <div className="font-rpg-body text-slate-100 text-xs sm:text-[14px] leading-snug tracking-wide mt-0.5">
                    {currentAct.transmission}
                  </div>
                </div>
              </div>
            </div>

            {/* TOP-RIGHT: WAYFARER LEVEL 12 CREST */}
            <div 
              onClick={() => setXp((x) => x + 300)}
              title="Click to test XP gain"
              className="pointer-events-auto cursor-pointer hud-glass relative px-5 py-2.5 rounded-sm border border-amber-400/30 flex items-center gap-3.5 shadow-2xl transition-transform hover:scale-105"
            >
              <WayfarerCrest className="w-11 h-11 shrink-0" />
              <div className="pr-2">
                <div className="font-rpg-title text-white text-sm sm:text-[15px] tracking-[0.18em] font-semibold leading-tight">
                  WAYFARER
                </div>
                <div className="font-rpg-title text-[#e5c158] text-xs sm:text-[13px] tracking-[0.15em] mt-0.5">
                  LEVEL {level} • <span className="text-slate-300">{xp} XP</span>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM ROW: ANALOG RADAR MINIMAP, HP/STAMINA, KEY BADGES */}
          <div className="flex flex-col md:flex-row items-center md:items-end justify-between w-full gap-4">
            {/* BOTTOM-LEFT: CIRCULAR RADAR MINIMAP */}
            <div className="pointer-events-auto relative flex items-center justify-center">
              <div className="absolute -top-3 z-30 bg-slate-950/90 px-1.5 py-0.2 rounded text-[13px] font-bold text-white tracking-wider border border-slate-600/60 shadow">
                N
              </div>

              <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full border-2 border-slate-300/70 shadow-[0_0_30px_rgba(0,0,0,0.85)] overflow-hidden relative bg-[#12161f]">
                <svg 
                  viewBox="0 0 200 200" 
                  className="w-full h-full transition-transform duration-150"
                  style={{
                    transform: `translate(${-playerPos.x * 0.35}px, ${(playerPos.z % 100) * 0.45}px)`
                  }}
                >
                  <rect width="200" height="200" fill="#10141d" />
                  
                  {/* City Street Blocks */}
                  <path d="M10 10 H70 V65 H10 Z" fill="#1c2230" />
                  <path d="M95 5 H185 V55 H95 Z" fill="#1c2230" />
                  <path d="M10 85 H65 V150 H10 Z" fill="#1c2230" />
                  <path d="M100 75 H190 V135 H100 Z" fill="#232a3b" />
                  <path d="M25 165 H85 V210 H25 Z" fill="#1c2230" />
                  <path d="M105 152 H185 V205 H105 Z" fill="#1c2230" />

                  {/* Road Network */}
                  <line x1="82" y1="0" x2="82" y2="200" stroke="#334155" strokeWidth="18" />
                  <line x1="82" y1="0" x2="82" y2="200" stroke="#fbbf24" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="70" x2="200" y2="70" stroke="#334155" strokeWidth="14" />
                  <line x1="0" y1="145" x2="200" y2="145" stroke="#334155" strokeWidth="14" />

                  {/* Objective Diamond Marker */}
                  <g transform="translate(82, 35)">
                    <polygon points="0,-6 6,0 0,6 -6,0" fill="#e5c158" stroke="#ffffff" strokeWidth="1" />
                    <circle cx="0" cy="0" r="8" fill="none" stroke="#e5c158" strokeWidth="1" opacity="0.6" />
                  </g>
                </svg>

                {/* Center Player Direction Arrow */}
                <div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ transform: `rotate(${playerPos.angle}deg)` }}
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                    <path d="M12 2 L20 20 L12 16 L4 20 Z" fill="#ffffff" />
                  </svg>
                </div>

                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_18px_rgba(0,0,0,0.85)] pointer-events-none" />
              </div>
            </div>

            {/* BOTTOM-CENTER: HP & STAMINA BARS */}
            <div className="pointer-events-auto flex flex-col gap-2 w-72 sm:w-[360px] mb-1">
              <div className="flex items-center justify-end gap-3">
                <span className="font-rpg-title text-white text-xs sm:text-[13px] tracking-[0.14em] font-semibold drop-shadow">
                  HP
                </span>
                <div 
                  onClick={() => setHp((h) => (h > 25 ? h - 15 : 100))}
                  title="Click to test HP"
                  className="cursor-pointer w-56 sm:w-72 h-2.5 bg-slate-950/90 border border-slate-500/60 p-[1px] rounded-[1px] shadow-lg overflow-hidden"
                >
                  <div 
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${hp}%`,
                      background: 'linear-gradient(90deg, #dc2626 0%, #f87171 65%, #fecaca 100%)',
                      boxShadow: '0 0 10px rgba(248, 113, 113, 0.65)'
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <span className="font-rpg-title text-white text-xs sm:text-[13px] tracking-[0.14em] font-semibold drop-shadow">
                  STAMINA
                </span>
                <div className="w-56 sm:w-72 h-2.5 bg-slate-950/90 border border-slate-500/60 p-[1px] rounded-[1px] shadow-lg overflow-hidden">
                  <div 
                    className="h-full transition-all duration-75"
                    style={{
                      width: `${stamina}%`,
                      background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 70%, #bae6fd 100%)',
                      boxShadow: '0 0 10px rgba(56, 189, 248, 0.65)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* BOTTOM-RIGHT: TACTILE KEYBOARD BADGES */}
            <div className="pointer-events-auto flex flex-wrap items-center gap-4 sm:gap-6 mb-1">
              {/* W A S D */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {['w', 'a', 's', 'd'].map((k) => (
                    <button
                      key={k}
                      onMouseDown={() => handleVirtualKey(k, true)}
                      onMouseUp={() => handleVirtualKey(k, false)}
                      onMouseLeave={() => handleVirtualKey(k, false)}
                      onTouchStart={() => handleVirtualKey(k, true)}
                      onTouchEnd={() => handleVirtualKey(k, false)}
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-[3px] border text-xs font-semibold uppercase flex items-center justify-center transition-all ${
                        activeKeys[k]
                          ? 'bg-amber-400 text-slate-950 border-amber-200 scale-95 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                          : 'bg-slate-950/85 text-white border-slate-300/80 hover:border-amber-300'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
                <span className="font-rpg-title text-white text-xs sm:text-[13px] tracking-[0.12em] font-medium drop-shadow">
                  MOVE
                </span>
              </div>

              {/* SHIFT SPRINT */}
              <div className="flex items-center gap-2">
                <button
                  onMouseDown={() => handleVirtualKey('shift', true)}
                  onMouseUp={() => handleVirtualKey('shift', false)}
                  onMouseLeave={() => handleVirtualKey('shift', false)}
                  onTouchStart={() => handleVirtualKey('shift', true)}
                  onTouchEnd={() => handleVirtualKey('shift', false)}
                  className={`px-2.5 h-6 sm:h-7 rounded-[3px] border text-xs font-semibold uppercase flex items-center justify-center transition-all ${
                    activeKeys.shift
                      ? 'bg-sky-400 text-slate-950 border-sky-200 scale-95 shadow-[0_0_12px_rgba(56,189,248,0.8)]'
                      : 'bg-slate-950/85 text-white border-slate-300/80 hover:border-sky-300'
                  }`}
                >
                  SHIFT
                </button>
                <span className="font-rpg-title text-white text-xs sm:text-[13px] tracking-[0.12em] font-medium drop-shadow">
                  SPRINT
                </span>
              </div>

              {/* SPACE JUMP */}
              <div className="flex items-center gap-2">
                <button
                  onMouseDown={() => handleVirtualKey('space', true)}
                  onMouseUp={() => handleVirtualKey('space', false)}
                  onMouseLeave={() => handleVirtualKey('space', false)}
                  onTouchStart={() => handleVirtualKey('space', true)}
                  onTouchEnd={() => handleVirtualKey('space', false)}
                  className={`px-3 h-6 sm:h-7 rounded-[3px] border text-xs font-semibold uppercase flex items-center justify-center transition-all ${
                    activeKeys.space
                      ? 'bg-amber-400 text-slate-950 border-amber-200 scale-95 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                      : 'bg-slate-950/85 text-white border-slate-300/80 hover:border-amber-300'
                  }`}
                >
                  SPACE
                </button>
                <span className="font-rpg-title text-white text-xs sm:text-[13px] tracking-[0.12em] font-medium drop-shadow">
                  JUMP
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/game/GameComponent.jsx', template, 'utf8');
console.log('Successfully wrote exact GameComponent.jsx, length:', template.length);
