#!/usr/bin/env node
/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Spider Store reference server
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 *
 * Zero-dependency Node server for the Pocket Studio store (see docs/STORE-API.md).
 * It re-checks every rule the app checks (the app can be bypassed), keeps games and
 * images on disk, and serves them back. Run on a VPS behind nginx/Caddy:
 *
 *   PORT=8787 DATA_DIR=/var/lib/spider-store node server/store-server.cjs
 *
 * Environment:
 *   PORT         listen port (default 8787)
 *   HOST         listen address (default 127.0.0.1; put a reverse proxy in front)
 *   DATA_DIR     where games live (default ./store-data)
 *   CORS_ORIGIN  allowed origin for the browser app ("*" by default; set your domain in production)
 *   TRUST_PROXY  set to 1 behind nginx/Caddy so the rate limit sees the visitor, not the proxy
 *   PUBLIC_URL   absolute base used in image links (default: relative /api/store/files/...)
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = +process.env.PORT || 8787;
const HOST = process.env.HOST || "127.0.0.1";
const DATA_DIR = path.resolve(process.env.DATA_DIR || "store-data");
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const PUBLIC_URL = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
const PREFIX = "/api/store";

const LIMITS = {
  minImages: 4, maxImages: 8, maxGameBytes: 5 * 1024 * 1024, maxImageBytes: 600 * 1024,
  nameMax: 40, descMin: 40, descMax: 1200, notesMax: 300, bodyMax: 16 * 1024 * 1024,
  perMinute: 20, // submissions per IP per minute
};
const CATEGORIES = ["Action", "Adventure", "Arcade", "Puzzle", "Racing", "Shooter", "Simulation", "Strategy", "Family", "Other"];
const BLOCKED = /\b(porn\w*|nsfw|nude\w*|xxx|erotic\w*|sex(?:ual|y)?|hentai|gore|18\+|adults? only)\b/i;

fs.mkdirSync(path.join(DATA_DIR, "games"), { recursive: true });

const slugify = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const gameDir = (slug) => path.join(DATA_DIR, "games", slug);
const gameFile = (slug) => path.join(gameDir(slug), "game.json");

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

function readGame(slug) {
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return null;
  try { return JSON.parse(fs.readFileSync(gameFile(slug), "utf8")); } catch { return null; }
}
function writeAtomic(file, data) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, file);
}
const imageUrl = (slug, name) => `${PUBLIC_URL}${PREFIX}/files/${slug}/${name}`;
function publicGame(g) {
  return { ...g, images: g.images.map((i) => ({ ...i, url: imageUrl(g.slug, i.file) })) };
}
function listGames() {
  const out = [];
  for (const slug of fs.readdirSync(path.join(DATA_DIR, "games"))) {
    const g = readGame(slug);
    if (g) out.push(publicGame(g));
  }
  return out.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
}

/* ----------------------------- validation ----------------------------- */
function imageKind(buf) {
  if (buf.length > 12 && buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP") return "webp";
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 8 && buf.slice(1, 4).toString() === "PNG") return "png";
  return null;
}
// An image that still carries EXIF/XMP or a C2PA manifest was not processed by the app: refuse it.
function hasMetadata(buf, kind) {
  const head = buf.toString("latin1");
  if (kind === "jpg") return /Exif\0\0|http:\/\/ns\.adobe\.com\/xap|c2pa|jumb/.test(head);
  if (kind === "webp") return /EXIF|XMP |C2PA/.test(head.slice(12, 4096));
  if (kind === "png") return /eXIf|iTXt|tEXt|zTXt|c2pa|caBX/.test(head);
  return false;
}

function validate(b) {
  const bad = (m) => { throw new HttpError(400, m); };
  if (!b || typeof b !== "object") bad("Invalid request.");
  const str = (v, n) => (typeof v === "string" ? v.trim() : bad(`${n} is required.`));
  const developer = str(b.developer, "Developer name");
  const name = str(b.name, "Game name");
  const description = str(b.description, "Description");
  const notes = typeof b.notes === "string" ? b.notes.trim() : "";
  if (!developer || developer.length > 60) bad("Developer name is required (60 characters at most).");
  if (!name || name.length > LIMITS.nameMax) bad(`Game name is required (${LIMITS.nameMax} characters at most).`);
  const slug = slugify(name);
  if (!slug) bad("Game name needs letters or numbers.");
  if (!CATEGORIES.includes(b.category)) bad("Choose a valid category.");
  if (description.length < LIMITS.descMin || description.length > LIMITS.descMax) bad(`Description must be ${LIMITS.descMin} to ${LIMITS.descMax} characters.`);
  if (notes.length > LIMITS.notesMax) bad(`Version notes are limited to ${LIMITS.notesMax} characters.`);
  if (BLOCKED.test(`${name} ${description} ${notes}`)) bad("Adult (18+) content is not allowed in the Store.");

  if (!Array.isArray(b.images) || b.images.length < LIMITS.minImages) bad(`At least ${LIMITS.minImages} screenshots are required.`);
  if (b.images.length > LIMITS.maxImages) bad(`At most ${LIMITS.maxImages} screenshots.`);
  const images = b.images.map((im, i) => {
    const m = /^data:image\/(?:webp|jpeg|png);base64,([A-Za-z0-9+/=]+)$/.exec(im && im.dataUrl);
    if (!m) bad(`Screenshot ${i + 1} is not a valid image.`);
    const buf = Buffer.from(m[1], "base64");
    if (buf.length > LIMITS.maxImageBytes) bad(`Screenshot ${i + 1} is too large after compression.`);
    const kind = imageKind(buf);
    if (!kind) bad(`Screenshot ${i + 1} is not a WebP, JPEG or PNG image.`);
    if (hasMetadata(buf, kind)) bad(`Screenshot ${i + 1} still carries metadata. Re-export it from the app.`);
    const hash = sha256(buf);
    if (im.sha256 && im.sha256 !== hash) bad(`Screenshot ${i + 1} does not match its recorded hash.`);
    return { buf, kind, sha256: hash, file: `${hash.slice(0, 16)}.${kind}`, name: String(im.name || `shot-${i + 1}`).slice(0, 80), width: +im.width || 0, height: +im.height || 0, bytes: buf.length };
  });
  if (new Set(images.map((i) => i.sha256)).size !== images.length) bad("Screenshots must all be different.");

  const pkgB64 = b.package && b.package.base64;
  if (typeof pkgB64 !== "string" || !pkgB64) bad("The game package is missing.");
  const pkgBuf = Buffer.from(pkgB64, "base64");
  if (pkgBuf.length > LIMITS.maxGameBytes) throw new HttpError(413, "Games over 5 MB need the additional review, which is not available yet.");
  try { const j = JSON.parse(pkgBuf.toString("utf8")); if (!j || j.format !== "spider-project") bad("The package is not a Spider project."); } catch (e) { if (e instanceof HttpError) throw e; bad("The package is not valid JSON."); }
  const pkgHash = sha256(pkgBuf);
  const prov = b.provenance;
  if (prov && prov.package && prov.package.sha256 && prov.package.sha256 !== pkgHash) bad("The package does not match its recorded hash.");
  return { slug, name, developer, category: b.category, description, notes, images, pkgBuf, pkgHash };
}

/* ----------------------------- publish ----------------------------- */
const lock = new Set();
function publish(v) {
  if (lock.has(v.slug)) throw new HttpError(409, "Another submission for this game is in progress. Try again.");
  lock.add(v.slug);
  try {
    const existing = readGame(v.slug);
    if (existing && existing.developer.trim().toLowerCase() !== v.developer.toLowerCase()) {
      throw new HttpError(409, `"${existing.name}" already belongs to ${existing.developer}. Pick another name.`);
    }
    const version = existing ? Math.max(0, ...existing.versions.map((x) => x.version)) + 1 : 1;
    const dir = gameDir(v.slug);
    fs.mkdirSync(path.join(dir, "images"), { recursive: true });
    fs.mkdirSync(path.join(dir, "packages"), { recursive: true });
    for (const im of v.images) writeAtomic(path.join(dir, "images", im.file), im.buf);
    writeAtomic(path.join(dir, "packages", `v${version}.spider.json`), v.pkgBuf);
    const now = new Date().toISOString();
    const entry = {
      version, notes: v.notes, bytes: v.pkgBuf.length, sha256: v.pkgHash, createdAt: now,
      // Content Credentials: sealed by the operator's signing step (see docs/STORE-API.md); stays "unsigned" until then.
      provenance: { c2pa: { status: "unsigned" }, images: v.images.map((i) => ({ sha256: i.sha256, metadataStripped: true })) },
    };
    const images = v.images.map(({ name, file, sha256, width, height, bytes }) => ({ name, file, sha256, width, height, bytes }));
    const game = existing
      ? { ...existing, category: v.category, description: v.description, images, updatedAt: now, versions: [entry, ...existing.versions] }
      : { slug: v.slug, name: v.name, developer: v.developer, category: v.category, description: v.description, images, createdAt: now, updatedAt: now, versions: [entry] };
    writeAtomic(gameFile(v.slug), JSON.stringify(game, null, 2));
    return publicGame(game);
  } finally {
    lock.delete(v.slug);
  }
}

/* ----------------------------- http ----------------------------- */
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 60000);
  list.push(now);
  hits.set(ip, list);
  return list.length > LIMITS.perMinute;
}
function send(res, status, body, extra = {}) {
  const data = typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, {
    "content-type": typeof body === "object" && !Buffer.isBuffer(body) ? "application/json; charset=utf-8" : "text/plain; charset=utf-8",
    "access-control-allow-origin": CORS_ORIGIN, "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type",
    "x-content-type-options": "nosniff", ...extra,
  });
  res.end(data);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let n = 0;
    req.on("data", (c) => { n += c.length; if (n > LIMITS.bodyMax) { reject(new HttpError(413, "Request is too large.")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
const MIME = { webp: "image/webp", jpg: "image/jpeg", png: "image/png" };

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") return send(res, 204, "");
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.startsWith(PREFIX)) p = p.slice(PREFIX.length) || "/";
    const ip = (process.env.TRUST_PROXY === "1" && String(req.headers["x-forwarded-for"] || "").split(",")[0].trim()) || req.socket.remoteAddress || "";
    if (req.method === "GET" && p === "/health") return send(res, 200, { ok: true, games: fs.readdirSync(path.join(DATA_DIR, "games")).length });
    if (req.method === "GET" && p === "/games") return send(res, 200, listGames());
    let m;
    if (req.method === "GET" && (m = /^\/games\/([a-z0-9-]+)$/.exec(p))) {
      const g = readGame(m[1]);
      return g ? send(res, 200, publicGame(g)) : send(res, 404, { error: "Game not found." });
    }
    if (req.method === "GET" && (m = /^\/files\/([a-z0-9-]+)\/([a-f0-9]{16}\.(?:webp|jpg|png))$/.exec(p))) {
      const f = path.join(gameDir(m[1]), "images", m[2]);
      if (!fs.existsSync(f)) return send(res, 404, { error: "Not found." });
      return send(res, 200, fs.readFileSync(f), { "content-type": MIME[m[2].split(".")[1]], "cache-control": "public, max-age=31536000, immutable" });
    }
    if (req.method === "GET" && (m = /^\/games\/([a-z0-9-]+)\/versions\/(\d+)\/package$/.exec(p))) {
      const f = path.join(gameDir(m[1]), "packages", `v${+m[2]}.spider.json`);
      if (!/^[a-z0-9-]+$/.test(m[1]) || !fs.existsSync(f)) return send(res, 404, { error: "Not found." });
      return send(res, 200, fs.readFileSync(f), { "content-type": "application/json", "content-disposition": `attachment; filename="${m[1]}-v${+m[2]}.spider.json"` });
    }
    if (req.method === "POST" && p === "/games") {
      if (rateLimited(ip)) return send(res, 429, { error: "Too many submissions. Wait a minute." });
      let body;
      try { body = JSON.parse(await readBody(req)); } catch (e) { if (e instanceof HttpError) throw e; throw new HttpError(400, "Invalid JSON."); }
      return send(res, 201, publish(validate(body)));
    }
    return send(res, 404, { error: "Not found." });
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.status, { error: e.message });
    console.error(e);
    return send(res, 500, { error: "Server error." });
  }
});

if (require.main === module) {
  server.listen(PORT, HOST, () => console.log(`Spider Store server on http://${HOST}:${PORT}${PREFIX} (data: ${DATA_DIR})`));
}
module.exports = { server, validate, slugify, LIMITS };
