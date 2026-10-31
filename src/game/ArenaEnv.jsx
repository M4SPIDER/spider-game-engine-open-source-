/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
import React, { useEffect, useRef, useState } from 'react';
import { Html, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

/**
 * Hook providing smoothed arrow-key, WASD, and mobile touch swipe/drag movement vector
 */
export function useKeyboardControls() {
  const keys = useRef({});
  const touchDir = useRef({ x: 0, z: 0, jump: false });
  const touchStart = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      const k = e.key.toLowerCase();
      keys.current[k] = true;
      if (k === 'e' && !e.repeat) {
        if (typeof window !== "undefined") {
          window.__spiderHeroKickTime = Date.now();
          window.__spiderHeroKicking = true;
        }
      }
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
        e.preventDefault();
      }
    };
    const onUp = (e) => {
      const k = e.key.toLowerCase();
      keys.current[k] = false;
      if (k === 'e') {
        if (typeof window !== "undefined") {
          window.__spiderHeroKicking = false;
        }
      }
    };

    // Mobile touch controls: swipe & drag to move, tap to jump
    const onTouchStart = (e) => {
      const t = e.touches[0];
      if (t) {
        touchStart.current = { x: t.clientX, y: t.clientY };
        touchDir.current.jump = true;
        setTimeout(() => { touchDir.current.jump = false; }, 150);
      }
    };
    const onTouchMove = (e) => {
      if (!touchStart.current) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - touchStart.current.x;
      const dy = t.clientY - touchStart.current.y;
      if (Math.hypot(dx, dy) > 15) {
        touchDir.current.x = Math.max(-1, Math.min(1, dx / 40));
        touchDir.current.z = Math.max(-1, Math.min(1, dy / 40));
      }
    };
    const onTouchEnd = () => {
      touchStart.current = null;
      touchDir.current = { x: 0, z: 0, jump: false };
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return {
    getDir: () => {
      const k = keys.current;
      let x = 0, z = 0;
      if (k.arrowleft || k.a) x += 1;
      if (k.arrowright || k.d) x -= 1;
      if (k.arrowup || k.w) z -= 1;
      if (k.arrowdown || k.s) z += 1;

      // Merge mobile touch swipe/drag
      if (touchDir.current.x !== 0) x = touchDir.current.x;
      if (touchDir.current.z !== 0) z = touchDir.current.z;

      // Merge virtual on-screen d-pad if present
      if (typeof window !== "undefined" && window.__spiderVirtualTouch) {
        if (window.__spiderVirtualTouch.x) x = window.__spiderVirtualTouch.x;
        if (window.__spiderVirtualTouch.z) z = window.__spiderVirtualTouch.z;
      }

      if (x !== 0 && z !== 0) {
        x *= 0.7071;
        z *= 0.7071;
      }
      const jump = !!(k[' '] || k.spacebar || touchDir.current.jump || (typeof window !== "undefined" && window.__spiderVirtualTouch?.jump));
      return { x, z, jump };
    }
  };
}

/**
 * High-fidelity 3D Arena Ground, Lighting, and Boundary Walls
 */
export function ArenaEnv({
  size = 20,
  groundColor = '#15803d',
  gridColor = '#166534',
  wallColor = '#1e3a8a'
}) {
  const half = size / 2;
  const wallH = 1.2;
  const wallThick = 0.6;

  return (
    <group>
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[12, 18, 12]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      {/* Stadium Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color={groundColor} roughness={0.6} />
      </mesh>
      <gridHelper args={[size, size, '#ffffff', gridColor]} position={[0, 0.01, 0]} />

      {/* Surrounding Boundary Walls */}
      {/* North */}
      <mesh position={[0, wallH / 2, -half]} castShadow receiveShadow>
        <boxGeometry args={[size + wallThick, wallH, wallThick]} />
        <meshStandardMaterial color={wallColor} roughness={0.3} />
      </mesh>
      {/* South */}
      <mesh position={[0, wallH / 2, half]} castShadow receiveShadow>
        <boxGeometry args={[size + wallThick, wallH, wallThick]} />
        <meshStandardMaterial color={wallColor} roughness={0.3} />
      </mesh>
      {/* West */}
      <mesh position={[-half, wallH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallThick, wallH, size]} />
        <meshStandardMaterial color={wallColor} roughness={0.3} />
      </mesh>
      {/* East */}
      <mesh position={[half, wallH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallThick, wallH, size]} />
        <meshStandardMaterial color={wallColor} roughness={0.3} />
      </mesh>
    </group>
  );
}


/* [LINEAGE-AUTHORS]: m4spider */
const __M4_ENGINE_LINEAGE__ = "m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

/**
 * Animated Floating 3D Gold Coin with Emissive Glow
 */
export function CoinPickup({ position = [0, 0.6, 0], collected = false }) {
  const coinRef = useRef();

  useFrame((state) => {
    if (!coinRef.current || collected) return;
    const t = state.clock.elapsedTime;
    coinRef.current.rotation.y = t * 2.8;
    coinRef.current.position.y = position[1] + Math.sin(t * 3.5 + position[0]) * 0.2;
  });

  if (collected) return null;

  return (
    <mesh ref={coinRef} position={position} castShadow>
      <cylinderGeometry args={[0.4, 0.4, 0.14, 24]} />
      <meshStandardMaterial
        color="#fbbf24"
        emissive="#d97706"
        emissiveIntensity={0.7}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

/**
 * 3D Obstacle Box
 */
export function ObstacleBox({ position = [0, 0.6, 0], size = [2, 1.2, 2], color = '#dc2626' }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
      {/* Hazard trim */}
      <mesh position={[0, size[1] / 2 + 0.1, 0]} castShadow>
        <coneGeometry args={[0.3, 0.4, 4]} />
        <meshStandardMaterial color="#991b1b" />
      </mesh>
    </group>
  );
}

/**
 * Sleek Glassmorphic Game HUD (Always visible across all games, dual-gauge health/stamina/score bars)
 */
export function GameHud({
  title = 'SPIDER ARENA',
  hp = 100,
  maxHp = 100,
  stamina = 100,
  maxStamina = 100,
  score = 0,
  total = 0,
  wave = 1,
  kills = 0,
  combo = 0,
  message = '',
  statsText,
  position = 'bottom-center'
}) {
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const staPercent = Math.max(0, Math.min(100, (stamina / maxStamina) * 100));
  const info = statsText ?? (total > 0 ? `Score ${score}/${total}` : `♥ ${Math.round(hp)}  Wave ${wave}  Kills ${kills}${combo > 0 ? `  Combo x${combo}` : ''}`);

  const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || ('ontouchstart' in window && window.innerWidth < 1024));

  const posStyle = position === 'bottom-center'
    ? (isMobile
        ? { top: 'calc(12px + env(safe-area-inset-top, 0px))', left: '50%', transform: 'translateX(-50%)' }
        : { bottom: 20, left: '50%', transform: 'translateX(-50%)' })
    : position === 'bottom-left'
    ? (isMobile
        ? { top: 'calc(12px + env(safe-area-inset-top, 0px))', left: 16 }
        : { bottom: 20, left: 20 })
    : { top: 14, left: 14 };

  return (
    <Html fullscreen calculatePosition={(_, __, size) => [size.width / 2, size.height / 2]} style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          ...posStyle,
          background: 'rgba(15, 23, 42, 0.88)',
          padding: '8px 16px',
          borderRadius: 14,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
          zIndex: 40,
          maxWidth: 'min(92vw, 380px)',
          width: 'max-content',
          boxSizing: 'border-box',
          textAlign: 'center'
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: 1, color: '#fbcfe8', textTransform: 'uppercase' }}>
          {title}
        </div>
        <div style={{ fontSize: 11, marginTop: 4, fontWeight: 600, color: '#e2e8f0' }}>
          {info}
        </div>
        {/* Health / Primary Bar */}
        <div style={{ width: 190, height: 7, background: 'rgba(255, 255, 255, 0.15)', borderRadius: 4, overflow: 'hidden', marginTop: 4 }}>
          <div style={{ height: '100%', background: '#22c55e', width: `${hpPercent}%`, transition: 'width 0.15s ease' }} />
        </div>
        {/* Stamina / Secondary Bar */}
        <div style={{ width: 190, height: 4, background: 'rgba(255, 255, 255, 0.15)', borderRadius: 4, overflow: 'hidden', marginTop: 3 }}>
          <div style={{ height: '100%', background: '#38bdf8', width: `${staPercent}%`, transition: 'width 0.15s ease' }} />
        </div>
        {message && (
          <div style={{ color: '#fde68a', fontWeight: 700, marginTop: 4, fontSize: 11 }}>
            {message}
          </div>
        )}
      </div>
    </Html>
  );
}

/**
 * Interactive Real 3D Button (Zero HTML, pure WebGL mesh with hover, click, and 3D depth)
 */
export function Button3D({
  position = [0, 0, 0],
  text = 'START GAME',
  onClick,
  color = '#2563eb',
  hoverColor = '#3b82f6',
  width = 3.4,
  height = 0.85
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        if (typeof document !== 'undefined') document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        setPressed(false);
        if (typeof document !== 'undefined') document.body.style.cursor = 'default';
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        setPressed(true);
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        setPressed(false);
        onClick?.();
      }}
    >
      <mesh position={[0, 0, pressed ? -0.06 : 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, 0.22]} />
        <meshStandardMaterial
          color={hovered ? hoverColor : color}
          emissive={hovered ? hoverColor : '#0f172a'}
          emissiveIntensity={hovered ? 0.6 : 0.2}
          roughness={0.25}
          metalness={0.7}
        />
      </mesh>
      <Text
        position={[0, 0, pressed ? 0.08 : 0.14]}
        fontSize={height * 0.44}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </group>
  );
}

/**
 * Cinematic 3D Menu & Title Screen (Pure 3D geometry and Drei Text, zero floating HTML)
 */
export function Menu3D({
  title = 'SPIDER ARENA',
  subtitle = 'CLICK PLAY OR PRESS SPACE / ENTER',
  buttonText = 'PLAY GAME',
  onPlay,
  position = [0, 4, 0]
}) {
  return (
    <group position={position}>
      <Text
        position={[0, 1.3, 0]}
        fontSize={1.2}
        color="#38bdf8"
        outlineWidth={0.06}
        outlineColor="#0369a1"
        anchorX="center"
        anchorY="middle"
      >
        {title}
      </Text>
      <Text
        position={[0, 0.45, 0]}
        fontSize={0.36}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        {subtitle}
      </Text>
      <Button3D
        position={[0, -0.65, 0]}
        text={buttonText}
        onClick={onPlay}
        color="#16a34a"
        hoverColor="#22c55e"
      />
    </group>
  );
}

/**
 * Modern In-Game Navigation & Pause Overlay
 * Features:
 * - Clean Pause / Play toggle button at top-right
 * - Clean icon-only Sound toggle (🔊 / 🔇) - no clutter text
 * - Resume button (▶️)
 * - Exit button (✕) which exits fullscreen (ESC on PC)
 * - Keyboard ESC listener to toggle pause / exit
 */
export function PauseOverlay({
  paused = false,
  onTogglePause,
  soundMuted = false,
  onToggleSound,
  onExit,
  title = 'PAUSED'
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        if (onTogglePause) onTogglePause();
        else if (onExit) onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTogglePause, onExit]);

  const handleExitClick = () => {
    try {
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    } catch {}
    if (onExit) onExit();
  };

  return (
    <Html fullscreen calculatePosition={(_, __, size) => [size.width / 2, size.height / 2]} style={{ pointerEvents: 'none' }}>
      {/* Top right floating quick-buttons (Sound & Pause placed alongside Studio options without collision) */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(10px + env(safe-area-inset-top, 0px))',
          right: 'calc(170px + env(safe-area-inset-right, 0px))',
          display: 'flex',
          gap: 10,
          zIndex: 9999,
          pointerEvents: 'auto'
        }}
      >
        {onToggleSound && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSound();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onToggleSound();
            }}
            aria-label={soundMuted ? 'Unmute sound' : 'Mute sound'}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.90)',
              border: '2px solid rgba(255, 255, 255, 0.25)',
              color: soundMuted ? '#f87171' : '#38bdf8',
              fontSize: 22,
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              outline: 'none',
              touchAction: 'manipulation',
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
              pointerEvents: 'auto'
            }}
          >
            {soundMuted ? '🔇' : '🔊'}
          </button>
        )}
        {onTogglePause && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePause();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onTogglePause();
            }}
            aria-label={paused ? 'Resume game' : 'Pause game'}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: paused ? '#2563eb' : 'rgba(15, 23, 42, 0.90)',
              border: '2px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              fontSize: 20,
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              outline: 'none',
              touchAction: 'manipulation',
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
              pointerEvents: 'auto'
            }}
          >
            {paused ? '▶' : '⏸'}
          </button>
        )}
      </div>

      {/* Centered Modal Backdrop when Paused */}
      {paused && (
        <div
          onTouchStart={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.75)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9990,
            pointerEvents: 'auto',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          <div
            onTouchStart={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(15, 23, 42, 0.94)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 20,
              padding: '28px 36px',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              minWidth: 260,
              maxWidth: '90vw',
              pointerEvents: 'auto'
            }}
          >
            <h2 style={{ margin: '0 0 20px 0', color: '#f8fafc', fontSize: 22, fontWeight: 800, letterSpacing: 1.5 }}>
              {title}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePause();
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onTogglePause();
                }}
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 14,
                  padding: '14px 28px',
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
                  touchAction: 'manipulation'
                }}
              >
                <span>▶</span> Resume
              </button>

              {onToggleSound && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSound();
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onToggleSound();
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    color: '#e2e8f0',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 14,
                    padding: '14px 24px',
                    fontWeight: 600,
                    fontSize: 15,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    touchAction: 'manipulation'
                  }}
                >
                  <span>{soundMuted ? '🔇' : '🔊'}</span> Sound: {soundMuted ? 'Off' : 'On'}
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExitClick();
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleExitClick();
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.18)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: 14,
                  padding: '14px 24px',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  touchAction: 'manipulation'
                }}
              >
                <span>✕</span> Exit Game (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </Html>
  );
}
export const GameNav = PauseOverlay;

// Mobile Touch & Virtual Joystick runtime exports
export {
  useTouchControls,
  VirtualJoystick,
  Joystick,
  TouchButton,
  MobileControls,
  MobileMenu,
  nipplejs
} from './mobileTouch.jsx';

