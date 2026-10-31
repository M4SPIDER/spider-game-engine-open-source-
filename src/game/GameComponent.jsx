import React, { useRef, useState, useEffect } from "react";
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
    if (pRef.current) pRef.current.position.set(0, 0.65, 0);
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
      keys.current[e.key.toLowerCase()] = true;
      keys.current[e.code] = true;
      if (e.key === "Escape") setPaused((p) => !p);
      if ((e.key === "Enter" || e.key === " ") && state !== "playing") start();
      if (e.key.toLowerCase() === "r") {
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
      // Don't intercept touches on buttons or interactive UI (speaker, pause, etc.)
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

      // Tapping or swiping anywhere starts the run immediately!
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
        // Steer Left / Right (smooth responsive threshold)
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

    // Menu Camera Sweep
    if (state !== "playing") {
      const a = st.clock.elapsedTime * 0.25;
      st.camera.position.set(Math.sin(a) * 9, 4.5, Math.cos(a) * 9);
      st.camera.lookAt(0, 1, -4);
      p.rotation.x += dt * 2;
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
      vy.current = 10.4;
      jumpCount.current++;
      keys.current[" "] = false;
      keys.current["Space"] = false;
      if (typeof window !== "undefined" && window.__spiderVirtualTouch) {
        window.__spiderVirtualTouch.jump = false;
      }
      if (!muted) sfx(jumpCount.current === 2 ? 780 : 540, "sine", 0.12);
    }

    vy.current -= 28 * dt;
    p.position.y = Math.max(0.65, p.position.y + vy.current * dt);
    if (p.position.y <= 0.66) {
      vy.current = 0;
      jumpCount.current = 0;
    }

    // Rapid ball rotation according to speed
    p.rotation.x -= speed * dt * 0.95;
    p.rotation.z = -x * 0.3;
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
      if (
        Math.abs(o.z) < 0.95 &&
        Math.abs(o.x - p.position.x) < 1.05 &&
        p.position.y < 0.65 + o.h &&
        inv.current <= 0
      ) {
        inv.current = 1.6;
        hp.current--;
        setLives(hp.current);
        if (!muted) sfx(85, "sawtooth", 0.22);
        o.z -= 18;
        if (hp.current <= 0) setState("gameover");
      }
    });

    // Coin Pickups
    coins.current.forEach((c, i) => {
      const m = cR.current[i];
      if (!m) return;
      if (!c.a) {
        m.position.y = -5;
        return;
      }
      c.z += speed * dt;
      if (c.z > 9) {
        c.z -= 210;
        c.a = true;
        c.x = LANES[Math.floor(Math.random() * 3)];
      }
      m.position.set(c.x, 1 + Math.sin(st.clock.elapsedTime * 3 + i) * 0.15, c.z);
      m.rotation.y += dt * 3;
      if (
        Math.abs(c.z) < 1 &&
        Math.abs(c.x - p.position.x) < 1.1 &&
        Math.abs(p.position.y + 0.3 - m.position.y) < 1.4
      ) {
        c.a = false;
        sc.current += 30;
        setScore(Math.floor(sc.current));
        if (!muted) sfx(920, "sine", 0.14);
      }
    });

    // Invulnerability Blink & Boost Emissive Pulse
    if (p.children[0]) {
      p.children[0].material.emissiveIntensity =
        inv.current > 0 && Math.floor(st.clock.elapsedTime * 12) % 2 ? 0.15 : boostActive ? 1.8 : 1.0;
    }
    if (p.children[1]) {
      p.children[1].material.emissiveIntensity = boostActive ? 2.6 : 1.2;
    }

    // Third-Person Chase Cam (Pulls back on OP Boost)
    const targetCamZ = boostActive ? 10.5 : 8.2;
    const targetCamY = boostActive ? 4.9 : 4.4;
    st.camera.position.lerp({ x: p.position.x * 0.55, y: targetCamY, z: targetCamZ }, 0.1);
    st.camera.lookAt(p.position.x, 1, -6);
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
        <mesh key={i} ref={(el) => (sR.current[i] = el)} position={[0, 0.03, -i * 3]}>
          <boxGeometry args={[8.8, 0.05, 0.22]} />
          <meshStandardMaterial color="#facc15" emissive="#eab308" emissiveIntensity={isHyperBoosting ? 1.5 : 0.7} />
        </mesh>
      ))}

      {/* Cyber Pylons */}
      {[-9, -14, -24, -34].map((z, i) => (
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

      {/* Player Ball */}
      <group ref={pRef} position={[0, 0.65, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.65, 28, 28]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive={isHyperBoosting ? "#0284c7" : "#0369a1"}
            emissiveIntensity={isHyperBoosting ? 1.8 : 1}
            metalness={0.35}
            roughness={0.25}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.66, 0.07, 10, 28]} />
          <meshStandardMaterial
            color="#facc15"
            emissive={isHyperBoosting ? "#f59e0b" : "#ca8a04"}
            emissiveIntensity={isHyperBoosting ? 2.5 : 1.2}
          />
        </mesh>
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
            <h1 style={{ fontSize: "clamp(32px, 8vw, 54px)", margin: "8px 0", color: "#fde047", textShadow: "0 0 32px #0284c7" }}>
              🏃 BALL RUNNER
            </h1>
            <p style={{ maxWidth: 440, opacity: 0.92, fontSize: "clamp(12px, 3.5vw, 14px)", padding: "0 14px" }}>
              {state === "gameover"
                ? `💀 Run over! Distance: ${distance}m • Final score: ${score}`
                : "Roll at high speed, push forward for OP BOOST, double-jump barriers and collect gold rings!"}
            </p>
            <p style={{ fontSize: "clamp(11px, 3vw, 13px)", opacity: 0.85, padding: "0 12px" }}>
              {typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0)
                ? "🕹️ Touch anywhere to start • Swipe to Steer • Push Forward for BOOST • Tap to JUMP"
                : "⌨️ A/D or ←/→ Move • SPACE Jump (x2) • Push W / ↑ or Shift for OP BOOST • Esc Pause • R Restart"}
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
            🏃 BALL RUNNER &nbsp; ❤️ {lives} &nbsp; 📏 {distance}m &nbsp; 🏆 {score}
            {isHyperBoosting && (
              <span style={{ marginLeft: 10, color: "#f59e0b", fontWeight: 900 }}>🔥 OP BOOST!</span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
