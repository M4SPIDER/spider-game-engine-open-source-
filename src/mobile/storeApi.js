/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Spider Store client (mobile)
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 *
 * Everything the publish flow needs on the device: store rules, screenshot
 * processing (metadata stripped, resized, compressed), the provenance manifest,
 * duplicate detection (same game => new version) and a backend adapter.
 *
 * Backend: set VITE_STORE_API to the store server base URL (see docs/STORE-API.md).
 * Without it a local adapter keeps submissions in this browser, so the whole flow
 * works and can be tested before the server exists.
 */
import { read, write } from "./store.js";
import { SAMPLE_GAMES, SAMPLE_LIBRARY, sampleBySlug } from "./storeSamples.js";
import { dbAll, dbDelete, dbGet, dbPut } from "./storeDb.js";

export const STORE_CATEGORIES = ["Action", "Adventure", "Arcade", "Puzzle", "Racing", "Shooter", "Simulation", "Strategy", "Family", "Other"];

export const LIMITS = {
  minImages: 4,
  maxImages: 8,
  maxGameBytes: 5 * 1024 * 1024, // larger games need the extra review process (coming soon)
  imageMaxEdge: 1280,
  imageQuality: 0.82,
  nameMax: 40,
  descMin: 40,
  descMax: 1200,
};

export const RULES = [
  { id: "age", text: "My game is suitable for all ages. No adult (18+) content." },
  { id: "own", text: "I made it, or I have the right to publish every asset in it." },
  { id: "safe", text: "It has no malware, hidden trackers or misleading claims." },
];

const BLOCKED = /\b(porn\w*|nsfw|nude\w*|xxx|erotic\w*|sex(?:ual|y)?|hentai|gore|18\+|adults? only)\b/i;

export const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const formatBytes = (n) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(2)} MB`);

/** Plain-text rules check on the listing. Returns a list of problems (empty = fine). */
export function checkListing({ name, developer, category, description }) {
  const out = [];
  if (!developer.trim()) out.push("Add the developer name.");
  if (!name.trim()) out.push("Add the game name.");
  else if (name.trim().length > LIMITS.nameMax) out.push(`Game name is limited to ${LIMITS.nameMax} characters.`);
  if (!category) out.push("Choose a category.");
  if (description.trim().length < LIMITS.descMin) out.push(`Describe the game in at least ${LIMITS.descMin} characters.`);
  if (description.length > LIMITS.descMax) out.push(`Description is limited to ${LIMITS.descMax} characters.`);
  if (BLOCKED.test(`${name} ${description}`)) out.push("Adult (18+) content is not allowed in the Store.");
  return out;
}

/* ----------------------------- hashing ----------------------------- */
export async function sha256Hex(data) {
  const buf = data instanceof Blob ? await data.arrayBuffer() : new TextEncoder().encode(String(data));
  const h = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ----------------------------- screenshots ----------------------------- */
const blobToDataUrl = (blob) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });

async function decode(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {}
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => rej(new Error("This file is not a readable image."));
      img.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

/**
 * Re-encodes a screenshot on a canvas. A canvas carries pixels only, so EXIF, GPS,
 * camera, XMP and any embedded manifest are dropped; the image is also scaled down
 * and compressed (WebP, JPEG fallback).
 */
export async function processImage(file) {
  if (!/^image\//.test(file.type)) throw new Error(`${file.name || "File"} is not an image.`);
  const src = await decode(file);
  const w0 = src.width, h0 = src.height;
  const k = Math.min(1, LIMITS.imageMaxEdge / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * k)), h = Math.max(1, Math.round(h0 * k));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(src, 0, 0, w, h);
  if (src.close) src.close();
  let type = "image/webp";
  let blob = await new Promise((r) => canvas.toBlob(r, type, LIMITS.imageQuality));
  if (!blob || blob.type !== type) {
    type = "image/jpeg";
    blob = await new Promise((r) => canvas.toBlob(r, type, LIMITS.imageQuality));
  }
  if (!blob) throw new Error("Could not compress this image.");
  return {
    id: `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: (file.name || "screenshot").replace(/\.[^.]+$/, "") + (type === "image/webp" ? ".webp" : ".jpg"),
    type,
    width: w,
    height: h,
    bytes: blob.size,
    originalBytes: file.size,
    sha256: await sha256Hex(blob),
    dataUrl: await blobToDataUrl(blob),
  };
}

/* ----------------------------- game package ----------------------------- */
/**
 * The build that goes to the Store: exactly what the 3D view shows. The mounted game code (as it is in the
 * viewport now, even if it differs from the saved file) and the scene objects.
 */
export function buildPackage(project, live) {
  let files = project.files || [];
  let mountedFile = project.mountedFile || null;
  if (live?.code && live?.name) {
    files = files.some((f) => f.name === live.name) ? files.map((f) => (f.name === live.name ? { ...f, content: live.code } : f)) : [...files, { name: live.name, content: live.code }];
    mountedFile = live.name;
  }
  const objects = (project.groups || []).reduce((n, g) => n + (g.children || []).length, 0);
  const body = JSON.stringify({ format: "spider-project", version: 1, name: project.name, groups: project.groups, files, mountedFile });
  const blob = new Blob([body], { type: "application/json" });
  return { body, bytes: blob.size, blob, mountedFile, objects, empty: !live?.code && !project.mountedFile && objects === 0 };
}

/**
 * Provenance manifest sent with every submission: what was uploaded (hashes), by whom,
 * with which tool, and whether the metadata was stripped. The Store server seals it into
 * C2PA Content Credentials with its own signing certificate (a certificate cannot live in
 * a client app), so `c2pa.status` stays "unsigned" until the server has done that.
 */
export async function buildProvenance({ developer, name, version, pkg, images }) {
  return {
    schema: "spider-store-provenance/1",
    createdAt: new Date().toISOString(),
    generator: "Spider Engine Pocket Studio",
    developer,
    game: name,
    version,
    package: { sha256: await sha256Hex(pkg.blob), bytes: pkg.bytes },
    images: images.map((i) => ({ name: i.name, sha256: i.sha256, bytes: i.bytes, width: i.width, height: i.height, metadataStripped: true })),
    c2pa: { status: "unsigned", signer: "store-server", assertions: ["c2pa.created"] },
  };
}

/* ----------------------------- backend adapter ----------------------------- */
const API = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_STORE_API) || "";
const LOCAL_KEY = "spider-store-local";
const DEV_KEY = "spider-store-developer";

export const storeMode = () => (API ? "server" : "local");
export const savedDeveloper = () => read(DEV_KEY, "");
export const rememberDeveloper = (n) => write(DEV_KEY, n);

const LIB_KEY = "spider-store-library";
/** Games the user got from the Store: { slug: installedVersion }. */
export const getLibrary = () => read(LIB_KEY, SAMPLE_LIBRARY);
export function setLibraryVersion(slug, version) {
  const lib = { ...getLibrary(), [slug]: version };
  write(LIB_KEY, lib);
  return lib;
}

/** Games published on this device. Older builds kept them in localStorage: move those over once. */
let migrated = false;
async function localAll() {
  if (!migrated) {
    migrated = true;
    const old = read(LOCAL_KEY, []);
    for (const g of old) { try { await dbPut("games", g); } catch {} }
    if (old.length) { try { localStorage.removeItem(LOCAL_KEY); } catch {} }
  }
  return dbAll("games");
}

// The server answers with root-relative image links; when the Store lives on another origin, anchor them there.
function anchor(game) {
  if (!game || !/^https?:\/\//.test(API)) return game;
  const origin = new URL(API).origin;
  return { ...game, images: (game.images || []).map((i) => (i.url && i.url.startsWith("/") ? { ...i, url: origin + i.url } : i)) };
}

async function http(path, init) {
  const r = await fetch(`${API.replace(/\/$/, "")}${path}`, { headers: { "content-type": "application/json" }, ...init });
  if (!r.ok) {
    let msg = `Store server answered ${r.status}`;
    try { msg = (await r.json()).error || msg; } catch {}
    const err = new Error(msg);
    err.status = r.status;
    throw err;
  }
  return r.json();
}

/** All games, newest activity first. Each game: { slug, name, developer, category, description, images[], versions[] }. */
export async function listGames() {
  let games = [];
  if (API) {
    try { games = (await http("/games")).map(anchor); } catch (e) { console.warn("[store] server unreachable:", e.message); }
  }
  // Games published on this device (all of them without a server, or those saved while the server was away).
  const mine = await localAll().catch(() => []);
  games = [...games, ...mine.filter((m) => !games.some((g) => g.slug === m.slug))];
  const real = [...games].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  // Sample listings come after the real ones, and only for names no real game uses.
  const taken = new Set(real.map((g) => g.slug));
  return [...real, ...SAMPLE_GAMES.filter((g) => !taken.has(g.slug))];
}

/** A game for the detail page: a real one, or one of the sample listings. */
export async function getGame(slug) {
  return (await findGame(slug)) || sampleBySlug(slug);
}

export async function findGame(slug) {
  if (!slug) return null;
  const here = (await localAll().catch(() => [])).find((g) => g.slug === slug) || null;
  if (API) {
    try { return anchor(await http(`/games/${encodeURIComponent(slug)}`)); } catch (e) { if (e.status === 404 || !e.status) return here; throw e; }
  }
  return here;
}

/**
 * Decides what a submission would do: a new game, a new version of the developer's own
 * game, or a refusal when another developer already owns that name.
 */
export async function resolveTarget({ name, developer }) {
  const slug = slugify(name);
  if (!slug) return { kind: "new", slug, version: 1 };
  const existing = await findGame(slug);
  if (!existing) return { kind: "new", slug, version: 1 };
  if ((existing.developer || "").trim().toLowerCase() !== developer.trim().toLowerCase()) return { kind: "taken", slug, existing };
  const last = Math.max(0, ...(existing.versions || []).map((v) => v.version));
  return { kind: "version", slug, existing, version: last + 1 };
}

/** Submits a prepared listing. `submission` is built by the publish page. */
export async function submitGame(submission) {
  if (API) {
    try {
      return anchor(await http("/games", { method: "POST", body: JSON.stringify(submission) }));
    } catch (e) {
      if (e.status) throw e; // the server answered and said no (a rule): show that
      console.warn("[store] server unreachable, saving on this device:", e.message);
    }
  }
  return submitLocal(submission, !!API);
}

async function submitLocal(submission, offline) {
  const now = new Date().toISOString();
  const ver = { version: submission.version, notes: submission.notes || "", bytes: submission.package.bytes, createdAt: now, provenance: submission.provenance, package: submission.package.base64 };
  const prev = (await localAll()).find((g) => g.slug === submission.slug);
  const game = prev
    ? { ...prev, description: submission.description, category: submission.category, images: submission.images, updatedAt: now, versions: [ver, ...prev.versions] }
    : { slug: submission.slug, name: submission.name, developer: submission.developer, category: submission.category, description: submission.description, images: submission.images, createdAt: now, updatedAt: now, versions: [ver] };
  try {
    await dbPut("games", game);
  } catch (e) {
    throw new Error(e?.message || "This device has no room left for the submission. Free some space and try again.");
  }
  return offline ? { ...game, localOnly: true } : game;
}

/**
 * The game package text for Play Now: from the Store server, from this device (local mode),
 * or from the static file a bundled demo game points to. Sample listings without a build refuse.
 */
export async function fetchPackage(game, version) {
  const v = version || game.versions[0].version;
  if (game.packageUrl) {
    const r = await fetch(game.packageUrl);
    if (!r.ok) throw new Error("Could not load this game.");
    return r.text();
  }
  if (game.sample) throw new Error("This is a sample listing: no build has been uploaded for it yet.");
  if (API) {
    try {
      const r = await fetch(`${API.replace(/\/$/, "")}/games/${encodeURIComponent(game.slug)}/versions/${v}/package`);
      if (r.ok) return r.text();
      if (r.status !== 404) throw new Error(`The Store server answered ${r.status}.`);
    } catch (e) {
      if (/answered/.test(e.message)) throw e;
      // network failure: fall through to the copy kept on this device, if any
    }
  }
  const local = (await localAll()).find((g) => g.slug === game.slug)?.versions.find((x) => x.version === v);
  if (!local?.package) throw new Error("This game's build is not on this device.");
  return decodeURIComponent(escape(atob(local.package)));
}

export const canPlay = (game) => !!game.packageUrl || !game.sample;

/* ----------------------------- Studio screenshot tray ----------------------------- */
// The camera button in Studio also drops the picture here, so publishing can use real in-game screenshots.
export async function addShot(projectId, dataUrl) {
  await dbPut("shots", { id: `shot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, projectId, dataUrl, at: Date.now() });
  return (await listShots(projectId)).length;
}
export async function listShots(projectId) {
  return (await dbAll("shots")).filter((x) => x.projectId === projectId).sort((a, b) => a.at - b.at);
}
export const removeShot = (id) => dbDelete("shots", id);
