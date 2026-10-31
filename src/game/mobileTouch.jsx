/*
 * ============================================================================
 * SPIDER GAME ENGINE - MOBILE TOUCH & VIRTUAL JOYSTICK RUNTIME LIBRARY
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * ============================================================================
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Html } from "@react-three/drei";

/**
 * Hook providing unified mobile touch swipe, virtual d-pad, and keyboard controls.
 */
export function useTouchControls() {
  const keys = useRef({});
  const touchDir = useRef({ x: 0, z: 0, jump: false, sprint: false, action: false });
  const touchStart = useRef(null);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768 || "ontouchstart" in window || navigator.maxTouchPoints > 0;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window || navigator.maxTouchPoints > 0);
    };
    window.addEventListener("resize", handleResize);

    const onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      keys.current[k] = true;
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) {
        e.preventDefault();
      }
    };
    const onKeyUp = (e) => {
      keys.current[e.key.toLowerCase()] = false;
    };

    // Swipe & drag touch listeners on window
    const onTouchStart = (e) => {
      const t = e.touches[0];
      if (t) {
        touchStart.current = { x: t.clientX, y: t.clientY };
        touchDir.current.jump = true;
        setTimeout(() => {
          touchDir.current.jump = false;
        }, 120);
      }
    };

    const onTouchMove = (e) => {
      if (!touchStart.current) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - touchStart.current.x;
      const dy = t.clientY - touchStart.current.y;
      if (Math.hypot(dx, dy) > 12) {
        touchDir.current.x = Math.max(-1, Math.min(1, dx / 35));
        touchDir.current.z = Math.max(-1, Math.min(1, dy / 35));
      }
    };

    const onTouchEnd = () => {
      touchStart.current = null;
      touchDir.current = { x: 0, z: 0, jump: false, sprint: false, action: false };
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const getDir = useCallback(() => {
    const k = keys.current;
    let x = 0;
    let z = 0;

    // Keyboard (WASD & Arrows)
    if (k.arrowleft || k.a) x += 1;
    if (k.arrowright || k.d) x -= 1;
    if (k.arrowup || k.w) z -= 1;
    if (k.arrowdown || k.s) z += 1;

    // Swipe / drag
    if (touchDir.current.x !== 0) x = touchDir.current.x;
    if (touchDir.current.z !== 0) z = touchDir.current.z;

    // Global Spider Virtual Touch (Virtual Joystick / Mobile D-pad)
    if (typeof window !== "undefined" && window.__spiderVirtualTouch) {
      if (window.__spiderVirtualTouch.x !== undefined) x = window.__spiderVirtualTouch.x;
      if (window.__spiderVirtualTouch.z !== undefined) z = window.__spiderVirtualTouch.z;
    }

    if (x !== 0 && z !== 0) {
      x *= 0.7071;
      z *= 0.7071;
    }

    const jump = Boolean(
      k[" "] ||
        k.spacebar ||
        touchDir.current.jump ||
        (typeof window !== "undefined" && window.__spiderVirtualTouch?.jump)
    );
    const sprint = Boolean(
      k.shift ||
        k.shiftleft ||
        k.shiftright ||
        touchDir.current.sprint ||
        (typeof window !== "undefined" && window.__spiderVirtualTouch?.sprint)
    );
    const action = Boolean(
      k.e ||
        k.f ||
        k.enter ||
        touchDir.current.action ||
        (typeof window !== "undefined" && window.__spiderVirtualTouch?.action)
    );

    return { x, z, jump, sprint, action };
  }, []);

  return { getDir, isMobile, touchDir };
}

/**
 * Smooth 360-degree Virtual Thumb Joystick Component for React / React Three Fiber
 */
export function VirtualJoystick({
  size = 110,
  color = "#0ea5e9",
  onMove,
  onEnd,
  style = {}
}) {
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const containerRef = useRef(null);
  const radius = size / 2;
  const knobRadius = radius * 0.44;

  const handlePointer = useCallback(
    (clientX, clientY) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);
      const maxDist = radius - knobRadius;

      let nx = dx;
      let ny = dy;
      if (dist > maxDist) {
        nx = (dx / dist) * maxDist;
        ny = (dy / dist) * maxDist;
      }

      setKnobPos({ x: nx, y: ny });

      const normX = nx / maxDist;
      const normY = ny / maxDist;

      if (typeof window !== "undefined") {
        window.__spiderVirtualTouch = window.__spiderVirtualTouch || {};
        window.__spiderVirtualTouch.x = normX;
        window.__spiderVirtualTouch.z = normY;
      }

      onMove?.({ x: normX, y: normY, distance: dist / maxDist, angle: Math.atan2(dy, dx) });
    },
    [radius, knobRadius, onMove]
  );

  const startDrag = (e) => {
    e.preventDefault();
    setActive(true);
    const point = e.touches ? e.touches[0] : e;
    handlePointer(point.clientX, point.clientY);
  };

  const moveDrag = (e) => {
    if (!active) return;
    e.preventDefault();
    const point = e.touches ? e.touches[0] : e;
    handlePointer(point.clientX, point.clientY);
  };

  const endDrag = (e) => {
    e.preventDefault();
    setActive(false);
    setKnobPos({ x: 0, y: 0 });
    if (typeof window !== "undefined" && window.__spiderVirtualTouch) {
      window.__spiderVirtualTouch.x = 0;
      window.__spiderVirtualTouch.z = 0;
    }
    onEnd?.();
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={startDrag}
      onTouchMove={moveDrag}
      onTouchEnd={endDrag}
      onMouseDown={startDrag}
      onMouseMove={moveDrag}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: active ? "rgba(15, 23, 42, 0.75)" : "rgba(15, 23, 42, 0.55)",
        border: `2px solid ${active ? color : "rgba(255, 255, 255, 0.25)"}`,
        boxShadow: active ? `0 0 20px ${color}` : "0 8px 24px rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(10px)",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        touchAction: "none",
        cursor: "grab",
        userSelect: "none",
        ...style
      }}
    >
      {/* Inner Thumb Knob */}
      <div
        style={{
          width: knobRadius * 2,
          height: knobRadius * 2,
          borderRadius: "50%",
          background: active ? color : "rgba(255, 255, 255, 0.8)",
          boxShadow: active ? `0 0 16px ${color}` : "0 4px 10px rgba(0, 0, 0, 0.3)",
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          transition: active ? "none" : "transform 0.15s ease-out",
          pointerEvents: "none"
        }}
      />
    </div>
  );
}

// react-joystick-component drop-in compatibility shim
export function Joystick({ size = 100, baseColor, stickColor, move, stop }) {
  return (
    <VirtualJoystick
      size={size}
      color={stickColor || baseColor || "#0ea5e9"}
      onMove={({ x, y, distance }) => move?.({ x, y: -y, direction: y < 0 ? "FORWARD" : "BACKWARD", distance })}
      onEnd={stop}
    />
  );
}

/**
 * Mobile Touch Button for Jump / Boost / Action
 */
export function TouchButton({ label = "JUMP", sub = "Action", color = "#22c55e", size = 64, onPress, onRelease }) {
  const [pressed, setPressed] = useState(false);

  const start = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPressed(true);
    onPress?.();
  };

  const end = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPressed(false);
    onRelease?.();
  };

  return (
    <button
      type="button"
      onTouchStart={start}
      onTouchEnd={end}
      onMouseDown={start}
      onMouseUp={end}
      onMouseLeave={end}
      style={{
        width: size,
        height: size,
        borderRadius: "22px",
        background: pressed
          ? color
          : `linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.85))`,
        border: `2px solid ${pressed ? "#ffffff" : "rgba(255, 255, 255, 0.25)"}`,
        boxShadow: pressed ? `0 0 24px ${color}` : "0 10px 25px rgba(0,0,0,0.4)",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        userSelect: "none",
        touchAction: "none",
        transform: pressed ? "scale(0.92)" : "scale(1)",
        transition: "transform 0.08s ease, background 0.1s ease",
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}
    >
      <span style={{ fontSize: size > 60 ? 13 : 11, fontWeight: 900, letterSpacing: 0.5 }}>{label}</span>
      {sub && <span style={{ fontSize: 9, opacity: 0.75, marginTop: 1 }}>{sub}</span>}
    </button>
  );
}

/**
 * Universal Mobile Controls Overlay (renders on phones < 768px or touch devices)
 */
export function MobileControls({ onJump, onSprint, onAction }) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768 || "ontouchstart" in window;
  });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!isMobile) return null;

  return (
    <Html fullscreen calculatePosition={(_, __, s) => [s.width / 2, s.height / 2]} style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          padding: "calc(16px + env(safe-area-inset-bottom, 0px)) calc(16px + env(safe-area-inset-right, 0px)) calc(16px + env(safe-area-inset-bottom, 0px)) calc(16px + env(safe-area-inset-left, 0px))",
          boxSizing: "border-box",
          zIndex: 45
        }}
      >
        {/* Left Thumb Joystick */}
        <div style={{ pointerEvents: "auto" }}>
          <VirtualJoystick size={105} color="#0ea5e9" />
        </div>

        {/* Right Action Buttons */}
        <div style={{ pointerEvents: "auto", display: "flex", gap: 12, alignItems: "flex-end" }}>
          {/* Boost / Sprint */}
          <TouchButton
            label="BOOST"
            sub="Shift"
            color="#f59e0b"
            size={58}
            onPress={() => {
              if (typeof window !== "undefined") {
                window.__spiderVirtualTouch = window.__spiderVirtualTouch || {};
                window.__spiderVirtualTouch.sprint = true;
              }
              onSprint?.(true);
            }}
            onRelease={() => {
              if (typeof window !== "undefined" && window.__spiderVirtualTouch) {
                window.__spiderVirtualTouch.sprint = false;
              }
              onSprint?.(false);
            }}
          />

          {/* Jump */}
          <TouchButton
            label="JUMP"
            sub="Space"
            color="#22c55e"
            size={68}
            onPress={() => {
              if (typeof window !== "undefined") {
                window.__spiderVirtualTouch = window.__spiderVirtualTouch || {};
                window.__spiderVirtualTouch.jump = true;
              }
              onJump?.(true);
            }}
            onRelease={() => {
              if (typeof window !== "undefined" && window.__spiderVirtualTouch) {
                window.__spiderVirtualTouch.jump = false;
              }
              onJump?.(false);
            }}
          />
        </div>
      </div>
    </Html>
  );
}

/**
 * Responsive Mobile + Desktop Menu and Title Screen
 * Optimizes layout, fonts, and controls explanations specifically for touchphones and PC!
 */
export function MobileMenu({
  title = "SPIDER GAME",
  subtitle = "TOUCH OR PRESS START",
  onStart,
  score,
  lives,
  isGameOver = false,
  highScore
}) {
  const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  return (
    <Html fullscreen calculatePosition={(_, __, s) => [s.width / 2, s.height / 2]} style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at center, rgba(14, 165, 233, 0.28) 0%, rgba(2, 6, 23, 0.94) 85%)",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
          padding: "20px",
          boxSizing: "border-box",
          pointerEvents: "auto",
          zIndex: 50
        }}
      >
        <div style={{ letterSpacing: 4, fontSize: 11, color: "#7dd3fc", fontWeight: 700, textTransform: "uppercase" }}>
          {isGameOver ? "RUN FINISHED" : "SPIDER ENGINE 3D"}
        </div>

        <h1
          style={{
            fontSize: "clamp(32px, 8vw, 56px)",
            margin: "10px 0",
            color: "#fde047",
            textShadow: "0 0 35px rgba(2, 132, 199, 0.8)",
            fontWeight: 900,
            lineHeight: 1.1
          }}
        >
          {title}
        </h1>

        <p
          style={{
            maxWidth: 440,
            fontSize: "clamp(13px, 3.5vw, 16px)",
            opacity: 0.92,
            margin: "0 0 16px 0",
            lineHeight: 1.4
          }}
        >
          {isGameOver ? (
            <span>Game Over! Final Score: <b style={{ color: "#38bdf8" }}>{score || 0}</b></span>
          ) : (
            subtitle
          )}
        </p>

        {/* Dynamic Controls Hint (Phones vs Desktop) */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.75)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: 14,
            padding: "8px 18px",
            fontSize: "clamp(11px, 2.8vw, 13px)",
            color: "#e2e8f0",
            marginBottom: 20,
            maxWidth: "min(90vw, 420px)"
          }}
        >
          {isTouch ? (
            <span>🕹️ <b>Touch Controls:</b> Use Virtual Joystick to move • Tap <b>JUMP</b> • Tap <b>BOOST</b></span>
          ) : (
            <span>⌨️ <b>Desktop:</b> WASD / Arrows to Move • <b>Space</b> Jump • <b>Shift</b> Boost • <b>Esc</b> Pause</span>
          )}
        </div>

        {/* Big Touch-Friendly Start Button (48px+ touch target) */}
        <button
          type="button"
          onClick={onStart}
          onTouchStart={(e) => {
            e.preventDefault();
            onStart?.();
          }}
          style={{
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "#ffffff",
            border: "none",
            padding: "16px 44px",
            borderRadius: 16,
            fontSize: "clamp(16px, 4.5vw, 20px)",
            fontWeight: 900,
            cursor: "pointer",
            boxShadow: "0 0 30px rgba(34, 197, 94, 0.6)",
            letterSpacing: 1,
            display: "flex",
            alignItems: "center",
            gap: 10,
            transition: "transform 0.1s ease, filter 0.1s ease",
            outline: "none"
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <span>▶</span>
          <span>{isGameOver ? "PLAY AGAIN" : "START GAME"}</span>
        </button>

        {/* Stats footer if score/lives present */}
        {(lives !== undefined || score !== undefined || highScore !== undefined) && (
          <div style={{ marginTop: 18, fontSize: 13, opacity: 0.85, display: "flex", gap: 16 }}>
            {lives !== undefined && <span>❤️ Lives: {lives}</span>}
            {score !== undefined && <span>⭐ Score: {score}</span>}
            {highScore !== undefined && <span>🏆 High: {highScore}</span>}
          </div>
        )}
      </div>
    </Html>
  );
}

// nipplejs drop-in compatibility shim
export const nipplejs = {
  create: (options = {}) => {
    const listeners = {};
    const zone = options.zone || (typeof document !== "undefined" ? document.body : null);
    const emitter = {
      on: (event, cb) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(cb);
        return emitter;
      },
      destroy: () => {
        if (zone && zone.__spiderNippleClean) zone.__spiderNippleClean();
      }
    };

    if (zone && typeof window !== "undefined") {
      const handleMove = (e) => {
        const t = e.touches ? e.touches[0] : e;
        const rect = zone.getBoundingClientRect();
        const dx = t.clientX - (rect.left + rect.width / 2);
        const dy = t.clientY - (rect.top + rect.height / 2);
        const dist = Math.hypot(dx, dy);
        (listeners["move"] || []).forEach((cb) =>
          cb(e, {
            vector: { x: dx / Math.max(1, dist), y: -dy / Math.max(1, dist) },
            distance: dist,
            angle: { radian: Math.atan2(-dy, dx) }
          })
        );
      };
      const handleEnd = (e) => {
        (listeners["end"] || []).forEach((cb) => cb(e));
      };

      zone.addEventListener("touchmove", handleMove, { passive: true });
      zone.addEventListener("touchend", handleEnd, { passive: true });
      zone.__spiderNippleClean = () => {
        zone.removeEventListener("touchmove", handleMove);
        zone.removeEventListener("touchend", handleEnd);
      };
    }
    return emitter;
  }
};

export const useGestureShim = {
  useDrag: (handler) => ({ onPointerDown: handler }),
  useGesture: (handlers) => handlers
};
