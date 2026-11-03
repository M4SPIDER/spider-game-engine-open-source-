/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — "Write with Muse": a listing draft for the Store, made on the device
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 *
 * Uses the AI key the user already added (Meta first, so Muse Spark writes it). Nothing goes to the Store server.
 */
import { PROVIDERS, chat, loadConfig, loadKey, providerById } from "./ai.js";
import { LIMITS, STORE_CATEGORIES } from "./storeApi.js";

/** The provider that will write the listing: Meta when it has a key, else the active one, else any configured. */
export function assistProvider() {
  const cfg = loadConfig();
  const order = ["meta", cfg.provider, ...PROVIDERS.map((p) => p.id)];
  for (const id of order) {
    const key = loadKey(id);
    if (key && id !== "custom") return { provider: providerById(id), key, model: cfg.model[id] || providerById(id).models[0] };
  }
  return null;
}

function parseJson(text) {
  const t = String(text || "").replace(/```(?:json)?/gi, "").trim();
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b < a) throw new Error("The model did not return a listing. Try again.");
  return JSON.parse(t.slice(a, b + 1));
}

export async function suggestListing(project, signal) {
  const who = assistProvider();
  if (!who) throw new Error("Add an AI key first: More, Settings, AI.");
  const files = project.files || [];
  const main = files.find((f) => f.name === project.mountedFile) || files[0];
  const code = String(main?.content || "").slice(0, 6000);
  const messages = [
    { role: "system", content: `You write short, honest listings for a game store. Reply with ONLY a JSON object {"description": string, "category": string}. description: ${LIMITS.descMin + 20} to 400 characters, plain words, what the player does and what makes it fun, no hype, no emojis, nothing adult. category: exactly one of ${STORE_CATEGORIES.join(", ")}.` },
    { role: "user", content: `Game name: ${project.name}\nFiles: ${files.map((f) => f.name).join(", ")}\n\nMain file (start):\n${code}` },
  ];
  const text = await chat({ provider: who.provider, key: who.key, model: who.model, messages, signal, maxTokens: 4000 });
  const j = parseJson(text);
  const description = String(j.description || "").replace(/\s+/g, " ").trim().slice(0, LIMITS.descMax);
  if (description.length < LIMITS.descMin) throw new Error("The model's description was too short. Try again.");
  const category = STORE_CATEGORIES.find((c) => c.toLowerCase() === String(j.category || "").toLowerCase()) || "Other";
  return { description, category, by: who.provider.name };
}
