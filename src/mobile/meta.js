/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Meta AI tooling
 * One place for every Meta developer API the studio can use besides chat:
 *   - Muse Voice Transcribe  (speech to text, WebSocket realtime + HTTP fallback)
 *   - Muse Image             (text to image, used for textures and sprite props)
 *   - SAM 3.1                (photo to cutout, via the Responses API)
 *   - Muse Wonder            (planning step before a big build)
 * All calls go straight from the browser to https://api.meta.ai/v1 with the key the user saved
 * for the Meta provider. Nothing is proxied or stored by this app.
 */
import { loadKey } from "./ai.js";
import { decodeMaskToRaster, parseImageStream, recordsOfKind } from "@meta-sam/parser";

export const META_BASE = "https://api.meta.ai/v1";
export const META_TOOLS = [
  { id: "voice", name: "Muse Voice Transcribe", what: "Dictate prompts with the mic button", model: "muse-voice-transcribe-1.0" },
  { id: "image", name: "Muse Image", what: "Generate textures and sprite props from text", model: "muse-image-1.0" },
  { id: "sam", name: "SAM 3.1", what: "Cut an object out of a photo to use as a prop", model: "sam-3.1" },
  { id: "wonder", name: "Muse Wonder", what: "Plan a big game before the build starts", model: "muse-wonder-1.0" },
  { id: "spark", name: "Muse Spark 1.3", what: "Main agent model, 1M-token context and vision", model: "muse-spark-1.3" },
];

export const metaKey = () => loadKey("meta");
export const hasMetaKey = () => Boolean(metaKey());

const authHeaders = (key) => ({ "content-type": "application/json", authorization: `Bearer ${key}` });

async function fail(res, what) {
  let detail = "";
  try {
    const j = await res.json();
    detail = j?.error?.message || j?.message || "";
  } catch {}
  throw new Error(`${what} failed (${res.status})${detail ? `: ${detail}` : ""}`);
}

/* ------------------------------ Muse Image ------------------------------ */

/** The API returns WebP today; read the type from the first bytes instead of assuming png. */
export function imageMime(b64) {
  if (b64.startsWith("iVBOR")) return "image/png";
  if (b64.startsWith("/9j/")) return "image/jpeg";
  if (b64.startsWith("UklGR")) return "image/webp";
  return "image/png";
}

/** Text to image through the Responses API. Returns a data URL (png). */
export async function generateImage(prompt, { size = "1024x1024", transparent = false, signal } = {}) {
  const key = metaKey();
  if (!key) throw new Error("Add your Meta key in Settings > AI providers first.");
  const text = transparent ? `${prompt}. Single object centered, plain flat background, no shadow, no text.` : prompt;
  const res = await fetch(`${META_BASE}/responses`, {
    method: "POST",
    headers: authHeaders(key),
    signal,
    body: JSON.stringify({
      model: "muse-image-1.0",
      input: text,
      tools: [{ type: "image_generation", size }],
    }),
  });
  if (!res.ok) await fail(res, "Muse Image");
  const data = await res.json();
  const call = (data.output || []).find((o) => o.type === "image_generation_call" && o.result);
  if (!call) throw new Error("Muse Image returned no picture.");
  return `data:${imageMime(call.result)};base64,${call.result}`;
}

/* -------------------------------- SAM 3.1 -------------------------------- */

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("Could not read the photo."));
    r.readAsDataURL(file);
  });

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not open the image."));
    img.src = src;
  });
}

/** SAM wants a short noun phrase ("red car"), not a command. */
export const samPhrase = (what) =>
  String(what || "")
    .toLowerCase()
    .replace(/^(please |cut out |segment |select |find )+/, "")
    .replace(/^(the|a|an|my) /, "")
    .trim() || "object";

/** Feed a finished Responses body to the official parser and return its mask records. */
export async function masksFromResponse(body) {
  const text = (body?.output || [])
    .flatMap((o) => o?.content || [])
    .filter((c) => c?.type === "output_text")
    .map((c) => c.text)
    .join("");
  async function* events() {
    yield { type: "response.output_text.delta", item_id: "m", output_index: 0, content_index: 0, delta: text };
    yield { type: "response.output_text.done", item_id: "m", output_index: 0, content_index: 0, text };
    yield { type: "response.completed" };
  }
  const result = await parseImageStream(events()).finalResult;
  return recordsOfKind(result.records, "mask");
}

/** Shrink big photos before upload: SAM works on the pixels it is sent, and phone photos are huge. */
async function prepareImage(file, maxSide = 1600) {
  const img = await loadImage(await fileToDataUrl(file));
  const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.naturalWidth * k));
  c.height = Math.max(1, Math.round(img.naturalHeight * k));
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return { canvas: c, dataUrl: c.toDataURL("image/jpeg", 0.9) };
}

/**
 * Photo to cutout through SAM 3.1. Sends the photo with a short noun phrase, decodes the returned
 * masks with Meta's parser, keeps only the matched pixels and crops to them. Returns a transparent
 * PNG data URL. If nothing matched, the whole photo comes back with matched: false.
 */
export async function cutOut(file, what = "object", { signal } = {}) {
  const key = metaKey();
  if (!key) throw new Error("Add your Meta key in Settings > AI providers first.");
  const { canvas, dataUrl } = await prepareImage(file);
  const res = await fetch(`${META_BASE}/responses`, {
    method: "POST",
    headers: authHeaders(key),
    signal,
    body: JSON.stringify({
      model: "sam-3.1",
      input: [{ role: "user", content: [{ type: "input_text", text: samPhrase(what) }, { type: "input_image", image_url: dataUrl }] }],
    }),
  });
  if (!res.ok) await fail(res, "SAM 3.1");
  const masks = await masksFromResponse(await res.json());
  if (!masks.length) return { url: canvas.toDataURL("image/png"), matched: false };

  const W = canvas.width;
  const H = canvas.height;
  const g = canvas.getContext("2d");
  const px = g.getImageData(0, 0, W, H);
  const keep = new Uint8Array(W * H);
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (const m of masks) {
    const raster = decodeMaskToRaster(m.mask);
    const { left, top } = m.bounds;
    for (let y = 0; y < m.mask.height; y++) {
      for (let x = 0; x < m.mask.width; x++) {
        if (!raster[y * m.mask.width + x]) continue;
        const X = left + x;
        const Y = top + y;
        if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
        keep[Y * W + X] = 1;
        if (X < x0) x0 = X;
        if (X > x1) x1 = X;
        if (Y < y0) y0 = Y;
        if (Y > y1) y1 = Y;
      }
    }
  }
  if (x1 < x0) return { url: canvas.toDataURL("image/png"), matched: false };
  for (let i = 0; i < keep.length; i++) if (!keep[i]) px.data[i * 4 + 3] = 0;
  g.putImageData(px, 0, 0);
  const out = document.createElement("canvas");
  out.width = x1 - x0 + 1;
  out.height = y1 - y0 + 1;
  out.getContext("2d").drawImage(canvas, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return { url: out.toDataURL("image/png"), matched: true };
}

/* --------------------------- Muse Voice Transcribe --------------------------- */

export const museVoiceSupported = () => typeof window !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia && (window.AudioContext || window.webkitAudioContext) && window.WebSocket);

/** 16-bit mono PCM to a WAV file. */
export function encodeWav(samples, rate = 16000) {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const str = (o, t) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  v.setUint32(4, 36 + samples.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, samples.length * 2, true);
  new Int16Array(buf, 44).set(samples);
  return new Blob([buf], { type: "audio/wav" });
}

/** Whole-clip transcription over HTTP. Verified live: multipart with a JSON "request" part and an "audio" part. */
export async function transcribeWav(wav, { language, signal } = {}) {
  const key = metaKey();
  if (!key) throw new Error("Add your Meta key in Settings > AI providers first.");
  const form = new FormData();
  form.append("request", new Blob([JSON.stringify({ model: "muse-voice-transcribe-1.0", audioEncoding: "WAV", ...(language ? { languageCode: language } : {}) })], { type: "application/json" }));
  form.append("audio", wav, "speech.wav");
  const res = await fetch(`${META_BASE}/asr/transcribe`, { method: "POST", headers: { authorization: `Bearer ${key}` }, body: form, signal });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(`Muse Voice failed (${res.status}): ${data?.error?.message || "unknown error"}`);
  return String(data.transcript || "").trim();
}

/**
 * Dictation with Muse Voice. Microphone audio is converted to 16 kHz PCM16 and streamed over
 * wss://api.meta.ai/v1/asr/realtime for live text. The same audio is kept, so if the socket cannot be
 * opened (blocked network, proxy) the clip is sent as a WAV to the HTTP endpoint when the user stops.
 * Returns { stop }.
 */
export async function startMuseVoice({ language, onText, onEnd, onError }) {
  const key = metaKey();
  if (!key) {
    onError?.("Add your Meta key in Settings > AI providers to use Muse Voice.");
    onEnd?.();
    return { stop() {} };
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
  } catch {
    onError?.("Microphone is blocked. Allow it for this site in the browser settings.");
    onEnd?.();
    return { stop() {} };
  }
  const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
  let ws = null;
  try {
    ws = new WebSocket("wss://api.meta.ai/v1/asr/realtime");
    ws.binaryType = "arraybuffer";
  } catch {
    ws = null;
  }
  let finished = false;
  let wsOk = Boolean(ws);
  let gotText = false;
  let committed = "";
  let partial = "";
  let node;
  let source;
  const pcm = []; // everything said, for the HTTP fallback

  const release = () => {
    try { node?.disconnect(); source?.disconnect(); } catch {}
    stream.getTracks().forEach((t) => t.stop());
    ctx.close().catch(() => {});
  };
  const finish = () => {
    if (finished) return;
    finished = true;
    release();
    try { ws?.close(); } catch {}
    onEnd?.();
  };
  const viaHttp = async () => {
    release();
    const total = pcm.reduce((n, c) => n + c.length, 0);
    if (total < 3200) return finish(); // under 0.2 s: nothing to send
    const all = new Int16Array(total);
    let at = 0;
    for (const c of pcm) { all.set(c, at); at += c.length; }
    try {
      const text = await transcribeWav(encodeWav(all, 16000), { language });
      if (text) onText?.(text);
    } catch (e) {
      onError?.(e.message);
    }
    finish();
  };

  source = ctx.createMediaStreamSource(stream);
  node = ctx.createScriptProcessor(4096, 1, 1);
  node.onaudioprocess = (e) => {
    const f = e.inputBuffer.getChannelData(0);
    const chunk = new Int16Array(f.length);
    for (let i = 0; i < f.length; i++) chunk[i] = Math.max(-1, Math.min(1, f[i])) * 0x7fff;
    pcm.push(chunk);
    if (wsOk && ws.readyState === 1) ws.send(chunk.buffer);
  };
  source.connect(node);
  node.connect(ctx.destination);

  if (ws) {
    ws.onopen = () => {
      ws.send(JSON.stringify({ authorization: { accessToken: key }, config: { language: language || undefined, encoding: "pcm_s16le", sampleRate: ctx.sampleRate } }));
    };
    ws.onmessage = (ev) => {
      if (typeof ev.data !== "string") return;
      let m;
      try { m = JSON.parse(ev.data); } catch { return; }
      if (m.error) {
        wsOk = false;
        return;
      }
      const t = m.transcript ?? m.text ?? "";
      if (!t) return;
      gotText = true;
      if (m.is_final || m.final || m.type === "final") {
        committed = `${committed} ${t}`.trim();
        partial = "";
      } else partial = t;
      onText?.(`${committed} ${partial}`.trim());
      if (m.type === "end" || m.done) finish();
    };
    ws.onerror = () => { wsOk = false; };
    ws.onclose = () => { if (!gotText) wsOk = false; };
  }

  return {
    stop() {
      if (finished) return;
      if (wsOk && ws?.readyState === 1) {
        try { ws.send(JSON.stringify({ endStream: true })); } catch {}
        setTimeout(() => (gotText ? finish() : viaHttp()), 1500); // let the final transcript arrive
      } else viaHttp();
    },
  };
}

/* ------------------------------- Muse Wonder ------------------------------- */

/** Ask Muse Wonder for a short build plan. Returns plain text, or "" when it is unavailable. */
export async function planGame(request, { signal } = {}) {
  const key = metaKey();
  if (!key) return "";
  try {
    const res = await fetch(`${META_BASE}/chat/completions`, {
      method: "POST",
      headers: authHeaders(key),
      signal,
      body: JSON.stringify({
        model: "muse-wonder-1.0",
        max_tokens: 6000, // Wonder reasons first; a small budget is spent on thinking and the answer comes back empty
        messages: [
          { role: "system", content: "You plan small 3D browser games for a React Three Fiber engine. Reply with at most 8 short numbered steps: world, player controls, enemies or goals, scoring, polish. No code." },
          { role: "user", content: request },
        ],
      }),
    });
    if (!res.ok) return "";
    const j = await res.json();
    return String(j?.choices?.[0]?.message?.content || "").trim();
  } catch {
    return "";
  }
}
