// Generator for the true 3D Open-World City Map in React Three Fiber
const fs = require('fs');

const code = `import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { 
  Eye, 
  Sparkles, 
  RotateCcw,
  Compass,
  Award,
  Terminal,
  Cpu,
  ChevronRight,
  X
} from 'lucide-react';

// ============================================================================
// 1. SOUND SYNTHESIS ENGINE (Web Audio API)
// ============================================================================
class CityAudio {
  constructor() {
    this.ctx = null;
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
  playFootstep(sprint = false) {
    if (!this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime((sprint ? 130 : 100) + Math.random() * 20, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);
      gain.gain.setValueAtTime(sprint ? 0.07 : 0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }
  playJump() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(360, now + 0.14);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }
  playLanding() {
    if (!this.ctx) return;
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
}
const cityAudio = new CityAudio();

// ============================================================================
// 2. HUD SVG ICONS
// ============================================================================
const DiamondIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none">
    <path d="M16 2 L30 16 L16 30 L2 16 Z" stroke="#e5c158" strokeWidth="1.5" fill="rgba(229, 193, 88, 0.12)" />
    <path d="M16 0 L16 5 M16 27 L16 32 M0 16 L5 16 M27 16 L32 16" stroke="#e5c158" strokeWidth="1.2" />
    <path d="M16 8 L24 16 L16 24 L8 16 Z" fill="#fff6d6" className="animate-pulse" />
  </svg>
);

const StarSparkle = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#e5c158">
    <path d="M12 0 C12.5 8 16 11.5 24 12 C16 12.5 12.5 16 12 24 C11.5 16 8 12.5 0 12 C8 11.5 11.5 8 12 0 Z" />
  </svg>
);

const WayfarerCrest = ({ className = "w-11 h-11" }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none">
    <polygon points="32,2 58,16 58,46 32,60 6,46 6,16" stroke="#e5c158" strokeWidth="2" fill="rgba(15, 23, 42, 0.95)" />
    <polygon points="32,6 54,18 54,44 32,56 10,44 10,18" stroke="rgba(229, 193, 88, 0.4)" strokeWidth="1" fill="none" />
    <path d="M18 36 L24 26 L32 32 L40 26 L46 36 L32 50 Z" fill="#e5c158" stroke="#fff6d6" strokeWidth="1.2" />
    <path d="M14 24 Q32 14 50 24" stroke="#e5c158" strokeWidth="1.8" strokeLinecap="round" />
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
// 3. 3D HOODED WAYFARER CHARACTER MESH & KINEMATICS
// ============================================================================
function WayfarerCharacter({ position, rotation, isMoving, isSprinting, walkCycle }) {
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const coatRef = useRef();

  // Dynamic stride swing
  const stride = isMoving ? Math.sin(walkCycle) * (isSprinting ? 0.6 : 0.35) : 0;
  const oppStride = -stride;

  return (
    <group position={position} rotation={rotation}>
      {/* Cowl Hood & Head */}
      <mesh position={[0, 1.72, 0]}>
        <sphereGeometry args={[0.26, 16, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
      {/* Cowl Drape Crease */}
      <mesh position={[0, 1.58, 0.05]} rotation={[0.2, 0, 0]}>
        <coneGeometry args={[0.32, 0.28, 16]} />
        <meshStandardMaterial color="#0a0f1d" roughness={0.85} />
      </mesh>

      {/* Torso & Tactical Armor Vest */}
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[0.55, 0.58, 0.32]} />
        <meshStandardMaterial color="#111827" roughness={0.7} />
      </mesh>

      {/* Contoured Hardshell Tactical Backpack */}
      <mesh position={[0, 1.32, -0.22]}>
        <boxGeometry args={[0.38, 0.44, 0.18]} />
        <meshStandardMaterial color="#0e1726" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Pulsing Cyan LED Status Light on Backpack */}
      <mesh position={[0, 1.42, -0.32]}>
        <boxGeometry args={[0.18, 0.04, 0.02]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2.5} />
      </mesh>

      {/* Double-Vented Flowing Leather Trenchcoat */}
      <group position={[0, 0.98, 0]} rotation={[stride * 0.15, 0, 0]}>
        <mesh position={[0, -0.35, -0.02]}>
          <boxGeometry args={[0.58, 0.68, 0.28]} />
          <meshStandardMaterial color="#090d15" roughness={0.65} />
        </mesh>
      </group>

      {/* Utility Belt & Pouches */}
      <mesh position={[0, 0.96, 0]}>
        <boxGeometry args={[0.58, 0.08, 0.34]} />
        <meshStandardMaterial color="#030508" roughness={0.4} metalness={0.8} />
      </mesh>
      {/* Brass belt buckle */}
      <mesh position={[0, 0.96, 0.18]}>
        <boxGeometry args={[0.12, 0.09, 0.02]} />
        <meshStandardMaterial color="#e5c158" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Left Cargo Leg & Combat Lug Boot */}
      <group position={[-0.16, 0.9, 0]} rotation={[stride, 0, 0]}>
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.09, 0.08, 0.78, 12]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.84, 0.06]}>
          <boxGeometry args={[0.14, 0.14, 0.28]} />
          <meshStandardMaterial color="#05070a" roughness={0.9} metalness={0.2} />
        </mesh>
      </group>

      {/* Right Cargo Leg & Combat Lug Boot */}
      <group position={[0.16, 0.9, 0]} rotation={[oppStride, 0, 0]}>
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.09, 0.08, 0.78, 12]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.84, 0.06]}>
          <boxGeometry args={[0.14, 0.14, 0.28]} />
          <meshStandardMaterial color="#05070a" roughness={0.9} metalness={0.2} />
        </mesh>
      </group>

      {/* Left Arm with Tactical Gauntlet */}
      <group position={[-0.34, 1.48, 0]} rotation={[oppStride * 0.7, 0, 0]}>
        <mesh position={[0, -0.32, 0]}>
          <capsuleGeometry args={[0.07, 0.52, 8, 8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
      </group>

      {/* Right Arm with Tactical Gauntlet */}
      <group position={[0.34, 1.48, 0]} rotation={[stride * 0.7, 0, 0]}>
        <mesh position={[0, -0.32, 0]}>
          <capsuleGeometry args={[0.07, 0.52, 8, 8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

// ============================================================================
// 4. 3D CITY WORLD MAP (Road, Buildings, Skybridge, Lights, Traffic)
// ============================================================================
function CityWorldMap({ currentDistrict, onInteractTerminal }) {
  // Roadside Amber Bollards with Real 3D Point Lights
  const bollardPositions = useMemo(() => {
    const list = [];
    for (let z = 0; z < 800; z += 20) {
      list.push([-8.5, 0.5, z]);
      list.push([8.5, 0.5, z]);
    }
    return list;
  }, []);

  // 3D Buildings
  const buildings = useMemo(() => {
    const list = [];
    for (let z = 0; z < 800; z += 40) {
      // Left side skyscrapers
      list.push({
        pos: [-24, 25, z + 15],
        size: [18, 50 + (z % 30), 28],
        color: '#070c18',
        winColor: (z % 80 === 0) ? '#38bdf8' : '#fbbf24'
      });
      // Right side skyscrapers
      list.push({
        pos: [24, 28, z + 25],
        size: [18, 56 + ((z * 2) % 40), 28],
        color: '#060a14',
        winColor: (z % 60 === 0) ? '#fde047' : '#38bdf8'
      });
    }
    return list;
  }, []);

  return (
    <group>
      {/* Lighting */}
      <ambientLight intensity={0.4} color="#38bdf8" />
      <directionalLight position={[30, 60, 40]} intensity={1.2} color="#fde047" />
      <fog attach="fog" args={['#040813', 25, 260]} />

      {/* WET ASPHALT ROAD BOULEVARD (Runs endlessly along +Z) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 500]}>
        <planeGeometry args={[18, 1200]} />
        <meshStandardMaterial 
          color="#080e1a" 
          roughness={0.18} 
          metalness={0.75} 
        />
      </mesh>

      {/* Center Dashed Lane Stripe */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 500]}>
        <planeGeometry args={[0.25, 1200]} />
        <meshStandardMaterial color="#e5c158" emissive="#e5c158" emissiveIntensity={0.6} />
      </mesh>

      {/* Outer Cyan Lane Stripes */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.5, 0.01, 500]}>
        <planeGeometry args={[0.15, 1200]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.5, 0.01, 500]}>
        <planeGeometry args={[0.15, 1200]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.5} />
      </mesh>

      {/* Elevated Left Sidewalk */}
      <mesh position={[-13.5, 0.15, 500]}>
        <boxGeometry args={[9, 0.3, 1200]} />
        <meshStandardMaterial color="#0d1424" roughness={0.7} />
      </mesh>
      {/* Elevated Right Sidewalk */}
      <mesh position={[13.5, 0.15, 500]}>
        <boxGeometry args={[9, 0.3, 1200]} />
        <meshStandardMaterial color="#0d1424" roughness={0.7} />
      </mesh>

      {/* Amber Bollards with Glowing Lantern Cubes */}
      {bollardPositions.map((bPos, idx) => (
        <group key={idx} position={bPos}>
          {/* Concrete post */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.22, 1.0, 12]} />
            <meshStandardMaterial color="#1e293b" roughness={0.8} />
          </mesh>
          {/* Glowing amber lantern cube */}
          <mesh position={[0, 0.48, 0]}>
            <boxGeometry args={[0.26, 0.22, 0.26]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={2.5} />
          </mesh>
          {/* Subtle light pool every 40m */}
          {idx % 4 === 0 && (
            <pointLight color="#fbbf24" intensity={1.8} distance={8} decay={2} position={[0, 0.8, 0]} />
          )}
        </group>
      ))}

      {/* 3D Skyscrapers Lining the Avenue */}
      {buildings.map((b, idx) => (
        <group key={idx} position={b.pos}>
          <mesh>
            <boxGeometry args={b.size} />
            <meshStandardMaterial color={b.color} roughness={0.2} metalness={0.85} />
          </mesh>
          {/* Emissive window panel on facade */}
          <mesh position={[idx % 2 === 0 ? 8.9 : -8.9, 0, 0]}>
            <boxGeometry args={[0.2, b.size[1] * 0.85, b.size[2] * 0.85]} />
            <meshStandardMaterial color={b.winColor} emissive={b.winColor} emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}

      {/* Iconic Cylindrical Skyscraper with Glowing Amber Crown at Z = 140m */}
      <group position={[32, 45, 140]}>
        <mesh>
          <cylinderGeometry args={[12, 14, 90, 24]} />
          <meshStandardMaterial color="#0a101f" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Amber Crown Rings */}
        {[0, 4, 8, 12].map((ringY) => (
          <mesh key={ringY} position={[0, 40 + ringY, 0]}>
            <torusGeometry args={[12.2, 0.4, 8, 24]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={3} />
          </mesh>
        ))}
      </group>

      {/* HIGH-ELEVATION OVERHEAD PEDESTRIAN SKYBRIDGE & DISTRICT SIGN AT Z = 80m */}
      <group position={[0, 11, 80]}>
        {/* Architectural Arch Beam spanning 28m */}
        <mesh>
          <boxGeometry args={[28, 1.8, 4.5]} />
          <meshStandardMaterial color="#060c18" roughness={0.3} metalness={0.8} />
        </mesh>
        {/* Illuminated Facade Sign Frame */}
        <mesh position={[0, 2.2, -2.3]}>
          <boxGeometry args={[14, 2.2, 0.4]} />
          <meshStandardMaterial color="#020617" roughness={0.2} />
        </mesh>
        {/* Cyan Glowing Border */}
        <mesh position={[0, 2.2, -2.4]}>
          <boxGeometry args={[14.4, 2.6, 0.2]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2.5} />
        </mesh>
      </group>

      {/* Parked Black Sports Coupe with Glowing Red LED Taillight at Z = 35m */}
      <group position={[7.5, 0.65, 35]}>
        <mesh>
          <boxGeometry args={[2.2, 0.9, 4.6]} />
          <meshStandardMaterial color="#050811" roughness={0.1} metalness={0.95} />
        </mesh>
        {/* Red LED Taillight strip */}
        <mesh position={[0, 0.1, -2.25]}>
          <boxGeometry args={[1.9, 0.12, 0.08]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3.5} />
        </mesh>
        <pointLight color="#ef4444" intensity={2.2} distance={6} position={[0, 0.2, -2.6]} />
      </group>

      {/* Interactive Terminal at Z = 120m */}
      <group position={[-6.5, 1.1, 120]}>
        <mesh>
          <boxGeometry args={[1.2, 2.2, 0.8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Cyan Hologram Screen */}
        <mesh position={[0, 1.6, 0]}>
          <boxGeometry args={[1.4, 0.8, 0.1]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2.8} />
        </mesh>
        <pointLight color="#38bdf8" intensity={2.5} distance={8} position={[0, 1.8, 0]} />
      </group>
    </group>
  );
}

// ============================================================================
// 5. MAIN TRUE 3D R3F COMPONENT (Player Controller, Camera Rig & HUD)
// ============================================================================
export default function App() {
  const { camera } = useThree();

  // Player 3D coordinates on the ground
  const playerState = useRef({
    x: 0,
    y: 0,
    z: 15, // Starts on Knowledge Park Boulevard
    vx: 0,
    vz: 0,
    vy: 0,
    rotation: 0,
    walkCycle: 0,
    isGrounded: true
  });

  const [playerUiPos, setPlayerUiPos] = useState({ x: 0, z: 15, rot: 0 });
  const [level, setLevel] = useState(12);
  const [hp, setHp] = useState(100);
  const [stamina, setStamina] = useState(100);
  const [isMovingUi, setIsMovingUi] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const keys = useRef({ w: false, a: false, s: false, d: false, shift: false, space: false });

  // Keyboard event listeners
  useEffect(() => {
    const onKeyDown = (e) => {
      cityAudio.init();
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') keys.current.w = true;
      if (k === 's' || e.key === 'ArrowDown') keys.current.s = true;
      if (k === 'a' || e.key === 'ArrowLeft') keys.current.a = true;
      if (k === 'd' || e.key === 'ArrowRight') keys.current.d = true;
      if (e.key === 'Shift') keys.current.shift = true;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (playerState.current.isGrounded) {
          playerState.current.vy = 8.5; // Jump upward velocity
          playerState.current.isGrounded = false;
          cityAudio.playJump();
        }
      }
      if (k === 'f') {
        // Interact terminal
        if (Math.abs(playerState.current.z - 120) < 15) {
          setActiveModal('hack');
        }
      }
      if (e.key === 'Escape') setActiveModal(null);
    };

    const onKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') keys.current.w = false;
      if (k === 's' || e.key === 'ArrowDown') keys.current.s = false;
      if (k === 'a' || e.key === 'ArrowLeft') keys.current.a = false;
      if (k === 'd' || e.key === 'ArrowRight') keys.current.d = false;
      if (e.key === 'Shift') keys.current.shift = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // 60 FPS R3F Frame Loop: Real 3D Third-Person Movement & Camera Tracking
  useFrame((state, delta) => {
    if (activeModal) return;

    const p = playerState.current;
    const isMoving = keys.current.w || keys.current.a || keys.current.s || keys.current.d;
    const isSprinting = isMoving && keys.current.shift && stamina > 2;

    const moveSpeed = isSprinting ? 14.0 : 6.5; // meters per second
    const turnSpeed = 3.2;

    // Forward / backward travel along Z
    let targetVz = 0;
    if (keys.current.w) targetVz += moveSpeed;
    if (keys.current.s) targetVz -= moveSpeed * 0.7;

    // Lateral strafing along X
    let targetVx = 0;
    if (keys.current.a) targetVx -= moveSpeed * 0.85;
    if (keys.current.d) targetVx += moveSpeed * 0.85;

    // Smooth inertia
    p.vz += (targetVz - p.vz) * 0.18;
    p.vx += (targetVx - p.vx) * 0.18;

    // Vertical Jump & Gravity
    p.y += p.vy * delta;
    p.vy -= 22.0 * delta; // Gravity g = 22 m/s^2

    if (p.y <= 0) {
      p.y = 0;
      p.vy = 0;
      if (!p.isGrounded) cityAudio.playLanding();
      p.isGrounded = true;
    }

    // Update positions on 3D ground (NO WALLS — TRAVEL FREELY!)
    p.z = Math.max(0, p.z + p.vz * delta);
    p.x = Math.max(-14, Math.min(14, p.x + p.vx * delta));

    // Stride kinematics
    const speed = Math.hypot(p.vx, p.vz);
    if (isMoving && p.isGrounded) {
      p.walkCycle += delta * (isSprinting ? 12 : 7);
      if (Math.sin(p.walkCycle) > 0.95) cityAudio.playFootstep(isSprinting);
    }

    // Stamina drain and recovery
    if (isSprinting) {
      setStamina((s) => Math.max(0, s - delta * 18));
    } else if (isMoving) {
      setStamina((s) => Math.min(100, s + delta * 5));
    } else {
      setStamina((s) => Math.min(100, s + delta * 14));
    }

    // 3D Third-Person Chase Camera: follows behind player through the 3D map!
    const targetCamX = p.x * 0.45;
    const targetCamY = p.y + 3.2;
    const targetCamZ = p.z - 7.5; // Always stays 7.5 meters behind player

    camera.position.x += (targetCamX - camera.position.x) * 0.12;
    camera.position.y += (targetCamY - camera.position.y) * 0.12;
    camera.position.z += (targetCamZ - camera.position.z) * 0.12;
    camera.lookAt(p.x, p.y + 1.6, p.z + 14);

    // Sync UI position every few frames
    if (Math.random() > 0.75) {
      setPlayerUiPos({ x: p.x, z: p.z, rot: p.rotation });
      setIsMovingUi(isMoving);
    }
  });

  const p = playerState.current;
  const distanceToTerminal = Math.max(0, Math.round(120 - playerUiPos.z));

  return (
    <group>
      {/* 3D World Map */}
      <CityWorldMap currentDistrict="Knowledge Park Boulevard" />

      {/* 3D Hooded Wayfarer Hero */}
      <WayfarerCharacter
        position={[p.x, p.y, p.z]}
        rotation={[0, p.rotation, 0]}
        isMoving={isMovingUi}
        isSprinting={keys.current.shift}
        walkCycle={p.walkCycle}
      />

      {/* FULL RPG HUD OVERLAY (Drei Html) */}
      <Html fullscreen style={{ pointerEvents: 'none' }}>
        <div className="relative w-full h-full flex flex-col justify-between p-4 sm:p-6 select-none font-sans">
          <style>{\`
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:wght@500;600;700&display=swap');
            .font-rpg-title { font-family: 'Cinzel', Georgia, serif; }
            .font-rpg-body { font-family: 'Cormorant Garamond', Georgia, serif; }
            .hud-glass {
              background: linear-gradient(90deg, rgba(12, 16, 24, 0.92) 0%, rgba(16, 21, 32, 0.82) 75%, rgba(16, 21, 32, 0.25) 100%);
              backdrop-filter: blur(10px);
            }
          \`}</style>

          {/* TOP DISTRICT & FORWARD DISTANCE TRACKER */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center">
            <div className="bg-slate-950/90 border border-sky-400/80 px-6 py-2 rounded shadow-[0_0_22px_rgba(56,189,248,0.45)]">
              <span className="font-rpg-title text-sky-100 text-sm sm:text-base tracking-[0.3em] font-bold">
                KNOWLEDGE PARK BOULEVARD
              </span>
              <span className="ml-3 text-xs text-amber-400 font-mono">Z: {Math.round(playerUiPos.z)}m</span>
            </div>
          </div>

          {/* TOP ROW: OBJECTIVE & CREST */}
          <div className="flex justify-between items-start w-full">
            {/* TOP-LEFT: OBJECTIVE & INCOMING MESSAGE */}
            <div className="flex flex-col gap-2.5 max-w-md">
              <div className="pointer-events-auto hud-glass relative px-5 py-3 rounded-sm border-l-2 border-amber-400/70 shadow-xl">
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 shrink-0">
                    <DiamondIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-rpg-title text-[12px] tracking-[0.16em] text-[#e5c158] font-semibold uppercase">
                        NEW OBJECTIVE
                      </span>
                      <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                        🎯 {distanceToTerminal}m
                      </span>
                    </div>
                    <div className="font-rpg-body text-white text-lg sm:text-[20px] font-medium leading-snug tracking-wide drop-shadow mt-0.5">
                      Investigate the signal in Knowledge Park
                    </div>
                  </div>
                </div>
              </div>

              {/* INCOMING TRANSMISSION WITH AVATAR */}
              <div className="pointer-events-auto hud-glass relative px-4 py-2 rounded-sm border-l-2 border-amber-400/70 flex items-center gap-3.5 shadow-lg">
                <div className="w-10 h-10 rounded overflow-hidden border border-slate-600/60 shrink-0 bg-slate-900">
                  <HoodedAvatarSVG />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-rpg-title text-xs tracking-wider text-[#e5c158] font-semibold uppercase">
                    <StarSparkle className="w-3 h-3 text-[#e5c158]" />
                    <span>INCOMING MESSAGE</span>
                  </div>
                  <div className="font-rpg-body text-slate-100 text-xs sm:text-[14px] leading-snug tracking-wide mt-0.5">
                    Welcome back. Something has changed in Knowledge Park.
                  </div>
                </div>
              </div>
            </div>

            {/* TOP-RIGHT: WAYFARER LEVEL 12 CREST */}
            <div 
              onClick={() => setLevel((l) => l + 1)}
              className="pointer-events-auto cursor-pointer hud-glass relative px-5 py-2.5 rounded-sm border border-amber-400/30 flex items-center gap-3.5 shadow-2xl"
            >
              <WayfarerCrest className="w-11 h-11 shrink-0" />
              <div>
                <div className="font-rpg-title text-white text-sm sm:text-[15px] tracking-[0.18em] font-semibold leading-tight">
                  WAYFARER
                </div>
                <div className="font-rpg-title text-[#e5c158] text-xs sm:text-[13px] tracking-[0.15em] mt-0.5">
                  LEVEL {level}
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM ROW: RADAR, HP/STAMINA, KEY BADGES */}
          <div className="flex flex-row items-end justify-between w-full gap-4">
            {/* BOTTOM-LEFT: RADAR MINIMAP */}
            <div className="pointer-events-auto relative flex items-center justify-center shrink-0">
              <div className="absolute -top-3 z-30 bg-slate-950/90 px-2 py-0.5 rounded text-[11px] font-bold text-white tracking-wider border border-slate-600/60 shadow">
                N
              </div>
              <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-full border-2 border-slate-300/70 shadow-2xl overflow-hidden relative bg-[#0e131d]">
                <svg viewBox="-40 -40 80 80" className="w-full h-full">
                  <rect x="-40" y="-40" width="80" height="80" fill="#0c1018" />
                  <line x1="-14" y1="-40" x2="-14" y2="40" stroke="#334155" strokeWidth="1.2" />
                  <line x1="14" y1="-40" x2="14" y2="40" stroke="#334155" strokeWidth="1.2" />
                  <line x1="-40" y1="0" x2="40" y2="0" stroke="#1e293b" strokeWidth="0.8" />
                  {/* Waypoint Diamond at Z = 120m */}
                  <g transform={\`translate(0, \${Math.max(-32, Math.min(32, -(120 - playerUiPos.z) * 0.4))})\`}>
                    <polygon points="0,-4 4,0 0,4 -4,0" fill="#e5c158" />
                  </g>
                  {/* Player arrow */}
                  <polygon points="0,-5 4,5 0,3 -4,5" fill="#ffffff" />
                </svg>
              </div>
            </div>

            {/* BOTTOM-CENTER: HP & STAMINA */}
            <div className="pointer-events-auto flex flex-col gap-2 w-64 sm:w-80 mb-1">
              <div className="flex items-center justify-end gap-3">
                <span className="font-rpg-title text-white text-xs tracking-wider font-semibold">HP</span>
                <div className="flex-1 h-2.5 bg-slate-950/90 border border-slate-500/60 p-[1px] rounded-[1px] shadow-lg overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-600 to-rose-400" style={{ width: \`\${hp}%\` }} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <span className="font-rpg-title text-white text-xs tracking-wider font-semibold">STAMINA</span>
                <div className="flex-1 h-2.5 bg-slate-950/90 border border-slate-500/60 p-[1px] rounded-[1px] shadow-lg overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-sky-600 to-cyan-400" style={{ width: \`\${stamina}%\` }} />
                </div>
              </div>
            </div>

            {/* BOTTOM-RIGHT: KEY BADGES */}
            <div className="pointer-events-auto flex items-center gap-2 flex-wrap justify-end">
              <div className="flex items-center gap-1">
                {['W', 'A', 'S', 'D'].map((k) => (
                  <button key={k} className="w-6 h-6 rounded bg-slate-950/85 text-white border border-slate-500/60 text-xs font-bold">
                    {k}
                  </button>
                ))}
                <span className="font-rpg-title text-white text-xs ml-1">MOVE</span>
              </div>
              <button className="px-2 h-6 rounded bg-slate-950/85 text-white border border-slate-500/60 text-xs font-bold">
                SHIFT
              </button>
              <span className="font-rpg-title text-white text-xs">SPRINT</span>
              <button className="px-2 h-6 rounded bg-slate-950/85 text-white border border-slate-500/60 text-xs font-bold">
                SPACE
              </button>
              <span className="font-rpg-title text-white text-xs">JUMP</span>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('spider:return-to-menu'))}
                className="px-2.5 h-6 rounded bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-400/50 text-xs font-bold"
              >
                ✕ MENU
              </button>
            </div>
          </div>

          {/* HACK TERMINAL MODAL */}
          {activeModal === 'hack' && (
            <div className="pointer-events-auto absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-900 border-2 border-sky-400 rounded-lg p-6 max-w-md w-full shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-sky-500/30">
                  <div className="flex items-center gap-2 text-sky-300 font-rpg-title font-bold text-lg">
                    <Terminal className="w-5 h-5 text-sky-400" />
                    <span>TERMINAL OVERRIDE // KNOWLEDGE PARK</span>
                  </div>
                  <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>
                <p className="py-4 text-sm text-slate-300">
                  Frequency matched. Signal decrypted: Access Granted to District 2!
                </p>
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button onClick={() => setActiveModal(null)} className="px-5 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm">
                    Close Terminal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}
`;

fs.writeFileSync('src/game/GameComponent.jsx', code, 'utf8');
console.log('Successfully wrote true 3D R3F GameComponent.jsx, bytes:', fs.statSync('src/game/GameComponent.jsx').size);
