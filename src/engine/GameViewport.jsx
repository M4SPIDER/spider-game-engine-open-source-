/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, Sky, Stars, Grid, TransformControls, GizmoHelper, GizmoViewport, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import DynamicJsxRenderer, { compileJsxComponent } from "./DynamicJsxRenderer.jsx";

function DomGameRenderer({ code, name, projectFiles }) {
  const ComponentToRender = useMemo(() => {
    return compileJsxComponent(code, {}, null, projectFiles);
  }, [code, projectFiles]);

  if (!ComponentToRender) return null;
  return <ComponentToRender />;
}

// 1 engine unit = 1m. App mock numbers are large, so static scenery uses WORLD scale.
const WORLD = 0.12;
const DEG = Math.PI / 180;

// Shared API for honest screenshot capture & canvas stream recording (set from inside Canvas).
export const viewportApi = { capture: null, canvas: null, getCanvas: null };
// Set while a TransformControls drag is active so smoothing doesn't fight the user.
let transforming = false;

function findNode(groups, id) {
  if (!Array.isArray(groups)) return null;
  for (const g of groups) {
    if (g && Array.isArray(g.children)) {
      for (const c of g.children) {
        if (c && c.id === id) return c;
      }
    }
  }
  return null;
}

// Reports real FPS to the editor telemetry.
function FpsMeter({ onFps }) {
  const frames = useRef(0);
  const last = useRef(performance.now());
  useFrame(() => {
    frames.current += 1;
    const now = performance.now();
    if (now - last.current >= 500) {
      onFps(Math.round((frames.current * 1000) / (now - last.current)));
      frames.current = 0;
      last.current = now;
    }
  });
  return null;
}

// Syncs editor zoom pill to the real camera fov.
function FovSync({ zoom }) {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    if (camera.isPerspectiveCamera) {
      camera.fov = 55 / zoom;
      camera.updateProjectionMatrix();
    }
  }, [camera, zoom]);
  return null;
}

// Follows the hero in Play/Game modes; slow auto-orbit in Cinematic;
// Unreal-style WASD/QE camera fly in the free Viewport when not playing.
function CameraRig({ isPlaying, followRef, mode, keysPressed, activeGizmo, hasChess }) {
  const controls = useThree((s) => s.controls);
  const camera = useThree((s) => s.camera);
  const target = useMemo(() => new THREE.Vector3(), []);
  const chase = useMemo(() => new THREE.Vector3(), []);
  const fwd = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  useFrame(({ clock }) => {
    if (hasChess) {
      if (controls && controls.target.lengthSq() > 0.05) {
        controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.1);
      }
      return;
    }
    if (mode === "Cinematic") {
      const t = clock.elapsedTime * 0.12;
      const r = 34;
      camera.position.set(Math.cos(t) * r, 14, Math.sin(t) * r);
      camera.lookAt(0, 4, 0);
      if (controls) controls.target.set(0, 4, 0);
      return;
    }
    const follow = mode === "Game View" || (mode === "Viewport" && isPlaying);
    if (follow && controls && followRef.current) {
      followRef.current.getWorldPosition(target);
      if (mode === "Game View") {
        // Chase cam: behind + above hero, looking at hero
        chase.set(target.x - 7, target.y + 5, target.z - 9);
        camera.position.lerp(chase, 0.06);
        controls.target.lerp(target, 0.12);
      } else {
        controls.target.lerp(target, 0.08);
      }
      controls.update();
      return;
    }
    // Free Viewport + select tool + not playing: WASD/arrows fly, Q/E (or Space) rise/sink — camera-relative.
    // In move/rotate/scale gizmo modes WASD belongs to the selected object, so the camera stays put.
    if (!isPlaying && mode === "Viewport" && activeGizmo === "select" && controls) {
      const k = keysPressed || {};
      const f = (k["w"] || k["arrowup"] ? 1 : 0) - (k["s"] || k["arrowdown"] ? 1 : 0);
      const s = (k["d"] || k["arrowright"] ? 1 : 0) - (k["a"] || k["arrowleft"] ? 1 : 0);
      const u = (k["e"] || k[" "] ? 1 : 0) - (k["q"] ? 1 : 0);
      if (!f && !s && !u) return;
      camera.getWorldDirection(fwd);
      fwd.y = 0;
      if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, -1);
      fwd.normalize();
      right.crossVectors(fwd, up).normalize();
      const step = 0.35;
      camera.position.addScaledVector(fwd, f * step).addScaledVector(right, s * step);
      camera.position.y = Math.max(1, camera.position.y + u * step);
      controls.target.addScaledVector(fwd, f * step).addScaledVector(right, s * step);
      controls.target.y = Math.max(0.5, controls.target.y + u * step);
      controls.update();
    }
  });
  return null;
}

// Exposes renderer capture for the Screenshot button & Agent Multimodal Vision.
function CaptureApi() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    viewportApi.canvas = gl.domElement;
    viewportApi.getCanvas = () => gl.domElement;
    viewportApi.capture = (download = false, maxWidth = 640) => {
      try {
        let url = gl.domElement.toDataURL("image/jpeg", 0.82);
        if (maxWidth && gl.domElement.width > maxWidth) {
          const c = document.createElement("canvas");
          const scale = maxWidth / gl.domElement.width;
          c.width = maxWidth;
          c.height = Math.round(gl.domElement.height * scale);
          const cx = c.getContext("2d");
          if (cx) {
            cx.drawImage(gl.domElement, 0, 0, c.width, c.height);
            url = c.toDataURL("image/jpeg", 0.82);
          }
        }
        if (download) {
          const a = document.createElement("a");
          a.href = url;
          a.download = `SpiderViewport_${Date.now()}.jpg`;
          a.click();
        }
        return url;
      } catch (e) {
        return null;
      }
    };
    return () => {
      viewportApi.capture = null;
      viewportApi.canvas = null;
      viewportApi.getCanvas = null;
    };
  }, [gl]);
  return null;
}

// Smooth group: lerps toward editor transform so inspector edits glide live.
function LiveGroup({ node, selected, onSelect, register, children }) {
  const ref = useRef(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    if (ref.current) register(node.id, ref.current);
    return () => register(node.id, null);
  }, [node.id, register]);
  useFrame(() => {
    if (!ref.current || transforming) return;
    const isChess = String(node.id).startsWith("spawn-chess-");
    const mult = isChess ? 1.0 : WORLD;
    target.position.set(node.pos.x * mult, node.pos.y * (isChess ? 1.0 : WORLD), node.pos.z * mult);
    target.rotation.set(node.rot.x * DEG, node.rot.y * DEG, node.rot.z * DEG);
    target.scale.set(node.scale.x, node.scale.y, node.scale.z);
    ref.current.position.lerp(target.position, 0.25);
    ref.current.rotation.x += (target.rotation.x - ref.current.rotation.x) * 0.25;
    ref.current.rotation.y += (target.rotation.y - ref.current.rotation.y) * 0.25;
    ref.current.rotation.z += (target.rotation.z - ref.current.rotation.z) * 0.25;
    ref.current.scale.lerp(target.scale, 0.25);
  });
  if (node.visible === false) return null;
  return (
    <group
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
    >
      {children}
    </group>
  );
}

function Std({ color, wire, emissive, ...props }) {  return (
    <meshStandardMaterial
      color={color}
      wireframe={wire}
      emissive={emissive || "#000000"}
      emissiveIntensity={emissive ? 0.55 : 0}
      roughness={0.8}
      metalness={0.1}
      {...props}
    />
  );
}

// Real imported GLB/GLTF model — geometry parsed by three, rendered natively.
function ImportedModel({ url, wire, selected }) {
  const { scene } = useGLTF(url);  const clone = useMemo(() => scene.clone(true), [scene]);
  useEffect(() => {
    clone.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        if (wire) {
          o.material = o.material.clone();
          o.material.wireframe = true;
        }
        if (selected) {
          o.material = o.material.clone();
          o.material.emissive = new THREE.Color("#6366f1");
          o.material.emissiveIntensity = 0.35;
        }
      }
    });
  }, [clone, wire, selected]);
  return <primitive object={clone} />;
}

// Real imported FBX model (Autodesk format — animations play if present).
function FbxModel({ url, wire, selected }) {
  const obj = useLoader(FBXLoader, url);
  const clone = useMemo(() => obj.clone(true), [obj]);
  useEffect(() => {
    clone.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        if (wire) {
          o.material = o.material.clone();
          o.material.wireframe = true;
        }
        if (selected) {
          o.material = o.material.clone();
          o.material.emissive = new THREE.Color("#6366f1");
          o.material.emissiveIntensity = 0.35;
        }
      }
    });
  }, [clone, wire, selected]);
  return <primitive object={clone} />;
}

// Real imported OBJ model (Wavefront — pairs with .mtl when present, plain material otherwise).
function ObjModel({ url, wire, selected }) {
  const obj = useLoader(OBJLoader, url);
  const clone = useMemo(() => obj.clone(true), [obj]);
  useEffect(() => {
    clone.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        if (wire) {
          o.material = o.material.clone();
          o.material.wireframe = true;
        }
        if (selected) {
          o.material = o.material.clone();
          if ("emissive" in o.material) {
            o.material.emissive = new THREE.Color("#6366f1");
            o.material.emissiveIntensity = 0.35;
          }
        }
      }
    });
  }, [clone, wire, selected]);
  return <primitive object={clone} />;
}

// Real imported texture mapped onto a prop box.
function TexturedProp({ url, wire, selected }) {
  const map = useTexture(url);
  return (
    <mesh castShadow>
      <boxGeometry args={[1.6, 1.6, 1.6]} />
      <meshStandardMaterial map={wire ? undefined : map} color={selected ? "#a5b4fc" : "#ffffff"} wireframe={wire} roughness={0.85} />
    </mesh>
  );
}

// Procedural mesh for spawned / generic prop nodes.
function PropMesh({ node, wire, selected }) {
  if (node.modelUrl) {
    return (
      <Suspense fallback={null}>
        {node.modelFormat === "fbx" ? (
          <FbxModel url={node.modelUrl} wire={wire} selected={selected} />
        ) : node.modelFormat === "obj" ? (
          <ObjModel url={node.modelUrl} wire={wire} selected={selected} />
        ) : (
          <ImportedModel url={node.modelUrl} wire={wire} selected={selected} />
        )}
      </Suspense>
    );
  }
  if (node.textureUrl) {
    return (
      <Suspense fallback={null}>
        <TexturedProp url={node.textureUrl} wire={wire} selected={selected} />
      </Suspense>
    );
  }
  const name = `${node.mesh} ${node.name}`.toLowerCase();
  const accent = node.tint || node.color || "#6366f1";
  const e = selected ? "#6366f1" : undefined;
  if (name.includes("pine") || name.includes("oak") || name.includes("tree")) {
    return (
      <group>
        <mesh position={[0, 1.6, 0]} castShadow>
          <coneGeometry args={[1.1, 2.6, 8]} />
          <Std color={accent} wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.24, 1.2, 8]} />
          <Std color="#451a03" wire={wire} emissive={e} />
        </mesh>
      </group>
    );
  }
  if (name.includes("boulder") || name.includes("rock")) {
    return (
      <mesh castShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <Std color={accent} wire={wire} emissive={e} flatShading />
      </mesh>
    );
  }
  if (name.includes("keep") || name.includes("citadel") || name.includes("castle")) {
    return (
      <group>
        <mesh position={[0, 1, 0]} castShadow>
          <boxGeometry args={[3, 2, 3]} />
          <Std color="#d6d3d1" wire={wire} emissive={e} />
        </mesh>
        <mesh position={[-1, 2.6, -1]} castShadow>
          <cylinderGeometry args={[0.5, 0.6, 2.4, 8]} />
          <Std color="#78716c" wire={wire} emissive={e} />
        </mesh>
        <mesh position={[1, 2.6, 1]} castShadow>
          <cylinderGeometry args={[0.5, 0.6, 2.4, 8]} />
          <Std color="#78716c" wire={wire} emissive={e} />
        </mesh>
      </group>
    );
  }
  if (name.includes("village") || name.includes("house") || name.includes("tudor")) {
    return (
      <group>
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[2.2, 1.8, 1.8]} />
          <Std color="#e2e8f0" wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0, 2.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[1.7, 1.2, 4]} />
          <Std color="#b45309" wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0.6, 2.4, 0.4]} castShadow>
          <boxGeometry args={[0.3, 0.8, 0.3]} />
          <Std color="#78716c" wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0, 0.45, 0.91]}>
          <boxGeometry args={[0.5, 0.9, 0.05]} />
          <Std color="#78350f" wire={wire} />
        </mesh>
      </group>
    );
  }
  if (name.includes("bridge") || name.includes("viaduct")) {
    return (
      <group>
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[4.2, 0.35, 1.8]} />
          <Std color="#a8a29e" wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0, 1.55, 0.85]} castShadow>
          <boxGeometry args={[4.2, 0.35, 0.15]} />
          <Std color="#78716c" wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0, 1.55, -0.85]} castShadow>
          <boxGeometry args={[4.2, 0.35, 0.15]} />
          <Std color="#78716c" wire={wire} emissive={e} />
        </mesh>
        <mesh position={[-1.4, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.45, 1.1, 8]} />
          <Std color="#57534e" wire={wire} emissive={e} />
        </mesh>
        <mesh position={[1.4, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.45, 1.1, 8]} />
          <Std color="#57534e" wire={wire} emissive={e} />
        </mesh>
      </group>
    );
  }
  if (name.includes("ruin") || name.includes("temple") || name.includes("pillar")) {
    return (
      <group>
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[2.8, 0.4, 2.2]} />
          <Std color="#a8a29e" wire={wire} emissive={e} />
        </mesh>
        <mesh position={[-0.9, 1.3, -0.6]} castShadow>
          <cylinderGeometry args={[0.22, 0.28, 1.8, 12]} />
          <Std color="#d6d3d1" wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0.9, 1.5, -0.6]} castShadow>
          <cylinderGeometry args={[0.22, 0.28, 2.2, 12]} />
          <Std color="#d6d3d1" wire={wire} emissive={e} />
        </mesh>
        <mesh position={[-0.2, 0.45, 0.5]} rotation={[0, 0.4, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.22, 0.25, 1.4, 12]} />
          <Std color="#78716c" wire={wire} emissive={e} />
        </mesh>
      </group>
    );
  }
  if (name.includes("cave") || name.includes("cavern")) {
    return (
      <group>
        <mesh position={[0, 1.2, 0]} castShadow>
          <dodecahedronGeometry args={[2.2, 0]} />
          <Std color="#57534e" wire={wire} emissive={e} flatShading />
        </mesh>
        <mesh position={[0, 0.9, 1.3]}>
          <boxGeometry args={[1.2, 1.4, 0.5]} />
          <meshBasicMaterial color="#09090b" />
        </mesh>
      </group>
    );
  }
  if (name.includes("waterfall") || name.includes("cascade")) {
    return (
      <group>
        <mesh position={[0, 2, -0.4]} castShadow>
          <boxGeometry args={[2.4, 4, 1.2]} />
          <Std color="#57534e" wire={wire} emissive={e} flatShading />
        </mesh>
        <mesh position={[0, 2, 0.25]}>
          <boxGeometry args={[1.6, 3.8, 0.15]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.1} transparent opacity={0.88} />
        </mesh>
        <mesh position={[0, 0.1, 0.6]}>
          <cylinderGeometry args={[1.3, 1.4, 0.2, 16]} />
          <meshStandardMaterial color="#bae6fd" roughness={0.3} transparent opacity={0.8} />
        </mesh>
      </group>
    );
  }
  if (name.includes("mountain") || name.includes("alpine") || name.includes("peak")) {
    return (
      <group>
        <mesh position={[0, 3, 0]} castShadow>
          <coneGeometry args={[2.8, 6, 6]} />
          <Std color="#64748b" wire={wire} emissive={e} flatShading />
        </mesh>
        <mesh position={[0, 4.8, 0]}>
          <coneGeometry args={[1.2, 2.4, 6]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.6} flatShading />
        </mesh>
        <mesh position={[1.8, 2, -0.6]} castShadow>
          <coneGeometry args={[1.8, 4, 5]} />
          <Std color="#475569" wire={wire} emissive={e} flatShading />
        </mesh>
      </group>
    );
  }
  if (name.includes("cloud") || name.includes("cumulus")) {
    return (
      <group position={[0, 4, 0]}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[1.4, 12, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} transparent opacity={0.92} />
        </mesh>
        <mesh position={[-1, -0.2, 0.3]}>
          <sphereGeometry args={[1, 10, 10]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.9} transparent opacity={0.92} />
        </mesh>
        <mesh position={[1, -0.1, -0.2]}>
          <sphereGeometry args={[1.1, 10, 10]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.9} transparent opacity={0.92} />
        </mesh>
      </group>
    );
  }
  if (name.includes("cliff")) {
    return (
      <group>
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[3.2, 2.4, 1.8]} />
          <Std color="#78716c" wire={wire} emissive={e} flatShading />
        </mesh>
        <mesh position={[0.4, 2.2, -0.2]} castShadow>
          <boxGeometry args={[2.2, 1.6, 1.4]} />
          <Std color="#57534e" wire={wire} emissive={e} flatShading />
        </mesh>
      </group>
    );
  }
  if (name.includes("water") || name.includes("lake") || name.includes("river") || name.includes("pond")) {
    return (
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, 3]} />
        <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.2} transparent opacity={0.85} />
      </mesh>
    );
  }
  if (name.includes("grass") || name.includes("meadow")) {
    return (
      <group>
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.18, 0.8, 6]} />
          <Std color="#65a30d" wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0.2, 0.35, 0.1]} rotation={[0, 0, 0.2]} castShadow>
          <cylinderGeometry args={[0.06, 0.15, 0.7, 6]} />
          <Std color="#84cc16" wire={wire} emissive={e} />
        </mesh>
      </group>
    );
  }
  if (name.includes("sphere") || name.includes("ball") || name.includes("orb")) {
    return (
      <mesh castShadow>
        <sphereGeometry args={[1, 24, 24]} />
        <Std color={accent} wire={wire} emissive={e} />
      </mesh>
    );
  }
  if (name.includes("cylinder") || name.includes("pipe") || name.includes("pole")) {
    return (
      <mesh castShadow>
        <cylinderGeometry args={[0.8, 0.8, 2, 24]} />
        <Std color={accent} wire={wire} emissive={e} />
      </mesh>
    );
  }
  if (name.includes("cone") || name.includes("spike") || name.includes("pyramid")) {
    return (
      <mesh castShadow>
        <coneGeometry args={[1, 2, 24]} />
        <Std color={accent} wire={wire} emissive={e} />
      </mesh>
    );
  }
  if (name.includes("torus") || name.includes("ring") || name.includes("portal") || name.includes("hoop")) {
    return (
      <mesh castShadow>
        <torusGeometry args={[1.4, 0.28, 16, 32]} />
        <Std color={accent} wire={wire} emissive={e} />
      </mesh>
    );
  }
  if (name.includes("ramp") || name.includes("wedge")) {
    return (
      <mesh castShadow rotation={[-Math.PI / 6, 0, 0]}>
        <boxGeometry args={[2, 0.25, 3]} />
        <Std color={accent} wire={wire} emissive={e} />
      </mesh>
    );
  }
  if (name.includes("pawn")) {
    return (
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.45, 0.3, 16]} />
          <Std color={accent} wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0, 0.55, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.3, 0.5, 16]} />
          <Std color={accent} wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0, 0.88, 0]} castShadow>
          <sphereGeometry args={[0.25, 16, 16]} />
          <Std color={accent} wire={wire} emissive={e} />
        </mesh>
      </group>
    );
  }
  if (name.includes("rook")) {
    return (
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.4, 0.5, 0.3, 16]} />
          <Std color={accent} wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0, 0.65, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.38, 0.7, 16]} />
          <Std color={accent} wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0, 1.1, 0]} castShadow>
          <cylinderGeometry args={[0.36, 0.3, 0.25, 16]} />
          <Std color={accent} wire={wire} emissive={e} />
        </mesh>
      </group>
    );
  }
  if (name.includes("knight")) {
    return (
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.4, 0.5, 0.3, 16]} />
          <Std color={accent} wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0, 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.38, 0.6, 16]} />
          <Std color={accent} wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0, 1.05, 0.1]} rotation={[0.4, 0, 0]} castShadow>
          <boxGeometry args={[0.35, 0.5, 0.45]} />
          <Std color={accent} wire={wire} emissive={e} />
        </mesh>
      </group>
    );
  }
  if (name.includes("bishop")) {
    return (
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.48, 0.3, 16]} />
          <Std color={accent} wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0, 0.7, 0]} castShadow>
          <cylinderGeometry args={[0.25, 0.35, 0.8, 16]} />
          <Std color={accent} wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0, 1.25, 0]} castShadow>
          <coneGeometry args={[0.25, 0.45, 16]} />
          <Std color={accent} wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0, 1.52, 0]} castShadow>
          <sphereGeometry args={[0.08, 12, 12]} />
          <Std color={accent} wire={wire} emissive={e} />
        </mesh>
      </group>
    );
  }
  if (name.includes("queen")) {
    return (
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.42, 0.52, 0.3, 16]} />
          <Std color={accent} wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0, 0.8, 0]} castShadow>
          <cylinderGeometry args={[0.26, 0.38, 1.0, 16]} />
          <Std color={accent} wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0, 1.4, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.22, 0.3, 16]} />
          <Std color={accent} wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0, 1.62, 0]} castShadow>
          <sphereGeometry args={[0.1, 12, 12]} />
          <Std color={accent} wire={wire} emissive={e} />
        </mesh>
      </group>
    );
  }
  if (name.includes("king")) {
    return (
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.44, 0.54, 0.3, 16]} />
          <Std color={accent} wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0, 0.85, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.4, 1.1, 16]} />
          <Std color={accent} wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.26, 0.3, 16]} />
          <Std color={accent} wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0, 1.75, 0]} castShadow>
          <boxGeometry args={[0.08, 0.3, 0.08]} />
          <Std color={accent} wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0, 1.8, 0]} castShadow>
          <boxGeometry args={[0.22, 0.08, 0.08]} />
          <Std color={accent} wire={wire} emissive={e} />
        </mesh>
      </group>
    );
  }
  if (name.includes("chessboard") || name.includes("board")) {
    return (
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[8.6, 0.3, 8.6]} />
          <Std color="#334155" wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0, 0.31, 0]}>
          <planeGeometry args={[8, 8]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
      </group>
    );
  }

/* [LINEAGE-AUTHORS]: m4spider */
const __M4_ENGINE_LINEAGE__ = "m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

  if (name.includes("plane") || name.includes("floor") || name.includes("platform") || name.includes("deck")) {
    return (
      <mesh castShadow>
        <boxGeometry args={[4, 0.25, 4]} />
        <Std color={accent} wire={wire} emissive={e} />
      </mesh>
    );
  }
  return (
    <mesh castShadow>
      <boxGeometry args={[1.4, 1.4, 1.4]} />
      <Std color={accent} wire={wire} emissive={e} />
    </mesh>
  );
}

function Hero({ node, wire, selected, moving }) {
  const ref = useRef(null);
  const leftLeg = useRef(null);
  const rightLeg = useRef(null);
  const leftArm = useRef(null);
  const rightArm = useRef(null);
  const coatLeft = useRef(null);
  const coatRight = useRef(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    const amp = moving ? 0.08 : 0.02;
    ref.current.position.y = Math.abs(Math.sin(t * (moving ? 10 : 2))) * amp;
    ref.current.rotation.x = moving ? 0.1 : 0;

    // Procedural arm, leg and trenchcoat sway
    const swing = moving ? Math.sin(t * 10) * 0.5 : 0;
    if (leftLeg.current) leftLeg.current.rotation.x = swing;
    if (rightLeg.current) rightLeg.current.rotation.x = -swing;
    if (leftArm.current) leftArm.current.rotation.x = -swing * 0.8;
    if (rightArm.current) rightArm.current.rotation.x = swing * 0.8;

    const coatFlutter = moving ? 0.2 + Math.sin(t * 12) * 0.08 : 0.04;
    if (coatLeft.current) coatLeft.current.rotation.x = coatFlutter;
    if (coatRight.current) coatRight.current.rotation.x = coatFlutter;
  });

  const e = selected ? "#3b82f6" : undefined;

  return (
    <group ref={ref}>
      {/* 1. Cowl Hood & Glowing Cyber Visor */}
      <group position={[0, 1.82, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.32, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.8]} />
          <Std color="#0f172a" wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0, 0.08, 0.2]} rotation={[0.3, 0, 0]} castShadow>
          <boxGeometry args={[0.36, 0.08, 0.24]} />
          <Std color="#090d16" wire={wire} />
        </mesh>
        <mesh position={[0, -0.04, 0.12]}>
          <sphereGeometry args={[0.22, 12, 12]} />
          <meshBasicMaterial color="#020617" />
        </mesh>
        {/* Cyan Cyber Visor Eyes */}
        <mesh position={[0, -0.02, 0.22]}>
          <boxGeometry args={[0.22, 0.035, 0.04]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={3} />
        </mesh>
      </group>

      {/* 2. Torso Armor & High Collar */}
      <group position={[0, 1.35, 0]}>
        <mesh position={[0, 0.28, 0.02]} castShadow>
          <cylinderGeometry args={[0.25, 0.32, 0.2, 12]} />
          <Std color="#090d16" wire={wire} />
        </mesh>
        <mesh position={[0, 0.02, 0]} castShadow>
          <boxGeometry args={[0.54, 0.55, 0.34]} />
          <Std color={node.tint || "#1e293b"} wire={wire} emissive={e} />
        </mesh>
        {/* Cyan Spine Rail */}
        <mesh position={[0, 0.04, -0.18]}>
          <boxGeometry args={[0.07, 0.44, 0.03]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2.5} />
        </mesh>
        {/* Shoulder Pauldrons */}
        <mesh position={[-0.34, 0.2, 0]} rotation={[0, 0, -0.15]} castShadow>
          <boxGeometry args={[0.18, 0.16, 0.28]} />
          <Std color="#0f172a" wire={wire} />
        </mesh>
        <mesh position={[0.34, 0.2, 0]} rotation={[0, 0, 0.15]} castShadow>
          <boxGeometry args={[0.18, 0.16, 0.28]} />
          <Std color="#0f172a" wire={wire} />
        </mesh>
      </group>

      {/* 3. Arms */}
      <group ref={leftArm} position={[-0.35, 1.45, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <capsuleGeometry args={[0.085, 0.42, 6, 8]} />
          <Std color="#111827" wire={wire} />
        </mesh>
        <mesh position={[0, -0.32, 0.02]}>
          <cylinderGeometry args={[0.1, 0.09, 0.22, 8]} />
          <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.8} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.35, 1.45, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <capsuleGeometry args={[0.085, 0.42, 6, 8]} />
          <Std color="#111827" wire={wire} />
        </mesh>
        <mesh position={[0, -0.32, 0.02]}>
          <cylinderGeometry args={[0.1, 0.09, 0.22, 8]} />
          <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* 4. Trenchcoat Tails */}
      <group position={[0, 1.05, 0]}>
        <mesh position={[0, 0.02, 0]} castShadow>
          <cylinderGeometry args={[0.31, 0.32, 0.1, 14]} />
          <Std color="#090d16" wire={wire} />
        </mesh>
        <mesh position={[0, 0.02, 0.31]}>
          <boxGeometry args={[0.14, 0.08, 0.04]} />
          <meshStandardMaterial color="#c79d42" metalness={0.8} roughness={0.2} />
        </mesh>
        <group ref={coatLeft} position={[-0.14, -0.05, -0.1]}>
          <mesh position={[0, -0.42, 0]} castShadow>
            <boxGeometry args={[0.26, 0.75, 0.06]} />
            <Std color="#090d16" wire={wire} />
          </mesh>
        </group>
        <group ref={coatRight} position={[0.14, -0.05, -0.1]}>
          <mesh position={[0, -0.42, 0]} castShadow>
            <boxGeometry args={[0.26, 0.75, 0.06]} />
            <Std color="#090d16" wire={wire} />
          </mesh>
        </group>
      </group>

      {/* 5. Legs & Armored Boots */}
      <group ref={leftLeg} position={[-0.16, 0.95, 0]}>
        <mesh position={[0, -0.45, 0]} castShadow>
          <capsuleGeometry args={[0.095, 0.75, 6, 8]} />
          <Std color="#1e293b" wire={wire} />
        </mesh>
        <mesh position={[0, -0.88, 0.06]} castShadow>
          <boxGeometry args={[0.18, 0.18, 0.32]} />
          <Std color="#020617" wire={wire} />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.16, 0.95, 0]}>
        <mesh position={[0, -0.45, 0]} castShadow>
          <capsuleGeometry args={[0.095, 0.75, 6, 8]} />
          <Std color="#1e293b" wire={wire} />
        </mesh>
        <mesh position={[0, -0.88, 0.06]} castShadow>
          <boxGeometry args={[0.18, 0.18, 0.32]} />
          <Std color="#020617" wire={wire} />
        </mesh>
      </group>
    </group>
  );
}

function WeaponFollow({ player, weapon, wire, selected, onSelect }) {
  const ref = useRef(null);
  useFrame(() => {
    if (!ref.current || transforming || !player) return;
    const t = ref.current.position;
    t.x += (player.pos.x * WORLD + 0.55 - t.x) * 0.3;
    t.y += (1.2 + player.pos.y * WORLD - t.y) * 0.3;
    t.z += (player.pos.z * WORLD + 0.2 - t.z) * 0.3;
    ref.current.rotation.y += (player.rot.y * DEG - ref.current.rotation.y) * 0.3;
  });
  return (
    <group ref={ref} position={[0.55, 1.2, 0.2]}>
      <mesh castShadow onClick={(e) => { e.stopPropagation(); onSelect("weapon"); }}>
        <boxGeometry args={[0.18, 0.18, 1.1]} />
        <Std color="#27272a" wire={wire} emissive={selected ? "#6366f1" : undefined} />
      </mesh>
    </group>
  );
}

function Boat({ node, wire, selected }) {
  const ref = useRef(null);
  // Inner local lift: outer LiveGroup already places us at node pos,
  // so hover just above the water plane (world y ~ -0.1) with a bob.
  const lift = -0.1 - node.pos.y * WORLD;
  useFrame(({ clock }) => {
    if (!ref.current || transforming || node.animPaused) return;
    ref.current.position.y += (lift + Math.sin(clock.elapsedTime * 1.4) * 0.12 - ref.current.position.y) * 0.1;
    ref.current.rotation.z = Math.sin(clock.elapsedTime * 1.1) * 0.04;
  });
  const e = selected ? "#f59e0b" : undefined;
  return (
    <group ref={ref}>
      <mesh castShadow>
        <boxGeometry args={[1.6, 0.5, 3]} />
        <Std color="#92400e" wire={wire} emissive={e} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 2.6, 8]} />
        <Std color="#451a03" wire={wire} emissive={e} />
      </mesh>
      <mesh position={[0, 1.5, 0.7]}>
        <planeGeometry args={[1.2, 1.4]} />
        <Std color={node.tint2 || "#fef3c7"} wire={wire} emissive={e} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Guards({ node, wire, selected }) {
  const g1 = useRef(null);
  const g2 = useRef(null);
  useFrame(({ clock }) => {
    if (transforming || node.animPaused) return;
    const t = clock.elapsedTime * 0.5;
    if (g1.current) {
      g1.current.position.x += (Math.sin(t) * 2 - g1.current.position.x) * 0.1;
      g1.current.position.z += (0 - g1.current.position.z) * 0.1;
      g1.current.rotation.y = Math.cos(t) >= 0 ? Math.PI / 2 : -Math.PI / 2;
    }
    if (g2.current) {
      g2.current.position.x += (Math.cos(t) * 2 - g2.current.position.x) * 0.1;
      g2.current.position.z += (1.5 - g2.current.position.z) * 0.1;
    }
  });
  const e = selected ? "#f59e0b" : undefined;
  const guard = (
    <>
      <mesh position={[0, 0.85, 0]} castShadow>
        <capsuleGeometry args={[0.36, 0.8, 6, 12]} />
        <Std color="#9ca3af" wire={wire} emissive={e} />
      </mesh>
      <mesh position={[0, 1.75, 0]}>
        <sphereGeometry args={[0.26, 16, 16]} />
        <Std color="#d6b49c" wire={wire} emissive={e} />
      </mesh>
    </>
  );
  return (
    <>
      <group ref={g1} position={[0, 0, 0]}>
        {guard}
      </group>
      <group ref={g2} position={[0, 0, 1.5]}>
        {guard}
      </group>
    </>
  );
}

// Click-to-shoot in Play — raycast from screen center, targets die on hit.
function ShootHandler({ registry, isPlaying, onShoot, hasChess }) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useRef({ x: 0, y: 0, inside: false });
  const [flash, setFlash] = useState(null);
  const [aim, setAim] = useState(null); // live aim point under the cursor
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 120);
    return () => clearTimeout(t);
  }, [flash]);
  const pick = () => {
    ray.setFromCamera(mouse.current, camera);
    const roots = [...registry.current.values()];
    const hits = ray.intersectObjects(roots, true);
    for (const h of hits) {
      let o = h.object;
      while (o) {
        for (const [rid, root] of registry.current) {
          if (root === o) return { id: rid, point: h.point.clone() };
        }
        o = o.parent;
      }
    }
    return { id: null, point: ray.ray.at(24, new THREE.Vector3()).clone() };
  };
  // Live aim marker — raycast from the cursor every frame while playing
  useFrame(() => {
    if (hasChess || !isPlaying || !mouse.current.inside) {
      if (aim) setAim(null);
      return;
    }
    const { point } = pick();
    setAim((prev) => {
      if (prev && prev.distanceToSquared(point) < 0.0025) return prev;
      return point.clone();
    });
  });
  useEffect(() => {
    if (!isPlaying || hasChess) {
      setAim(null);
      return;
    }
    const el = gl.domElement;
    let down = null;
    const toNDC = (e) => {
      const r = el.getBoundingClientRect();
      mouse.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.current.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      mouse.current.inside = true;
    };
    const onMove = (e) => toNDC(e);
    const onLeave = () => { mouse.current.inside = false; };
    const onDown = (e) => { down = [e.clientX, e.clientY]; toNDC(e); };
    const onUp = (e) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]);
      down = null;
      if (moved > 6) return; // was an orbit drag, not a shot
      toNDC(e);
      const { id, point } = pick();
      setFlash({ pos: point, at: Date.now() });
      if (onShoot) onShoot(id);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
    };
  }, [gl, isPlaying, ray, camera, registry, onShoot, aim]);
  return (
    <>
      {aim && isPlaying && (
        <group position={[aim.x, aim.y, aim.z]}>
          <mesh>
            <torusGeometry args={[0.35, 0.045, 10, 24]} />
            <meshBasicMaterial color="#f43f5e" depthTest={false} transparent opacity={0.95} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.06, 10, 10]} />
            <meshBasicMaterial color="#f43f5e" depthTest={false} transparent opacity={0.95} />
          </mesh>
        </group>
      )}
      {flash && (
        <group position={[flash.pos.x, flash.pos.y, flash.pos.z]}>
          <mesh>
            <sphereGeometry args={[0.22, 12, 12]} />
            <meshBasicMaterial color="#fde047" />
          </mesh>
          <pointLight color="#fbbf24" intensity={8} distance={9} decay={2} />
        </group>
      )}
    </>
  );
}

// Spinning collectible coins — the playable game objective.
function Coins({ coins, wire }) {
  const refs = useRef(new Map());
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 2.2;
    refs.current.forEach((o) => {
      if (!o) return;
      o.rotation.y = t;
      o.position.y += (Math.sin(t * 1.5 + o.position.x) * 0.15 + 1 - o.position.y) * 0.1;
    });
  });
  return (
    <>
      {coins.filter((c) => !c.taken).map((c) => (
        <mesh
          key={c.id}
          ref={(o) => { if (o) refs.current.set(c.id, o); else refs.current.delete(c.id); }}
          position={[c.x * WORLD, 1, c.z * WORLD]}
        >
          <cylinderGeometry args={[0.45, 0.45, 0.12, 24]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.25} emissive="#b45309" emissiveIntensity={0.5} wireframe={wire} />
        </mesh>
      ))}
    </>
  );
}

// Trees — real wind sway (ABP_WindSway) + live tint; pauses when animPaused
function SwayingTrees({ node, wire, selected }) {
  const ref = useRef(null);
  useFrame(({ clock }) => {
    if (!ref.current || transforming || node.animPaused) return;
    ref.current.rotation.z = Math.sin(clock.elapsedTime * 1.2) * 0.04;
    ref.current.rotation.x = Math.cos(clock.elapsedTime * 0.9) * 0.025;
  });
  const leaf = node.tint || "#15803d";
  const e = selected ? "#6366f1" : undefined;
  return (
    <group ref={ref}>
      {[
        [0, 0],
        [2.2, 1.2],
        [-2, 1.6]
      ].map(([dx, dz], i) => (
        <group key={i} position={[dx, 0, dz]}>
          <mesh position={[0, 2.2, 0]} castShadow>
            <coneGeometry args={[1.3, 3, 8]} />
            <Std color={leaf} wire={wire} emissive={e} />
          </mesh>
          <mesh position={[0, 0.7, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.28, 1.4, 8]} />
            <Std color={node.tint2 || "#451a03"} wire={wire} emissive={e} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Castle({ node, wire, selected }) {
  const e = selected ? "#f59e0b" : undefined;
  const baseY = 3 + node.pos.y * 0.02;
  const wall = node.tint || "#d6d3d1";  return (
    <group>
      {/* Cliff island */}
      <mesh position={[0, 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[11, 6, 11]} />
        <Std color="#78716c" wire={wire} emissive={e} flatShading />
      </mesh>
      {/* Waterfalls */}
      <mesh position={[-2.5, 0.4, 5.55]}>
        <boxGeometry args={[0.9, 6.5, 0.25]} />
        <meshStandardMaterial color="#bae6fd" transparent opacity={0.85} wireframe={wire} />
      </mesh>
      <mesh position={[2.5, 0.4, 5.55]}>
        <boxGeometry args={[1.3, 6.5, 0.25]} />
        <meshStandardMaterial color="#e0f2fe" transparent opacity={0.85} wireframe={wire} />
      </mesh>
      {/* Keep + towers */}
      <mesh position={[0, baseY + 1.2, 0]} castShadow>
        <boxGeometry args={[4, 2.4, 4]} />
        <Std color={wall} wire={wire} emissive={e} />
      </mesh>
      {[
        [-1.7, -1.7],
        [1.7, -1.7],
        [-1.7, 1.7],
        [1.7, 1.7]
      ].map(([dx, dz]) => (
        <group key={`${dx}${dz}`}>
          <mesh position={[dx, baseY + 2.6, dz]} castShadow>
            <cylinderGeometry args={[0.55, 0.65, 3, 10]} />
            <Std color={node.tint2 || "#a8a29e"} wire={wire} emissive={e} />
          </mesh>
          <mesh position={[dx, baseY + 4.4, dz]} castShadow>
            <coneGeometry args={[0.8, 1.1, 10]} />
            <Std color={node.tint2 || "#475569"} wire={wire} emissive={e} />
          </mesh>
        </group>
      ))}
      {/* Bridge */}
      <mesh position={[-8, 2.2, 0]} castShadow>
        <boxGeometry args={[6, 0.4, 1.6]} />
        <Std color="#a8a29e" wire={wire} emissive={e} />
      </mesh>
    </group>
  );
}

export default function GameViewport({
  sceneGroups,
  selectedNodeId,
  onSelectNode,
  onTransformNode,
  isPlaying,
  keysPressed,
  timeOfDay,
  rtxEnabled,
  showGrid,
  viewMode,
  activeGizmo,
  cameraZoom,
  projection,
  space,
  cameraMode,
  coins,
  tint,
  onFps,
  onShoot,
  chessSel,
  chessTargets = [],
  chessCaptures = [],
  activeJsxCode = null,
  activeJsxName = null,
  snakesActive = false,
  all3dActive = false,
  selectedScriptNames = null,
  projectFiles = []
}) {
  const hasChess = useMemo(() => {
    return (sceneGroups || []).some((g) => (g?.children || []).some((c) => c && String(c.id).startsWith("spawn-chess-")));
  }, [sceneGroups]);
  const hasCustomJsx = Boolean(activeJsxCode && activeJsxCode.trim());
  const isDomApp = hasCustomJsx && (
    (activeJsxCode.includes("<div") || activeJsxCode.includes("<canvas") || activeJsxCode.includes("ProceduralNightCityCanvas")) &&
    !activeJsxCode.includes("<mesh") && !activeJsxCode.includes("<group") && !activeJsxCode.includes("<ambientLight")
  );
  const isBoardGame = hasChess || snakesActive;
  const isolateCustomGame = hasCustomJsx || isBoardGame;

  const registry = useRef(new Map());
  const register = (id, obj) => {
    if (obj) registry.current.set(id, obj);
    else registry.current.delete(id);
  };
  const [selectedObj, setSelectedObj] = useStateSelected(selectedNodeId, registry, sceneGroups);
  // Editor selection glow only — in Play the game shows true authored colors
  const selId = isPlaying ? "__playing__" : selectedNodeId;

  const terrain = findNode(sceneGroups, "terrain");
  const water = findNode(sceneGroups, "water");
  const trees = findNode(sceneGroups, "trees");
  const rocks = findNode(sceneGroups, "rocks");
  const sky = findNode(sceneGroups, "sky");
  const lighting = findNode(sceneGroups, "lighting");
  const fog = findNode(sceneGroups, "fog");
  const buildings = findNode(sceneGroups, "buildings");
  const vehicles = findNode(sceneGroups, "vehicles");
  const npcs = findNode(sceneGroups, "npcs");
  const player = findNode(sceneGroups, "player");
  const cameraNode = findNode(sceneGroups, "camera");
  const weapon = findNode(sceneGroups, "weapon");

  const spawned = [];
  for (const g of (sceneGroups || [])) {
    if (g && Array.isArray(g.children)) {
      for (const c of g.children) if (c && String(c.id).startsWith("spawn-")) spawned.push(c);
    }
  }

  // Sun path: 6h rise -> 12h noon -> 18h set.
  const sunT = ((timeOfDay - 6) / 12) * Math.PI;
  const sunPos = [Math.cos(sunT) * 60, Math.max(4, Math.sin(sunT) * 60), -30];
  const night = timeOfDay < 6.5 || timeOfDay > 19;
  const wire = viewMode === "Wireframe";

  const gizmoMode =
    activeGizmo === "rotate" ? "rotate" : activeGizmo === "scale" ? "scale" : "translate";
  const showTransform = activeGizmo !== "select" && selectedObj && selectedObj.parent && !isPlaying;
  const heroMoving = isPlaying && keysPressed && Object.values(keysPressed).some(Boolean);

  return (
    <div
      className="absolute inset-0 focus:outline-none"
      tabIndex={0}
      onClick={() => {
        try {
          if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
            document.activeElement.blur();
          }
        } catch {}
        window.focus();
      }}
      style={{ cursor: (isPlaying && typeof document !== "undefined" && document.pointerLockElement) ? "none" : (isPlaying ? "crosshair" : undefined) }}
    >
      <Canvas
        key={`${projection}-${hasCustomJsx}`}
        shadows={rtxEnabled ? "pcf" : false}
        orthographic={projection === "Orthographic"}
        camera={
          projection === "Orthographic"
            ? { position: [50, 50, 50], zoom: 22 }
            : hasCustomJsx
            ? { position: [0, 13, 14], fov: 44 / cameraZoom }
            : isBoardGame
            ? { position: [0, 16, 18], fov: 46 / cameraZoom }
            : { position: [14, 10, 18], fov: 55 / cameraZoom }
        }
        dpr={[1, 2]}
        gl={{ preserveDrawingBuffer: true, antialias: true, logarithmicDepthBuffer: true }}
        onPointerMissed={() => {
          if (!isBoardGame) onSelectNode("player");
        }}
      >
        {!night && sky && sky.visible !== false ? (
          <Sky distance={450000} sunPosition={sunPos} inclination={0.52} />
        ) : (
          <color attach="background" args={["#0f172a"]} />
        )}
        {night && <Stars radius={200} depth={40} count={2500} factor={4} fade />}
        {fog && fog.visible !== false && <fog attach="fog" args={["#cbd5e1", 70, 240]} />}
        <ambientLight intensity={night ? 0.25 : 0.55} />
        {lighting && lighting.visible !== false && (
          <directionalLight
            position={sunPos}
            intensity={night ? 0.4 : 1.6}
            castShadow={rtxEnabled}
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-40}
            shadow-camera-right={40}
            shadow-camera-top={40}
            shadow-camera-bottom={-40}
          />
        )}

        {/* Dedicated Studio & Tournament Lighting for Custom & Board Games */}
        {isolateCustomGame && (
          <>
            <hemisphereLight skyColor="#f8fafc" groundColor="#1e293b" intensity={0.65} />
            <directionalLight
              position={[14, 24, 18]}
              intensity={1.6}
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-camera-left={-16}
              shadow-camera-right={16}
              shadow-camera-top={16}
              shadow-camera-bottom={-16}
              shadow-bias={-0.0001}
            />
            <directionalLight position={[-12, 14, -12]} intensity={0.45} color="#93c5fd" />
          </>
        )}

        {/* Clean Tournament Tiled Stage under Board & Custom Games */}
        {isolateCustomGame && (
          <mesh position={[0, -0.42, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[180, 180]} />
            <meshStandardMaterial color="#0f172a" roughness={0.85} metalness={0.08} />
          </mesh>
        )}

        {/* Terrain + distant peaks (only for outdoor gameplay) */}
        {!isolateCustomGame && terrain && terrain.visible !== false && (
          <group>
            <mesh rotation-x={-Math.PI / 2} receiveShadow>
              <planeGeometry args={[260, 260]} />
              <Std color="#4d7c0f" wire={wire} />
            </mesh>
            {[
              [-70, -60, 26, "#64748b"],
              [60, -70, 32, "#475569"],
              [-85, 20, 22, "#94a3b8"],
              [75, 55, 24, "#64748b"]
            ].map(([x, z, h, c], i) => (
              <group key={i} position={[x, 0, z]}>
                <mesh position={[0, h / 2, 0]} castShadow>
                  <coneGeometry args={[h * 0.55, h, 7]} />
                  <Std color={c} wire={wire} flatShading />
                </mesh>
                <mesh position={[0, h - h * 0.12, 0]}>
                  <coneGeometry args={[h * 0.55 * 0.24, h * 0.24, 7]} />
                  <Std color="#f8fafc" wire={wire} flatShading />
                </mesh>
              </group>
            ))}
          </group>
        )}

        {/* Water */}
        {!isolateCustomGame && water && water.visible !== false && (
          <mesh
            rotation-x={-Math.PI / 2}
            position={[water.pos.x * WORLD, -0.5, water.pos.z * WORLD]}
          >
            <planeGeometry args={[water.scale.x * WORLD, water.scale.z * WORLD]} />
            <meshStandardMaterial
              color="#0284c7"
              transparent
              opacity={0.8}
              roughness={0.2}
              metalness={0.4}
              wireframe={wire}
            />
          </mesh>
        )}

        {/* Trees */}
        {!isolateCustomGame && trees && trees.visible !== false && (
          <LiveGroup node={trees} selected={selId === "trees"} onSelect={onSelectNode} register={register}>
            <SwayingTrees node={trees} wire={wire} selected={selId === "trees"} />
          </LiveGroup>
        )}

        {/* Rocks */}
        {!isolateCustomGame && rocks && rocks.visible !== false && (
          <LiveGroup node={rocks} selected={selId === "rocks"} onSelect={onSelectNode} register={register}>
            {[
              [0, 0, 1],
              [1.8, 0.8, 0.7],
              [-1.5, 1, 1.3]
            ].map(([dx, dz, s], i) => (
              <mesh key={i} position={[dx, 0.4 * s, dz]} scale={s} castShadow>
                <dodecahedronGeometry args={[1, 0]} />
                <Std color={rocks.tint || "#78716c"} wire={wire} flatShading emissive={selId === "rocks" ? "#6366f1" : undefined} />
              </mesh>
            ))}
          </LiveGroup>
        )}

        {/* Castle */}
        {!isolateCustomGame && buildings && buildings.visible !== false && (
          <LiveGroup node={buildings} selected={selId === "buildings"} onSelect={onSelectNode} register={register}>
            <Castle node={buildings} wire={wire} selected={selId === "buildings"} />
          </LiveGroup>
        )}

        {/* Boat */}
        {!isolateCustomGame && vehicles && vehicles.visible !== false && (
          <LiveGroup node={vehicles} selected={selId === "vehicles"} onSelect={onSelectNode} register={register}>
            <Boat node={vehicles} wire={wire} selected={selId === "vehicles"} />
          </LiveGroup>
        )}

        {/* Guards on patrol (disabled during custom games / board games) */}
        {!isolateCustomGame && npcs && npcs.visible !== false && (
          <LiveGroup node={npcs} selected={selId === "npcs"} onSelect={onSelectNode} register={register}>
            <Guards node={npcs} wire={wire} selected={selId === "npcs"} />
          </LiveGroup>
        )}

        {/* Hero (disabled during custom games / board games) */}
        {!isolateCustomGame && player && player.visible !== false && (
          <LiveGroup node={player} selected={selId === "player"} onSelect={onSelectNode} register={register}>
            <Hero node={player} wire={wire} selected={selId === "player"} moving={heroMoving} />
          </LiveGroup>
        )}

        {/* Collectible coins */}
        {!isolateCustomGame && <Coins coins={coins || []} wire={wire} />}

        {/* Weapon follows hero */}
        {!isolateCustomGame && weapon && weapon.visible !== false && player && (
          <WeaponFollow player={player} weapon={weapon} wire={wire} selected={selId === "weapon"} onSelect={onSelectNode} />
        )}

        {/* Camera helper */}
        {cameraNode && cameraNode.visible !== false && (
          <LiveGroup node={cameraNode} selected={selId === "camera"} onSelect={onSelectNode} register={register}>
            <mesh position={[0, 1.2, 0]} onClick={(e) => { e.stopPropagation(); onSelectNode("camera"); }}>
              <boxGeometry args={[0.5, 0.35, 0.7]} />
              <Std color="#3b82f6" wire={wire} emissive={selId === "camera" ? "#6366f1" : undefined} />
            </mesh>
          </LiveGroup>
        )}

        {/* Spawned props & 3D Chess Pieces / Board */}
        {spawned.map(
          (n) =>
            n.visible !== false && (
              <LiveGroup key={n.id} node={n} selected={selectedNodeId === n.id} onSelect={onSelectNode} register={register}>
                <PropMesh
                  node={n}
                  wire={wire}
                  selected={selectedNodeId === n.id}
                  chessSel={chessSel}
                  chessTargets={chessTargets}
                  chessCaptures={chessCaptures}
                />
              </LiveGroup>
            )
        )}

        {/* Dynamic 3D Game / Component Staging — Powered by Muse / Spider AI */}
        {hasCustomJsx && !isDomApp ? (
          <Suspense fallback={null}>
            <DynamicJsxRenderer code={activeJsxCode} name={activeJsxName} projectFiles={projectFiles} />
          </Suspense>
        ) : null}

        {/* Real gizmo on the selected actor */}
        {showTransform && (
          <TransformControls
            object={selectedObj}
            mode={gizmoMode}
            space={space === "Local" ? "local" : "world"}
            size={0.8}
            onMouseDown={() => {
              transforming = true;
            }}
            onMouseUp={(e) => {
              transforming = false;
              const o = e?.target?.object;
              if (o && onTransformNode) onTransformNode(o);
            }}
          />
        )}

        {showGrid && !isolateCustomGame && <Grid position={[0, 0.01, 0]} args={[120, 120]} cellColor="#94a3b8" sectionColor="#475569" fadeDistance={140} />}
        {!hasCustomJsx && (
          <OrbitControls makeDefault target={[0, 0, 0]} maxPolarAngle={Math.PI / 2.05} minDistance={4} maxDistance={160} enabled={isBoardGame || cameraMode !== "Game View"} />
        )}
        {/* Live axis orientation gizmo — tracks the real camera */}
        {!isPlaying && !hasCustomJsx && (
          <GizmoHelper alignment="bottom-right" margin={[70, 70]}>
            <GizmoViewport axisColors={["#ef4444", "#22c55e", "#2563eb"]} labelColor="white" />
          </GizmoHelper>
        )}
        {!hasCustomJsx && (
          <CameraRig mode={cameraMode || "Viewport"} isPlaying={isPlaying} keysPressed={keysPressed} activeGizmo={activeGizmo} followRef={{ current: registry.current.get("player") || null }} hasChess={isBoardGame} />
        )}
        <FpsMeter onFps={onFps} />
        <FovSync zoom={cameraZoom} />
        <CaptureApi />
        {!isolateCustomGame && (
          <ShootHandler registry={registry} isPlaying={isPlaying} onShoot={onShoot} hasChess={isBoardGame} />
        )}
      </Canvas>

      {/* Native Fullscreen DOM Overlay for Canvas/2D interactive games */}
      {hasCustomJsx && isDomApp && (
        <div className="absolute inset-0 z-20 overflow-hidden pointer-events-auto">
          <DomGameRenderer code={activeJsxCode} name={activeJsxName} projectFiles={projectFiles} />
        </div>
      )}
    </div>
  );
}

function useStateSelected(selectedNodeId, registry, sceneGroups) {
  const [obj, setObj] = React.useState(null);
  useEffect(() => {
    const t = setTimeout(() => setObj(registry.current.get(selectedNodeId) || null), 0);
    return () => clearTimeout(t);
  }, [selectedNodeId, registry, sceneGroups]);
  return [obj, setObj];
}
