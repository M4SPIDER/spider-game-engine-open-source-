/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Pocket Studio: viewport tab
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box, Camera, ChevronUp, Film, Gamepad2, Video, Copy, Maximize2, Minimize2, Square, Eye, EyeOff, MousePointer2, Move, Redo2, Rotate3d, Scale3d,
  SlidersHorizontal, Bot, Trash2, Undo2, Coins as CoinsIcon,
} from "lucide-react";
import GameViewport, { viewportApi } from "../engine/GameViewport.jsx";
import { cx } from "./ui.jsx";

const GIZMOS = [
  { id: "select", icon: MousePointer2, label: "Select" },
  { id: "move", icon: Move, label: "Move" },
  { id: "rotate", icon: Rotate3d, label: "Rotate" },
  { id: "scale", icon: Scale3d, label: "Scale" },
];

// same names, order and icons as the desktop editor
const CAMERAS = [
  { id: "Viewport", label: "Viewport", icon: Box },
  { id: "Cinematic", label: "Cinematic", icon: Film },
  { id: "Game View", label: "Game View", icon: Gamepad2 },
];

/** Virtual stick: writes analog jx/jz into engine keys & dispatches synthetic WASD/Arrow events for 3D games */
function Joystick({ onChange }) {
  const base = useRef(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const last = useRef("");
  const activeKeys = useRef(new Set());
  const R = 44;

  const dispatchKeys = (jx, jz) => {
    const nextKeys = new Set();
    if (jx > 0.25) { nextKeys.add("KeyD"); nextKeys.add("ArrowRight"); }
    if (jx < -0.25) { nextKeys.add("KeyA"); nextKeys.add("ArrowLeft"); }
    if (jz > 0.25) { nextKeys.add("KeyW"); nextKeys.add("ArrowUp"); }
    if (jz < -0.25) { nextKeys.add("KeyS"); nextKeys.add("ArrowDown"); }

    activeKeys.current.forEach((k) => {
      if (!nextKeys.has(k)) {
        window.dispatchEvent(new KeyboardEvent("keyup", { code: k, key: k, bubbles: true }));
      }
    });
    nextKeys.forEach((k) => {
      if (!activeKeys.current.has(k)) {
        window.dispatchEvent(new KeyboardEvent("keydown", { code: k, key: k, bubbles: true }));
      }
    });
    activeKeys.current = nextKeys;

    if (typeof window !== "undefined") {
      window.__spiderVirtualTouch = {
        x: jx,
        z: -jz,
        jump: false
      };
    }
  };

  const apply = (e) => {
    if (!base.current) return;
    const r = base.current.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > R) {
      dx = (dx / d) * R;
      dy = (dy / d) * R;
    }
    setKnob({ x: dx, y: dy });
    const jx = Math.abs(dx) < 8 ? 0 : Number((dx / R).toFixed(2));
    const jz = Math.abs(dy) < 8 ? 0 : Number((-dy / R).toFixed(2));
    const sig = `${jx}|${jz}`;
    if (sig !== last.current) {
      last.current = sig;
      onChange({ jx, jz });
      dispatchKeys(jx, jz);
    }
  };
  const end = () => {
    setKnob({ x: 0, y: 0 });
    last.current = "";
    onChange({ jx: 0, jz: 0 });
    dispatchKeys(0, 0);
  };
  return (
    <div
      ref={base}
      className="sp-stick"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        apply(e);
      }}
      onPointerMove={(e) => e.buttons && apply(e)}
      onPointerUp={end}
      onPointerCancel={end}
      aria-label="Movement stick"
    >
      <span className="sp-stick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}

export default function Studio({ s, onOpenInspector, onOpenView, notify, onGoAI, full = false, onToggleFull }) {
  const {
    groups, selectedId, setSelectedId, selected, isPlaying, gizmo, setGizmo, cameraMode, setCameraMode,
    settings, activeJsx, activeJsxName, setFps, fps, keys, setKeys, jump, score, coins, togglePlay,
    undo, redo, undoCount, toggleVisible, duplicate, removeNode, onViewportTransform, timeOfDay, files, resetScore,
  } = s;

  // Camera modes stay folded into one round button so they never cover the FPS badge or the scene.
  const [camOpen, setCamOpen] = useState(false);
  const camTimer = useRef(null);
  const openCams = () => {
    setCamOpen(true);
    clearTimeout(camTimer.current);
    camTimer.current = setTimeout(() => setCamOpen(false), 4500);
  };
  useEffect(() => () => clearTimeout(camTimer.current), []);
  // The transform tools fold into one round button too (shows the active tool).
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsTimer = useRef(null);
  const openTools = () => {
    setToolsOpen(true);
    clearTimeout(toolsTimer.current);
    toolsTimer.current = setTimeout(() => setToolsOpen(false), 4500);
  };
  useEffect(() => () => clearTimeout(toolsTimer.current), []);
  const currentTool = GIZMOS.find((g) => g.id === gizmo) || GIZMOS[1];

  const currentCam = CAMERAS.find((c) => c.id === cameraMode) || CAMERAS[0];

  const left = coins.filter((c) => !c.taken).length;
  const customGame = Boolean(activeJsx);

  const [sprintOn, setSprintOn] = useState(false);
  const toggleSprint = useCallback(() => {
    setSprintOn((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") window.__spiderHeroSprinting = next;
      setKeys((k) => ({ ...k, shift: next }));
      return next;
    });
  }, [setKeys]);

  const triggerKey = useCallback((code, key) => {
    window.dispatchEvent(new KeyboardEvent("keydown", { code, key, bubbles: true }));
    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent("keyup", { code, key, bubbles: true }));
    }, 120);
  }, []);

  const shot = useCallback(() => {
    try {
      const url = viewportApi.capture?.(true, 1280);
      notify(url ? "Screenshot saved" : "Viewport not ready yet", url ? "ok" : "warn");
    } catch {
      notify("Screenshot failed", "warn");
    }
  }, [notify]);

  const empty = !activeJsx && groups.every((g) => !(g.children || []).length);

  return (
    <section className="sp-studio">
      <div className="sp-viewport">
        <GameViewport
          sceneGroups={groups}
          selectedNodeId={selectedId}
          onSelectNode={setSelectedId}
          onTransformNode={onViewportTransform}
          isPlaying={isPlaying}
          keysPressed={keys}
          timeOfDay={timeOfDay}
          rtxEnabled={settings.rtx}
          showGrid={settings.grid}
          viewMode={settings.viewMode}
          activeGizmo={gizmo}
          cameraZoom={settings.zoom}
          projection={settings.projection}
          space={settings.space}
          cameraMode={cameraMode}
          coins={coins}
          onFps={setFps}
          activeJsxCode={activeJsx}
          activeJsxName={activeJsxName || "GameComponent.jsx"}
          projectFiles={files}
        />

        {/* top-right quick actions */}
        <div className="sp-float sp-float-tr">
          {!isPlaying && (
            <>
              <button type="button" className="sp-fab" onClick={undo} disabled={!undoCount.u} aria-label="Undo">
                <Undo2 size={18} />
              </button>
              <button type="button" className="sp-fab" onClick={redo} disabled={!undoCount.r} aria-label="Redo">
                <Redo2 size={18} />
              </button>
            </>
          )}
          <button type="button" className="sp-fab" onClick={shot} aria-label="Screenshot">
            <Camera size={18} />
          </button>
          <button type="button" className="sp-fab" onClick={onToggleFull} aria-label={full ? "Exit fullscreen" : "Fullscreen"} aria-pressed={full}>
            {full ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button type="button" className="sp-fab" onClick={onOpenView} aria-label="View options">
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {/* tool rail */}
        {!isPlaying &&
          (toolsOpen ? (
            <div className="sp-float sp-float-tl sp-rail" role="toolbar" aria-label="Transform tools">
              {GIZMOS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={cx("sp-rail-btn", gizmo === g.id && "is-on")}
                  aria-label={g.label}
                  aria-pressed={gizmo === g.id}
                  onClick={() => {
                    setGizmo(g.id);
                    clearTimeout(toolsTimer.current);
                    toolsTimer.current = setTimeout(() => setToolsOpen(false), 900);
                  }}
                >
                  <g.icon size={19} />
                </button>
              ))}
            </div>
          ) : (
            <button type="button" className="sp-fab sp-tool-btn" onClick={openTools} aria-label={`Tool: ${currentTool.label}. Tap to change`}>
              <currentTool.icon size={19} />
            </button>
          ))}

        {/* Floating exit button when in Fullscreen */}
        {full && (
          <button
            type="button"
            className="sp-stop-fab"
            onClick={onToggleFull}
            aria-label="Exit fullscreen"
            style={{
              top: "calc(14px + env(safe-area-inset-top, 0px))",
              left: "calc(14px + env(safe-area-inset-left, 0px))",
              zIndex: 9999,
              cursor: "pointer",
              touchAction: "manipulation"
            }}
          >
            <Minimize2 size={14} /> Exit Full
          </button>
        )}

        {fps > 0 && <div className="sp-fps">{fps} fps</div>}

        {/* play HUD */}
        {isPlaying && (
          <>
            {!customGame && (
              <div className="sp-hud" aria-live="polite">
                <span className="sp-hud-pill">
                  <CoinsIcon size={14} /> <b>{score}</b>
                </span>
                <span className="sp-hud-pill">{left} left</span>
                {left === 0 && (
                  <button type="button" className="sp-hud-pill is-action" onClick={resetScore}>
                    Replay
                  </button>
                )}
              </div>
            )}
            {/* Mobile joystick & Shadow Fight Combat Actions Pad */}
            <Joystick onChange={(v) => setKeys((k) => ({ ...k, ...v }))} />
            <div className="sp-combat-pad">
              <div className="sp-combat-row">
                {/* Sprint Boost */}
                <button
                  type="button"
                  className={cx("sp-btn-combat is-sprint", sprintOn && "is-active")}
                  onClick={toggleSprint}
                  aria-label="Sprint Boost"
                  title="Sprint / Run"
                >
                  ⚡<span>RUN</span>
                </button>
                {/* Shadow Blast */}
                <button
                  type="button"
                  className="sp-btn-combat is-shadow"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    triggerKey("KeyR", "r");
                  }}
                  aria-label="Shadow Blast"
                  title="Shadow Blast (R)"
                >
                  ✨<span>SLAM</span>
                </button>
              </div>
              <div className="sp-combat-row">
                {/* Martial Arts Front Snap Kick / Combo */}
                <button
                  type="button"
                  className="sp-btn-combat is-kick"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    triggerKey("KeyE", "e");
                  }}
                  aria-label="Martial Arts Kick"
                  title="Kick Combo (E)"
                >
                  🥋<span>KICK</span>
                </button>
                {/* Martial Arts Punch / Fist Combo */}
                <button
                  type="button"
                  className="sp-btn-combat is-punch"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    triggerKey("KeyF", "f");
                  }}
                  aria-label="Martial Arts Punch"
                  title="Punch Combo (F)"
                >
                  🥊<span>PUNCH</span>
                </button>
                {/* Jump */}
                <button
                  type="button"
                  className="sp-btn-combat is-jump"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    jump();
                    triggerKey("Space", " ");
                    if (typeof window !== "undefined" && window.__spiderVirtualTouch) {
                      window.__spiderVirtualTouch.jump = true;
                    }
                  }}
                  onPointerUp={() => {
                    if (typeof window !== "undefined" && window.__spiderVirtualTouch) {
                      window.__spiderVirtualTouch.jump = false;
                    }
                  }}
                  aria-label="Jump / Leap"
                  title="Jump (Space)"
                >
                  🦘<span>JUMP</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* camera pills: accessible anytime for Game View, Cinematic, and Viewport */}
        {camOpen ? (
          <div className="sp-cams" role="radiogroup" aria-label="Camera">
            {CAMERAS.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={cameraMode === c.id}
                className={cx(cameraMode === c.id && "is-on")}
                onClick={() => {
                  setCameraMode(c.id);
                  clearTimeout(camTimer.current);
                  camTimer.current = setTimeout(() => setCamOpen(false), 900);
                }}
              >
                <c.icon size={15} />
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <button type="button" className="sp-cam-btn" onClick={openCams} aria-label={`Camera: ${currentCam.label}. Tap to change`}>
            <Video size={20} />
          </button>
        )}

        {empty && !isPlaying && (
          <div className="sp-hint-card">
            <b>Blank level</b>
            <span>Add something from Scene, or ask the AI to build a game.</span>
            <button type="button" onClick={onGoAI}>
              <Bot size={14} /> Ask AI
            </button>
          </div>
        )}
      </div>

      {/* selection dock (above tab bar, never over the stick) */}
      {!isPlaying && selected && (
        <div className="sp-dock">
          <button type="button" className="sp-dock-main" onClick={() => onOpenInspector(true)} aria-label="Open inspector">
            <span className="sp-dot" style={{ background: selected.tint || selected.color || "#6366f1" }} />
            <span className="sp-dock-text">
              <b>{selected.name || selected.id}</b>
              <small>
                {Math.round(selected.pos?.x ?? 0)}, {Math.round(selected.pos?.y ?? 0)}, {Math.round(selected.pos?.z ?? 0)}
              </small>
            </span>
            <ChevronUp size={16} />
          </button>
          <button type="button" className="sp-icon-btn" onClick={() => toggleVisible(selected.id)} aria-label={selected.visible === false ? "Show" : "Hide"}>
            {selected.visible === false ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <button type="button" className="sp-icon-btn" onClick={() => duplicate(selected.id)} aria-label="Duplicate">
            <Copy size={18} />
          </button>
          <button
            type="button"
            className="sp-icon-btn is-danger"
            onClick={() => {
              removeNode(selected.id);
              notify(`Removed ${selected.name || selected.id}`, "ok");
            }}
            aria-label="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}
    </section>
  );
}

