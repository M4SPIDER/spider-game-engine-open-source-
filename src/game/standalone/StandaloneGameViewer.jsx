/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Standalone Game Viewer Component
 * Author: M4SPIDER (support@m4spider.com)
 */
import React from "react";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import "../../index.css";
import MyGame from "../GameComponent.jsx";

export default function StandaloneGameViewer() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#0b0f19", position: "relative", overflow: "hidden", touchAction: "none" }}>
      {/* Subtle Editor Switcher link */}
      <a
        href="/?mode=editor"
        style={{
          position: "absolute",
          top: "calc(14px + env(safe-area-inset-top, 0px))",
          left: "calc(14px + env(safe-area-inset-left, 0px))",
          zIndex: 9999,
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
        <span>🛠️</span> Editor
      </a>

      <Canvas
        camera={{ position: [0, 4.4, 8.2], fov: 48 }}
        shadows
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 20, 15]} intensity={1.5} castShadow />
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
        {typeof MyGame === "function" ? <MyGame /> : null}
      </Canvas>
    </div>
  );
}
