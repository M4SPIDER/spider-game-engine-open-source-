import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useKeyboardControls } from './ArenaEnv.jsx';

export default function GameComponent() {
  const [gameState, setGameState] = useState('menu');
  const playing = gameState === 'playing';
  const playerRef = useRef();
  const camInit = useRef(false);
  const [hud, setHud] = useState({ score: 0, coins: 0, lives: 3 });
  const dataRef = useRef({ score: 0, coins: 0, lives: 3, inv: 0 });
  const st = useRef({ x: 0, y: 0, vy: 0, face: 1, onGround: true });
  const enemyRefs = useRef([]);
  const coinRefs = useRef([]);
  const { getDir } = useKeyboardControls();

  const LEVEL = useMemo(() => ({
    grounds: [{ x1: -12, x2: 22 }, { x1: 26, x2: 48 }, { x1: 52, x2: 78 }, { x1: 82, x2: 118 }],
    bricks: [
      { x: 8, y: 3.2 }, { x: 9.5, y: 3.2 }, { x: 11, y: 3.2, q: true }, { x: 12.5, y: 3.2 },
      { x: 32, y: 3.2, q: true }, { x: 33.5, y: 3.2 }, { x: 38, y: 5, q: true },
      { x: 58, y: 3.2 }, { x: 59.5, y: 3.2, q: true }, { x: 61, y: 3.2 }
    ].map(b => ({ ...b, used: false })),
    pipes: [{ x: 18, h: 2.6, w: 2.2 }, { x: 36, h: 3.4, w: 2.2 }, { x: 62, h: 2.8, w: 2.4 }, { x: 72, h: 3.6, w: 2.4 }],
    stairs: [{ x: 84, y: 0.5 }, { x: 85, y: 1.5 }, { x: 86, y: 2.5 }, { x: 87, y: 3.5 }],
    coins: [
      { x: 11, y: 4.6 }, { x: 24, y: 3 }, { x: 24.8, y: 3.8 }, { x: 25.6, y: 4.4 }, { x: 32.7, y: 4.6 },
      { x: 42, y: 2 }, { x: 44, y: 2 }, { x: 50, y: 3 }, { x: 50.8, y: 3.8 }, { x: 51.6, y: 4.4 },
      { x: 60.2, y: 4.6 }, { x: 68, y: 2.5 }, { x: 80, y: 3 }, { x: 80.8, y: 3.8 }, { x: 81.6, y: 4.4 },
      { x: 90, y: 4 }, { x: 92, y: 4 }, { x: 94, y: 4 }
    ].map(c => ({ ...c, on: true, ph: Math.random() * 6.28 })),
    enemies: [
      { x0: 14, r: 4, speed: 1.6, dir: 1 }, { x0: 30, r: 4, speed: 1.8, dir: -1 },
      { x0: 42, r: 5, speed: 2, dir: 1 }, { x0: 56, r: 4, speed: 2.2, dir: -1 },
      { x0: 68, r: 5, speed: 2.4, dir: 1 }, { x0: 76, r: 3, speed: 2, dir: -1 }
    ].map(e => ({ ...e, x: e.x0, alive: true })),
    flagX: 96
  }), []);

  useEffect(() => {
    if (gameState === 'playing') {
      st.current = { x: 0, y: 0, vy: 0, face: 1, onGround: true };
      dataRef.current = { score: 0, coins: 0, lives: 3, inv: 0 };
      LEVEL.coins.forEach(c => c.on = true);
      LEVEL.enemies.forEach(e => { e.x = e.x0; e.alive = true; });
      LEVEL.bricks.forEach(b => b.used = false);
      setHud({ score: 0, coins: 0, lives: 3 });
      camInit.current = false;
    }
  }, [gameState, LEVEL]);

  useEffect(() => {
    const id = setInterval(() => {
      setHud({ score: dataRef.current.score, coins: dataRef.current.coins, lives: dataRef.current.lives });
    }, 250);
    return () => clearInterval(id);
  }, []);

  function isGround(x) {
    for (let i = 0; i < LEVEL.grounds.length; i++) {
      const g = LEVEL.grounds[i];
      if (x > g.x1 && x < g.x2) return true;
    }
    return false;
  }

  useFrame((state, dt0) => {
    const t = state.clock.elapsedTime;
    for (let i = 0; i < LEVEL.coins.length; i++) {
      const m = coinRefs.current[i];
      const c = LEVEL.coins[i];
      if (m) {
        m.visible = c.on;
        if (c.on) {
          m.rotation.y += dt0 * 3;
          m.position.y = c.y + Math.sin(t * 3 + c.ph) * 0.15;
        }
      }
    }
    for (let i = 0; i < LEVEL.enemies.length; i++) {
      const m = enemyRefs.current[i];
      if (m && LEVEL.enemies[i].alive) {
        m.position.y = 0.55 + Math.abs(Math.sin(t * 6 + i)) * 0.08;
      }
    }
    if (gameState !== 'playing') {
      const cam = state.camera;
      const mx = 6 + Math.sin(t * 0.25) * 3;
      cam.position.set(mx, 5.5, 13);
      cam.lookAt(mx, 2.2, 0);
      if (playerRef.current) playerRef.current.position.set(0, 0, 0);
      return;
    }
    const dt = Math.min(dt0, 0.033);
    const s = st.current;
    const D = dataRef.current;
    let mx = 0;
    let jmp = false;
    try {
      const d = getDir();
      mx = d.x || 0;
      jmp = !!d.jump;
    } catch (e) {}
    const vt = window.__spiderVirtualTouch;
    if (vt && typeof vt.x === 'number' && vt.x !== 0) mx = vt.x;
    if (Math.abs(mx) < 0.08) mx = 0;
    if (mx !== 0) s.face = mx > 0 ? 1 : -1;
    const speed = 7.5;
    let newX = s.x + mx * speed * dt;
    if (newX < -10) newX = -10;
    if (newX > 112) newX = 112;
    for (let i = 0; i < LEVEL.pipes.length; i++) {
      const p = LEVEL.pipes[i];
      const half = p.w / 2;
      if (newX + 0.5 > p.x - half && newX - 0.5 < p.x + half && s.y < p.h - 0.3) {
        if (s.x <= p.x - half) newX = p.x - half - 0.5;
        else if (s.x >= p.x + half) newX = p.x + half + 0.5;
        else { if (mx > 0) newX = p.x - half - 0.5; else newX = p.x + half + 0.5; }
      }
    }
    s.x = newX;
    if (jmp && s.onGround) {
      s.vy = 11.5;
      s.onGround = false;
    }
    const vtJ = window.__spiderVirtualTouch;
    if (vtJ && vtJ.jump) {
      if (s.onGround) {
        s.vy = 11.5;
        s.onGround = false;
      }
      window.__spiderVirtualTouch.jump = false;
    }
    s.vy -= 30 * dt;
    if (s.vy < -18) s.vy = -18;
    let newY = s.y + s.vy * dt;
    s.onGround = false;
    if (newY <= 0 && isGround(s.x)) {
      newY = 0;
      s.vy = 0;
      s.onGround = true;
    }
    for (let i = 0; i < LEVEL.pipes.length; i++) {
      const p = LEVEL.pipes[i];
      const half = p.w / 2;
      if (s.x > p.x - half - 0.4 && s.x < p.x + half + 0.4) {
        if (s.y >= p.h - 0.2 && newY <= p.h && s.vy <= 0) {
          newY = p.h;
          s.vy = 0;
          s.onGround = true;
        }
      }
    }
    for (let i = 0; i < LEVEL.bricks.length; i++) {
      const b = LEVEL.bricks[i];
      if (Math.abs(s.x - b.x) < 0.9) {
        const top = b.y + 0.5;
        const bot = b.y - 0.5;
        if (s.y >= top - 0.2 && newY <= top && s.vy <= 0) {
          newY = top;
          s.vy = 0;
          s.onGround = true;
        }
        const headOld = s.y + 1.9;
        const headNew = newY + 1.9;
        if (s.vy > 0 && headOld <= bot && headNew >= bot && s.y < bot) {
          newY = bot - 1.9;
          s.vy = 0;
          if (!b.used) {
            b.used = true;
            D.score += 100;
            D.coins += 1;
          }
        }
      }
    }
    for (let i = 0; i < LEVEL.stairs.length; i++) {
      const b = LEVEL.stairs[i];
      const top = b.y + 0.5;
      if (Math.abs(s.x - b.x) < 0.9) {
        if (s.y >= top - 0.3 && newY <= top && s.vy <= 0) {
          newY = top;
          s.vy = 0;
          s.onGround = true;
        }
      }
    }
    s.y = newY;
    if (s.y < -6) {
      D.lives -= 1;
      if (D.lives <= 0) {
        setGameState('gameover');
        return;
      }
      s.x = Math.max(-10, s.x - 4);
      s.y = 4;
      s.vy = 0;
      D.inv = 2;
    }
    if (D.inv > 0) D.inv -= dt;
    for (let i = 0; i < LEVEL.coins.length; i++) {
      const c = LEVEL.coins[i];
      if (!c.on) continue;
      const dx = s.x - c.x;
      const dy = (s.y + 1) - c.y;
      if (dx * dx + dy * dy < 1.44) {
        c.on = false;
        D.coins += 1;
        D.score += 100;
      }
    }
    for (let i = 0; i < LEVEL.enemies.length; i++) {
      const e = LEVEL.enemies[i];
      if (!e.alive) continue;
      e.x += e.dir * e.speed * dt;
      if (e.x > e.x0 + e.r) e.dir = -1;
      if (e.x < e.x0 - e.r) e.dir = 1;
      const m = enemyRefs.current[i];
      if (m) {
        m.visible = true;
        m.position.x = e.x;
      }
      if (Math.abs(s.x - e.x) < 0.9 && s.y < 1.2 && s.y > -0.5) {
        if (s.vy < -2 && s.y >= 0.3) {
          e.alive = false;
          if (m) m.visible = false;
          s.vy = 8;
          D.score += 200;
        } else if (D.inv <= 0) {
          D.lives -= 1;
          D.inv = 2;
          if (D.lives <= 0) {
            setGameState('gameover');
            return;
          }
          s.vy = 7;
        }
      }
    }
    if (s.x >= LEVEL.flagX) {
      D.score += 500;
      setGameState('win');
      return;
    }
    if (playerRef.current) {
      playerRef.current.position.set(s.x, s.y, 0);
      playerRef.current.rotation.y = s.face > 0 ? 0 : Math.PI;
      const run = Math.abs(mx) > 0.1 && s.onGround ? Math.sin(t * 12) * 0.25 : 0;
      playerRef.current.rotation.z = run * 0.3;
      playerRef.current.visible = D.inv > 0 ? (Math.sin(t * 20) > 0) : true;
    }
    const cam = state.camera;
    if (!camInit.current) {
      cam.position.set(s.x, 5, 13);
      camInit.current = true;
    }
    const tx = s.x + 1.5;
    cam.position.x += (tx - cam.position.x) * Math.min(1, dt * 5);
    cam.position.y += (5.2 - cam.position.y) * Math.min(1, dt * 5);
    cam.position.z += (13 - cam.position.z) * Math.min(1, dt * 5);
    cam.lookAt(cam.position.x - 1.5, 2.2, 0);
  });

  return (
    <group>
      <ambientLight intensity={0.75} />
      <directionalLight position={[8, 14, 6]} intensity={1.15} />
      <color attach="background" args={['#5c94fc']} />
      {[[-6, 9, -6], [10, 10, -8], [30, 9, -5], [55, 10, -6], [80, 9, -7], [100, 10, -6]].map((p, i) => (
        <group key={i} position={p}>
          <mesh><sphereGeometry args={[1.2, 16, 16]} /><meshStandardMaterial color="#ffffff" /></mesh>
          <mesh position={[1.2, 0.2, 0]}><sphereGeometry args={[0.9, 16, 16]} /><meshStandardMaterial color="#ffffff" /></mesh>
          <mesh position={[-1.2, 0.1, 0]}><sphereGeometry args={[0.8, 16, 16]} /><meshStandardMaterial color="#ffffff" /></mesh>
        </group>
      ))}
      {LEVEL.grounds.map((g, i) => {
        const w = g.x2 - g.x1;
        const cx = (g.x1 + g.x2) / 2;
        return (
          <group key={i}>
            <mesh position={[cx, -1, 0]}><boxGeometry args={[w, 2, 6]} /><meshStandardMaterial color="#c84c0c" /></mesh>
            <mesh position={[cx, 0.05, 0]}><boxGeometry args={[w, 0.2, 6]} /><meshStandardMaterial color="#22c55e" /></mesh>
          </group>
        );
      })}
      {LEVEL.bricks.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, 0]}>
          <boxGeometry args={[1.2, 1, 1.2]} />
          <meshStandardMaterial color={b.used ? '#8d6e63' : (b.q ? '#ffb300' : '#d2691e')} />
        </mesh>
      ))}
      {LEVEL.pipes.map((p, i) => (
        <group key={i} position={[p.x, p.h / 2, 0]}>
          <mesh><boxGeometry args={[p.w, p.h, 1.8]} /><meshStandardMaterial color="#16a34a" /></mesh>
          <mesh position={[0, p.h / 2 + 0.2, 0]}><boxGeometry args={[p.w + 0.5, 0.6, 2.1]} /><meshStandardMaterial color="#22c55e" /></mesh>
        </group>
      ))}
      {LEVEL.stairs.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, 0]}>
          <boxGeometry args={[1, 1, 1.5]} />
          <meshStandardMaterial color="#c84c0c" />
        </mesh>
      ))}
      <group position={[LEVEL.flagX, 0, 0]}>
        <mesh position={[0, 4.5, 0]}><cylinderGeometry args={[0.12, 0.12, 9]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh position={[1, 8, 0]}><boxGeometry args={[1.8, 1.2, 0.1]} /><meshStandardMaterial color="#ef4444" /></mesh>
      </group>
      {LEVEL.coins.map((c, i) => (
        <mesh key={i} ref={(e) => (coinRefs.current[i] = e)} position={[c.x, c.y, 0]}>
          <torusGeometry args={[0.42, 0.16, 10, 22]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffaa00" emissiveIntensity={1.2} />
        </mesh>
      ))}
      {LEVEL.enemies.map((e, i) => (
        <group key={i} ref={(el) => (enemyRefs.current[i] = el)} position={[e.x0, 0.55, 0]}>
          <mesh><sphereGeometry args={[0.6, 18, 18]} /><meshStandardMaterial color="#7c4a21" /></mesh>
          <mesh position={[-0.18, 0.15, 0.5]}><sphereGeometry args={[0.12, 10, 10]} /><meshBasicMaterial color="#ffffff" /></mesh>
          <mesh position={[0.18, 0.15, 0.5]}><sphereGeometry args={[0.12, 10, 10]} /><meshBasicMaterial color="#ffffff" /></mesh>
        </group>
      ))}
      <group ref={playerRef} position={[0, 0, 0]}>
        <mesh position={[-0.18, 0.25, 0]}><boxGeometry args={[0.32, 0.5, 0.4]} /><meshStandardMaterial color="#1e40af" /></mesh>
        <mesh position={[0.18, 0.25, 0]}><boxGeometry args={[0.32, 0.5, 0.4]} /><meshStandardMaterial color="#1e40af" /></mesh>
        <mesh position={[0, 0.9, 0]}><boxGeometry args={[0.7, 0.7, 0.5]} /><meshStandardMaterial color="#e11d48" /></mesh>
        <mesh position={[0, 1.5, 0]}><sphereGeometry args={[0.38, 18, 18]} /><meshStandardMaterial color="#ffcc99" /></mesh>
        <mesh position={[0, 1.75, 0]}><sphereGeometry args={[0.4, 18, 12, 0, 6.283, 0, 1.2]} /><meshStandardMaterial color="#e11d48" /></mesh>
      </group>

      {/* IN-GAME HUD: DOCKED TOP-CENTER (CLEAR OF EXIT FULL & VIEWPORT BUTTONS) */}
      {playing && (
        <Html fullscreen>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div
              style={{
                position: 'absolute',
                top: 14,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 14,
                alignItems: 'center',
                background: 'rgba(15, 23, 42, 0.88)',
                backdropFilter: 'blur(8px)',
                padding: '6px 20px',
                borderRadius: 20,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                whiteSpace: 'nowrap',
                zIndex: 40,
                pointerEvents: 'none'
              }}
            >
              <span style={{ color: '#ffffff', fontWeight: 900, fontSize: 13 }}>SCORE {hud.score}</span>
              <span style={{ color: '#facc15', fontWeight: 900, fontSize: 13 }}>🪙 {hud.coins}</span>
              <span style={{ color: '#f87171', fontWeight: 900, fontSize: 13 }}>❤️ {hud.lives}</span>
            </div>
          </div>
        </Html>
      )}

      {/* START SCREEN: TAP ANYWHERE TO START */}
      {gameState === 'menu' && (
        <Html fullscreen>
          <div
            onClick={() => setGameState('playing')}
            onTouchStart={() => setGameState('playing')}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'radial-gradient(circle at center, rgba(14, 165, 233, 0.35) 0%, rgba(2, 6, 23, 0.94) 85%)',
              color: '#ffffff',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              textAlign: 'center',
              padding: '14px 20px',
              boxSizing: 'border-box',
              pointerEvents: 'auto',
              cursor: 'pointer',
              zIndex: 50,
              maxHeight: '100%',
              overflowY: 'auto',
              touchAction: 'manipulation'
            }}
          >
            <div style={{ letterSpacing: 4, fontSize: 11, color: '#7dd3fc', fontWeight: 800, textTransform: 'uppercase' }}>
              POCKET 3D PLATFORMER
            </div>
            <h1
              style={{
                fontSize: 'clamp(26px, 6vw, 44px)',
                margin: '6px 0',
                color: '#fde047',
                textShadow: '0 0 30px rgba(2, 132, 199, 0.8)',
                fontWeight: 900,
                lineHeight: 1.1
              }}
            >
              🍄 SUPER RUNNER
            </h1>
            <p style={{ maxWidth: 380, fontSize: 'clamp(12px, 3vw, 14px)', opacity: 0.9, margin: '0 0 14px 0' }}>
              Collect coins, stomp enemies, hit question bricks, and reach the finish flag!
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setGameState('playing');
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                setGameState('playing');
              }}
              style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 16,
                padding: '14px 38px',
                fontSize: 'clamp(16px, 4vw, 20px)',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 0 25px rgba(34, 197, 94, 0.65)',
                touchAction: 'manipulation'
              }}
            >
              ▶ TAP TO START
            </button>
            <div style={{ color: '#cbd5e1', fontSize: 11, marginTop: 10, fontWeight: 600 }}>
              🕹️ Use Virtual Joystick to Move • JUMP button to Jump
            </div>
          </div>
        </Html>
      )}

      {/* GAME OVER SCREEN */}
      {gameState === 'gameover' && (
        <Html fullscreen>
          <div
            onClick={() => setGameState('playing')}
            onTouchStart={() => setGameState('playing')}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(2, 6, 23, 0.92)',
              pointerEvents: 'auto',
              cursor: 'pointer',
              zIndex: 50,
              padding: 20
            }}
          >
            <div style={{ color: '#ef4444', fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 900 }}>GAME OVER</div>
            <div style={{ color: '#fff', margin: '8px 0 16px 0', fontSize: 16 }}>Score: {hud.score} • Coins: {hud.coins}</div>
            <button
              onClick={() => setGameState('playing')}
              style={{ background: '#22c55e', border: 'none', borderRadius: 14, padding: '14px 40px', fontSize: 18, fontWeight: 900, color: '#fff', cursor: 'pointer' }}
            >
              🔄 RETRY
            </button>
          </div>
        </Html>
      )}

      {/* VICTORY SCREEN */}
      {gameState === 'win' && (
        <Html fullscreen>
          <div
            onClick={() => setGameState('playing')}
            onTouchStart={() => setGameState('playing')}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, rgba(2, 6, 23, 0.94) 85%)',
              pointerEvents: 'auto',
              cursor: 'pointer',
              zIndex: 50,
              padding: 20
            }}
          >
            <div style={{ color: '#fde047', fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 900 }}>🎉 LEVEL COMPLETE!</div>
            <div style={{ color: '#fff', margin: '8px 0 16px 0', fontSize: 16 }}>Final Score: {hud.score} • Coins: {hud.coins}</div>
            <button
              onClick={() => setGameState('playing')}
              style={{ background: '#3b82f6', border: 'none', borderRadius: 14, padding: '14px 40px', fontSize: 18, fontWeight: 900, color: '#fff', cursor: 'pointer' }}
            >
              ▶ PLAY AGAIN
            </button>
          </div>
        </Html>
      )}
    </group>
  );
}
