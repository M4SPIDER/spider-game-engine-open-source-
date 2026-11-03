/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Standalone Game Viewer Component
 * Author: M4SPIDER (support@m4spider.com)
 */
import React, { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import "../../index.css";
import MyGame from "../GameComponent.jsx";
import DynamicJsxRenderer from "../../engine/DynamicJsxRenderer.jsx";

export default function StandaloneGameViewer({ onExit, gameTitle = "GameWorld", game = null }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onExit) {
        e.preventDefault();
        onExit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit]);
  return (
    <div style={{ width: "100%", height: "100%", background: "#0b0f19", position: "relative", overflow: "hidden", touchAction: "none" }}>
      {/* Top Floating Controls Bar */}
      <div
        style={{
          position: "absolute",
          top: "calc(14px + env(safe-area-inset-top, 0px))",
          left: "calc(14px + env(safe-area-inset-left, 0px))",
          right: "calc(14px + env(safe-area-inset-right, 0px))",
          zIndex: 9999,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pointerEvents: "none"
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            background: "rgba(15, 23, 42, 0.88)",
            color: "#f8fafc",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            padding: "8px 18px",
            borderRadius: 24,
            fontSize: 13,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 10,
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)"
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 10px #22c55e" }} />
          <span>🎮 Playing: {gameTitle}</span>
          <span style={{ color: "#94a3b8", fontWeight: 400, fontSize: 12 }}>• WASD / Arrows to Walk • Space to Jump</span>
        </div>

        {onExit ? (
          <button
            onClick={onExit}
            style={{
              pointerEvents: "auto",
              background: "rgba(225, 29, 72, 0.9)",
              color: "#fff",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              padding: "8px 18px",
              borderRadius: 24,
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              backdropFilter: "blur(12px)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.4)"
            }}
            title="Exit to Spider Store (Esc)"
          >
            <span>✕ Exit to Store</span>
          </button>
        ) : (
          <a
            href="/?mode=editor"
            style={{
              pointerEvents: "auto",
              background: "rgba(15, 23, 42, 0.75)",
              color: "#94a3b8",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
              backdropFilter: "blur(8px)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
            }}
            title="Open Spider Game Engine Editor"
          >
            <span>⚡</span> Editor
          </a>
        )}
      </div>

      <Canvas
        camera={{ position: [0, 4.4, 8.2], fov: 48 }}
        shadows
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 20, 15]} intensity={1.5} castShadow />
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
        {game?.gameCode ? (
          <DynamicJsxRenderer
            code={game.gameCode}
            name={game.gameName || "GameComponent.jsx"}
            projectFiles={game.projectFiles || []}
          />
        ) : typeof MyGame === "function" ? (
          <MyGame />
        ) : null}
      </Canvas>
    </div>
  );
}
