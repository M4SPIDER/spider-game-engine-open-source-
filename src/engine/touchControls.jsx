/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — one tested joystick + buttons kit for games the AI writes
 *
 *   import { useTouch, TouchControls } from "spider-touch";
 *   const touch = useTouch();           // touch.move.x / touch.move.y in -1..1, touch.a, touch.b (booleans)
 *   <TouchControls touch={touch} buttons={["Jump"]} />
 *
 * The overlay is anchored to the game viewport: stick bottom-left, buttons bottom-right, in portrait and
 * landscape, sized from the viewport. On a computer the same `touch` object is driven by the keyboard
 * (WASD / arrows move, Space = a, E or Shift = b), so one code path serves phone and PC.
 */
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { useThree } from "@react-three/fiber";

const isTyping = (e) => {
  const t = e.target;
  return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
};

export function useTouch() {
  const ref = useRef(null);
  if (!ref.current) {
    const t = {
      move: { x: 0, y: 0 },
      a: false,
      b: false,
      presses: { a: 0, b: 0 },
      _stick: { x: 0, y: 0 },
      _kb: { x: 0, y: 0, a: false, b: false },
      _touchA: false,
      _touchB: false,
    };
    t._sync = () => {
      const s = t._stick;
      const useStick = Math.abs(s.x) > 0.01 || Math.abs(s.y) > 0.01;
      t.move.x = useStick ? s.x : t._kb.x;
      t.move.y = useStick ? s.y : t._kb.y;
      const a = t._touchA || t._kb.a;
      const b = t._touchB || t._kb.b;
      if (a && !t.a) t.presses.a++;
      if (b && !t.b) t.presses.b++;
      t.a = a;
      t.b = b;
    };
    ref.current = t;
  }
  useEffect(() => {
    const t = ref.current;
    const down = new Set();
    const apply = () => {
      t._kb.x = (down.has("d") || down.has("arrowright") ? 1 : 0) - (down.has("a") || down.has("arrowleft") ? 1 : 0);
      t._kb.y = (down.has("w") || down.has("arrowup") ? 1 : 0) - (down.has("s") || down.has("arrowdown") ? 1 : 0);
      t._kb.a = down.has(" ");
      t._kb.b = down.has("e") || down.has("shift") || down.has("enter");
      t._sync();
    };
    const kd = (e) => {
      if (isTyping(e)) return;
      const k = e.key.toLowerCase();
      if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
      down.add(k);
      apply();
    };
    const ku = (e) => {
      down.delete(e.key.toLowerCase());
      apply();
    };
    const blur = () => {
      down.clear();
      apply();
    };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("blur", blur);
    };
  }, []);
  return ref.current;
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const hasTouch = () => typeof window !== "undefined" && (window.matchMedia?.("(pointer: coarse)").matches || "ontouchstart" in window || navigator.maxTouchPoints > 0);

function Overlay({ touch, buttons, always }) {
  const root = useRef(null);
  const knob = useRef(null);
  const [size, setSize] = useState(120);
  const active = useRef(null);

  // size follows the viewport and updates on resize / rotation
  useEffect(() => {
    const el = root.current;
    if (!el) return undefined;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize(Math.round(clamp(Math.min(r.width, r.height) * 0.3, 96, 150)));
    };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    window.addEventListener("orientationchange", measure);
    window.addEventListener("resize", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("orientationchange", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  if (!always && !hasTouch()) return <div ref={root} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />;

  const R = size / 2;
  const kn = Math.round(size * 0.42);
  const move = (e) => {
    const base = e.currentTarget.getBoundingClientRect();
    let dx = e.clientX - (base.left + base.width / 2);
    let dy = e.clientY - (base.top + base.height / 2);
    const d = Math.hypot(dx, dy);
    const max = R - kn / 2 + 6;
    if (d > max) {
      dx = (dx / d) * max;
      dy = (dy / d) * max;
    }
    if (knob.current) knob.current.style.transform = `translate(${dx}px, ${dy}px)`;
    const dead = 0.12;
    const nx = dx / max;
    const ny = -dy / max;
    touch._stick.x = Math.abs(nx) < dead ? 0 : Number(nx.toFixed(2));
    touch._stick.y = Math.abs(ny) < dead ? 0 : Number(ny.toFixed(2));
    touch._sync();
  };
  const release = () => {
    active.current = null;
    if (knob.current) knob.current.style.transform = "translate(0px, 0px)";
    touch._stick.x = 0;
    touch._stick.y = 0;
    touch._sync();
  };

  const edge = "max(16px, env(safe-area-inset-left))";
  const bottom = "max(20px, env(safe-area-inset-bottom))";
  const bigBtn = Math.round(size * 0.62);
  const names = (buttons || []).slice(0, 2);
  const key = ["a", "b"];

  return (
    <div ref={root} style={{ position: "absolute", inset: 0, pointerEvents: "none", touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}>
      <div
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture?.(e.pointerId);
          active.current = e.pointerId;
          move(e);
        }}
        onPointerMove={(e) => active.current === e.pointerId && move(e)}
        onPointerUp={release}
        onPointerCancel={release}
        style={{
          position: "absolute", left: edge, bottom, width: size, height: size, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,.18), rgba(255,255,255,.06))",
          border: "2px solid rgba(255,255,255,.4)", pointerEvents: "auto", touchAction: "none",
          display: "grid", placeItems: "center", boxSizing: "border-box",
        }}
      >
        <div ref={knob} style={{ width: kn, height: kn, borderRadius: "50%", background: "rgba(255,255,255,.85)", boxShadow: "0 4px 14px rgba(0,0,0,.4)", pointerEvents: "none" }} />
      </div>
      {names.map((label, i) => {
        const k = key[i];
        const s = i === 0 ? bigBtn : Math.round(bigBtn * 0.82);
        return (
          <button
            key={label + i}
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture?.(e.pointerId);
              touch[`_touch${k.toUpperCase()}`] = true;
              touch._sync();
            }}
            onPointerUp={() => {
              touch[`_touch${k.toUpperCase()}`] = false;
              touch._sync();
            }}
            onPointerCancel={() => {
              touch[`_touch${k.toUpperCase()}`] = false;
              touch._sync();
            }}
            style={{
              position: "absolute",
              right: i === 0 ? "max(20px, env(safe-area-inset-right))" : `calc(max(20px, env(safe-area-inset-right)) + ${bigBtn + 12}px)`,
              bottom: i === 0 ? bottom : `calc(${bottom} + ${Math.round(bigBtn * 0.35)}px)`,
              width: s, height: s, borderRadius: "50%", pointerEvents: "auto", touchAction: "none",
              background: i === 0 ? "rgba(91,124,255,.78)" : "rgba(255,255,255,.28)",
              border: "2px solid rgba(255,255,255,.5)", color: "#fff", font: "700 14px system-ui, sans-serif",
              letterSpacing: ".03em", cursor: "pointer", padding: 0,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Joystick (bottom-left) and up to two buttons (bottom-right) over the game viewport.
 * Rendered into the canvas wrapper with its own React root, so it works from inside the 3D tree.
 */
export function TouchControls({ touch, buttons = ["Jump"], always = false }) {
  const gl = useThree((st) => st.gl);
  const mount = useRef(null);
  const key = (buttons || []).join("|");

  useEffect(() => {
    const host = gl.domElement.parentElement || document.body;
    const el = document.createElement("div");
    el.setAttribute("data-spider-touch", "");
    el.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:40;";
    host.appendChild(el);
    const root = createRoot(el);
    mount.current = root;
    root.render(<Overlay touch={touch} buttons={buttons} always={always} />);
    return () => {
      mount.current = null;
      // unmount after the current render so React does not complain
      setTimeout(() => {
        try {
          root.unmount();
        } catch {}
        el.remove();
      }, 0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl]);

  useEffect(() => {
    mount.current?.render(<Overlay touch={touch} buttons={buttons} always={always} />);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touch, key, always]);

  return null;
}

/**
 * On-screen text for score, timer, messages and menus. Children are plain DOM (divs, buttons) drawn
 * over the canvas, so they work on every device. Give panels that must be tapped pointerEvents:"auto".
 */
export function Hud({ children }) {
  const gl = useThree((st) => st.gl);
  const mount = useRef(null);
  const latest = useRef(children);
  latest.current = children;

  useEffect(() => {
    const host = gl?.domElement?.parentElement || document.body;
    const el = document.createElement("div");
    el.setAttribute("data-spider-hud", "");
    el.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:35;overflow:hidden;";
    host.appendChild(el);
    const root = createRoot(el);
    mount.current = root;
    root.render(<>{latest.current}</>);
    return () => {
      mount.current = null;
      setTimeout(() => {
        try {
          root.unmount();
        } catch {}
        el.remove();
      }, 0);
    };
  }, [gl]);

  useEffect(() => {
    mount.current?.render(<>{children}</>);
  });

  return null;
}

export default { useTouch, TouchControls, Hud };
