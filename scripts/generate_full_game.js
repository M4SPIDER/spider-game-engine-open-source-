// Script to generate the comprehensive, 30+ minute playable open-world GameComponent.jsx
const fs = require('fs');

const code = `import React, { useState, useEffect, useRef, useMemo } from 'react';
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
// 1. SOUND SYNTHESIS ENGINE (Web Audio API - Realistic SFX & Ambience)
// ============================================================================
class WayfarerAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.rainGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();
      this.initialized = true;

      // Start procedural rain ambient sound
      this.startRainAmbience();
    } catch (e) {
      console.warn('Web Audio not available:', e);
    }
  }

  startRainAmbience() {
    if (!this.ctx || this.muted) return;
    try {
      // White noise buffer for rain
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Bandpass filter to sculpt rain texture
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, this.ctx.currentTime);
      filter.Q.setValueAtTime(0.8, this.ctx.currentTime);

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(this.rainGain);
      this.rainGain.connect(this.ctx.destination);
      noise.start();
    } catch {}
  }

  playFootstep(isSprint = false) {
    if (!this.ctx || this.muted) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const now = this.ctx.currentTime;
      // Wet squish noise
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      const baseFreq = isSprint ? 140 : 110;
      osc.frequency.setValueAtTime(baseFreq + Math.random() * 30, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);

      gain.gain.setValueAtTime(isSprint ? 0.08 : 0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }

  playJump() {
    if (!this.ctx || this.muted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.15);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
    } catch {}
  }

  playLanding() {
    if (!this.ctx || this.muted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.12);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  playCarBump() {
    if (!this.ctx || this.muted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.2);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.23);
    } catch {}
  }

  playEmpBlast() {
    if (!this.ctx || this.muted) return;
    try {
      const now = this.ctx.currentTime;
      // Sub boom
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.45);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.52);

      // Cyber sweep
      const sweep = this.ctx.createOscillator();
      const sweepGain = this.ctx.createGain();
      sweep.type = 'sawtooth';
      sweep.frequency.setValueAtTime(900, now + 0.05);
      sweep.frequency.exponentialRampToValueAtTime(140, now + 0.4);

      sweepGain.gain.setValueAtTime(0.1, now + 0.05);
      sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      sweep.connect(sweepGain);
      sweepGain.connect(this.ctx.destination);
      sweep.start(now + 0.05);
      sweep.stop(now + 0.45);
    } catch {}
  }

  playScanner() {
    if (!this.ctx || this.muted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.linearRampToValueAtTime(980, now + 0.18);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }

  playChime(success = true) {
    if (!this.ctx || this.muted) return;
    try {
      const now = this.ctx.currentTime;
      const notes = success ? [523.25, 659.25, 783.99, 1046.50] : [330, 290, 220];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } catch {}
  }

  setMuted(m) {
    this.muted = m;
    if (this.rainGain) {
      this.rainGain.gain.setValueAtTime(m ? 0 : 0.04, this.ctx?.currentTime || 0);
    }
  }
}

const audio = new WayfarerAudio();

// ============================================================================
// 2. CUSTOM SVG ASSETS FOR EXACT RPG HUD FIDELITY
// ============================================================================
const DiamondIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none">
    <path 
      d="M16 2 L30 16 L16 30 L2 16 Z" 
      stroke="#e5c158" 
      strokeWidth="1.5" 
      fill="rgba(229, 193, 88, 0.12)"
    />
    <path d="M16 0 L16 5 M16 27 L16 32 M0 16 L5 16 M27 16 L32 16" stroke="#e5c158" strokeWidth="1.2" />
    <path 
      d="M16 8 L24 16 L16 24 L8 16 Z" 
      fill="#fff6d6" 
      className="animate-pulse"
    />
  </svg>
);

const StarSparkle = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#e5c158">
    <path d="M12 0 C12.5 8 16 11.5 24 12 C16 12.5 12.5 16 12 24 C11.5 16 8 12.5 0 12 C8 11.5 11.5 8 12 0 Z" />
  </svg>
);

const WayfarerCrest = ({ className = "w-11 h-11" }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none">
    <polygon 
      points="32,2 58,16 58,46 32,60 6,46 6,16" 
      stroke="#e5c158" 
      strokeWidth="2" 
      fill="rgba(15, 23, 42, 0.95)"
    />
    <polygon 
      points="32,6 54,18 54,44 32,56 10,44 10,18" 
      stroke="rgba(229, 193, 88, 0.4)" 
      strokeWidth="1" 
      fill="none"
    />
    <path 
      d="M18 36 L24 26 L32 32 L40 26 L46 36 L32 50 Z" 
      fill="#e5c158" 
      stroke="#fff6d6" 
      strokeWidth="1.2"
    />
    <path 
      d="M14 24 Q32 14 50 24" 
      stroke="#e5c158" 
      strokeWidth="1.8" 
      strokeLinecap="round"
    />
    <path d="M32 10 V48" stroke="#ffffff" strokeWidth="2" />
    <circle cx="32" cy="24" r="3" fill="#ffffff" />
  </svg>
);

const HoodedAvatarSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950">
    <circle cx="20" cy="30" r="8" fill="#fbbf24" opacity="0.15" />
    <circle cx="80" cy="25" r="12" fill="#38bdf8" opacity="0.12" />
    <path d="M8 100 C12 72 28 65 50 65 C72 65 88 72 92 100 Z" fill="#111318" stroke="#2d3340" strokeWidth="1" />
    <path d="M26 68 C22 40 32 14 50 12 C68 14 78 40 74 68 Z" fill="#181b22" stroke="#374151" strokeWidth="1.2" />
    <path d="M34 64 C32 43 38 24 50 22 C62 24 68 43 66 64 Z" fill="#050608" />
    <path d="M32 25 C40 15 55 15 65 25" stroke="#9ca3af" strokeWidth="1" fill="none" opacity="0.4" />
    <path d="M35 66 L50 78 L65 66" stroke="#cba358" strokeWidth="1" fill="none" opacity="0.5" />
  </svg>
);

// ============================================================================
// 3. STORY MISSIONS & OPEN-WORLD DISTRICT DEFINITIONS (30+ MIN PLAYTIME)
// ============================================================================
const STORY_ACTS = [
  {
    act: 1,
    district: "Knowledge Park Boulevard",
    targetZ: 120,
    title: "Investigate the Signal in Knowledge Park",
    details: "Approach the Skybridge Access Terminal at Z = 120m and hack into the surveillance feed.",
    sender: "INCOMING MESSAGE",
    transmission: "Welcome back, Wayfarer. A rogue encrypted signal has appeared in Knowledge Park. Investigate the terminal.",
    xpReward: 350,
    terminalId: "term_1"
  },
  {
    act: 2,
    district: "Nexus Highway Interchange",
    targetZ: 650,
    title: "Deactivate Nexus Highway Jammer",
    details: "Sprint down Nexus Highway, evade high-speed autonomous traffic, and disable the signal jammer.",
    sender: "CIPHER // ENCRYPTED",
    transmission: "Good work. Aegis security has activated highway patrol drones. Use [E] EMP to neutralize them if detected.",
    xpReward: 500,
    terminalId: "term_2"
  },
  {
    act: 3,
    district: "Aegis Corporate Plaza",
    targetZ: 1600,
    title: "Infiltrate Aegis Data Substation",
    details: "Reach the grand corporate plaza and override the substation to unlock District 4.",
    sender: "WAYFARER SYNDICATE",
    transmission: "You've entered Aegis core territory. Use [Q] Cyber Scanner to locate hidden Data Shards in the sector.",
    xpReward: 750,
    terminalId: "term_3"
  },
  {
    act: 4,
    district: "Old Cyber Bazaar",
    targetZ: 2800,
    title: "Locate the Underground Bazaar Contact",
    details: "Meet the tech merchant in Old Town Bazaar. Spend collected Energy Cores to upgrade your abilities.",
    sender: "BAZAAR FIXER",
    transmission: "Over here, Wayfarer. My stall is tucked behind the neon alley. I've got upgrades for your suit and EMP.",
    xpReward: 1000,
    terminalId: "term_4"
  },
  {
    act: 5,
    district: "Apex Spire - Knowledge Core",
    targetZ: 4500,
    title: "Override the Knowledge Grid Core",
    details: "Reach the Apex Spire courtyard at Z = 4500m, bypass the heavy Overseer Drone, and trigger master override.",
    sender: "SYSTEM OVERRIDE READY",
    transmission: "This is it. The master knowledge protocol is within reach. Connect all shards to free the city grid!",
    xpReward: 2000,
    terminalId: "term_5"
  }
];

// World Data Shards placed across the 5km boulevard
const WORLD_DATA_SHARDS = [
  { id: 'shard_1', z: 340, x: -6.5, name: 'Nexus Route Key', collected: false },
  { id: 'shard_2', z: 880, x: 6.8, name: 'Aegis Security Firmware', collected: false },
  { id: 'shard_3', z: 1850, x: -7.2, name: 'Corporate Grid Map', collected: false },
  { id: 'shard_4', z: 3100, x: 6.4, name: 'Bazaar Black-Market Code', collected: false },
  { id: 'shard_5', z: 4350, x: -5.8, name: 'Apex Master Encryption Key', collected: false }
];

// World Interactive Terminals
const WORLD_TERMINALS = [
  { id: 'term_1', z: 120, x: -5.8, name: 'Skybridge Network Hub', hacked: false },
  { id: 'term_2', z: 650, x: 6.2, name: 'Nexus Jammer Pedestal', hacked: false },
  { id: 'term_3', z: 1600, x: -6.0, name: 'Aegis Substation Console', hacked: false },
  { id: 'term_4', z: 2800, x: 6.5, name: 'Bazaar Vendor Terminal', hacked: false },
  { id: 'term_5', z: 4500, x: 0.0, name: 'Apex Core Master Terminal', hacked: false }
];

// Static Parked Obstacle Vehicles with Solid Box Colliders
const WORLD_VEHICLES = [
  { id: 'v1', x: 5.5, z: 45, w: 2.4, l: 4.8, type: 'coupe', color: '#090d16', lightColor: '#ef4444' },
  { id: 'v2', x: -5.6, z: 180, w: 2.6, l: 5.2, type: 'cruiser', color: '#0f172a', lightColor: '#38bdf8' },
  { id: 'v3', x: 5.8, z: 410, w: 2.8, l: 6.2, type: 'van', color: '#1e293b', lightColor: '#fbbf24' },
  { id: 'v4', x: -5.2, z: 920, w: 2.5, l: 5.0, type: 'coupe', color: '#111827', lightColor: '#f43f5e' },
  { id: 'v5', x: 5.6, z: 1400, w: 2.6, l: 5.4, type: 'limo', color: '#030712', lightColor: '#a855f7' },
  { id: 'v6', x: -5.5, z: 2400, w: 3.0, l: 7.0, type: 'truck', color: '#1c1917', lightColor: '#eab308' },
  { id: 'v7', x: 5.2, z: 3600, w: 2.5, l: 5.1, type: 'coupe', color: '#0c0a09', lightColor: '#06b6d4' }
];

// Highway traffic moving continuously in middle lanes
const TRAFFIC_LANES = [
  { id: 't1', x: -2.2, z: 90, speed: 17, color: '#1e293b', lightColor: '#f43f5e' },
  { id: 't2', x: -2.2, z: 420, speed: 16, color: '#0f172a', lightColor: '#ef4444' },
  { id: 't3', x: 2.2, z: 240, speed: 19, color: '#172554', lightColor: '#f59e0b' },
  { id: 't4', x: 2.2, z: 780, speed: 18, color: '#18181b', lightColor: '#ef4444' }
];

// Security Patrol Drones with Searchlights & EMP Vulnerability
const WORLD_DRONES = [
  { id: 'd1', z: 260, minX: -6, maxX: 6, x: 0, dir: 1, speed: 3.2, disabledTimer: 0 },
  { id: 'd2', z: 750, minX: -7, maxX: 7, x: -3, dir: 1, speed: 4.0, disabledTimer: 0 },
  { id: 'd3', z: 1250, minX: -6, maxX: 6, x: 4, dir: -1, speed: 4.5, disabledTimer: 0 },
  { id: 'd4', z: 2100, minX: -7, maxX: 7, x: -2, dir: 1, speed: 5.0, disabledTimer: 0 },
  { id: 'd5', z: 3400, minX: -6, maxX: 6, x: 1, dir: -1, speed: 5.2, disabledTimer: 0 },
  { id: 'd6', z: 4420, minX: -8, maxX: 8, x: 0, dir: 1, speed: 6.0, disabledTimer: 0, isBoss: true }
];

export default function App() {
  // --- PLAYER STATE ---
  const [player, setPlayer] = useState({
    x: 0,
    z: 15, // Starts at 15m on Knowledge Park Boulevard
    y: 0,  // Vertical jump altitude
    vx: 0,
    vz: 0,
    vy: 0,
    heading: 0,
    walkCycle: 0,
    isGrounded: true
  });

  const [hp, setHp] = useState(100);
  const [stamina, setStamina] = useState(100);
  const [maxStamina, setMaxStamina] = useState(100);
  const [level, setLevel] = useState(12);
  const [xp, setXp] = useState(320);
  const [energyCores, setEnergyCores] = useState(3);
  const [dataShards, setDataShards] = useState(WORLD_DATA_SHARDS);
  const [terminals, setTerminals] = useState(WORLD_TERMINALS);
  const [currentActIdx, setCurrentActIdx] = useState(0);

  // --- ABILITIES & FX ---
  const [empCooldown, setEmpCooldown] = useState(0);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerPulse, setScannerPulse] = useState(false);
  const [empShockwaves, setEmpShockwaves] = useState([]);
  const [screenMessage, setScreenMessage] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'hack' | 'vendor' | 'victory' | 'quest'
  const [hudVisible, setHudVisible] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [rainIntensity, setRainIntensity] = useState(1);

  // --- REFS & INPUT ---
  const canvasRef = useRef(null);
  const activeKeys = useRef({
    w: false, a: false, s: false, d: false,
    shift: false, space: false, e: false, q: false, f: false
  });
  const dronesRef = useRef(WORLD_DRONES);
  const trafficRef = useRef(TRAFFIC_LANES);
  const stepTimerRef = useRef(0);

  const currentAct = STORY_ACTS[currentActIdx] || STORY_ACTS[STORY_ACTS.length - 1];

  // Initialize Web Audio on first user interaction
  useEffect(() => {
    const handleFirstGesture = () => {
      audio.init();
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('mousedown', handleFirstGesture);
    };
    window.addEventListener('keydown', handleFirstGesture);
    window.addEventListener('mousedown', handleFirstGesture);
    return () => {
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('mousedown', handleFirstGesture);
    };
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      audio.init();
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') activeKeys.current.w = true;
      if (k === 's' || e.key === 'ArrowDown') activeKeys.current.s = true;
      if (k === 'a' || e.key === 'ArrowLeft') activeKeys.current.a = true;
      if (k === 'd' || e.key === 'ArrowRight') activeKeys.current.d = true;
      if (e.key === 'Shift') activeKeys.current.shift = true;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        triggerJump();
      }
      if (k === 'e') triggerEmpBlast();
      if (k === 'q') triggerScanner();
      if (k === 'f') triggerInteract();
      if (e.key === 'Escape') setActiveModal(null);
    };

    const handleKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') activeKeys.current.w = false;
      if (k === 's' || e.key === 'ArrowDown') activeKeys.current.s = false;
      if (k === 'a' || e.key === 'ArrowLeft') activeKeys.current.a = false;
      if (k === 'd' || e.key === 'ArrowRight') activeKeys.current.d = false;
      if (e.key === 'Shift') activeKeys.current.shift = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [player.isGrounded, empCooldown, activeModal]);

  // Jump Ability
  const triggerJump = () => {
    if (activeModal) return;
    setPlayer((prev) => {
      if (!prev.isGrounded) return prev;
      audio.playJump();
      return {
        ...prev,
        vy: 6.8, // Upward initial velocity
        isGrounded: false
      };
    });
  };

  // EMP Blast Ability [E]
  const triggerEmpBlast = () => {
    if (empCooldown > 0 || activeModal) return;
    setEmpCooldown(8); // 8 second cooldown
    audio.playEmpBlast();
    setEmpShockwaves((prev) => [
      ...prev,
      { x: player.x, z: player.z, radius: 0, maxRadius: 18, alpha: 1 }
    ]);

    // Check drones within 18m
    dronesRef.current.forEach((d) => {
      const dist = Math.hypot(d.x - player.x, d.z - player.z);
      if (dist < 18) {
        d.disabledTimer = 14; // Disable for 14 seconds
      }
    });

    setScreenMessage("⚡ EMP SHOCKWAVE DISCHARGED — PATROL DRONES DISABLED!");
    setTimeout(() => setScreenMessage(null), 3000);
  };

  // Cyber Scanner [Q]
  const triggerScanner = () => {
    if (scannerActive || activeModal) return;
    audio.playScanner();
    setScannerActive(true);
    setScannerPulse(true);
    setTimeout(() => setScannerPulse(false), 1200);
    setTimeout(() => setScannerActive(false), 6000);
  };

  // Contextual Interaction [F]
  const triggerInteract = () => {
    if (activeModal) return;

    // Check nearby terminal
    const nearbyTerminal = terminals.find((t) => Math.hypot(t.x - player.x, t.z - player.z) < 3.2);
    if (nearbyTerminal) {
      if (nearbyTerminal.id === 'term_4') {
        setActiveModal('vendor');
        audio.playChime(true);
        return;
      }
      setActiveModal('hack');
      audio.playChime(true);
      return;
    }

    // Check nearby collectible data shard
    const nearbyShard = dataShards.find((s) => !s.collected && Math.hypot(s.x - player.x, s.z - player.z) < 2.8);
    if (nearbyShard) {
      setDataShards((prev) => prev.map((s) => s.id === nearbyShard.id ? { ...s, collected: true } : s));
      setEnergyCores((c) => c + 1);
      setXp((x) => x + 250);
      audio.playChime(true);
      setScreenMessage(\`💾 RECOVERED DATA SHARD: \${nearbyShard.name} (+1 CORE, +250 XP)\`);
      setTimeout(() => setScreenMessage(null), 3500);
      return;
    }

    // Check parked car inspection
    const nearbyCar = WORLD_VEHICLES.find((v) => Math.hypot(v.x - player.x, v.z - player.z) < 3.5);
    if (nearbyCar) {
      audio.playCarBump();
      setScreenMessage("🚗 CYBER-COUPE SECURITY LOCKED: Trace registered to Knowledge Park Transit.");
      setTimeout(() => setScreenMessage(null), 2500);
    }
  };

  // Complete Hacking Mini-Game
  const handleHackSuccess = () => {
    const curTerm = terminals.find((t) => t.id === currentAct.terminalId);
    if (curTerm) {
      setTerminals((prev) => prev.map((t) => t.id === curTerm.id ? { ...t, hacked: true } : t));
    }
    setActiveModal(null);
    audio.playChime(true);
    setXp((x) => x + currentAct.xpReward);

    if (currentActIdx < STORY_ACTS.length - 1) {
      setCurrentActIdx((prev) => prev + 1);
      setScreenMessage(\`🎉 ACT \${currentAct.act} COMPLETE! UNLOCKED: \${STORY_ACTS[currentActIdx + 1].district}\`);
    } else {
      setActiveModal('victory');
    }
  };

  // Level Up Check
  useEffect(() => {
    if (xp >= 1000) {
      setLevel((l) => l + 1);
      setXp((x) => x - 1000);
      setMaxStamina((s) => s + 20);
      setHp(100);
      audio.playChime(true);
      setScreenMessage("⭐ WAYFARER LEVEL UP! MAX STAMINA & HP RESTORED");
      setTimeout(() => setScreenMessage(null), 4000);
    }
  }, [xp]);

  // EMP Cooldown Timer
  useEffect(() => {
    if (empCooldown <= 0) return;
    const t = setInterval(() => setEmpCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [empCooldown]);

  // ============================================================================
  // 4. MAIN KINEMATICS & RIGID COLLISION PHYSICS TICK (60 FPS)
  // ============================================================================
  useEffect(() => {
    const tickInterval = setInterval(() => {
      if (activeModal) return;

      const keys = activeKeys.current;
      const isMoving = keys.w || keys.a || keys.s || keys.d;
      const isSprinting = isMoving && keys.shift && stamina > 3;

      // Stamina drain and recovery
      setStamina((prev) => {
        if (isSprinting) return Math.max(0, prev - 0.45);
        if (isMoving) return Math.min(maxStamina, prev + 0.1);
        return Math.min(maxStamina, prev + 0.35);
      });

      // Update Drone Patrols
      dronesRef.current.forEach((d) => {
        if (d.disabledTimer > 0) {
          d.disabledTimer -= 0.03;
          return;
        }
        d.x += d.dir * d.speed * 0.03;
        if (d.x > d.maxX) { d.x = d.maxX; d.dir = -1; }
        if (d.x < d.minX) { d.x = d.minX; d.dir = 1; }
      });

      // Update Moving Traffic
      trafficRef.current.forEach((t) => {
        t.z += t.speed * 0.03;
        if (t.z > player.z + 400) t.z = player.z - 300;
        if (t.z < player.z - 300) t.z = player.z + 400;
      });

      // Update EMP Shockwave Expansion
      setEmpShockwaves((prev) =>
        prev
          .map((sw) => ({
            ...sw,
            radius: sw.radius + 0.6,
            alpha: Math.max(0, 1 - sw.radius / sw.maxRadius)
          }))
          .filter((sw) => sw.alpha > 0.02)
      );

      // Player Movement Kinematics
      setPlayer((prev) => {
        const moveSpeed = isSprinting ? 12.0 : 5.2; // meters/sec
        const accel = 32.0; // m/s^2
        const dt = 0.025; // tick delta

        let targetVx = 0;
        let targetVz = 0;

        if (keys.w) targetVz += moveSpeed;
        if (keys.s) targetVz -= moveSpeed * 0.7;
        if (keys.a) targetVx -= moveSpeed * 0.85;
        if (keys.d) targetVx += moveSpeed * 0.85;

        // Apply authentic wet asphalt friction / momentum
        const friction = 0.88;
        let newVx = prev.vx + (targetVx - prev.vx) * accel * dt * 0.18;
        let newVz = prev.vz + (targetVz - prev.vz) * accel * dt * 0.18;

        if (!keys.a && !keys.d) newVx *= friction;
        if (!keys.w && !keys.s) newVz *= friction;

        // Vertical Gravity & Jump Curve
        let newY = prev.y + prev.vy * dt;
        let newVy = prev.vy - 22.0 * dt; // Gravity g = 22 m/s^2
        let grounded = false;

        if (newY <= 0) {
          newY = 0;
          newVy = 0;
          grounded = true;
          if (!prev.isGrounded) audio.playLanding();
        }

        // Potential next positions
        let nextX = prev.x + newVx * dt;
        let nextZ = Math.max(0, prev.z + newVz * dt); // Infinite forward travel!

        // --- SOLID COLLISION RESOLUTION ---
        const playerRadius = 0.65; // meters

        // 1. Sidewalk Curbs / Building Bounds (Road width is 24m, +/-12m)
        if (nextX < -11.5) { nextX = -11.5; newVx = 0; }
        if (nextX > 11.5) { nextX = 11.5; newVx = 0; }

        // 2. Roadside Amber Bollards along curbs (at x = +/-7.6m every 24m)
        const bollardInterval = 24;
        const curZBlock = Math.round(nextZ / bollardInterval) * bollardInterval;
        [-7.6, 7.6].forEach((bx) => {
          const dist = Math.hypot(nextX - bx, nextZ - curZBlock);
          if (dist < playerRadius + 0.35) {
            // Deflect along tangent
            const angle = Math.atan2(nextZ - curZBlock, nextX - bx);
            nextX = bx + Math.cos(angle) * (playerRadius + 0.35);
            nextZ = curZBlock + Math.sin(angle) * (playerRadius + 0.35);
          }
        });

        // 3. Parked Vehicles (AABB Solid Colliders)
        WORLD_VEHICLES.forEach((v) => {
          const halfW = v.w / 2 + playerRadius;
          const halfL = v.l / 2 + playerRadius;
          if (
            nextX > v.x - halfW &&
            nextX < v.x + halfW &&
            nextZ > v.z - halfL &&
            nextZ < v.z + halfL
          ) {
            // Find minimal penetration axis to slide player smoothly
            const overlapX1 = nextX - (v.x - halfW);
            const overlapX2 = (v.x + halfW) - nextX;
            const overlapZ1 = nextZ - (v.z - halfL);
            const overlapZ2 = (v.z + halfL) - nextZ;
            const minOverlap = Math.min(overlapX1, overlapX2, overlapZ1, overlapZ2);

            if (minOverlap === overlapX1) nextX = v.x - halfW;
            else if (minOverlap === overlapX2) nextX = v.x + halfW;
            else if (minOverlap === overlapZ1) nextZ = v.z - halfL;
            else nextZ = v.z + halfL;

            audio.playCarBump();
          }
        });

        // 4. Moving Traffic Collision
        trafficRef.current.forEach((t) => {
          if (Math.hypot(nextX - t.x, nextZ - t.z) < 2.6) {
            // Player struck by vehicle!
            audio.playCarBump();
            setHp((h) => Math.max(10, h - 15));
            nextZ += 3.5; // Bump forward
          }
        });

        // Footstep Audio Synchronization
        const speedMagnitude = Math.hypot(newVx, newVz);
        if (grounded && speedMagnitude > 0.8) {
          stepTimerRef.current += speedMagnitude * dt;
          if (stepTimerRef.current > (isSprinting ? 2.4 : 1.6)) {
            stepTimerRef.current = 0;
            audio.playFootstep(isSprinting);
          }
        }

        // Heading Angle Calculation
        let newHeading = prev.heading;
        if (speedMagnitude > 0.4) {
          newHeading = Math.atan2(newVx, newVz) * (180 / Math.PI);
        }

        return {
          x: nextX,
          z: nextZ,
          y: newY,
          vx: newVx,
          vz: newVz,
          vy: newVy,
          heading: newHeading,
          walkCycle: prev.walkCycle + speedMagnitude * dt * (isSprinting ? 1.6 : 1.1),
          isGrounded: grounded
        };
      });
    }, 25);

    return () => clearInterval(tickInterval);
  }, [stamina, maxStamina, activeModal]);

  // ============================================================================
  // 5. PROCEDURAL 3D CANVAS PERSPECTIVE RENDERER (60 FPS)
  // ============================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let time = 0;

    const render = () => {
      time += 0.016;
      const width = canvas.width;
      const height = canvas.height;
      const horizonY = height * 0.54;
      const fov = 680;

      // 3D Camera tracking player down the boulevard
      const camX = player.x * 0.72;
      const camZ = player.z - 8.2; // Third-person chase cam 8.2m behind
      const camY = player.y * 0.35 + 2.5;

      const vpX = width / 2;
      const vpY = horizonY;

      // 3D Perspective Projection Helper
      const project = (wx, wy, wz) => {
        const relZ = wz - camZ;
        if (relZ <= 0.6) return null;
        const scale = fov / relZ;
        const sx = vpX + (wx - camX) * scale;
        const sy = vpY - (wy - camY) * scale;
        return { x: sx, y: sy, scale, relZ };
      };

      ctx.clearRect(0, 0, width, height);

      // --- 1. MIDNIGHT SKYLINE & RAIN ATMOSPHERE ---
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#030712');
      skyGrad.addColorStop(0.6, '#081020');
      skyGrad.addColorStop(1, '#0e1c36');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, horizonY + 15);

      // Twinkling Midnight Stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 65; i++) {
        const sx = (i * 49 + 75) % width;
        const sy = (i * 31 + 25) % (horizonY - 80);
        const sa = 0.25 + Math.sin(time * 3 + i) * 0.35;
        ctx.globalAlpha = sa;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }
      ctx.globalAlpha = 1;

      // --- 2. PROCEDURAL SKYSCRAPER TOWERS (Sorted by Depth) ---
      for (let b = -8; b <= 8; b++) {
        if (b === 0) continue; // Leave central avenue open
        const bx = b * 22;
        const bZStart = Math.floor(camZ / 60) * 60 - 60;
        for (let bz = bZStart; bz < camZ + 380; bz += 60) {
          const pBottom = project(bx, 0, bz);
          const pTop = project(bx, 85, bz);
          if (pBottom && pTop && pBottom.relZ > 5) {
            const bWidth = 18 * pBottom.scale;
            const bHeight = pBottom.y - pTop.y;

            // Building facade
            ctx.fillStyle = '#060a14';
            ctx.fillRect(pBottom.x - bWidth / 2, pTop.y, bWidth, bHeight);

            // Lit window matrices
            ctx.fillStyle = b % 2 === 0 ? 'rgba(251, 191, 36, 0.65)' : 'rgba(56, 189, 248, 0.55)';
            const winRows = 8;
            const winCols = 4;
            const ww = (bWidth * 0.7) / winCols;
            const wh = (bHeight * 0.75) / winRows;
            for (let r = 0; r < winRows; r++) {
              for (let c = 0; c < winCols; c++) {
                if ((r + c + Math.floor(bz / 10)) % 3 === 0) {
                  ctx.fillRect(
                    pBottom.x - bWidth * 0.35 + c * (ww + 3),
                    pTop.y + 20 + r * (wh + 4),
                    ww,
                    wh
                  );
                }
              }
            }
          }
        }
      }

      // --- 3. WET RAIN-SLICKED BOULEVARD & SPECULAR PAVEMENT ---
      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      roadGrad.addColorStop(0, '#0d1524');
      roadGrad.addColorStop(0.35, '#090d18');
      roadGrad.addColorStop(0.8, '#05070d');
      roadGrad.addColorStop(1, '#020306');
      ctx.fillStyle = roadGrad;
      ctx.fillRect(0, horizonY, width, height - horizonY);

      // Longitudinal Road Perspective Seams & Lane Stripes
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.lineWidth = 1.4;
      [-12, -7.5, -2.5, 2.5, 7.5, 12].forEach((laneX) => {
        const pFar = project(laneX, 0, camZ + 350);
        const pNear = project(laneX, 0, camZ + 3);
        if (pFar && pNear) {
          ctx.beginPath();
          ctx.moveTo(pFar.x, pFar.y);
          ctx.lineTo(pNear.x, pNear.y);
          ctx.stroke();
        }
      });

      // Transverse Road Marking Seams (Scroll continuously as player runs forward!)
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.22)';
      const zOffset = player.z % 6;
      for (let zStep = 4; zStep < 280; zStep += 6) {
        const pLeft = project(-12, 0, camZ + zStep - zOffset);
        const pRight = project(12, 0, camZ + zStep - zOffset);
        if (pLeft && pRight) {
          ctx.beginPath();
          ctx.moveTo(pLeft.x, pLeft.y);
          ctx.lineTo(pRight.x, pRight.y);
          ctx.stroke();
        }
      }

      // Specular Golden Light Reflection Columns on Wet Asphalt
      [-7.5, -3, 3, 7.5].forEach((rx) => {
        const pFar = project(rx, 0, camZ + 240);
        const pNear = project(rx, 0, camZ + 2);
        if (pFar && pNear) {
          const colGrad = ctx.createLinearGradient(0, pFar.y, 0, height);
          colGrad.addColorStop(0, 'rgba(251, 191, 36, 0.38)');
          colGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.18)');
          colGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = colGrad;
          ctx.fillRect(pFar.x - 35, pFar.y, 70, height - pFar.y);
        }
      });

      // --- 4. OVERHEAD SKYBRIDGES & DISTRICT SIGNS ---
      [
        { z: 120, name: "KNOWLEDGE PARK", color: "#38bdf8" },
        { z: 650, name: "NEXUS HIGHWAY OVERPASS", color: "#fbbf24" },
        { z: 1600, name: "AEGIS RESEARCH DATA VAULT", color: "#f43f5e" },
        { z: 2800, name: "OLD TOWN CYBER BAZAAR", color: "#a855f7" },
        { z: 4500, name: "APEX SPIRE - KNOWLEDGE CORE", color: "#34d399" }
      ].forEach((bridge) => {
        if (bridge.z > camZ - 5 && bridge.z < camZ + 360) {
          const pL = project(-14, 0, bridge.z);
          const pR = project(14, 0, bridge.z);
          const pTop = project(0, 14, bridge.z);
          if (pL && pR && pTop) {
            const bridgeW = pR.x - pL.x;
            const bridgeH = 26 * pTop.scale;

            // Bridge Beam
            ctx.fillStyle = '#060a14';
            ctx.fillRect(pL.x, pTop.y, bridgeW, bridgeH);
            ctx.strokeStyle = bridge.color;
            ctx.lineWidth = 1.8;
            ctx.strokeRect(pL.x, pTop.y, bridgeW, bridgeH);

            // Illuminated District Sign
            const signW = Math.min(bridgeW * 0.65, 340 * pTop.scale);
            const signH = 34 * pTop.scale;
            const signX = (pL.x + pR.x) / 2 - signW / 2;
            const signY = pTop.y - signH * 0.4;

            ctx.fillStyle = '#020617';
            ctx.fillRect(signX, signY, signW, signH);
            ctx.strokeStyle = bridge.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(signX, signY, signW, signH);

            ctx.font = \`bold \${Math.max(10, 17 * pTop.scale)}px 'Cinzel', serif\`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.shadowColor = bridge.color;
            ctx.shadowBlur = 12;
            ctx.fillText(bridge.name, (pL.x + pR.x) / 2, signY + signH * 0.68);
            ctx.shadowBlur = 0;
            ctx.textAlign = 'start';
          }
        }
      });

      // --- 5. ROADSIDE BOLLARDS (GLOWING AMBER CUBES) ---
      const minBollardZ = Math.floor(camZ / 24) * 24 - 24;
      for (let bz = minBollardZ; bz < camZ + 180; bz += 24) {
        [-7.6, 7.6].forEach((bx) => {
          const p = project(bx, 0, bz);
          if (p && p.relZ > 2) {
            const bw = 16 * p.scale;
            const bh = 34 * p.scale;
            // Concrete base
            ctx.fillStyle = '#171d29';
            ctx.fillRect(p.x - bw / 2, p.y - bh, bw, bh);
            // Glowing amber lantern cube
            ctx.fillStyle = '#fbbf24';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 14;
            ctx.fillRect(p.x - bw * 0.4, p.y - bh, bw * 0.8, bh * 0.4);
            ctx.shadowBlur = 0;
          }
        });
      }

      // --- 6. WORLD OBJECTS & VEHICLES (Depth-Sorted) ---
      const renderEntities = [];

      // Parked vehicles
      WORLD_VEHICLES.forEach((v) => {
        if (v.z > camZ - 5 && v.z < camZ + 220) {
          renderEntities.push({ type: 'vehicle', z: v.z, data: v });
        }
      });

      // Moving traffic
      trafficRef.current.forEach((t) => {
        if (t.z > camZ - 5 && t.z < camZ + 220) {
          renderEntities.push({ type: 'traffic', z: t.z, data: t });
        }
      });

      // Terminals
      terminals.forEach((term) => {
        if (term.z > camZ - 5 && term.z < camZ + 200) {
          renderEntities.push({ type: 'terminal', z: term.z, data: term });
        }
      });

      // Collectible Shards
      dataShards.forEach((s) => {
        if (!s.collected && s.z > camZ - 5 && s.z < camZ + 200) {
          renderEntities.push({ type: 'shard', z: s.z, data: s });
        }
      });

      // Drones
      dronesRef.current.forEach((d) => {
        if (d.z > camZ - 5 && d.z < camZ + 220) {
          renderEntities.push({ type: 'drone', z: d.z, data: d });
        }
      });

      // Player entity
      renderEntities.push({ type: 'player', z: player.z, data: player });

      // Sort entities back to front (descending Z relative to camera)
      renderEntities.sort((a, b) => b.z - a.z);

      renderEntities.forEach((ent) => {
        if (ent.type === 'vehicle' || ent.type === 'traffic') {
          const v = ent.data;
          const p = project(v.x, 0, v.z);
          if (p && p.relZ > 1) {
            const vw = (v.w || 2.5) * 16 * p.scale;
            const vh = 24 * p.scale;

            // Vehicle Body
            ctx.fillStyle = v.color || '#0a0e17';
            ctx.fillRect(p.x - vw / 2, p.y - vh, vw, vh);

            // Glowing Tail Light LED Strip
            ctx.fillStyle = v.lightColor || '#ef4444';
            ctx.shadowColor = v.lightColor || '#ef4444';
            ctx.shadowBlur = 16;
            ctx.fillRect(p.x - vw * 0.45, p.y - vh * 0.45, vw * 0.9, 5 * p.scale);

            // Ground Red Reflection
            ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, vw * 0.6, 8 * p.scale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        } else if (ent.type === 'terminal') {
          const t = ent.data;
          const p = project(t.x, 0, t.z);
          if (p && p.relZ > 1) {
            const tw = 20 * p.scale;
            const th = 42 * p.scale;
            // Pedestal
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(p.x - tw / 2, p.y - th, tw, th);
            ctx.strokeStyle = t.hacked ? '#22c55e' : '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(p.x - tw / 2, p.y - th, tw, th);

            // Floating Holographic Screen
            ctx.fillStyle = t.hacked ? 'rgba(34, 197, 94, 0.85)' : 'rgba(56, 189, 248, 0.85)';
            ctx.shadowColor = t.hacked ? '#22c55e' : '#38bdf8';
            ctx.shadowBlur = 12;
            ctx.fillRect(p.x - tw * 0.6, p.y - th - 18 * p.scale, tw * 1.2, 14 * p.scale);
            ctx.shadowBlur = 0;
          }
        } else if (ent.type === 'shard') {
          const s = ent.data;
          const p = project(s.x, Math.sin(time * 4) * 0.3 + 0.8, s.z);
          if (p && p.relZ > 1) {
            // Floating glowing data core
            ctx.fillStyle = '#e5c158';
            ctx.shadowColor = '#e5c158';
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 9 * p.scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        } else if (ent.type === 'drone') {
          const d = ent.data;
          const p = project(d.x, 3.2, d.z);
          const pGround = project(d.x, 0, d.z);
          if (p && pGround && p.relZ > 1) {
            const dw = 28 * p.scale;
            const dh = 14 * p.scale;

            // Drone Chasis
            ctx.fillStyle = d.disabledTimer > 0 ? '#475569' : '#0f172a';
            ctx.fillRect(p.x - dw / 2, p.y - dh / 2, dw, dh);
            ctx.strokeStyle = d.disabledTimer > 0 ? '#94a3b8' : '#ef4444';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(p.x - dw / 2, p.y - dh / 2, dw, dh);

            // Red Searchlight Cone on Ground (if active)
            if (d.disabledTimer <= 0) {
              const spotGrad = ctx.createRadialGradient(pGround.x, pGround.y, 2, pGround.x, pGround.y, 45 * pGround.scale);
              spotGrad.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
              spotGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
              ctx.fillStyle = spotGrad;
              ctx.beginPath();
              ctx.ellipse(pGround.x, pGround.y, 45 * pGround.scale, 16 * pGround.scale, 0, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        } else if (ent.type === 'player') {
          // --- 7. HOODED WAYFARER KINEMATIC CHARACTER RENDER ---
          const p = project(player.x, player.y, player.z);
          if (p && p.relZ > 0.8) {
            const scale = p.scale;
            const px = p.x;
            const py = p.y;

            ctx.save();
            ctx.translate(px, py);
            ctx.scale(scale * 0.42, scale * 0.42);

            // Asphalt Water Ripple & Specular Reflection
            ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
            ctx.beginPath();
            ctx.ellipse(0, 0, 75, 24, 0, 0, Math.PI * 2);
            ctx.fill();

            // Puddle ripple
            const rippleR = ((player.walkCycle * 25) % 80);
            ctx.strokeStyle = \`rgba(229, 193, 88, \${Math.max(0, 0.5 - rippleR / 120)})\`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(0, 0, rippleR, rippleR * 0.35, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Stride swing angles
            const stride = Math.sin(player.walkCycle) * 32;
            const oppStride = -stride;

            // Combat Boots & Articulated Cargo Legs
            const drawLeg = (hipX, isRight) => {
              const s = isRight ? stride : oppStride;
              const footX = hipX + s * 0.6;
              const footY = -s * 0.25;

              ctx.strokeStyle = '#0f172a';
              ctx.lineWidth = 18;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(hipX, -110);
              ctx.lineTo(footX, footY - 14);
              ctx.stroke();

              // Lug Boot
              ctx.fillStyle = '#05070a';
              ctx.fillRect(footX - 14, footY - 16, 28, 16);
              // Gold lace buckle
              ctx.fillStyle = '#e5c158';
              ctx.fillRect(footX - 6, footY - 12, 12, 4);
            };

            drawLeg(-28, false);
            drawLeg(28, true);

            // Flowing Billowed Leather Trenchcoat
            ctx.fillStyle = '#090d15';
            ctx.beginPath();
            ctx.moveTo(-54, -135);
            ctx.lineTo(54, -135);
            ctx.lineTo(65 + stride * 0.35, -20);
            ctx.lineTo(-65 + oppStride * 0.35, -20);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(229, 193, 88, 0.35)';
            ctx.lineWidth = 1.6;
            ctx.stroke();

            // Tactical Utility Belt & Pouches
            ctx.fillStyle = '#030508';
            ctx.fillRect(-52, -138, 104, 18);
            ctx.fillStyle = '#e5c158';
            ctx.fillRect(-12, -137, 24, 16);

            // Contoured Hardshell Tactical Backpack with Cyan LED
            ctx.fillStyle = '#0e1422';
            ctx.roundRect(-36, -215, 72, 85, 12);
            ctx.fill();
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Pulsing Cyan LED Status Light
            ctx.fillStyle = '#38bdf8';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 10;
            ctx.fillRect(-18, -170, 36, 6);
            ctx.shadowBlur = 0;

            // Natural Draped Charcoal Cowl Hood
            ctx.fillStyle = '#0a0e18';
            ctx.beginPath();
            ctx.moveTo(-45, -215);
            ctx.quadraticCurveTo(0, -290, 45, -215);
            ctx.quadraticCurveTo(0, -230, -45, -215);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(229, 193, 88, 0.45)';
            ctx.lineWidth = 1.8;
            ctx.stroke();

            ctx.restore();
          }
        }
      });

      // --- 8. EMP SHOCKWAVES EXPANSION ON WET ASPHALT ---
      empShockwaves.forEach((sw) => {
        const p = project(sw.x, 0, sw.z);
        if (p && p.relZ > 0.5) {
          const r = sw.radius * 24 * p.scale;
          ctx.strokeStyle = \`rgba(56, 189, 248, \${sw.alpha})\`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, r, r * 0.38, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // --- 9. RAIN STREAKS OVERLAY ---
      if (rainIntensity > 0) {
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.35)';
        ctx.lineWidth = 1.2;
        const streakCount = rainIntensity === 1 ? 90 : 160;
        for (let r = 0; r < streakCount; r++) {
          const rx = (r * 37 + time * 650) % width;
          const ry = (r * 29 + time * 1200) % height;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 7, ry + 24);
          ctx.stroke();
        }
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [player, rainIntensity, empShockwaves, terminals, dataShards]);

  // Calculate distance to active mission target
  const distanceToTarget = Math.max(0, Math.round(currentAct.targetZ - player.z));

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 select-none font-sans">
      <style>{\`
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
      \`}</style>

      {/* 3D CANVAS */}
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* DYNAMIC DISTRICT SIGN NOTIFICATION */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center">
        <div className="bg-slate-950/90 border border-sky-400/80 px-6 py-2 rounded shadow-[0_0_22px_rgba(56,189,248,0.45)]">
          <span className="font-rpg-title text-sky-100 text-sm sm:text-base tracking-[0.3em] font-bold">
            {currentAct.district}
          </span>
          <span className="ml-3 text-xs text-amber-400 font-mono">Z: {Math.round(player.z)}m</span>
        </div>
      </div>

      {/* NOTIFICATION TOAST */}
      {screenMessage && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce">
          <div className="bg-amber-950/95 border border-amber-400/80 px-6 py-2.5 rounded shadow-2xl text-amber-200 font-semibold text-sm">
            {screenMessage}
          </div>
        </div>
      )}

      {/* INTERACTIVE HUD OVERLAY */}
      {hudVisible && (
        <div className="relative z-20 w-full h-full pointer-events-none flex flex-col justify-between p-4 sm:p-6">
          {/* TOP ROW: OBJECTIVE & CREST */}
          <div className="flex justify-between items-start w-full">
            {/* TOP-LEFT: NEW OBJECTIVE & INCOMING MESSAGE */}
            <div className="flex flex-col gap-2.5 max-w-md">
              <div 
                onClick={() => setActiveModal('quest')}
                className="pointer-events-auto group cursor-pointer hud-glass relative px-5 py-3 rounded-sm border-l-2 border-amber-400/70 transition-all hover:brightness-110 shadow-xl"
              >
                <div className="absolute top-0 left-0 right-0 h-[1px] gold-line-fade" />
                <div className="absolute bottom-0 left-0 right-0 h-[1px] gold-line-fade" />
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 shrink-0">
                    <DiamondIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-rpg-title text-[12px] tracking-[0.16em] text-[#e5c158] font-semibold uppercase">
                        ACT {currentAct.act} // OBJECTIVE
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

              {/* INCOMING TRANSMISSION WITH HOODED AVATAR */}
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

            {/* TOP-RIGHT: WAYFARER LEVEL CREST & EXP */}
            <div 
              onClick={() => setXp((x) => x + 300)}
              title="Click to test XP gain"
              className="pointer-events-auto cursor-pointer hud-glass relative px-5 py-2.5 rounded-sm border border-amber-400/30 flex items-center gap-3.5 shadow-2xl transition-transform hover:scale-105"
            >
              <WayfarerCrest className="w-11 h-11 shrink-0" />
              <div>
                <div className="font-rpg-title text-white text-sm sm:text-[15px] tracking-[0.18em] font-semibold leading-tight">
                  WAYFARER
                </div>
                <div className="font-rpg-title text-[#e5c158] text-xs sm:text-[13px] tracking-[0.15em] mt-0.5">
                  LEVEL {level}
                </div>
                <div className="w-24 h-1.5 bg-slate-900 rounded-full mt-1 overflow-hidden border border-slate-700">
                  <div className="h-full bg-amber-400" style={{ width: \`\${(xp / 1000) * 100}%\` }} />
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM ROW: RADAR, HP/STAMINA, KEYS */}
          <div className="flex flex-row items-end justify-between w-full gap-4">
            {/* BOTTOM-LEFT: RADAR MINIMAP */}
            <div className="pointer-events-auto relative flex items-center justify-center shrink-0">
              <div className="absolute -top-3 z-30 bg-slate-950/90 px-2 py-0.5 rounded text-[11px] font-bold text-white tracking-wider border border-slate-600/60 shadow">
                N
              </div>
              <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-full border-2 border-slate-300/70 shadow-2xl overflow-hidden relative bg-[#0e131d]">
                <svg viewBox="-30 -30 60 60" className="w-full h-full">
                  <rect x="-30" y="-30" width="60" height="60" fill="#0c1018" />
                  {/* Street boundaries */}
                  <line x1="-12" y1="-30" x2="-12" y2="30" stroke="#334155" strokeWidth="1.2" />
                  <line x1="12" y1="-30" x2="12" y2="30" stroke="#334155" strokeWidth="1.2" />
                  <line x1="-30" y1="0" x2="30" y2="0" stroke="#1e293b" strokeWidth="0.8" />

                  {/* Objective Marker Diamond */}
                  <g transform={\`translate(\${currentAct.targetZ > player.z ? 0 : -8}, \${Math.max(-24, Math.min(24, -(currentAct.targetZ - player.z) * 0.15))})\`}>
                    <polygon points="0,-3 3,0 0,3 -3,0" fill="#e5c158" />
                  </g>

                  {/* Shards */}
                  {dataShards.filter((s) => !s.collected).map((s) => (
                    <circle key={s.id} cx={s.x * 0.8} cy={-(s.z - player.z) * 0.15} r="1.8" fill="#38bdf8" />
                  ))}

                  {/* Terminals */}
                  {terminals.map((t) => (
                    <rect key={t.id} x={t.x * 0.8 - 1.5} y={-(t.z - player.z) * 0.15 - 1.5} width="3" height="3" fill={t.hacked ? '#22c55e' : '#38bdf8'} />
                  ))}

                  {/* Drones */}
                  {dronesRef.current.map((d) => (
                    <circle key={d.id} cx={d.x * 0.8} cy={-(d.z - player.z) * 0.15} r="2.2" fill={d.disabledTimer > 0 ? '#64748b' : '#ef4444'} />
                  ))}

                  {/* Center Player Cursor */}
                  <polygon
                    points="0,-4 3,4 0,2 -3,4"
                    fill="#ffffff"
                    transform={\`rotate(\${player.heading})\`}
                  />
                </svg>
              </div>
            </div>

            {/* BOTTOM-CENTER: HP & STAMINA */}
            <div className="pointer-events-auto flex flex-col gap-2 w-64 sm:w-80 mb-1">
              {/* HP Bar */}
              <div className="flex items-center justify-end gap-3">
                <span className="font-rpg-title text-white text-xs tracking-wider font-semibold">HP</span>
                <div 
                  onClick={() => setHp((h) => (h > 20 ? h - 20 : 100))}
                  title="Click to test HP damage/heal"
                  className="cursor-pointer flex-1 h-2.5 bg-slate-950/90 border border-slate-500/60 p-[1px] rounded-[1px] shadow-lg overflow-hidden"
                >
                  <div 
                    className="h-full transition-all duration-300"
                    style={{
                      width: \`\${hp}%\`,
                      background: 'linear-gradient(90deg, #dc2626 0%, #f87171 65%, #fecaca 100%)',
                      boxShadow: '0 0 10px rgba(248, 113, 113, 0.65)'
                    }}
                  />
                </div>
              </div>

              {/* Stamina Bar */}
              <div className="flex items-center justify-end gap-3">
                <span className="font-rpg-title text-white text-xs tracking-wider font-semibold">STAMINA</span>
                <div className="flex-1 h-2.5 bg-slate-950/90 border border-slate-500/60 p-[1px] rounded-[1px] shadow-lg overflow-hidden">
                  <div 
                    className="h-full transition-all duration-75"
                    style={{
                      width: \`\${(stamina / maxStamina) * 100}%\`,
                      background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 70%, #bae6fd 100%)',
                      boxShadow: '0 0 10px rgba(56, 189, 248, 0.65)'
                    }}
                  />
                </div>
              </div>

              {/* Cores / Shards Counter */}
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono px-1">
                <span>⚡ Cores: {energyCores}</span>
                <span>💾 Shards: {dataShards.filter((s) => s.collected).length}/5</span>
              </div>
            </div>

            {/* BOTTOM-RIGHT: INTERACTIVE KEY BADGES */}
            <div className="pointer-events-auto flex items-center gap-2 flex-wrap justify-end">
              {/* WASD */}
              <div className="flex items-center gap-1">
                {['W', 'A', 'S', 'D'].map((k) => (
                  <button key={k} className="w-6 h-6 rounded bg-slate-950/85 text-white border border-slate-500/60 text-xs font-bold">
                    {k}
                  </button>
                ))}
                <span className="font-rpg-title text-white text-xs ml-1">MOVE</span>
              </div>

              {/* SHIFT */}
              <button className="px-2 h-6 rounded bg-slate-950/85 text-white border border-slate-500/60 text-xs font-bold">
                SHIFT
              </button>
              <span className="font-rpg-title text-white text-xs">SPRINT</span>

              {/* SPACE */}
              <button onClick={triggerJump} className="px-2 h-6 rounded bg-slate-950/85 text-white border border-slate-500/60 text-xs font-bold">
                SPACE
              </button>
              <span className="font-rpg-title text-white text-xs">JUMP</span>

              {/* [E] EMP */}
              <button 
                onClick={triggerEmpBlast}
                className={\`px-2 h-6 rounded border text-xs font-bold flex items-center gap-1 \${
                  empCooldown === 0 ? 'bg-cyan-950 text-cyan-200 border-cyan-400' : 'bg-slate-900 text-slate-500 border-slate-700'
                }\`}
              >
                <span>[E] EMP</span>
                {empCooldown > 0 && <span className="font-mono">({empCooldown}s)</span>}
              </button>

              {/* [F] INTERACT */}
              <button 
                onClick={triggerInteract}
                className="px-2 h-6 rounded bg-amber-950 text-amber-200 border border-amber-400 text-xs font-bold"
              >
                [F] INTERACT
              </button>

              {/* EXIT MENU */}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('spider:return-to-menu'))}
                className="px-2.5 h-6 rounded bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-400/50 text-xs font-bold"
              >
                ✕ MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- HACKING CONSOLE MODAL --- */}
      {activeModal === 'hack' && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-sky-400 rounded-lg p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-sky-500/30">
              <div className="flex items-center gap-2 text-sky-300 font-rpg-title font-bold text-lg">
                <Terminal className="w-5 h-5 text-sky-400" />
                <span>TERMINAL OVERRIDE // {currentAct.district}</span>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="py-4 text-sm text-slate-300 leading-relaxed">
              <p>Security protocol detected. Bypass firewall nodes to extract encrypted district data.</p>
              <div className="my-4 p-3 bg-slate-950 rounded border border-slate-700 font-mono text-xs text-emerald-400">
                &gt; Frequency Match: 104.8 MHz<br />
                &gt; Shards Connected: {dataShards.filter((s) => s.collected).length}/5<br />
                &gt; Access Level: WAYFARER RANK {level}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded bg-slate-800 text-slate-300 text-sm">
                Cancel
              </button>
              <button onClick={handleHackSuccess} className="px-5 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow">
                Execute Bypass (+{currentAct.xpReward} XP)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BAZAAR VENDOR UPGRADE MODAL --- */}
      {activeModal === 'vendor' && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-400 rounded-lg p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-300 font-rpg-title font-bold text-lg">
                <Cpu className="w-5 h-5 text-amber-400" />
                <span>CYBER BAZAAR // TECH MOD SHOP</span>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="py-4 space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-950 rounded border border-slate-800">
                <div>
                  <div className="text-white font-bold text-sm">Synthetic Adrenaline (+25 Max Stamina)</div>
                  <div className="text-xs text-slate-400">Current: {maxStamina} Stamina</div>
                </div>
                <button 
                  onClick={() => {
                    if (energyCores >= 1) {
                      setEnergyCores((c) => c - 1);
                      setMaxStamina((s) => s + 25);
                      setStamina((s) => s + 25);
                      audio.playChime(true);
                    }
                  }}
                  disabled={energyCores < 1}
                  className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs disabled:opacity-40"
                >
                  Buy (1 Core)
                </button>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-950 rounded border border-slate-800">
                <div>
                  <div className="text-white font-bold text-sm">Nano-Plating (+Full Health Restore)</div>
                  <div className="text-xs text-slate-400">Restores player HP to 100%</div>
                </div>
                <button 
                  onClick={() => {
                    if (energyCores >= 1) {
                      setEnergyCores((c) => c - 1);
                      setHp(100);
                      audio.playChime(true);
                    }
                  }}
                  disabled={energyCores < 1}
                  className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs disabled:opacity-40"
                >
                  Heal (1 Core)
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-800 text-xs text-amber-300 font-mono">
              <span>Available Energy Cores: {energyCores}</span>
              <button onClick={() => setActiveModal(null)} className="px-4 py-1.5 rounded bg-slate-800 text-white">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- VICTORY OVERRIDE MODAL --- */}
      {activeModal === 'victory' && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-400 rounded-lg p-8 max-w-lg w-full text-center shadow-2xl">
            <Award className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-bounce" />
            <h2 className="font-rpg-title text-2xl font-bold text-emerald-300">
              KNOWLEDGE GRID OVERRIDDEN // CAMPAIGN COMPLETE!
            </h2>
            <p className="mt-3 text-slate-300 text-sm leading-relaxed">
              You ran the entire 5km wet boulevard from Knowledge Park through the Apex Spire, neutralized security drone patrols, and secured all encrypted shards. The open city is now fully unlocked for free-roam exploration!
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <button 
                onClick={() => {
                  setActiveModal(null);
                  setPlayer((p) => ({ ...p, z: 20 }));
                }}
                className="px-6 py-2.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm"
              >
                Restart Campaign
              </button>
              <button 
                onClick={() => setActiveModal(null)}
                className="px-6 py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow"
              >
                Continue Free Roam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/game/GameComponent.jsx', code, 'utf8');
console.log('Successfully wrote upgraded GameComponent.jsx, bytes:', fs.statSync('src/game/GameComponent.jsx').size);
