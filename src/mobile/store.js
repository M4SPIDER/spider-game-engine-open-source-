/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Pocket Studio data layer
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 *
 * Projects, settings and chat sessions live in localStorage behind
 * try/catch (private windows and quota errors must never crash the UI).
 */
import { GAME_WORLD } from "../game/index.js";
import BALL_RUNNER_CODE from "../game/GameComponent.jsx?raw";

export const STARTER_CODE = BALL_RUNNER_CODE;

export const TEMPLATES = [
  { id: "code", name: "Cyber Knight Runner", blurb: "3D endless cyber knight runner game", emoji: "⚡" },
  { id: "normal", name: "Third person", blurb: "Hero, coins, tutorial", emoji: "🧍" },
  { id: "blank", name: "Blank level", blurb: "Empty black viewport", emoji: "⬛" },
  { id: "tpp", name: "TPP shooting", blurb: "Rifle + 3 targets", emoji: "🎯" },
  { id: "fpp", name: "FPP shooting", blurb: "You are the camera", emoji: "👁️" },
  { id: "racing", name: "Racing", blurb: "Hero on the boat", emoji: "🏁" },
];

const K = {
  projects: "spider-m-projects",
  current: "spider-m-current",
  settings: "spider-m-settings",
  sessions: "spider-m-sessions",
  key: "spider-meta-key-raw",
  model: "spider-meta-model",
  models: "spider-meta-models",
};

export function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const clone = (v) => JSON.parse(JSON.stringify(v));

/** Scene groups may arrive half-formed from old saves: normalise. */
export function sanitizeGroups(groups) {
  if (!Array.isArray(groups)) return clone(GAME_WORLD);
  return groups
    .filter((g) => g && typeof g === "object")
    .map((g, i) => ({
      ...g,
      id: g.id || `group-${i}`,
      name: g.name || `Group ${i + 1}`,
      expanded: g.expanded !== false,
      children: Array.isArray(g.children) ? g.children.filter(Boolean) : [],
    }));
}


const DROP_FROM_STARTER = new Set(["terrain", "water", "trees", "rocks", "weapon", "buildings", "vehicles", "npcs", "point-lights", "fog"]);
const prop = (id, name, mesh, color, pos, scale = { x: 1, y: 1, z: 1 }) => ({
  id, name, type: "mesh", color, visible: true, pos, rot: { x: 0, y: 0, z: 0 }, scale,
  tag: "Primitive", layer: "Default", mesh, mat0: `M_${name}_Base`, mat1: `M_${name}_Detail`,
  anim: "None", physics: false, mass: 100, collision: "BlockAll",
});

/** Full open world starter level: Terrain, Water, Trees, Rocks, Castle, Boat, Guards, Hero, Coins */
export function starterWorld() {
  return clone(GAME_WORLD);
}

export function buildTemplate(tpl, fallbackGroups) {
  const full = clone(GAME_WORLD);
  if (tpl === "blank" || tpl === "code") {
    return {
      groups: full.map((g) => ({ ...g, expanded: false, children: [] })),
      select: null,
      code: tpl === "code" ? STARTER_CODE : null,
    };
  }
  if (tpl === "custom") return { groups: clone(fallbackGroups || full), select: "player", code: null };
  if (tpl === "tpp") {
    const targets = [8, 12, 16].map((z, i) => ({
      id: `spawn-target-${Date.now()}-${i}`,
      name: `Target_${10 + i}`,
      type: "mesh",
      color: "#ef4444",
      visible: true,
      pos: { x: -6 + i * 6, y: 0, z },
      rot: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      tag: "Prop",
      layer: "Default",
      mesh: "SM_Crate_01",
      mat0: "M_Target_Red",
      mat1: "M_Target_Base",
      anim: "None",
      physics: false,
      mass: 50,
      collision: "BlockAll",
    }));
    return {
      groups: full.map((g, i) => (i === 0 ? { ...g, expanded: true, children: [...g.children, ...targets] } : g)),
      select: "weapon",
      code: null,
    };
  }
  if (tpl === "fpp") {
    return {
      groups: full.map((g) => ({ ...g, children: g.children.map((c) => (c.id === "player" ? { ...c, visible: false } : c)) })),
      select: "camera",
      code: null,
    };
  }
  if (tpl === "racing") {
    return {
      groups: full.map((g) => ({
        ...g,
        children: g.children.map((c) => (c.id === "player" ? { ...c, pos: { x: 24, y: 0, z: 60 } } : c)),
      })),
      select: "vehicles",
      code: null,
    };
  }
  return { groups: starterWorld(), select: "player", code: null };
}

export function makeProject(name, tpl = "normal", fallbackGroups) {
  const t = buildTemplate(tpl, fallbackGroups);
  const files = [{ name: "GameComponent.jsx", content: t.code || STARTER_CODE }];
  return {
    id: `project-${Date.now().toString(36)}${Math.floor(Math.random() * 1e3)}`,
    name: (name || "").trim() || (tpl === "code" ? "3D Ball Runner" : "My first game"),
    template: tpl,
    groups: t.groups,
    select: t.select,
    files,
    mountedFile: tpl === "code" ? "GameComponent.jsx" : null,
    updatedAt: Date.now(),
  };
}

export function loadProjects() {
  const list = read(K.projects, null);
  if (Array.isArray(list) && list.length) {
    const listSanitized = list.map((p) => {
      // Force open world restoration on mobile so the knight has the full world to explore
      const hasTerrain = (p.groups || []).some((g) => (g.children || []).some((c) => c.id === "terrain"));
      const hasSpawnGround = (p.groups || []).some((g) => (g.children || []).some((c) => c.id === "spawn-ground"));
      const needsFullWorld = !hasTerrain || hasSpawnGround || !p.groups || p.groups.length <= 1 || Boolean(p.mountedFile);

      if (needsFullWorld) {
        return {
          ...p,
          template: "normal",
          mountedFile: null,
          groups: clone(GAME_WORLD),
          select: "player",
          files: Array.isArray(p.files) && p.files.length ? p.files : [{ name: "GameComponent.jsx", content: STARTER_CODE }],
          updatedAt: Date.now(),
        };
      }
      return {
        ...p,
        groups: sanitizeGroups(p.groups),
        files: Array.isArray(p.files) && p.files.length ? p.files : [{ name: "GameComponent.jsx", content: STARTER_CODE }],
      };
    });
    write(K.projects, listSanitized);
    return listSanitized;
  }
  const first = makeProject("My first game", "normal");
  write(K.projects, [first]);
  return [first];
}

export const saveProjects = (list) => write(K.projects, list);
export const loadCurrentId = () => read(K.current, null);
export const saveCurrentId = (id) => write(K.current, id);

export const DEFAULT_SETTINGS = {
  theme: "light",
  rtx: true,
  grid: true,
  viewMode: "Lit",
  projection: "Perspective",
  space: "Global",
  zoom: 1,
  timeOfDay: 14.5,
  permission: "ask",
  haptics: true,
  autosave: true,
  wrapCode: true,
  voiceLang: "auto",
  contextWindow: "auto",
};

export const loadSettings = () => {
  const s = { ...DEFAULT_SETTINGS, ...read(K.settings, {}) };
  if (s.theme !== "dark") s.theme = "light";
  return s;
};
export const saveSettings = (s) => write(K.settings, s);

export const loadSessions = () => {
  const s = read(K.sessions, null);
  return Array.isArray(s) && s.length ? s : [newSession()];
};
export const saveSessions = (s) => write(K.sessions, s.slice(0, 20));
export function newSession() {
  return { id: `chat-${Date.now().toString(36)}`, title: "New chat", messages: [], updatedAt: Date.now() };
}

export const META_KEYS = K;

/* ---- in-flight agent run: survives a reload so the chat can say what happened and offer Retry ---- */
const INFLIGHT = "spider-m-inflight";
export const saveInflight = (rec) => write(INFLIGHT, rec);
export const clearInflight = () => {
  try {
    localStorage.removeItem(INFLIGHT);
  } catch {}
};
/** If a run was cut off by a reload, append an "interrupted" note (with Retry) to its chat. */
export function applyInterrupted(list) {
  const rec = read(INFLIGHT, null);
  if (!rec || !rec.goal) return list;
  clearInflight();
  if (Date.now() - (rec.startedAt || 0) > 24 * 3600 * 1000) return list;
  const target = list.find((s) => s.id === rec.sessionId) || list[0];
  const n = (rec.steps || []).length;
  const queued = rec.queued || [];
  const note = {
    id: `${Date.now()}-int`,
    role: "assistant",
    ok: false,
    interrupted: true,
    retryText: [rec.goal, ...queued].join("\n\n"),
    text:
      `The page reloaded, or the app went to the background, while the agent was working${n ? ` (it had done ${n} step${n > 1 ? "s" : ""})` : ""}, so this run stopped.` +
      ` Everything it already wrote to your scene and files is saved.` +
      (queued.length ? ` ${queued.length} message${queued.length > 1 ? "s" : ""} you sent during the run ${queued.length > 1 ? "were" : "was"} not processed.` : "") +
      " Tap Retry to continue.",
    steps: (rec.steps || []).map((s) => ({ tool: s.tool, state: s.state === "run" ? "err" : s.state })),
  };
  return list.map((s) => (s.id === target.id ? { ...s, messages: [...s.messages, note], updatedAt: Date.now() } : s));
}

export function download(name, text, mime = "text/plain") {
  try {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch {
    return false;
  }
}

export function haptic(on = true, ms = 8) {
  if (!on) return;
  try {
    navigator.vibrate?.(ms);
  } catch {}
}
