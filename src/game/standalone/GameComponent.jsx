import React, { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { PauseOverlay, useKeyboardControls } from "./ArenaEnv.jsx";

// Web Audio API Procedural SFX (Zero external audio files required)
const sfx = (f = 440, t = "sine", d = 0.12) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const c = new AudioCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = t;
    o.frequency.value = f;
    g.gain.setValueAtTime(0.09, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + d);
  } catch {}
};

// 3 Track Lanes
const LANES = [-2.3, 0, 2.3];

/**
 * Animated 3D Cyber Knight Character
 * Procedurally animated limbs, glowing cyber visor, pauldrons, fluttering trenchcoat & sprint lean.
 */
function CyberKnight({ isBoosting, isAirborne, isInvulnerable, isRunning }) {
  const ref = useRef(null);
  const leftLeg = useRef(null);
  const rightLeg = useRef(null);
  const leftArm = useRef(null);
  const rightArm = useRef(null);
  const coatLeft = useRef(null);
  const coatRight = useRef(null);
  const kickArc = useRef(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const now = Date.now();
    const kickTime = typeof window !== "undefined" ? window.__spiderHeroKickTime || 0 : 0;
    const isKicking = now - kickTime < 380;
    const kickProgress = isKicking ? Math.min(1, (now - kickTime) / 380) : 0;
    const kickPhase = isKicking
      ? kickProgress < 0.35
        ? Math.sin((kickProgress / 0.35) * (Math.PI / 2))
        : kickProgress < 0.6
        ? 1.0
        : Math.cos(((kickProgress - 0.6) / 0.4) * (Math.PI / 2))
      : 0;

    if (isKicking) {
      // Dynamic martial arts front kick (E key)
      if (rightLeg.current) {
        rightLeg.current.rotation.x = -1.65 * kickPhase;
        rightLeg.current.position.y = 0.95 + 0.18 * kickPhase;
        rightLeg.current.position.z = 0.16 * kickPhase;
      }
      if (leftLeg.current) {
        leftLeg.current.rotation.x = 0.22 * kickPhase;
        leftLeg.current.position.y = 0.95 - 0.04 * kickPhase;
      }
      if (leftArm.current) leftArm.current.rotation.x = 0.85 * kickPhase;
      if (rightArm.current) rightArm.current.rotation.x = -0.65 * kickPhase;
      if (coatLeft.current) coatLeft.current.rotation.x = 0.35 + 0.45 * kickPhase;
      if (coatRight.current) coatRight.current.rotation.x = 0.45 + 0.55 * kickPhase;
      if (ref.current) {
        ref.current.rotation.x = -0.22 * kickPhase;
        ref.current.position.y = kickPhase * 0.12;
      }
      if (kickArc.current) {
        kickArc.current.visible = kickPhase > 0.25;
        kickArc.current.scale.setScalar(0.7 + kickPhase * 0.7);
      }
    } else {
      if (rightLeg.current) rightLeg.current.position.set(0.16, 0.95, 0);
      if (leftLeg.current) leftLeg.current.position.set(-0.16, 0.95, 0);
      if (kickArc.current) kickArc.current.visible = false;

      if (isAirborne) {
        // Dynamic airborne jump pose
        if (leftLeg.current) leftLeg.current.rotation.x = -0.55;
        if (rightLeg.current) rightLeg.current.rotation.x = 0.45;
        if (leftArm.current) leftArm.current.rotation.x = -0.85;
        if (rightArm.current) rightArm.current.rotation.x = -0.85;
        if (coatLeft.current) coatLeft.current.rotation.x = 0.65;
        if (coatRight.current) coatRight.current.rotation.x = 0.65;
        if (ref.current) {
          ref.current.rotation.x = -0.12;
          ref.current.position.y = 0;
        }
      } else if (isRunning) {
        // High-speed running animation with stride rate matching game speed
        const strideRate = isBoosting ? 24 : 15;
        const legSwing = Math.sin(t * strideRate) * 0.75;
        const armSwing = -legSwing * 0.85;
        const bounce = Math.abs(Math.sin(t * strideRate)) * (isBoosting ? 0.12 : 0.07);

        if (leftLeg.current) leftLeg.current.rotation.x = legSwing;
        if (rightLeg.current) rightLeg.current.rotation.x = -legSwing;
        if (leftArm.current) leftArm.current.rotation.x = armSwing;
        if (rightArm.current) rightArm.current.rotation.x = -armSwing;

        const flutter = 0.35 + Math.abs(Math.sin(t * strideRate * 1.2)) * (isBoosting ? 0.35 : 0.18);
        if (coatLeft.current) coatLeft.current.rotation.x = flutter;
        if (coatRight.current) coatRight.current.rotation.x = flutter;

        if (ref.current) {
          ref.current.position.y = bounce;
          // Athletic forward sprint lean
          ref.current.rotation.x = isBoosting ? 0.28 : 0.16;
        }
      } else {
        // Idle breathing sway in menu
        const breath = Math.sin(t * 2.2) * 0.02;
        if (ref.current) {
          ref.current.position.y = breath;
          ref.current.rotation.x = 0;
        }
        if (leftLeg.current) leftLeg.current.rotation.x = 0;
        if (rightLeg.current) rightLeg.current.rotation.x = 0;
        if (leftArm.current) leftArm.current.rotation.x = 0;
        if (rightArm.current) rightArm.current.rotation.x = 0;
        if (coatLeft.current) coatLeft.current.rotation.x = 0.08;
        if (coatRight.current) coatRight.current.rotation.x = 0.08;
      }
    }
  });

  const visorGlow = isBoosting ? 4 : 2.5;
  const visorColor = isBoosting ? "#38bdf8" : "#00e5ff";
  const armorColor = isInvulnerable ? "#475569" : "#1e293b";

  return (
    <group ref={ref} rotation={[0, Math.PI, 0]}>
      {/* 1. Cowl Hood & Glowing Cyber Visor */}
      <group position={[0, 1.82, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.32, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.08, 0.2]} rotation={[0.3, 0, 0]} castShadow>
          <boxGeometry args={[0.36, 0.08, 0.24]} />
          <meshStandardMaterial color="#090d16" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.04, 0.12]}>
          <sphereGeometry args={[0.22, 12, 12]} />
          <meshBasicMaterial color="#020617" />
        </mesh>
        {/* Cyan Cyber Visor Eyes */}
        <mesh position={[0, -0.02, 0.22]}>
          <boxGeometry args={[0.22, 0.035, 0.04]} />
          <meshStandardMaterial
            color={visorColor}
            emissive={visorColor}
            emissiveIntensity={isInvulnerable ? 1.0 : visorGlow}
          />
        </mesh>
      </group>

      {/* 2. Torso Armor & High Collar */}
      <group position={[0, 1.35, 0]}>
        <mesh position={[0, 0.28, 0.02]} castShadow>
          <cylinderGeometry args={[0.25, 0.32, 0.2, 12]} />
          <meshStandardMaterial color="#090d16" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.02, 0]} castShadow>
          <boxGeometry args={[0.54, 0.55, 0.34]} />
          <meshStandardMaterial color={armorColor} roughness={0.5} metalness={0.4} />
        </mesh>
        {/* Cyan Spine Energy Rail */}
        <mesh position={[0, 0.04, -0.18]}>
          <boxGeometry args={[0.07, 0.44, 0.03]} />
          <meshStandardMaterial
            color="#06b6d4"
            emissive="#06b6d4"
            emissiveIntensity={isBoosting ? 3.5 : 2.0}
          />
        </mesh>
        {/* Shoulder Pauldrons */}
        <mesh position={[-0.34, 0.2, 0]} rotation={[0, 0, -0.15]} castShadow>
          <boxGeometry args={[0.18, 0.16, 0.28]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.3} />
        </mesh>
        <mesh position={[0.34, 0.2, 0]} rotation={[0, 0, 0.15]} castShadow>
          <boxGeometry args={[0.18, 0.16, 0.28]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.3} />
        </mesh>
      </group>

      {/* 3. Arms */}
      <group ref={leftArm} position={[-0.35, 1.45, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <capsuleGeometry args={[0.085, 0.42, 6, 8]} />
          <meshStandardMaterial color="#111827" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.32, 0.02]}>
          <cylinderGeometry args={[0.1, 0.09, 0.22, 8]} />
          <meshStandardMaterial
            color="#0284c7"
            emissive="#0284c7"
            emissiveIntensity={isBoosting ? 1.5 : 0.8}
          />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.35, 1.45, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <capsuleGeometry args={[0.085, 0.42, 6, 8]} />
          <meshStandardMaterial color="#111827" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.32, 0.02]}>
          <cylinderGeometry args={[0.1, 0.09, 0.22, 8]} />
          <meshStandardMaterial
            color="#0284c7"
            emissive="#0284c7"
            emissiveIntensity={isBoosting ? 1.5 : 0.8}
          />
        </mesh>
      </group>

      {/* 4. Armored Trenchcoat Tails */}
      <group position={[0, 1.05, 0]}>
        <mesh position={[0, 0.02, 0]} castShadow>
          <cylinderGeometry args={[0.31, 0.32, 0.1, 14]} />
          <meshStandardMaterial color="#090d16" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.02, 0.31]}>
          <boxGeometry args={[0.14, 0.08, 0.04]} />
          <meshStandardMaterial color="#c79d42" metalness={0.8} roughness={0.2} />
        </mesh>
        <group ref={coatLeft} position={[-0.14, -0.05, -0.1]}>
          <mesh position={[0, -0.42, 0]} castShadow>
            <boxGeometry args={[0.26, 0.75, 0.06]} />
            <meshStandardMaterial color="#090d16" roughness={0.8} />
          </mesh>
        </group>
        <group ref={coatRight} position={[0.14, -0.05, -0.1]}>
          <mesh position={[0, -0.42, 0]} castShadow>
            <boxGeometry args={[0.26, 0.75, 0.06]} />
            <meshStandardMaterial color="#090d16" roughness={0.8} />
          </mesh>
        </group>
      </group>

      {/* 5. Legs & Armored Boots */}
      <group ref={leftLeg} position={[-0.16, 0.95, 0]}>
        <mesh position={[0, -0.45, 0]} castShadow>
          <capsuleGeometry args={[0.095, 0.75, 6, 8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.88, 0.06]} castShadow>
          <boxGeometry args={[0.18, 0.18, 0.32]} />
          <meshStandardMaterial color="#020617" roughness={0.9} />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.16, 0.95, 0]}>
        <mesh position={[0, -0.45, 0]} castShadow>
          <capsuleGeometry args={[0.095, 0.75, 6, 8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.88, 0.06]} castShadow>
          <boxGeometry args={[0.18, 0.18, 0.32]} />
          <meshStandardMaterial color="#020617" roughness={0.9} />
        </mesh>
        {/* Glowing Martial Arts Kick Energy Blade / Arc */}
        <mesh ref={kickArc} position={[0, -0.88, 0.35]} visible={false}>
          <ringGeometry args={[0.18, 0.44, 16, 1, 0, Math.PI]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.88} />
        </mesh>
      </group>

      {/* OP Hyper-Boost Energy Aura (Sprint flare) */}
      {isBoosting && (
        <mesh position={[0, 1.0, 0]}>
          <sphereGeometry args={[0.95, 16, 16]} />
          <meshStandardMaterial
            color="#00e5ff"
            emissive="#00e5ff"
            emissiveIntensity={1.8}
            transparent
            opacity={0.25}
            wireframe
          />
        </mesh>
      )}
    </group>
  );
}

export default function GameComponent() {
  const pRef = useRef();
  const keys = useRef({});
  const vy = useRef(0);
  const hp = useRef(3);
  const sc = useRef(0);
  const dist = useRef(0);
  const lastTier = useRef(0);
  const inv = useRef(0);
  const jumpCount = useRef(0);
  const oR = useRef([]);
  const cR = useRef([]);
  const sR = useRef([]);

  const touchState = useRef({
    startX: 0,
    startY: 0,
    active: false,
    isTap: true,
    startTime: 0
  });

  // Procedural Obstacles and Coins
  const obs = useRef(
    Array.from({ length: 14 }, (_, i) => ({
      x: LANES[i % 3],
      z: -18 - i * 17,
      h: i % 3 === 0 ? 1.6 : 1
    }))
  );

  const coins = useRef(
    Array.from({ length: 14 }, (_, i) => ({
      x: LANES[(i + 1) % 3],
      z: -10 - i * 15,
      a: true
    }))
  );

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [distance, setDistance] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [state, setState] = useState("menu");
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const [isHyperBoosting, setIsHyperBoosting] = useState(false);
  const [isAirborne, setIsAirborne] = useState(false);
  const [speedNotification, setSpeedNotification] = useState(null);

  const { getDir } = useKeyboardControls();

  // Reset Run State
  const reset = () => {
    hp.current = 3;
    sc.current = 0;
    dist.current = 0;
    lastTier.current = 0;
    vy.current = 0;
    inv.current = 0;
    jumpCount.current = 0;
    setScore(0);
    setLives(3);
    setDistance(0);
    setSpeedNotification(null);
    obs.current.forEach((o, i) => {
      o.x = LANES[Math.floor(Math.random() * 3)];
      o.z = -18 - i * 17;
    });
    coins.current.forEach((c, i) => {
      c.a = true;
      c.x = LANES[Math.floor(Math.random() * 3)];
      c.z = -10 - i * 15;
    });
    if (pRef.current) pRef.current.position.set(0, 0, 0);
  };

  // Start Run
  const start = () => {
    reset();
    setState("playing");
    setPaused(false);
    if (!muted) sfx(620, "triangle", 0.18);
  };

  // Physical Keyboard Listeners
  useEffect(() => {
    const dn = (e) => {
      const k = e.key.toLowerCase();
      keys.current[k] = true;
      keys.current[e.code] = true;
      if (k === "e" && !e.repeat) {
        if (typeof window !== "undefined") {
          window.__spiderHeroKickTime = Date.now();
          window.__spiderCombat = { move: "front_kick", time: Date.now(), duration: 360 };
        }
        if (!muted) sfx(380, "triangle", 0.16);
      }
      if ((k === "f" || k === "q") && !e.repeat) {
        if (typeof window !== "undefined") {
          window.__spiderHeroKickTime = Date.now();
          window.__spiderCombat = { move: "jab", time: Date.now(), duration: 240 };
        }
        if (!muted) sfx(460, "triangle", 0.12);
      }
      if (k === "x" && !e.repeat) {
        if (typeof window !== "undefined") {
          window.__spiderHeroKickTime = Date.now();
          window.__spiderCombat = { move: "shadow_blast", time: Date.now(), duration: 520 };
        }
        if (!muted) sfx(120, "sawtooth", 0.35);
      }
      if (e.key === "Escape") setPaused((p) => !p);
      if ((e.key === "Enter" || e.key === " ") && state !== "playing") start();
      if (k === "r") {
        reset();
        setState("playing");
      }
    };
    const up = (e) => {
      keys.current[e.key.toLowerCase()] = false;
      keys.current[e.code] = false;
    };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", dn);
      window.removeEventListener("keyup", up);
    };
  }, [state, muted]);

  // Touch Gesture Listeners (Push Forward = Boost, Swipe Left/Right = Steer, Tap = Jump)
  useEffect(() => {
    const handleTouchStart = (e) => {
      if (e.target && (e.target.closest("button") || e.target.closest("a") || e.target.closest("[data-interactive]"))) {
        return;
      }
      const t = e.touches[0];
      if (!t) return;
      touchState.current = {
        startX: t.clientX,
        startY: t.clientY,
        active: true,
        isTap: true,
        startTime: Date.now()
      };

      if (stateRef.current !== "playing") {
        start();
      }
    };

    const handleTouchMove = (e) => {
      if (e.target && (e.target.closest("button") || e.target.closest("a") || e.target.closest("[data-interactive]"))) {
        return;
      }
      if (!touchState.current.active) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - touchState.current.startX;
      const dy = t.clientY - touchState.current.startY;

      if (Math.hypot(dx, dy) > 8) {
        touchState.current.isTap = false;
      }

      if (stateRef.current !== "playing") {
        start();
      }

      if (typeof window !== "undefined") {
        window.__spiderVirtualTouch = window.__spiderVirtualTouch || {};
        if (dx < -15) {
          window.__spiderVirtualTouch.x = -1;
        } else if (dx > 15) {
          window.__spiderVirtualTouch.x = 1;
        } else {
          window.__spiderVirtualTouch.x = 0;
        }

        // PUSH FORWARD -> TURN ON BOOST!
        if (dy < -20) {
          window.__spiderVirtualTouch.sprint = true;
        } else {
          window.__spiderVirtualTouch.sprint = false;
        }
      }
    };

    const handleTouchEnd = (e) => {
      if (e.target && (e.target.closest("button") || e.target.closest("a") || e.target.closest("[data-interactive]"))) {
        touchState.current.active = false;
        return;
      }
      if (touchState.current.active && touchState.current.isTap && Date.now() - touchState.current.startTime < 350) {
        if (stateRef.current === "playing") {
          // Tap screen = JUMP
          if (typeof window !== "undefined") {
            window.__spiderVirtualTouch = window.__spiderVirtualTouch || {};
            window.__spiderVirtualTouch.jump = true;
            setTimeout(() => {
              if (window.__spiderVirtualTouch) window.__spiderVirtualTouch.jump = false;
            }, 120);
          }
        } else {
          start();
        }
      }
      touchState.current.active = false;
      if (typeof window !== "undefined" && window.__spiderVirtualTouch) {
        window.__spiderVirtualTouch.x = 0;
        window.__spiderVirtualTouch.sprint = false;
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  // Main 60 FPS Game Loop
  useFrame((st, dt) => {
    const p = pRef.current;
    if (!p) return;

    // Menu Camera Sweep & Knight idle preview
    if (state !== "playing") {
      const a = st.clock.elapsedTime * 0.3;
      st.camera.position.set(Math.sin(a) * 7.5, 3.2, Math.cos(a) * 7.5);
      st.camera.lookAt(0, 1.2, 0);
      return;
    }

    if (paused) return;
    dt = Math.min(dt, 0.033);

    // SPEED PROGRESSION: On every 100 meters, increase speed!
    const currentTier = Math.floor(dist.current / 100);
    if (currentTier > lastTier.current) {
      lastTier.current = currentTier;
      setSpeedNotification(`🚀 SPEED UP! ${currentTier * 100}m MILESTONE (+${currentTier * 3.5} SPD)`);
      if (!muted) {
        sfx(780, "sine", 0.1);
        setTimeout(() => sfx(1046, "sine", 0.16), 65);
      }
      setTimeout(() => setSpeedNotification(null), 2400);
    }

    // Base speed increases with every 100m milestone!
    const speedMilestoneBonus = currentTier * 3.5;
    const baseSpeed = 16 + speedMilestoneBonus;

    // PUSH FORWARD TO TURN ON BOOST (W / Up Arrow / Push Forward on Touch Screen)
    const { x } = getDir();
    const boostActive = Boolean(
      keys.current["w"] ||
      keys.current["arrowup"] ||
      keys.current["shift"] ||
      keys.current["shiftleft"] ||
      keys.current["shiftright"] ||
      (typeof window !== "undefined" && window.__spiderVirtualTouch?.sprint)
    );
    if (boostActive !== isHyperBoosting) {
      setIsHyperBoosting(boostActive);
    }

    // OP Boost multiplier: 2.2x speed boost!
    const sprint = boostActive ? 2.2 : 1.0;
    const speed = baseSpeed * sprint;

    dist.current += speed * dt;
    sc.current += dt * (boostActive ? 14 : 6);
    if (Math.floor(sc.current) % 10 === 0) setScore(Math.floor(sc.current));
    if (Math.floor(dist.current) % 5 === 0) setDistance(Math.floor(dist.current));

    // Smooth horizontal lane steering
    p.position.x = Math.max(-3.4, Math.min(3.4, p.position.x + x * (boostActive ? 14 : 11) * dt));

    // MULTI-JUMP / AIR JUMP (Spacebar or Screen Tap - up to 2 jumps in air!)
    const jumpPressed = Boolean(
      keys.current[" "] ||
      keys.current["Space"] ||
      (typeof window !== "undefined" && window.__spiderVirtualTouch?.jump)
    );
    if (jumpPressed && jumpCount.current < 2 && p.position.y <= 2.2) {
      vy.current = 11.2;
      jumpCount.current++;
      keys.current[" "] = false;
      keys.current["Space"] = false;
      if (typeof window !== "undefined" && window.__spiderVirtualTouch) {
        window.__spiderVirtualTouch.jump = false;
      }
      if (!muted) sfx(jumpCount.current === 2 ? 780 : 540, "sine", 0.12);
    }

    vy.current -= 28 * dt;
    p.position.y = Math.max(0, p.position.y + vy.current * dt);
    const airborne = p.position.y > 0.05;
    if (airborne !== isAirborne) setIsAirborne(airborne);

    if (p.position.y <= 0.01) {
      p.position.y = 0;
      vy.current = 0;
      jumpCount.current = 0;
    }

    // Knight banks smoothly into turns
    p.rotation.z = -x * 0.25;
    inv.current -= dt;

    // Moving Ground Stripes
    sR.current.forEach((m) => {
      if (!m) return;
      m.position.z = ((m.position.z + speed * dt + 6) % 36) - 30;
    });

    // Obstacle Logic & Collision
    obs.current.forEach((o, i) => {
      const m = oR.current[i];
      if (!m) return;
      o.z += speed * dt;
      if (o.z > 9) {
        o.z -= 238;
        o.x = LANES[Math.floor(Math.random() * 3)];
      }
      m.position.set(o.x, o.h / 2, o.z);
      m.rotation.y = st.clock.elapsedTime * 0.4 + i;

      // Martial Arts Kick Smash (E key)
      const now = Date.now();
      const kickTime = typeof window !== "undefined" ? window.__spiderHeroKickTime || 0 : 0;
      const isKicking = now - kickTime < 380;
      if (
        isKicking &&
        Math.abs(o.z) < 2.4 &&
        Math.abs(o.x - p.position.x) < 1.4
      ) {
        // Kick smash! Launch obstacle backward and award bonus points
        o.z -= 48;
        sc.current += 150;
        setScore(Math.floor(sc.current));
        setSpeedNotification("🥋 KICK SMASH! +150 PTS");
        if (!muted) {
          sfx(440, "triangle", 0.18);
          setTimeout(() => sfx(220, "sawtooth", 0.22), 50);
        }
        setTimeout(() => setSpeedNotification(null), 1600);
        return;
      }

      if (
        Math.abs(o.z) < 0.95 &&
        Math.abs(o.x - p.position.x) < 1.05 &&
        p.position.y < o.h &&
        inv.current <= 0
      ) {
        inv.current = 1.6;
        hp.current--;
        setLives(hp.current);
        if (!muted) sfx(180, "sawtooth", 0.25);
        if (hp.current <= 0) {
          setState("gameover");
          if (!muted) {
            sfx(140, "sawtooth", 0.4);
            setTimeout(() => sfx(90, "sawtooth", 0.5), 200);
          }
        }
      }
    });

    // Ring Collection (Rings float at chest height Y=1.1)
    coins.current.forEach((c, i) => {
      const m = cR.current[i];
      if (!m) return;
      c.z += speed * dt;
      if (c.z > 9) {
        c.z -= 210;
        c.x = LANES[Math.floor(Math.random() * 3)];
        c.a = true;
      }
      if (c.a) {
        m.position.set(c.x, 1.1, c.z);
        m.rotation.y = st.clock.elapsedTime * 2.5;
        if (
          Math.abs(c.z) < 1.1 &&
          Math.abs(c.x - p.position.x) < 1.1 &&
          Math.abs(p.position.y - 0.2) < 1.6
        ) {
          c.a = false;
          sc.current += 30;
          setScore(Math.floor(sc.current));
          if (!muted) sfx(920, "sine", 0.14);
        }
      }
    });

    // Third-Person Chase Cam behind Knight
    const targetCamZ = boostActive ? 9.8 : 7.6;
    const targetCamY = boostActive ? 4.2 : 3.8;
    st.camera.position.lerp({ x: p.position.x * 0.55, y: targetCamY, z: targetCamZ }, 0.1);
    st.camera.lookAt(p.position.x * 0.4, 1.3, -8);
  });

  return (
    <group>
      <ambientLight intensity={0.65} />
      <directionalLight position={[6, 14, 6]} intensity={1.7} castShadow color="#fef3c7" />
      <fog attach="fog" args={["#0f172a", 18, 62]} />

      {/* Main Track Floor */}
      <mesh position={[0, -0.25, -22]} receiveShadow>
        <boxGeometry args={[9, 0.5, 75]} />
        <meshStandardMaterial color="#111827" roughness={0.85} />
      </mesh>

      {/* Neon Side Guardrails */}
      {[-4.7, 4.7].map((x) => (
        <mesh key={x} position={[x, 0.45, -22]}>
          <boxGeometry args={[0.35, 0.9, 75]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={isHyperBoosting ? 2.5 : 1.6} />
        </mesh>
      ))}

      {/* Lane Markers */}
      {LANES.map((x) => (
        <mesh key={x} position={[x, 0.02, -22]}>
          <boxGeometry args={[0.08, 0.04, 75]} />
          <meshStandardMaterial color="#334155" emissive="#475569" emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* Speed Lines */}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => (sR.current[i] = el)}
          position={[((i % 3) - 1) * 2.3, 0.03, -i * 5]}
        >
          <planeGeometry args={[0.22, 1.8]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} />
        </mesh>
      ))}

      {/* Distant Cyber Mountain Peaks */}
      {[-35, -15, 5, 25].map((z, i) => (
        <group key={i}>
          <mesh position={[-8, 2.2, z]}>
            <coneGeometry args={[2.4, 5, 6]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[8, 2.8, z - 3]}>
            <coneGeometry args={[3, 6.5, 6]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      ))}

      {/* 3D Cyber Knight Character */}
      <group ref={pRef} position={[0, 0, 0]}>
        <CyberKnight
          isBoosting={isHyperBoosting}
          isAirborne={isAirborne}
          isInvulnerable={inv.current > 0}
          isRunning={state === "playing"}
        />
      </group>

      {/* Obstacles */}
      {obs.current.map((o, i) => (
        <mesh key={i} ref={(el) => (oR.current[i] = el)} castShadow>
          <boxGeometry args={[1.25, o.h, 1.25]} />
          <meshStandardMaterial
            color={i % 2 ? "#ef4444" : "#f97316"}
            emissive={i % 2 ? "#991b1b" : "#9a3412"}
            emissiveIntensity={0.8}
            roughness={0.6}
          />
        </mesh>
      ))}

      {/* Gold Ring Pickups */}
      {coins.current.map((c, i) => (
        <mesh key={i} ref={(el) => (cR.current[i] = el)}>
          <torusGeometry args={[0.42, 0.13, 10, 22]} />
          <meshStandardMaterial color="#fde047" emissive="#eab308" emissiveIntensity={1.6} metalness={0.6} roughness={0.2} />
        </mesh>
      ))}

      {/* Pause Menu & Sound Toggle */}
      <PauseOverlay
        paused={paused}
        onTogglePause={() => setPaused(!paused)}
        soundMuted={muted}
        onToggleSound={() => setMuted(!muted)}
        onExit={() => {
          setPaused(false);
          setState("menu");
        }}
      />

      {/* Speed Milestone Notification */}
      {speedNotification && (
        <Html fullscreen style={{ pointerEvents: "none" }} calculatePosition={(_, __, s) => [s.width / 2, s.height / 2]}>
          <div
            style={{
              position: "absolute",
              top: 110,
              left: "50%",
              transform: "translateX(-50%)",
              background: "linear-gradient(90deg, rgba(245,158,11,0.95), rgba(234,88,12,0.95))",
              color: "#fff",
              padding: "8px 22px",
              borderRadius: 30,
              fontFamily: "sans-serif",
              fontWeight: 800,
              fontSize: 14,
              boxShadow: "0 0 25px rgba(245,158,11,0.7)",
              pointerEvents: "none",
              animation: "pulse 1s infinite",
              whiteSpace: "nowrap"
            }}
          >
            {speedNotification}
          </div>
        </Html>
      )}

      {/* Start / Game Over Screen */}
      {state !== "playing" && (
        <Html fullscreen style={{ pointerEvents: "none" }} calculatePosition={(_, __, s) => [s.width / 2, s.height / 2]}>
          <div
            onClick={start}
            onTouchStart={(e) => {
              if (e.target && (e.target.closest("button") || e.target.closest("a") || e.target.closest("[data-interactive]"))) return;
              start();
            }}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "radial-gradient(circle,rgba(14,165,233,.28),rgba(2,6,23,.93))",
              color: "#fff",
              fontFamily: "sans-serif",
              textAlign: "center",
              pointerEvents: "auto",
              cursor: "pointer",
              userSelect: "none"
            }}
          >
            <div style={{ letterSpacing: 5, fontSize: 12, color: "#7dd3fc" }}>ENDLESS • FAST • OP BOOST RUNNER</div>
            <h1 style={{ fontSize: "clamp(30px, 7vw, 52px)", margin: "8px 0", color: "#fde047", textShadow: "0 0 32px #0284c7" }}>
              ⚔️ CYBER KNIGHT RUNNER
            </h1>
            <p style={{ maxWidth: 440, opacity: 0.92, fontSize: "clamp(12px, 3.5vw, 14px)", padding: "0 14px" }}>
              {state === "gameover"
                ? `💀 Run over! Distance: ${distance}m • Final score: ${score}`
                : "Sprint down the neon highway, push forward for OP BOOST, double-jump barriers and collect gold rings!"}
            </p>
            <p style={{ fontSize: "clamp(11px, 3vw, 13px)", opacity: 0.85, padding: "0 12px" }}>
              {typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0)
                ? "🕹️ Touch anywhere to start • Swipe to Steer • Push Forward for BOOST • Tap to JUMP"
                : "⌨️ A/D Move • SPACE Jump • E KICK SMASH 🥋 • Shift / W Boost • Esc Pause • R Restart"}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                start();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                e.preventDefault();
                start();
              }}
              style={{
                pointerEvents: "auto",
                marginTop: 14,
                background: "#22c55e",
                color: "#fff",
                border: "none",
                padding: "16px 42px",
                borderRadius: 14,
                fontSize: "clamp(16px, 4vw, 20px)",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 0 26px #16a34a",
                touchAction: "manipulation"
              }}
            >
              ▶ START RUN
            </button>
            <div style={{ marginTop: 12 }}>
              ❤️ {lives} &nbsp; 📏 {distance}m &nbsp; 🏆 {score}
            </div>
          </div>
        </Html>
      )}

      {/* In-Game Active HUD */}
      {state === "playing" && (
        <Html fullscreen style={{ pointerEvents: "none" }} calculatePosition={(_, __, s) => [s.width / 2, s.height / 2]}>
          <div
            style={{
              position: "absolute",
              top: 54,
              left: "50%",
              transform: "translateX(-50%)",
              color: "#fff",
              background: "rgba(0,0,0,.6)",
              backdropFilter: "blur(6px)",
              padding: "6px 16px",
              borderRadius: 20,
              fontFamily: "sans-serif",
              fontWeight: 700,
              fontSize: 13,
              whiteSpace: "nowrap",
              border: isHyperBoosting ? "1px solid #f59e0b" : "1px solid rgba(255,255,255,0.15)",
              boxShadow: isHyperBoosting ? "0 0 20px #f59e0b" : "none",
              pointerEvents: "none"
            }}
          >
            ⚔️ CYBER KNIGHT RUNNER &nbsp; ❤️ {lives} &nbsp; 📏 {distance}m &nbsp; 🏆 {score}
            {isHyperBoosting && (
              <span style={{ marginLeft: 10, color: "#f59e0b", fontWeight: 900 }}>🔥 OP BOOST!</span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
