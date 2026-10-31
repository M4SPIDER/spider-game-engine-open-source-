/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
import React, { Component, useState, useEffect, useMemo, useRef, useCallback, useReducer, useLayoutEffect } from "react";
import * as THREE from "three";
import * as Fiber from "@react-three/fiber";
import * as Drei from "@react-three/drei";
import * as Lucide from "lucide-react";
import { transform } from "sucrase";
import { Chess } from "chess.js";
import { sfx, SoundEffects } from "./audioSynthesizer.js";
import * as ArenaModule from "../game/ArenaEnv.jsx";
import * as ChessBoardEnvModule from "../game/ChessBoardEnv.jsx";
import * as PiecesModule from "../game/pieces.jsx";
import * as ChessRulesModule from "../game/ChessRules.js";
import * as MobileTouchModule from "../game/mobileTouch.jsx";

class JsxErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.warn("[DynamicJsxRenderer] Runtime error in dynamic JSX component:", error);
    if (typeof window !== "undefined") {
      window.__lastDynamicJsxError = `Runtime error in ${this.props.name || "GameComponent"}: ${error?.message || String(error)}`;
    }
    if (this.props.onError) this.props.onError(error);
  }
  componentDidUpdate(prevProps) {
    if (prevProps.code !== this.props.code && this.state.hasError) {
      if (typeof window !== "undefined") {
        window.__lastDynamicJsxError = null;
      }
      this.setState({ hasError: false, error: null });
    }
  }
  render() {
    if (this.state.hasError) {
      // Do NOT plaster code/errors across the 3D canvas! Keep 3D scene pristine.
      return null;
    }
    return this.props.children;
  }
}

const EMPTY_SCOPE = Object.freeze({});
const EMPTY_PROJECT_FILES = Object.freeze([]);
const COMPILATION_CACHE = new Map();
const MAX_CACHE_SIZE = 64;

function filterCollidingScope(keys, values, transformedCode) {
  const declared = new Set();
  const declRegex = /(?:^|[;\s{}])(?:const|let|var|function|class)\s+([a-zA-Z0-9_$]+)/g;
  let match;
  while ((match = declRegex.exec(transformedCode)) !== null) {
    declared.add(match[1]);
  }
  const essentials = new Set(["require", "module", "exports", "React"]);
  const safeKeys = [];
  const safeValues = [];
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (essentials.has(k) || !declared.has(k)) {
      safeKeys.push(k);
      safeValues.push(values[i]);
    }
  }
  return { safeKeys, safeValues };
}

function computeCacheKey(codeStr, projectFiles) {
  let key = codeStr;
  if (Array.isArray(projectFiles) && projectFiles.length > 0) {
    key += "||" + projectFiles.map((f) => `${f.name}:${f.content || ""}`).join(";");
  }
  return key;
}

/**
 * Strips markdown code blocks (```jsx ... ```) and extra whitespace.
 */
export function cleanJsxCode(raw) {
  if (!raw || typeof raw !== "string") return "";
  let str = raw.trim();
  const match = str.match(/^```(?:jsx|tsx|javascript|js)?\s*([\s\S]*?)```$/i);
  if (match) {
    str = match[1].trim();
  } else {
    str = str.replace(/^```[a-z0-9_-]*\r?\n/i, "").replace(/\r?\n```\s*$/i, "").trim();
  }
  return str;
}

/**
 * Compiles a raw JSX/TSX string in real-time and returns the React component.
 * Supports multi-file project imports by recursively resolving and compiling projectFiles.
 * Uses persistent compilation cache to preserve React component identity across parent re-renders.
 */
export function compileJsxComponent(rawCode, customScope = EMPTY_SCOPE, onError = null, projectFiles = EMPTY_PROJECT_FILES, moduleCache = new Map()) {
  const codeStr = cleanJsxCode(rawCode);
  if (!codeStr) return null;

  // If code is raw HTML document or non-React HTML snippet, skip 3D JSX compilation
  const lower = codeStr.trim().toLowerCase();
  if (
    lower.startsWith("<!doctype") ||
    lower.startsWith("<html") ||
    lower.startsWith("<head") ||
    lower.startsWith("<body") ||
    (lower.startsWith("<canvas") && !codeStr.includes("import ") && !codeStr.includes("export "))
  ) {
    return null;
  }

  // Check persistent compilation cache
  const cacheKey = computeCacheKey(codeStr, projectFiles);
  if (COMPILATION_CACHE.has(cacheKey)) {
    return COMPILATION_CACHE.get(cacheKey);
  }

  try {
    const transformed = transform(codeStr, {
      transforms: ["jsx", "imports", "typescript"],
      jsxRuntime: "classic"
    }).code;

    const module = { exports: {} };
    const exports = module.exports;

    const SafeCanvas = ({ children }) => React.createElement(React.Fragment, null, children);

    const safeLucide = new Proxy(Lucide, {
      get(target, prop) {
        if (prop in target) return target[prop];
        // Fallback for any unknown icon so dynamic game components never crash
        return (props) => React.createElement("span", { ...props, "data-icon": String(prop) });
      }
    });

    const scopeMap = {
      react: React,
      three: THREE,
      "@react-three/fiber": { ...Fiber, Canvas: SafeCanvas },
      "@react-three/drei": Drei,
      "lucide-react": safeLucide,
      "chess.js": { Chess, default: Chess },
      audio: { sfx, SoundEffects, playSound: (k) => sfx[k]?.() || sfx.play?.(k), default: sfx },
      sound: { sfx, SoundEffects, playSound: (k) => sfx[k]?.() || sfx.play?.(k), default: sfx },
      "./audio": { sfx, SoundEffects, playSound: (k) => sfx[k]?.() || sfx.play?.(k), default: sfx },
      "./sound": { sfx, SoundEffects, playSound: (k) => sfx[k]?.() || sfx.play?.(k), default: sfx },
      sfx,
      SoundEffects,
      spiderAudio: sfx,
      // Built-in modular game environments
      "./ArenaEnv": ArenaModule,
      "./ArenaEnv.jsx": ArenaModule,
      "ArenaEnv": ArenaModule,
      "./ChessBoardEnv": ChessBoardEnvModule,
      "./ChessBoardEnv.jsx": ChessBoardEnvModule,
      "ChessBoardEnv": ChessBoardEnvModule,
      "./pieces": PiecesModule,
      "./pieces.jsx": PiecesModule,
      "pieces": PiecesModule,
      "./ChessRules": ChessRulesModule,
      "./ChessRules.js": ChessRulesModule,
      "ChessRules": ChessRulesModule,
      // Built-in Mobile Touch & Virtual Joystick runtime libraries
      "./mobileTouch": MobileTouchModule,
      "./mobileTouch.jsx": MobileTouchModule,
      "./mobileTouch.js": MobileTouchModule,
      "mobileTouch": MobileTouchModule,
      "touch": MobileTouchModule,
      "./touch": MobileTouchModule,
      "nipplejs": MobileTouchModule.nipplejs,
      "react-joystick-component": { Joystick: MobileTouchModule.Joystick, default: { Joystick: MobileTouchModule.Joystick } },
      "@use-gesture/react": MobileTouchModule.useGestureShim,
      ...customScope
    };

    const customRequire = (name) => {
      if (scopeMap[name]) return scopeMap[name];
      if (name.startsWith("./") || name.startsWith("../")) {
        const cleanName = name.replace(/^(\.\/|\.\.\/)+/, "");
        const base = cleanName.split("/").pop().replace(/\.(jsx?|tsx?)$/, "");

        if (moduleCache.has(base)) return moduleCache.get(base);
        if (scopeMap[base]) return scopeMap[base];

        // Search in projectFiles
        const targetFile = (projectFiles || []).find((f) => {
          const fBase = (f.name || "").replace(/\.(jsx?|tsx?)$/, "");
          return fBase === base || f.name === cleanName || f.name === name || (f.path && f.path.endsWith(cleanName));
        });

        if (targetFile && targetFile.content) {
          const subModule = { exports: {} };
          moduleCache.set(base, subModule.exports);
          try {
            const subTransformed = transform(cleanJsxCode(targetFile.content), {
              transforms: ["jsx", "imports", "typescript"],
              jsxRuntime: "classic"
            }).code;

            const subKeys = [
              "require",
              "module",
              "exports",
              "React",
              "useState",
              "useEffect",
              "useRef",
              "useMemo",
              "useCallback",
              "useReducer",
              "useLayoutEffect",
              "THREE",
              "useFrame",
              "useThree",
              "Float",
              "Trail",
              "Text",
              "Sparkles",
              "Sky",
              "Stars",
              "Grid",
              "Html",
              "useFBX",
              "useGLTF",
              "useAnimations",
              "OrbitControls",
              "Clone",
              "Chess",
              "sfx",
              "SoundEffects",
              "spiderAudio"
            ];
            const subValues = [
              customRequire,
              subModule,
              subModule.exports,
              React,
              useState,
              useEffect,
              useRef,
              useMemo,
              useCallback,
              useReducer,
              useLayoutEffect,
              THREE,
              Fiber.useFrame,
              Fiber.useThree,
              Drei.Float,
              Drei.Trail,
              Drei.Text,
              Drei.Sparkles,
              Drei.Sky,
              Drei.Stars,
              Drei.Grid,
              Drei.Html,
              Drei.useFBX,
              Drei.useGLTF,
              Drei.useAnimations,
              Drei.OrbitControls,
              Drei.Clone,
              Chess,
              sfx,
              SoundEffects,
              sfx
            ];
            const { safeKeys: safeSubKeys, safeValues: safeSubValues } = filterCollidingScope(subKeys, subValues, subTransformed);
            const subFn = new Function(...safeSubKeys, subTransformed);
            subFn(...safeSubValues);


/* [LINEAGE-AUTHORS]: m4spider */
const __M4_ENGINE_LINEAGE__ = "m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

            if (subModule.exports && !subModule.exports.default) {
              const fnExport = Object.values(subModule.exports).find((v) => typeof v === "function");
              if (fnExport) subModule.exports.default = fnExport;
            }

            moduleCache.set(base, subModule.exports);
            return subModule.exports;
          } catch (subErr) {
            console.warn(`[DynamicJsxRenderer] Failed to compile imported file "${targetFile.name}":`, subErr);
            return subModule.exports;
          }
        }
      }
      return {};
    };

    const scopeKeys = [
      "require",
      "module",
      "exports",
      "React",
      "useState",
      "useEffect",
      "useRef",
      "useMemo",
      "useCallback",
      "useReducer",
      "useLayoutEffect",
      "THREE",
      "useFrame",
      "useThree",
      "Canvas",
      "Float",
      "Trail",
      "Text",
      "Sparkles",
      "Sky",
      "Stars",
      "Grid",
      "Html",
      "Billboard",
      "Center",
      "RoundedBox",
      "PerspectiveCamera",
      "KeyboardControls",
      "useKeyboardControls",
      "useFBX",
      "useGLTF",
      "useAnimations",
      "OrbitControls",
      "Clone",
      "Chess",
      "sfx",
      "SoundEffects",
      "spiderAudio",
      "ArenaEnv",
      "CoinPickup",
      "ObstacleBox",
      "GameHud",
      "PauseOverlay",
      "GameNav",
      "ChessBoardEnv",
      "PieceModel",
      "ChessPiece",
      "useTouchControls",
      "VirtualJoystick",
      "Joystick",
      "TouchButton",
      "MobileControls",
      "MobileMenu",
      "nipplejs"
    ];

    const scopeValues = [
      customRequire,
      module,
      exports,
      React,
      useState,
      useEffect,
      useRef,
      useMemo,
      useCallback,
      useReducer,
      useLayoutEffect,
      THREE,
      Fiber.useFrame,
      Fiber.useThree,
      SafeCanvas,
      Drei.Float,
      Drei.Trail,
      Drei.Text,
      Drei.Sparkles,
      Drei.Sky,
      Drei.Stars,
      Drei.Grid,
      Drei.Html,
      Drei.Billboard,
      Drei.Center,
      Drei.RoundedBox,
      Drei.PerspectiveCamera,
      Drei.KeyboardControls,
      Drei.useKeyboardControls,
      Drei.useFBX,
      Drei.useGLTF,
      Drei.useAnimations,
      Drei.OrbitControls,
      Drei.Clone,
      Chess,
      sfx,
      SoundEffects,
      sfx,
      ArenaModule.ArenaEnv,
      ArenaModule.CoinPickup,
      ArenaModule.ObstacleBox,
      ArenaModule.GameHud,
      ArenaModule.PauseOverlay,
      ArenaModule.GameNav,
      ChessBoardEnvModule.ChessBoardEnv,
      PiecesModule.PieceModel,
      PiecesModule.PieceModel,
      MobileTouchModule.useTouchControls,
      MobileTouchModule.VirtualJoystick,
      MobileTouchModule.Joystick,
      MobileTouchModule.TouchButton,
      MobileTouchModule.MobileControls,
      MobileTouchModule.MobileMenu,
      MobileTouchModule.nipplejs
    ];

    const { safeKeys, safeValues } = filterCollidingScope(scopeKeys, scopeValues, transformed);
    const fn = new Function(...safeKeys, transformed);
    fn(...safeValues);

    const ComponentTarget = exports.default || Object.values(exports).find((v) => typeof v === "function") || null;
    if (ComponentTarget && typeof window !== "undefined" && !window.__lastDynamicJsxError?.startsWith("Runtime error")) {
      window.__lastDynamicJsxError = null;
    }

    if (ComponentTarget) {
      if (COMPILATION_CACHE.size >= MAX_CACHE_SIZE) {
        const oldestKey = COMPILATION_CACHE.keys().next().value;
        COMPILATION_CACHE.delete(oldestKey);
      }
      COMPILATION_CACHE.set(cacheKey, ComponentTarget);
    }
    return ComponentTarget;
  } catch (err) {
    console.warn("[DynamicJsxRenderer] Compilation error:", err);
    if (typeof window !== "undefined") {
      window.__lastDynamicJsxError = `Compilation error: ${err?.message || String(err)}`;
    }
    if (onError) onError(err);
    return null;
  }
}

/**
 * DynamicJsxRenderer component to be mounted inside <Canvas>
 */
export default function DynamicJsxRenderer({
  code,
  name,
  customScope = EMPTY_SCOPE,
  onError = null,
  projectFiles = EMPTY_PROJECT_FILES
}) {
  const filesSignature = useMemo(() => {
    if (!Array.isArray(projectFiles) || projectFiles.length === 0) return "";
    return projectFiles.map((f) => `${f.name}:${f.content ? f.content.length : 0}`).join(",");
  }, [projectFiles]);

  const ComponentToRender = useMemo(() => {
    let comp = compileJsxComponent(code, customScope, onError, projectFiles);
    // If the active file did NOT export a React component (e.g. it was a helper file like rules.js or pieces.jsx),
    // automatically fall back to the root game component in projectFiles so the game STILL opens and runs!
    if (!comp && Array.isArray(projectFiles) && projectFiles.length > 0) {
      const rootFile =
        projectFiles.find((f) => f.name?.toLowerCase() === "gamecomponent.jsx") ||
        projectFiles.find((f) => f.name?.toLowerCase().includes("game") && f.name?.endsWith(".jsx")) ||
        projectFiles.find((f) => f.content && (f.content.includes("export default function") || f.content.includes("export default")));
      if (rootFile && rootFile.content && rootFile.content !== code) {
        comp = compileJsxComponent(rootFile.content, customScope, onError, projectFiles);
      }
    }
    return comp;
  }, [code, filesSignature]);

  if (!ComponentToRender) return null;

  const isDomApp = (code && (code.includes("<div") || code.includes("<canvas") || code.includes("ProceduralNightCityCanvas"))) &&
    !code.includes("<mesh") && !code.includes("<group") && !code.includes("<ambientLight");

  return (
    <JsxErrorBoundary code={code} onError={onError}>
      {isDomApp ? (
        <Drei.Html
          fullscreen
          calculatePosition={() => [0, 0]}
          zIndexRange={[100, 0]}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'auto'
          }}
        >
          <React.Suspense fallback={null}>
            <ComponentToRender />
          </React.Suspense>
        </Drei.Html>
      ) : (
        <React.Suspense fallback={null}>
          <ComponentToRender />
        </React.Suspense>
      )}
    </JsxErrorBoundary>
  );
}
