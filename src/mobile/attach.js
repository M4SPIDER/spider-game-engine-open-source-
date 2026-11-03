/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — chat attachments: images and text files
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 *
 * Images are shrunk on the device and read by Muse Spark (Meta's models are multimodal), which turns
 * them into a short description the game agent can build from. Text and code files are added as they are.
 */
import { chat, loadConfig, loadKey, providerById } from "./ai.js";

export const MAX_ATTACH = 4;
const TEXT_EXT = /\.(txt|md|json|js|jsx|ts|tsx|css|html|csv|glsl)$/i;
export const ATTACH_ACCEPT = "image/*,.txt,.md,.json,.js,.jsx,.ts,.tsx,.css,.html,.csv,.glsl";

async function decode(file) {
  if (typeof createImageBitmap === "function") {
    try { return await createImageBitmap(file); } catch {}
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("Could not read this image.")); i.src = url; });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
}

/** One attachment from a picked file: { id, kind: "image"|"text", name, dataUrl | text }. */
export async function prepareAttachment(file) {
  const id = `att-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
  if (/^image\//.test(file.type)) {
    const src = await decode(file);
    const k = Math.min(1, 1024 / Math.max(src.width, src.height));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(src.width * k));
    c.height = Math.max(1, Math.round(src.height * k));
    c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
    if (src.close) src.close();
    return { id, kind: "image", name: file.name || "image", dataUrl: c.toDataURL("image/jpeg", 0.85) };
  }
  if (TEXT_EXT.test(file.name || "") || /^text\//.test(file.type)) {
    const text = (await file.text()).slice(0, 20000);
    return { id, kind: "text", name: file.name, text };
  }
  throw new Error(`${file.name || "This file"} is not an image or a text file.`);
}

/** Muse Spark when a Meta key exists, otherwise OpenAI; both read images through the same chat call. */
function visionProvider() {
  const cfg = loadConfig();
  for (const id of ["meta", "openai"]) {
    const key = loadKey(id);
    if (key) return { provider: providerById(id), key, model: id === "meta" ? "muse-spark-1.3" : (cfg.model[id] || providerById(id).models[0]) };
  }
  return null;
}
export const canReadImages = () => !!visionProvider();

/** The text the agent receives: the user's words plus every attachment, images as a short description. */
export async function buildGoal(text, items, signal) {
  let goal = text.trim();
  for (const a of items) {
    if (a.kind === "text") goal += `\n\n--- attached file: ${a.name} ---\n${a.text}`;
  }
  const images = items.filter((a) => a.kind === "image");
  if (images.length) {
    const who = visionProvider();
    if (!who) throw new Error("Reading images needs a Meta key. Open More, Settings, AI.");
    for (const a of images) {
      const desc = await chat({
        provider: who.provider, key: who.key, model: who.model, signal, maxTokens: 4000,
        messages: [{ role: "user", content: [
          { type: "text", text: "Describe this image for a game developer in under 90 words: the objects, their colors and shapes, the art style, the mood, and any text or UI. Be concrete." },
          { type: "image_url", image_url: { url: a.dataUrl } },
        ] }],
      });
      goal += `\n\n--- attached image: ${a.name} (described by ${who.provider.name} ${who.model}) ---\n${String(desc).trim()}`;
    }
  }
  return goal;
}
