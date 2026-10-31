/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Pocket Studio state + agent tools
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 *
 * One hook owns the project, scene, selection, undo history, play loop,
 * console and the AI agent so every screen stays a thin view.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { viewportApi } from "../engine/GameViewport.jsx";
import { compileJsxComponent } from "../engine/DynamicJsxRenderer.jsx";
import { runAgent, systemPrompt, GAME_STEPS, GAME_BUILDER_PRIMER, extractFilesFromRawJson } from "../engine/agentHarness.js";
import { COINS, COIN_RULES, PLAYER, physicsFallSpeed, PRIMITIVE_SHAPES, GAME_WORLD } from "../game/index.js";
import {
  STARTER_CODE,
  clone,
  download,
  loadCurrentId,
  loadProjects,
  loadSessions,
  applyInterrupted,
  saveInflight,
  clearInflight,
  loadSettings,
  makeProject,
  newSession,
  sanitizeGroups,
  saveCurrentId,
  saveProjects,
  saveSessions,
  saveSettings,
  haptic,
} from "./store.js";
import { buildMemory, contextWindow, memoryBudget, runLimits } from "./context.js";
import { retrieveRagContext, ragStore } from "../engine/ragEngine.js";
import { PROVIDERS, baseUrlFor, chat, fetchModels, friendlyModel, loadConfig, loadKey, providerById, saveConfig, saveKey } from "./ai.js";

const MAX_UNDO = 40;

// Rules the agent must follow for on-screen controls in games it writes.
const TOUCH_CONTROLS_RULES = [
  "TOUCH CONTROLS (mandatory for every game that moves or has buttons):",
  "- NEVER write your own joystick or on-screen buttons and never read the keyboard yourself. Use the built-in kit: import { useTouch, TouchControls } from 'spider-touch'.",
  "- const touch = useTouch(); then read it inside useFrame every frame: touch.move.x (right is +1) and touch.move.y (forward/up is +1) are -1..1; touch.a and touch.b are booleans (jump, action); touch.presses.a / touch.presses.b are counters that go up once per tap (use them for one-shot actions like jump or shoot).",
  "- Render <TouchControls touch={touch} buttons={['Jump']} /> as a child of the game's root <group>. Up to two buttons: buttons={['Jump','Shoot']} maps to touch.a and touch.b.",
  "- The kit puts the joystick in a FIXED place (bottom-left) and the buttons bottom-right, sizes them from the viewport, and keeps them there in portrait and landscape. The same touch object also reacts to WASD / arrows / Space / E on a computer, so you do not need any other input code.",
  "- Do not draw other controls in those corners. Put score and lives top-centre.",
  "- Minimal pattern: const touch = useTouch(); const ref = useRef(); useFrame((_, dt) => { ref.current.position.x += touch.move.x * 6 * dt; ref.current.position.z -= touch.move.y * 6 * dt; }); return (<group><mesh ref={ref}>...</mesh><TouchControls touch={touch} buttons={['Jump']} /></group>);",
  "",
].join("\n");
const CORE_IDS = new Set(["player", "camera", "weapon", "terrain", "water", "sky", "lighting", "fog", "postprocess", "dir-light", "sky-light", "point-lights"]);

const flatten = (groups) => (groups || []).flatMap((g) => g?.children || []).filter(Boolean);
const mapNodes = (groups, fn) => (groups || []).map((g) => ({ ...g, children: (g.children || []).map(fn) }));

function parseStreaming(raw) {
  const out = { thought: "", tool: "", name: "", code: "", final: "" };
  if (!raw) return out;
  const unq = (s) => {
    try {
      return JSON.parse(`"${s}"`);
    } catch {
      return s.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    }
  };
  const t = raw.match(/"thought"\s*:\s*"((?:[^"\\]|\\.)*)/);
  if (t) out.thought = unq(t[1]);
  const f = raw.match(/"final"\s*:\s*"((?:[^"\\]|\\.)*)/);
  if (f) out.final = unq(f[1]);
  const tool = raw.match(/"tool"\s*:\s*"([^"]+)/);
  if (tool) out.tool = tool[1];
  const n = raw.match(/"name"\s*:\s*"([^"]+)/);
  if (n) out.name = n[1];
  const c = raw.match(/"(?:code|content)"\s*:\s*"((?:[^"\\]|\\.)*)/);
  if (c) out.code = unq(c[1]);
  return out;
}

export function useStudio() {
  const [settings, setSettingsState] = useState(loadSettings);
  const [projects, setProjects] = useState(loadProjects);
  const [currentId, setCurrentId] = useState(() => {
    const id = loadCurrentId();
    return id;
  });
  const project = useMemo(() => projects.find((p) => p.id === currentId) || projects[0], [projects, currentId]);
  const groups = project.groups;
  const flat = useMemo(() => flatten(groups), [groups]);

  const [selectedId, setSelectedId] = useState(project.select === undefined ? "player" : project.select);
  const mountedAtBoot = project.mountedFile ? project.files?.find((f) => f.name === project.mountedFile) : null;
  const [activeJsx, setActiveJsx] = useState(() => (mountedAtBoot ? mountedAtBoot.content : null));
  const [activeJsxName, setActiveJsxName] = useState(() => (mountedAtBoot ? mountedAtBoot.name : null));
  const [codeError, setCodeError] = useState(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [gizmo, setGizmo] = useState("move");
  const [cameraMode, setCameraMode] = useState("Game View");
  const [fps, setFps] = useState(0);
  const [keys, setKeys] = useState({});
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(() => COINS.map((c) => ({ ...c, taken: false })));
  const [timeOfDay, setTimeOfDay] = useState(settings.timeOfDay);
  const [timelinePlaying, setTimelinePlaying] = useState(false);
  const [logs, setLogs] = useState([]);
  const [undoCount, setUndoCount] = useState({ u: 0, r: 0 });

  // Sync activeJsx when project changes or files update
  useEffect(() => {
    const mounted = project.mountedFile ? project.files?.find((f) => f.name === project.mountedFile) : null;
    const code = mounted ? mounted.content : null;
    const name = mounted ? mounted.name : null;
    if (code !== jsxRef.current.code) {
      setActiveJsx(code);
      setActiveJsxName(name);
    }
  }, [project.id, project.mountedFile]);

  // ---------- refs mirrored for async agent tools ----------
  const undoRef = useRef([]);
  const redoRef = useRef([]);
  const lastUndoAt = useRef(0);
  const velY = useRef(0);
  const projectRef = useRef(project);
  const selectedRef = useRef(selectedId);
  const playRef = useRef(isPlaying);
  const jsxRef = useRef({ code: null, name: null });
  const settingsRef = useRef(settings);
  const logsRef = useRef(logs);
  const scoreRef = useRef(score);
  const coinsRef = useRef(coins);
  const todRef = useRef(timeOfDay);
  projectRef.current = project;
  selectedRef.current = selectedId;
  playRef.current = isPlaying;
  settingsRef.current = settings;
  logsRef.current = logs;
  scoreRef.current = score;
  coinsRef.current = coins;
  todRef.current = timeOfDay;
  jsxRef.current = { code: activeJsx, name: activeJsxName };

  const log = useCallback((level, text) => {
    setLogs((prev) => [...prev.slice(-199), { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, level, text: String(text), t: Date.now() }]);
  }, []);

  useEffect(() => {
    log("Success", "Pocket Studio ready");
  }, [log]);

  // ---------- persistence ----------
  useEffect(() => {
    saveCurrentId(project.id);
  }, [project.id]);
  useEffect(() => {
    if (!settings.autosave) return;
    const t = setTimeout(() => saveProjects(projects), 500);
    return () => clearTimeout(t);
  }, [projects, settings.autosave]);
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const setSettings = useCallback((patch) => setSettingsState((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) })), []);

  // ---------- project / scene mutation ----------
  const patchProject = useCallback((fn) => {
    setProjects((list) => list.map((p) => (p.id === projectRef.current.id ? { ...fn(p), updatedAt: Date.now() } : p)));
  }, []);

  const pushUndo = useCallback((snapshot, force = false) => {
    const now = Date.now();
    if (!force && now - lastUndoAt.current < 700) return;
    lastUndoAt.current = now;
    undoRef.current.push(clone(snapshot));
    if (undoRef.current.length > MAX_UNDO) undoRef.current.shift();
    redoRef.current = [];
    setUndoCount({ u: undoRef.current.length, r: 0 });
  }, []);

  /** Edit the scene. `silent` skips the undo snapshot (play loop, streams). */
  const editGroups = useCallback(
    (fn, { silent = false, force = false } = {}) => {
      if (!silent) pushUndo(projectRef.current.groups, force);
      patchProject((p) => ({ ...p, groups: sanitizeGroups(fn(p.groups)) }));
    },
    [patchProject, pushUndo]
  );

  const undo = useCallback(() => {
    const prev = undoRef.current.pop();
    if (!prev) return false;
    redoRef.current.push(clone(projectRef.current.groups));
    patchProject((p) => ({ ...p, groups: prev }));
    setUndoCount({ u: undoRef.current.length, r: redoRef.current.length });
    return true;
  }, [patchProject]);
  const redo = useCallback(() => {
    const next = redoRef.current.pop();
    if (!next) return false;
    undoRef.current.push(clone(projectRef.current.groups));
    patchProject((p) => ({ ...p, groups: next }));
    setUndoCount({ u: undoRef.current.length, r: redoRef.current.length });
    return true;
  }, [patchProject]);

  const updateNode = useCallback(
    (id, patch, opts) => {
      editGroups((g) => mapNodes(g, (c) => (c.id === id ? { ...c, ...(typeof patch === "function" ? patch(c) : patch) } : c)), opts);
    },
    [editGroups]
  );

  const selected = useMemo(() => flat.find((c) => c.id === selectedId) || null, [flat, selectedId]);

  const toggleVisible = useCallback((id) => updateNode(id, (c) => ({ visible: c.visible === false }), { force: true }), [updateNode]);

  const toggleGroup = useCallback(
    (gid) => patchProject((p) => ({ ...p, groups: p.groups.map((g) => (g.id === gid ? { ...g, expanded: g.expanded === false } : g)) })),
    [patchProject]
  );

  const spawn = useCallback(
    (asset, overrides = {}) => {
      const id = `spawn-${Date.now().toString(36)}${Math.floor(Math.random() * 1e3)}`;
      const base = asset.name || "Prop";
      const node = {
        id,
        name: `${base}_${Math.floor(Math.random() * 90 + 10)}`,
        type: "mesh",
        color: asset.color || asset.tint || "#6366f1",
        visible: true,
        pos: { x: Number(((Math.random() - 0.5) * 24).toFixed(1)), y: 0, z: Number((Math.random() * 30 + 6).toFixed(1)) },
        rot: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        tag: asset.category || "Primitive",
        layer: "Default",
        mesh: asset.mesh || asset.shape || "box",
        mat0: `M_${base}_Base`,
        mat1: `M_${base}_Detail`,
        anim: "None",
        physics: false,
        mass: 100,
        collision: "BlockAll",
        ...Object.fromEntries(Object.entries(overrides).filter(([, v]) => v !== undefined)),
      };
      editGroups((g) => {
        const target = g.some((x) => x.id === "props-group") ? "props-group" : g[0]?.id;
        return g.map((x) => (x.id === target ? { ...x, expanded: true, children: [...(x.children || []), node] } : x));
      }, { force: true });
      setSelectedId(id);
      log("Info", `Spawned ${node.name}`);
      haptic(settingsRef.current.haptics);
      return node;
    },
    [editGroups, log]
  );

  const duplicate = useCallback(
    (id) => {
      const src = flatten(projectRef.current.groups).find((c) => c.id === id);
      if (!src) return null;
      const nid = `spawn-${Date.now().toString(36)}${Math.floor(Math.random() * 1e3)}`;
      const copy = { ...clone(src), id: nid, name: `${src.name || src.id}_copy`, pos: { ...src.pos, x: (src.pos?.x || 0) + 2, z: (src.pos?.z || 0) + 2 } };
      editGroups((g) =>
        g.map((grp) => ((grp.children || []).some((c) => c.id === id) ? { ...grp, children: [...grp.children, copy] } : grp)), { force: true }
      );
      setSelectedId(nid);
      log("Info", `Duplicated ${src.name}`);
      return copy;
    },
    [editGroups, log]
  );

  const removeNode = useCallback(
    (id) => {
      const n = flatten(projectRef.current.groups).find((c) => c.id === id);
      editGroups((g) => g.map((grp) => ({ ...grp, children: (grp.children || []).filter((c) => c.id !== id) })), { force: true });
      setSelectedId((cur) => (cur === id ? null : cur));
      if (n) log("Info", `Removed ${n.name || id}`);
    },
    [editGroups, log]
  );

  const onViewportTransform = useCallback(
    (o) => {
      const W = 0.12;
      const R = 180 / Math.PI;
      const id = selectedRef.current;
      if (!id || playRef.current) return;
      updateNode(id, {
        pos: {
          x: Number((o.position.x / W).toFixed(1)),
          y: Number(Math.max(-50, Math.min(500, o.position.y / W)).toFixed(1)),
          z: Number((o.position.z / W).toFixed(1)),
        },
        rot: { x: Number((o.rotation.x * R).toFixed(1)), y: Number((o.rotation.y * R).toFixed(1)), z: Number((o.rotation.z * R).toFixed(1)) },
        scale: {
          x: Number(Math.max(0.05, o.scale.x).toFixed(2)),
          y: Number(Math.max(0.05, o.scale.y).toFixed(2)),
          z: Number(Math.max(0.05, o.scale.z).toFixed(2)),
        },
      });
    },
    [updateNode]
  );

  // ---------- projects ----------
  const resetRuntime = useCallback(() => {
    setIsPlaying(false);
    setKeys({});
    setScore(0);
    setCoins(COINS.map((c) => ({ ...c, taken: false })));
    undoRef.current = [];
    redoRef.current = [];
    setUndoCount({ u: 0, r: 0 });
    velY.current = 0;
    setCameraMode("Viewport");
  }, []);

  const openProject = useCallback(
    (id) => {
      const p = projects.find((x) => x.id === id);
      if (!p) return;
      resetRuntime();
      setCurrentId(id);
      setSelectedId(p.select === undefined ? null : p.select);
      const mounted = (p.mountedFile ? p.files?.find((f) => f.name === p.mountedFile) : null) || p.files?.find((f) => f.name === "GameComponent.jsx") || p.files?.[0];
      setActiveJsx(mounted ? mounted.content : STARTER_CODE);
      setActiveJsxName(mounted ? mounted.name : "GameComponent.jsx");
      setCodeError(null);
      log("Info", `Opened ${p.name}`);
    },
    [projects, resetRuntime, log]
  );

  const createProject = useCallback(
    (name, template = "code") => {
      const p = makeProject(name, template, projectRef.current.groups);
      setProjects((list) => [...list, p]);
      resetRuntime();
      setCurrentId(p.id);
      setSelectedId(p.select);
      const mounted = p.mountedFile ? p.files?.[0] : null;
      setActiveJsx(mounted ? mounted.content : STARTER_CODE);
      setActiveJsxName(mounted ? mounted.name : "GameComponent.jsx");
      if (template === "fpp") setCameraMode("Game View");
      log("Success", `Created ${p.name}`);
      return p;
    },
    [resetRuntime, log]
  );

  const renameProject = useCallback(
    (id, name) => setProjects((list) => list.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p))),
    []
  );

  const deleteProject = useCallback(
    (id) => {
      const rest = projects.filter((p) => p.id !== id);
      if (!rest.length) {
        const fresh = makeProject("3D Ball Runner", "code");
        setProjects([fresh]);
        setCurrentId(fresh.id);
        setSelectedId(fresh.select);
        setActiveJsx(STARTER_CODE);
        setActiveJsxName("GameComponent.jsx");
        return;
      }
      setProjects(rest);
      if (id === projectRef.current.id) {
        const next = rest[0];
        resetRuntime();
        setCurrentId(next.id);
        setSelectedId(next.select === undefined ? null : next.select);
        const mounted = (next.mountedFile ? next.files?.find((f) => f.name === next.mountedFile) : null) || next.files?.[0];
        setActiveJsx(mounted ? mounted.content : STARTER_CODE);
        setActiveJsxName(mounted ? mounted.name : "GameComponent.jsx");
      }
      log("Info", "Project deleted");
    },
    [projects, resetRuntime, log]
  );

  const exportProject = useCallback(() => {
    const p = projectRef.current;
    const ok = download(`${p.name.replace(/[^a-z0-9-_]+/gi, "_")}.spider.json`, JSON.stringify(p, null, 2), "application/json");
    log(ok ? "Success" : "Warning", ok ? `Exported ${p.name}` : "Export failed");
    return ok;
  }, [log]);

  const importProject = useCallback(
    async (file) => {
      try {
        const data = JSON.parse(await file.text());
        const groupsIn = data.groups || (Array.isArray(data) ? data : null);
        if (!groupsIn) throw new Error("No scene groups found");
        const p = {
          ...makeProject(data.name || file.name.replace(/\.[^.]+$/, ""), "custom", groupsIn),
          groups: sanitizeGroups(groupsIn),
          files: Array.isArray(data.files) && data.files.length ? data.files : [{ name: "GameComponent.jsx", content: STARTER_CODE }],
        };
        setProjects((list) => [...list, p]);
        resetRuntime();
        setCurrentId(p.id);
        setSelectedId(p.groups[0]?.children?.[0]?.id ?? null);
        setActiveJsx(null);
        setActiveJsxName(null);
        log("Success", `Imported ${p.name}`);
        return p;
      } catch (e) {
        log("Warning", `Import failed: ${e.message}`);
        throw e;
      }
    },
    [resetRuntime, log]
  );

  /** Import a 3D model, texture or scene/project file from the device. */
  const importFile = useCallback(
    async (file) => {
      if (!file) return { ok: false, message: "No file" };
      const name = file.name;
      const base = name.replace(/\.[^.]+$/, "");
      const toData = (f) =>
        new Promise((resolve, reject) => {
          if (f.size > 3 * 1024 * 1024) return reject(new Error("big"));
          const r = new FileReader();
          r.onload = () => resolve(r.result);
          r.onerror = () => reject(r.error);
          r.readAsDataURL(f);
        });
      try {
        if (/\.json$/i.test(name)) {
          await importProject(file);
          return { ok: true, message: "Project imported" };
        }
        if (/\.(glb|gltf|fbx|obj)$/i.test(name)) {
          const ext = name.split(".").pop().toLowerCase();
          const modelFormat = ext === "fbx" ? "fbx" : ext === "obj" ? "obj" : ext === "gltf" ? "gltf" : "glb";
          let url;
          let embedded = true;
          try {
            url = await toData(file);
          } catch {
            url = URL.createObjectURL(file);
            embedded = false;
          }
          spawn({ name: base, mesh: name, category: "Imported" }, { modelUrl: url, modelFormat });
          return { ok: true, message: embedded ? `Added ${base}` : `Added ${base} (over 3 MB: stays until you reload)` };
        }
        if (/\.(png|jpe?g|webp)$/i.test(name)) {
          let url;
          let embedded = true;
          try {
            url = await toData(file);
          } catch {
            url = URL.createObjectURL(file);
            embedded = false;
          }
          spawn({ name: base, mesh: name, category: "Imported" }, { textureUrl: url });
          return { ok: true, message: embedded ? `Added ${base}` : `Added ${base} (over 3 MB: stays until you reload)` };
        }
        return { ok: false, message: "Use .glb, .gltf, .fbx, .obj, .png, .jpg or a .json project" };
      } catch (e) {
        return { ok: false, message: `Import failed: ${e.message}` };
      }
    },
    [importProject, spawn]
  );

  const exportStandalone = useCallback(() => {
    const f = projectRef.current.files.find((x) => x.name === (projectRef.current.mountedFile || "GameComponent.jsx")) || projectRef.current.files[0];
    const ok = download(f.name, f.content, "text/javascript");
    log(ok ? "Success" : "Warning", ok ? `Built ${f.name}` : "Build failed");
    return ok;
  }, [log]);

  // ---------- code files ----------
  const files = project.files;

  const saveFile = useCallback(
    (name, content) => {
      try { ragStore.indexFile(name, content); } catch {}
      // When saving a file, if it is the mounted file or the primary GameComponent, update activeJsx live!
      if (jsxRef.current.name === name || (!jsxRef.current.name && name === "GameComponent.jsx")) {
        setActiveJsx(content);
        setActiveJsxName(name);
      }
      return patchProject((p) => ({
        ...p,
        mountedFile: p.mountedFile || name,
        files: p.files.some((f) => f.name === name)
          ? p.files.map((f) => (f.name === name ? { ...f, content } : f))
          : [...p.files, { name, content }]
      }));
    },
    [patchProject]
  );
  const createFile = useCallback(
    (name, content = "") => {
      const clean = name.trim().replace(/[^\w.\-]/g, "_") || "Untitled.jsx";
      const final = /\.(jsx?|tsx?)$/.test(clean) ? clean : `${clean}.jsx`;
      saveFile(final, content || `import React from "react";\n\nexport default function ${final.replace(/\.\w+$/, "").replace(/[^a-zA-Z0-9]/g, "") || "Component"}() {\n  return (\n    <group>\n    </group>\n  );\n}\n`);
      return final;
    },
    [saveFile]
  );
  const deleteFile = useCallback(
    (name) => {
      patchProject((p) => ({ ...p, files: p.files.filter((f) => f.name !== name), mountedFile: p.mountedFile === name ? null : p.mountedFile }));
      if (jsxRef.current.name === name) {
        setActiveJsx(null);
        setActiveJsxName(null);
      }
    },
    [patchProject]
  );
  const renameFile = useCallback(
    (from, to) => {
      const clean = to.trim().replace(/[^\w.\-]/g, "_");
      if (!clean) return;
      patchProject((p) => ({
        ...p,
        files: p.files.map((f) => (f.name === from ? { ...f, name: clean } : f)),
        mountedFile: p.mountedFile === from ? clean : p.mountedFile,
      }));
    },
    [patchProject]
  );

  const mountCode = useCallback(
    (name, code) => {
      let err = null;
      let comp = null;
      try {
        comp = compileJsxComponent(code, {}, (e) => (err = e), projectRef.current.files.map((f) => (f.name === name ? { ...f, content: code } : f)));
      } catch (e) {
        err = e;
      }
      if (!comp || err) {
        const msg = String(err?.message || err || "Component returned null or has no default export");
        setCodeError(msg);
        window.__lastDynamicJsxError = msg;
        log("Warning", `Compile error in ${name}: ${msg.slice(0, 160)}`);
        return { ok: false, error: msg };
      }
      window.__lastDynamicJsxError = null;
      setCodeError(null);
      saveFile(name, code);
      patchProject((p) => ({ ...p, mountedFile: name }));
      setActiveJsx(code);
      setActiveJsxName(name);
      log("Success", `Mounted ${name}`);
      return { ok: true };
    },
    [log, patchProject, saveFile]
  );

  const unmountCode = useCallback(() => {
    setActiveJsx(null);
    setActiveJsxName(null);
    patchProject((p) => ({ ...p, mountedFile: null }));
    log("Info", "Code unmounted from viewport");
  }, [log, patchProject]);

  // ---------- play ----------
  const togglePlay = useCallback(() => {
    if (!playRef.current) {
      setIsPlaying(true);
      if (jsxRef.current.code) {
        setSelectedId(null);
        setCameraMode("Game View");
        log("Success", `Playing ${jsxRef.current.name}`);
      } else {
        setSelectedId("player");
        setCameraMode("Game View");
        log("Info", "Play started. Joystick moves, Jump leaps. Collect the coins.");
      }
    } else {
      setIsPlaying(false);
      setKeys({});
      setCameraMode("Viewport");
      log("Info", "Play stopped");
    }
    haptic(settingsRef.current.haptics, 12);
  }, [log]);

  const resetScore = useCallback(() => {
    setScore(0);
    setCoins(COINS.map((c) => ({ ...c, taken: false })));
    log("Info", "Score reset");
  }, [log]);

  const jump = useCallback(() => {
    if (velY.current === 0) velY.current = PLAYER.jumpImpulse;
    haptic(settingsRef.current.haptics);
  }, []);

  const keysRefLive = useRef({});
  keysRefLive.current = keys;

  // Camera angle in Game View: camera is at (-7, 5, -9) looking at hero (0, 0, 0)
  // Camera forward ray in XZ plane: (7, 9) => sin = 7/sqrt(130) ≈ 0.61394, cos = 9/sqrt(130) ≈ 0.78935
  const CAM_SIN = 0.61394;
  const CAM_COS = 0.78935;

  // Ultra-responsive hero loop (30ms ~33 FPS) with smooth camera-relative steering & body turning
  useEffect(() => {
    const hasHero = flatten(projectRef.current.groups).some((c) => c.id === PLAYER.id);
    if (!isPlaying || jsxRef.current.code || !hasHero) return undefined;
    const tick = setInterval(() => {
      patchProject((p) => {
        const blockers = flatten(p.groups)
          .filter((c) => c.visible !== false && c.collision === "BlockAll" && c.id !== PLAYER.id)
          .map((c) => ({ x: c.pos?.x || 0, z: c.pos?.z || 0, r: Math.max(c.scale?.x || 1, c.scale?.z || 1) * 0.75 + 0.35 }));
        let changed = false;
        const groupsNext = mapNodes(p.groups, (node) => {
          if (node.id === PLAYER.id) {
            const step = PLAYER.moveStep * 0.7;
            const k = keysRefLive.current;
            // Raw 2D input from virtual joystick or keyboard
            let ix = Number(k.jx || 0);
            let iz = Number(k.jz || 0);
            if (k.d || k.arrowright || k.KeyD) ix += 1;
            if (k.a || k.arrowleft || k.KeyA) ix -= 1;
            if (k.w || k.arrowup || k.KeyW) iz += 1;
            if (k.s || k.arrowdown || k.KeyS) iz -= 1;

            const inputMag = Math.hypot(ix, iz);
            if (inputMag > 1) {
              ix /= inputMag;
              iz /= inputMag;
            }

            // Camera-relative steering:
            // Push UP on stick / W => move AWAY from camera
            // Push DOWN on stick / S => move TOWARDS camera
            // Push RIGHT on stick / D => move to screen RIGHT
            // Push LEFT on stick / A => move to screen LEFT
            const speed = inputMag > 0.05 ? step * Math.min(1, inputMag) : 0;
            let dx = 0;
            let dz = 0;
            if (speed > 0) {
              dx = (ix * CAM_COS + iz * CAM_SIN) * speed;
              dz = (-ix * CAM_SIN + iz * CAM_COS) * speed;
            }

            // Athletic parabolic jump with gravity
            const g = velY.current || 0;
            let ny = Number((node.pos.y + g * 0.038).toFixed(2));
            let nv = g - 0.75;
            if (ny <= PLAYER.groundY) {
              ny = PLAYER.groundY;
              nv = 0;
            }
            velY.current = nv;

            if (dx === 0 && dz === 0 && ny === node.pos.y) return node;

            let nx = Number(Math.max(PLAYER.bounds.minX, Math.min(PLAYER.bounds.maxX, node.pos.x + dx)).toFixed(2));
            let nz = Number(Math.max(PLAYER.bounds.minZ, Math.min(PLAYER.bounds.maxZ, node.pos.z + dz)).toFixed(2));

            // Smooth collision slide along tangent of obstacles
            for (const b of blockers) {
              const ox = nx - b.x;
              const oz = nz - b.z;
              const d = Math.hypot(ox, oz);
              if (d < b.r && d > 1e-4) {
                nx = Number((b.x + (ox / d) * b.r).toFixed(2));
                nz = Number((b.z + (oz / d) * b.r).toFixed(2));
              } else if (d <= 1e-4) nx = Number((b.x + b.r).toFixed(2));
            }

            // Smooth body rotation to face running direction
            let nextRotY = node.rot?.y || 0;
            if (speed > 0 && (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001)) {
              const targetRotDeg = Math.atan2(dx, dz) * (180 / Math.PI);
              let currentRot = node.rot?.y || 0;
              let diff = ((targetRotDeg - currentRot + 540) % 360) - 180;
              nextRotY = Number((currentRot + diff * 0.35).toFixed(1));
            }

            changed = true;
            return {
              ...node,
              pos: { ...node.pos, x: nx, z: nz, y: ny },
              rot: { ...(node.rot || { x: 0, z: 0 }), y: nextRotY }
            };
          }
          if (node.physics && node.pos.y > 0 && node.collision !== "NoCollision" && !CORE_IDS.has(node.id)) {
            const ny = Math.max(PLAYER.groundY, Number((node.pos.y - physicsFallSpeed(node.mass)).toFixed(2)));
            if (ny === node.pos.y) return node;
            changed = true;
            return { ...node, pos: { ...node.pos, y: ny } };
          }
          return node;
        });
        return changed ? { ...p, groups: groupsNext } : p;
      });
    }, 30);
    return () => clearInterval(tick);
  }, [isPlaying, activeJsx, patchProject, project.id]);

  // keyboard (desktop, tablets with keyboards): WASD / arrows move, Space jumps
  useEffect(() => {
    const map = { w: "w", arrowup: "w", s: "s", arrowdown: "s", a: "a", arrowleft: "a", d: "d", arrowright: "d" };
    const typing = (e) => {
      const t = e.target;
      return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    };
    const down = (e) => {
      if (!playRef.current || jsxRef.current.code || typing(e)) return;
      const k = e.key.toLowerCase();
      if (k === " ") {
        e.preventDefault();
        if (!e.repeat) jump();
      } else if (map[k]) {
        e.preventDefault();
        setKeys((p) => (p[map[k]] ? p : { ...p, [map[k]]: true }));
      }
    };
    const up = (e) => {
      const k = e.key.toLowerCase();
      if (map[k]) setKeys((p) => (p[map[k]] ? { ...p, [map[k]]: false } : p));
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [jump]);

  // coin pickup
  useEffect(() => {
    if (!isPlaying || activeJsx) return;
    const hero = flat.find((c) => c.id === PLAYER.id);
    if (!hero) return;
    const hits = coins.filter((c) => !c.taken && Math.hypot(hero.pos.x - c.x, hero.pos.z - c.z) < COIN_RULES.pickupRadius && hero.pos.y < COIN_RULES.maxPickupHeight);
    if (!hits.length) return;
    setCoins((cs) => cs.map((c) => (hits.some((h) => h.id === c.id) ? { ...c, taken: true } : c)));
    setScore((s) => s + hits.length * COIN_RULES.pointsEach);
    haptic(settingsRef.current.haptics, 18);
    log("Success", `Collected ${hits.length} coin${hits.length > 1 ? "s" : ""}`);
  }, [flat, isPlaying, activeJsx, coins, log]);

  // day cycle
  useEffect(() => {
    if (!timelinePlaying) return undefined;
    const t = setInterval(() => setTimeOfDay((p) => (p >= 22 ? 4 : Number((p + 0.1).toFixed(2)))), 100);
    return () => clearInterval(t);
  }, [timelinePlaying]);

  // ---------- AI ----------
  const [aiCfg, setAiCfg] = useState(loadConfig);
  const [keysRev, setKeysRev] = useState(0);
  const [modelsErrors, setModelsErrors] = useState({});
  const [loadingModels, setLoadingModels] = useState(false);
  const aiCfgRef = useRef(aiCfg);
  aiCfgRef.current = aiCfg;
  const [initialSessions] = useState(() => applyInterrupted(loadSessions()));
  const [sessions, setSessions] = useState(initialSessions);
  const [sessionId, setSessionId] = useState(initialSessions[0].id);
  const inflight = useRef(null);
  const unloading = useRef(false);
  useEffect(() => {
    // when the page is going away, a failing fetch must not wipe the record of the interrupted run
    const down = () => (unloading.current = true);
    const up = () => (unloading.current = false);
    window.addEventListener("pagehide", down);
    window.addEventListener("pageshow", up);
    return () => {
      window.removeEventListener("pagehide", down);
      window.removeEventListener("pageshow", up);
    };
  }, []);
  const persistInflight = useCallback(() => {
    if (inflight.current) saveInflight({ ...inflight.current, queued: [...queueRef.current] });
  }, []);
  const [busy, setBusy] = useState(false);
  const [stream, setStream] = useState(null); // { thought, text, steps[] }
  const [permission, setPermission] = useState(null); // { tool, detail, resolve }
  const [question, setQuestion] = useState(null); // { question, options, resolve }
  const abortRef = useRef(false);
  const ctrlRef = useRef(null);
  const queueRef = useRef([]);
  const [queued, setQueued] = useState([]);
  const agentUndo = useRef(null);

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  const session = sessions.find((s) => s.id === sessionId) || sessions[0];

  const pushMessage = useCallback((msg) => {
    setSessions((list) =>
      list.map((s) => {
        if (s.id !== sessionRefId.current) return s;
        const messages = [...s.messages, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, ...msg }];
        const title = s.title === "New chat" && msg.role === "user" ? msg.text.slice(0, 40) : s.title;
        return { ...s, title, messages, updatedAt: Date.now() };
      })
    );
  }, []);
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;
  const sessionRefId = useRef(sessionId);
  sessionRefId.current = sessionId;

  const writeSessions = useCallback((updater) => {
    const next = updater(sessionsRef.current);
    sessionsRef.current = next; // visible to send() right away, before React re-renders
    setSessions(next);
  }, []);

  const deleteMessage = useCallback(
    (id) =>
      writeSessions((list) => list.map((x) => (x.id === sessionRefId.current ? { ...x, messages: x.messages.filter((m) => m.id !== id) } : x))),
    [writeSessions]
  );

  /** Replace a sent message: drop it and everything after it, then send the edited text. */
  const editAndSend = useCallback(
    (id, text) => {
      writeSessions((list) =>
        list.map((x) => {
          if (x.id !== sessionRefId.current) return x;
          const i = x.messages.findIndex((m) => m.id === id);
          return i < 0 ? x : { ...x, messages: x.messages.slice(0, i) };
        })
      );
      sendRef.current?.(text);
    },
    [writeSessions]
  );

  const startSession = useCallback(() => {
    const s = newSession();
    setSessions((l) => [s, ...l]);
    setSessionId(s.id);
  }, []);
  const deleteSession = useCallback(
    (id) => {
      setSessions((l) => {
        const rest = l.filter((s) => s.id !== id);
        if (!rest.length) {
          const s = newSession();
          setSessionId(s.id);
          return [s];
        }
        if (id === sessionRefId.current) setSessionId(rest[0].id);
        return rest;
      });
    },
    []
  );

  const updateCfg = useCallback((patch) => {
    // read/write the ref first so back-to-back updates (set URL, then load models) see each other
    const c = aiCfgRef.current;
    const next = { ...c, ...(typeof patch === "function" ? patch(c) : patch) };
    aiCfgRef.current = next;
    saveConfig(next);
    setAiCfg(next);
  }, []);

  const providerId = aiCfg.provider;
  const provider = providerById(providerId);
  const baseUrl = baseUrlFor(provider, aiCfg);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const providerKey = useMemo(() => loadKey(providerId), [providerId, keysRev]);
  const hasKey = Boolean(providerKey || (provider.custom && baseUrl));
  const isConfigured = useCallback(
    (id) => {
      const p = providerById(id);
      return Boolean(loadKey(id) || (p.custom && aiCfgRef.current.baseUrls.custom));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keysRev, aiCfg.baseUrls]
  );
  const models = aiCfg.models[providerId]?.length ? aiCfg.models[providerId] : provider.models;
  const model = aiCfg.model[providerId] || models[0] || "";
  const modelsError = modelsErrors[providerId] || "";

  const setProvider = useCallback((id) => updateCfg({ provider: id }), [updateCfg]);
  const setModel = useCallback((m) => updateCfg((c) => ({ model: { ...c.model, [c.provider]: m } })), [updateCfg]);
  const setBaseUrl = useCallback((url) => updateCfg((c) => ({ baseUrls: { ...c.baseUrls, custom: url.trim() } })), [updateCfg]);

  const refreshModels = useCallback(
    async (id = aiCfgRef.current.provider) => {
      const p = providerById(id);
      const cfg = aiCfgRef.current;
      setLoadingModels(true);
      setModelsErrors((e) => ({ ...e, [id]: "" }));
      try {
        let ids = await fetchModels(p, loadKey(id), cfg);
        if (id === "meta") {
          const chatty = ids.filter((m) => /spark|wonder|contribu/i.test(m));
          if (chatty.length) ids = chatty;
        }
        updateCfg((c) => {
          const cur = c.model[id];
          const chosen = cur && ids.includes(cur) ? cur : (id === "meta" && ids.find((m) => m.includes("1.3"))) || ids[0];
          return { models: { ...c.models, [id]: ids }, model: { ...c.model, [id]: chosen } };
        });
        log("Success", `${p.name}: ${ids.length} models`);
        return true;
      } catch (e) {
        setModelsErrors((er) => ({ ...er, [id]: e.message }));
        log("Warning", e.message);
        return false;
      } finally {
        setLoadingModels(false);
      }
    },
    [log, updateCfg]
  );

  const setProviderKey = useCallback(
    async (id, key) => {
      saveKey(id, key);
      setKeysRev((n) => n + 1);
      setModelsErrors((e) => ({ ...e, [id]: "" }));
      if (!key && !providerById(id).custom) return true;
      return refreshModels(id);
    },
    [refreshModels]
  );

  const snapshotText = useCallback(() => {
    const p = projectRef.current;
    const actors = flatten(p.groups).map((c) => `${c.id} "${c.name}" @(${c.pos?.x},${c.pos?.y},${c.pos?.z})${c.visible === false ? " [hidden]" : ""}`);
    const sel = flatten(p.groups).find((c) => c.id === selectedRef.current);
    const { code, name } = jsxRef.current;
    const warnings = logsRef.current.filter((l) => l.level === "Warning").slice(-3).map((l) => l.text);
    return [
      `Active Project: ${p.name}`,
      code
        ? `Live Editor / Active Component: "${name}" (${code.split("\n").length} lines)\n--- BEGIN ${name} ---\n${code}\n--- END ${name} ---`
        : `Live Editor: No active game code open. Synthesize a clean, self-contained, high-fidelity 3D game using render_jsx.`,
      `Project files: ${p.files.map((f) => f.name).join(", ")}`,
      `Actors (${actors.length}):`,
      ...actors.slice(0, 40),
      actors.length > 40 ? `...and ${actors.length - 40} more actors` : "",
      `Selected actor: ${sel ? JSON.stringify(sel) : "none"}`,
      `Score: ${scoreRef.current} | Coins left: ${coinsRef.current.filter((c) => !c.taken).length} | Time: ${Number(todRef.current).toFixed(1)}h | Playing: ${playRef.current}`,
      warnings.length ? `Recent warnings:\n${warnings.join("\n")}` : "No recent warnings.",
    ].join("\n");
  }, []);

  const askPermission = useCallback(
    (tool, detail) => {
      if (settingsRef.current.permission === "auto") return Promise.resolve(true);
      return new Promise((resolve, reject) => {
        setPermission({
          tool,
          detail,
          allow: () => {
            setPermission(null);
            resolve(true);
          },
          deny: () => {
            setPermission(null);
            reject(new Error(`User denied permission to run ${tool}`));
          },
        });
      });
    },
    []
  );

  const findActor = useCallback((idOrName) => {
    const q = String(idOrName ?? "").toLowerCase();
    return flatten(projectRef.current.groups).find((c) => String(c.id).toLowerCase() === q || String(c.name || "").toLowerCase() === q) || null;
  }, []);

  const runTool = useCallback(
    async (tool, args = {}) => {
      switch (tool) {
        case "listScene": {
          const actors = flatten(projectRef.current.groups).map((c) => ({ id: c.id, name: c.name, pos: c.pos, mesh: c.mesh, visible: c.visible }));
          return JSON.stringify({ count: actors.length, actors: actors.slice(0, 60) });
        }
        case "spawnObject": {
          const q = String(args.name || args.mesh || "box").toLowerCase();
          const s = PRIMITIVE_SHAPES.find((a) => a.name.toLowerCase().includes(q) || a.shape.toLowerCase().includes(q));
          const n = spawn(s || { name: args.name || "Box", mesh: q });
          return `spawned ${n.name}`;
        }
        case "moveObject": {
          const n = findActor(args.id);
          if (!n) throw new Error(`actor not found: ${args.id}`);
          const pos = {
            x: args.x !== undefined ? Number(args.x) : n.pos.x,
            y: args.y !== undefined ? Number(args.y) : n.pos.y,
            z: args.z !== undefined ? Number(args.z) : n.pos.z,
          };
          if (![pos.x, pos.y, pos.z].every(Number.isFinite)) throw new Error("x/y/z must be numbers");
          updateNode(n.id, { pos }, { force: true });
          return `moved ${n.name} to (${pos.x}, ${pos.y}, ${pos.z})`;
        }
        case "setVisibility": {
          const n = findActor(args.id);
          if (!n) throw new Error(`actor not found: ${args.id}`);
          const vis = args.visible === true || args.visible === "true";
          updateNode(n.id, { visible: vis }, { force: true });
          return `${n.name} is now ${vis ? "visible" : "hidden"}`;
        }
        case "setTime": {
          const t = Math.max(4, Math.min(22, Number(args.t)));
          if (!Number.isFinite(t)) throw new Error("t must be 4-22");
          setTimeOfDay(t);
          return `solar time set to ${t.toFixed(1)}h`;
        }
        case "play": {
          const want = args.on === true || args.on === "true";
          if (want !== playRef.current) togglePlay();
          return want ? "Play mode started" : "Play mode stopped";
        }
        case "render_jsx": {
          let code = String(args.code || args.content || args.jsx || args.text || args.body || "").trim();
          if (!code && window.__lastStreamedAgentText) {
            try {
              const rec = extractFilesFromRawJson(window.__lastStreamedAgentText);
              if (rec.length) code = rec[0].content;
            } catch {}
          }
          const name = String(args.name || args.filename || "GameComponent.jsx");
          if (!code) throw new Error("render_jsx requires JSX code string");
          const r = mountCode(name, code);
          if (!r.ok) {
            const trunc = /Unexpected token|Unterminated/.test(r.error)
              ? "\n(TOKEN LIMIT ADVISORY: code was cut off mid-expression. Re-mount a compact component under 60 lines.)"
              : "";
            return `COMPILATION ERROR in "${name}": ${r.error}${trunc}\nFix the code and call render_jsx again.`;
          }
          return `Component "${name}" compiled, mounted and verified error-free in the 3D viewport. Ready to play.`;
        }
        case "clear_jsx":
          unmountCode();
          return "Live JSX component removed from viewport";
        case "captureScreenshot": {
          const shot = viewportApi.capture?.(false, 512);
          if (!shot) return "Viewport screenshot unavailable: open the Studio tab so the canvas is mounted.";
          return { text: "3D viewport snapshot captured; the image is attached.", image_url: shot };
        }
        case "check3DView": {
          const { code, name } = jsxRef.current;
          const shot = viewportApi.capture?.(false, 512);
          if (!code) return { text: "No dynamic JSX component is mounted. Call render_jsx to mount your game.", image_url: shot || undefined };
          const err = window.__lastDynamicJsxError;
          if (err) return { text: `3D VIEWPORT ERROR in "${name}":\n${err}\nFix and re-mount.`, image_url: shot || undefined };
          return { text: `3D VIEWPORT HEALTHY: "${name}" (${code.split("\n").length} lines), 0 compile errors. Scene actors: ${flatten(projectRef.current.groups).length}.`, image_url: shot || undefined };
        }
        case "spawn_set": {
          const items = Array.isArray(args.items) ? args.items.slice(0, 40) : [];
          if (!items.length) throw new Error("spawn_set needs items: [{asset, x, z}]");
          const ids = [];
          for (const it of items) {
            const q = String(it.asset || it.mesh || it.name || "box").toLowerCase();
            const found = PRIMITIVE_SHAPES.find((a) => a.name.toLowerCase().includes(q) || a.shape.toLowerCase().includes(q)) || { name: it.asset || "Box", mesh: q };
            const sc = typeof it.scale === "object" ? { x: Number(it.scale.x ?? 1), y: Number(it.scale.y ?? 1), z: Number(it.scale.z ?? 1) } : typeof it.scale === "number" ? { x: it.scale, y: it.scale, z: it.scale } : { x: 1, y: 1, z: 1 };
            const n = spawn(found, {
              name: it.name,
              color: it.color || it.tint || found.color,
              pos: { x: Number(it.x ?? 0), y: Number(it.y ?? 0), z: Number(it.z ?? 10) },
              rot: typeof it.rot === "object" ? { x: Number(it.rot.x ?? 0), y: Number(it.rot.y ?? 0), z: Number(it.rot.z ?? 0) } : { x: 0, y: 0, z: 0 },
              scale: sc,
              physics: Boolean(it.physics),
              mass: Number(it.mass ?? 100),
            });
            ids.push(n.id);
          }
          return { spawned: ids.length, ids };
        }
        case "set_actor": {
          const n = findActor(args.id);
          if (!n) throw new Error(`actor not found: ${args.id}`);
          const p = args.patch || {};
          const allowed = {};
          if (p.pos) allowed.pos = { x: Number(p.pos.x ?? n.pos.x), y: Number(p.pos.y ?? n.pos.y), z: Number(p.pos.z ?? n.pos.z) };
          if (p.scale) allowed.scale = { x: Number(p.scale.x ?? 1), y: Number(p.scale.y ?? 1), z: Number(p.scale.z ?? 1) };
          if (p.rot) allowed.rot = { x: Number(p.rot.x ?? 0), y: Number(p.rot.y ?? 0), z: Number(p.rot.z ?? 0) };
          for (const k of ["visible", "physics", "mass", "collision", "tag", "name", "color"]) if (p[k] !== undefined) allowed[k] = p[k];
          updateNode(n.id, allowed, { force: true });
          return `patched ${n.name}: ${Object.keys(allowed).join(", ")}`;
        }
        case "remove_prop": {
          const id = String(args.id || "");
          if (!id.startsWith("spawn-")) throw new Error("refusing: only spawned props (spawn-*) can be removed");
          const n = findActor(id);
          if (!n) throw new Error(`prop not found: ${id}`);
          removeNode(id);
          return `removed ${n.name}`;
        }
        case "saveScene":
          saveProjects(projects);
          return "scene saved to this device";
        case "listFiles":
          return JSON.stringify(projectRef.current.files.map((f) => ({ name: f.name, lines: f.content.split("\n").length })));
        case "readFile": {
          const f = projectRef.current.files.find((x) => x.name === (args.name || args.path));
          if (!f) throw new Error(`file not found: ${args.name}`);
          return f.content;
        }
        case "createFile": {
          const name = String(args.name || "GameComponent.jsx");
          await askPermission("createFile", name);
          saveFile(name, String(args.content ?? args.code ?? ""));
          log("Success", `Agent wrote ${name}`);
          return `wrote ${name}`;
        }
        case "create_multiple_files": {
          const list = Array.isArray(args.files) ? args.files : [];
          if (!list.length) throw new Error("files array required");
          await askPermission("create_multiple_files", list.map((f) => f.name).join(", "));
          list.forEach((f) => saveFile(String(f.name), String(f.content ?? "")));
          return `wrote ${list.length} files: ${list.map((f) => f.name).join(", ")}`;
        }
        case "editFile": {
          const name = String(args.name || args.path || "");
          const f = projectRef.current.files.find((x) => x.name === name);
          if (!f) throw new Error(`file not found: ${name}`);
          const find = args.find ?? args.old ?? args.search;
          const rep = args.replace ?? args.new ?? args.with ?? "";
          if (find == null || !f.content.includes(find)) throw new Error("search text not found in file");
          await askPermission("editFile", name);
          const next = f.content.replace(find, rep);
          saveFile(name, next);
          if (jsxRef.current.name === name) mountCode(name, next);
          return `edited ${name}`;
        }
        case "deleteFile": {
          const name = String(args.name || "");
          await askPermission("deleteFile", name);
          deleteFile(name);
          return `deleted ${name}`;
        }
        case "runCommand":
          throw new Error("Shell commands are not available in the browser/phone build. Use render_jsx and the project file tools instead.");
        case "ask_question":
        case "askQuestion": {
          const opts = Array.isArray(args.options) ? args.options.map(String) : [];
          return new Promise((resolve) => {
            setQuestion({
              question: String(args.question || "Choose"),
              options: opts,
              answer: (a) => {
                setQuestion(null);
                resolve(`User answered: ${a}`);
              },
            });
          });
        }
        default:
          throw new Error(`unknown tool: ${tool}`);
      }
    },
    [askPermission, deleteFile, findActor, log, mountCode, projects, removeNode, saveFile, spawn, togglePlay, unmountCode, updateNode]
  );

  const send = useCallback(
    async (text) => {
      const goal = String(text || "").trim();
      if (!goal) return;
      if (busy) {
        queueRef.current.push(goal);
        persistInflight();
        setQueued([...queueRef.current]);
        pushMessage({ role: "user", text: goal, queued: true });
        return;
      }
      const cfgNow = aiCfgRef.current;
      const provNow = providerById(cfgNow.provider);
      if (!loadKey(provNow.id) && !(provNow.custom && cfgNow.baseUrls.custom)) {
        pushMessage({ role: "user", text: goal });
        pushMessage({ role: "assistant", ok: false, text: `No ${provNow.name} key yet. Open More, then Settings, then AI, paste your key, then ask again.` });
        return;
      }
      const priorMessages = sessionsRef.current.find((x) => x.id === sessionRefId.current)?.messages || [];
      pushMessage({ role: "user", text: goal });
      setBusy(true);
      inflight.current = { sessionId: sessionRefId.current, goal, startedAt: Date.now(), steps: [] };
      persistInflight();
      let compactedLogged = false;
      abortRef.current = false;
      ctrlRef.current = new AbortController();
      const steps = [];
      setStream({ thought: "Thinking…", text: "", steps: [] });
      agentUndo.current = clone(projectRef.current.groups);
      pushUndo(projectRef.current.groups, true);
      log("Info", `Agent: ${goal.slice(0, 80)}`);
      const touch = true;
      try {
        const callModel = async (task, history) => {
          const cfgNow = aiCfgRef.current;
          const provNow = providerById(cfgNow.provider);
          const modelNow = cfgNow.model[provNow.id] || (cfgNow.models[provNow.id] || provNow.models)[0];
          const win = contextWindow(provNow.id, modelNow, settingsRef.current.contextWindow);
          const mem = buildMemory(priorMessages, memoryBudget(win));
          if (mem.compacted && !compactedLogged) {
            compactedLogged = true;
            log("Info", `Context compacted: kept ${mem.kept} of ${mem.turns} earlier messages (window ${Math.round(win / 1000)}K tokens)`);
          }
          const ragContext = retrieveRagContext(task || goal || "");
          const sys =
            systemPrompt(snapshotText(), { isMobile: touch }) +
            (ragContext ? `${ragContext}\n` : "") +
            (mem.text ? `\n\nCONVERSATION SO FAR (oldest first; the current goal comes below):\n${mem.text}\n` : "") +
            "\n\nCRITICAL MOBILE REQUIREMENT: The user is on a PHONE touchscreen. No keyboard controls (no WASD / arrows / space). All movement, steering and actions must be touch controlled (tap, swipe, drag, large on-screen buttons).\n" +
            TOUCH_CONTROLS_RULES +
            GAME_BUILDER_PRIMER;
          const messages =
            history.length === 0
              ? [
                  { role: "system", content: sys },
                  { role: "user", content: `GOAL: ${task}\nReply with exactly one JSON object.` },
                ]
              : [
                  { role: "system", content: sys },
                  { role: "user", content: `GOAL: ${task}` },
                  ...history.map((h) =>
                    h.role === "assistant"
                      ? { role: "assistant", content: h.text }
                      : h.image_url
                        ? { role: "user", content: [{ type: "text", text: h.text }, { type: "image_url", image_url: { url: h.image_url } }] }
                        : { role: "user", content: h.text }
                  ),
                ];
          let acc = "";
          const cfg = aiCfgRef.current;
          const prov = providerById(cfg.provider);
          const out = await chat({
            provider: prov,
            baseUrl: baseUrlFor(prov, cfg),
            key: loadKey(prov.id),
            model: cfg.model[prov.id] || (cfg.models[prov.id] || prov.models)[0],
            messages,
            signal: ctrlRef.current.signal,
            onToken: (tok) => {
              acc += tok;
              window.__lastStreamedAgentText = acc;
              const p = parseStreaming(acc);
              setStream((s) => ({
                ...(s || { steps: [] }),
                thought: p.final || p.thought || (p.tool ? `Running ${p.tool}…` : "Thinking…"),
                code: p.code && p.code.length > 5 ? { name: p.name || "GameComponent.jsx", lines: p.code.split("\n").length } : null,
              }));
            },
          });
          return { raw: out };
        };

        const final = await runAgent(goal, {
          ctx: { runTool, isAborted: () => abortRef.current },
          callModel,
          maxSteps: GAME_STEPS,
          ...runLimits(contextWindow(aiCfgRef.current.provider, aiCfgRef.current.model[aiCfgRef.current.provider], settingsRef.current.contextWindow)),
          getQueuedMessages: () => {
            if (!queueRef.current.length) return [];
            const m = [...queueRef.current];
            queueRef.current = [];
            setQueued([]);
            return m;
          },
          onEvent: (ev) => {
            if (ev.type === "action") {
              steps.push({ tool: ev.tool, state: "run" });
              if (inflight.current) inflight.current.steps = steps.map((x) => ({ ...x }));
              persistInflight();
              setStream((s) => ({ ...(s || {}), steps: [...steps] }));
              log("Info", `Agent → ${ev.tool}`);
            } else if (ev.type === "observation") {
              const last = steps[steps.length - 1];
              if (last) last.state = /^TOOL ERROR|COMPILATION ERROR/.test(ev.observation) ? "err" : "ok";
              if (inflight.current) inflight.current.steps = steps.map((x) => ({ ...x }));
              persistInflight();
              setStream((s) => ({ ...(s || {}), steps: [...steps] }));
            } else if (ev.type === "error") log("Warning", `Agent retry: ${ev.message}`);
          },
        });
        pushMessage({ role: "assistant", ok: true, text: String(final), steps: steps.map((s) => ({ ...s })), canUndo: true });
      } catch (e) {
        if (!unloading.current) {
          pushMessage({ role: "assistant", ok: false, text: `Agent failed: ${e.message}`, steps: steps.map((s) => ({ ...s })) });
          log("Warning", `Agent failed: ${e.message}`);
        }
      } finally {
        if (!unloading.current) {
          inflight.current = null;
          clearInflight();
        }
        setStream(null);
        setBusy(false);
        setPermission(null);
        setQuestion(null);
        if (queueRef.current.length) {
          const next = queueRef.current.shift();
          setQueued([...queueRef.current]);
          setTimeout(() => sendRef.current?.(next), 150);
        }
      }
    },
    [busy, log, persistInflight, pushMessage, pushUndo, runTool, snapshotText]
  );
  const sendRef = useRef(null);
  sendRef.current = send;

  // While the agent works: keep the screen awake (a sleeping phone suspends the tab and kills the run)
  // and ask before the page is closed or reloaded.
  useEffect(() => {
    if (!busy) return undefined;
    let lock = null;
    const acquire = async () => {
      try {
        lock = (await navigator.wakeLock?.request("screen")) || null;
      } catch {}
    };
    acquire();
    const onVisible = () => document.visibilityState === "visible" && acquire();
    const onUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("beforeunload", onUnload);
      try {
        lock?.release();
      } catch {}
    };
  }, [busy]);

  const stop = useCallback(() => {
    abortRef.current = true;
    try {
      ctrlRef.current?.abort();
    } catch {}
    permission?.deny?.();
  }, [permission]);

  const undoAgent = useCallback(() => {
    if (!agentUndo.current) return false;
    patchProject((p) => ({ ...p, groups: agentUndo.current }));
    agentUndo.current = null;
    log("Info", "Agent changes reverted");
    return true;
  }, [log, patchProject]);

  return {
    // settings
    settings, setSettings,
    // project
    projects, project, groups, flat, selected, selectedId, setSelectedId,
    openProject, createProject, renameProject, deleteProject, exportProject, importProject, exportStandalone,
    // scene
    editGroups, updateNode, toggleVisible, toggleGroup, spawn, importFile, duplicate, removeNode, onViewportTransform,
    undo, redo, undoCount,
    gizmo, setGizmo, cameraMode, setCameraMode, fps, setFps,
    timeOfDay, setTimeOfDay, timelinePlaying, setTimelinePlaying,
    // code
    files, saveFile, createFile, deleteFile, renameFile, mountCode, unmountCode, activeJsx, activeJsxName, codeError, setCodeError,
    // play
    isPlaying, togglePlay, keys, setKeys, jump, score, coins, resetScore,
    // console
    logs, setLogs, log,
    // AI
    providers: PROVIDERS, provider, providerId, setProvider, hasKey, providerKey, isConfigured, setProviderKey,
    models, model, setModel, modelsError, refreshModels, loadingModels, baseUrl, setBaseUrl,
    friendlyModel: (id) => friendlyModel(providerId, id),
    sessions, session, sessionId, setSessionId, startSession, deleteSession, deleteMessage, editAndSend,
    busy, stream, permission, question, queued, send, stop, undoAgent,
    pushMessage,
  };
}
