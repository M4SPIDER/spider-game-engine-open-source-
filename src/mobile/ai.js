/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — multi-provider model client for Pocket Studio
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 *
 * Every provider is either "openai" (chat/completions, the format most vendors copy)
 * or "anthropic" (messages API). Keys live only in this browser.
 */
import { read, write } from "./store.js";

export const PROVIDERS = [
  { id: "meta", name: "Meta", kind: "openai", baseUrl: "https://api.meta.ai/v1", keyHint: "Key from dev.meta.ai", models: ["muse-spark-1.3", "muse-spark-1.3-contributor", "muse-spark-1.2", "muse-wonder-1.0"] },
  { id: "openai", name: "OpenAI", kind: "openai", baseUrl: "https://api.openai.com/v1", keyHint: "sk-…", models: ["gpt-4.1", "gpt-4.1-mini", "gpt-4o", "gpt-4o-mini"] },
  { id: "anthropic", name: "Anthropic", kind: "anthropic", baseUrl: "https://api.anthropic.com/v1", keyHint: "sk-ant-…", models: ["claude-sonnet-5-5", "claude-opus-5-5", "claude-haiku-5-5"] },
  { id: "google", name: "Google Gemini", kind: "openai", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", keyHint: "AIza…", models: ["gemini-2.5-pro", "gemini-2.5-flash"] },
  { id: "deepseek", name: "DeepSeek", kind: "openai", baseUrl: "https://api.deepseek.com/v1", keyHint: "sk-…", models: ["deepseek-chat", "deepseek-reasoner"] },
  { id: "xai", name: "xAI", kind: "openai", baseUrl: "https://api.x.ai/v1", keyHint: "xai-…", models: ["grok-4", "grok-3"] },
  { id: "mistral", name: "Mistral", kind: "openai", baseUrl: "https://api.mistral.ai/v1", keyHint: "Mistral key", models: ["mistral-large-latest", "codestral-latest"] },
  { id: "groq", name: "Groq", kind: "openai", baseUrl: "https://api.groq.com/openai/v1", keyHint: "gsk_…", models: ["llama-3.3-70b-versatile"] },
  { id: "openrouter", name: "OpenRouter", kind: "openai", baseUrl: "https://openrouter.ai/api/v1", keyHint: "sk-or-…", models: ["anthropic/claude-sonnet-4.5", "openai/gpt-4.1"] },
  { id: "custom", name: "Custom (OpenAI-compatible)", short: "Custom", kind: "openai", baseUrl: "", keyHint: "Key (optional for local)", custom: true, models: [] },
];

export const providerById = (id) => PROVIDERS.find((p) => p.id === id) || PROVIDERS[0];

const CFG = "spider-ai-config";
const keyName = (id) => (id === "meta" ? "spider-meta-key-raw" : `spider-ai-key-${id}`);

export const sanitizeKey = (s) => String(s || "").replace(/[\s​-‍﻿ ]+/g, "").trim();

// "muse-wonder" is not a model id (the API answers 404); the real one is "muse-wonder-1.0". Fix ids saved by older builds.
const fixWonder = (m) => (m === "muse-wonder" ? "muse-wonder-1.0" : m);

export function loadConfig() {
  const c = read(CFG, {});
  const model = { ...(c.model || {}) };
  for (const k of Object.keys(model)) model[k] = fixWonder(model[k]);
  const models = { ...(c.models || {}) };
  for (const k of Object.keys(models)) if (Array.isArray(models[k])) models[k] = models[k].map(fixWonder);
  return { provider: c.provider || "meta", models, model, baseUrls: c.baseUrls || {} };
}
export const saveConfig = (c) => write(CFG, c);

export function loadKey(id) {
  try {
    const k = sanitizeKey(localStorage.getItem(keyName(id)));
    return k && k !== "[objectObject]" ? k : "";
  } catch {
    return "";
  }
}
export function saveKey(id, key) {
  try {
    if (key) localStorage.setItem(keyName(id), sanitizeKey(key));
    else localStorage.removeItem(keyName(id));
  } catch {}
}
export const configuredProviders = () => PROVIDERS.filter((p) => loadKey(p.id) || (p.custom && (loadConfig().baseUrls.custom || "")));

export function baseUrlFor(provider, cfg) {
  return (provider.custom ? cfg.baseUrls.custom || "" : provider.baseUrl).replace(/\/+$/, "");
}

export function friendlyModel(providerId, id) {
  const low = String(id).toLowerCase();
  if (providerId === "meta") {
    if (low.includes("wonder")) return { name: low.includes("full") ? "Wonder Full" : "Wonder", desc: "Complex tasks, plans and delegates" };
    if (low.includes("1.3") && low.includes("contributor")) return { name: "Spark 1.3 Contributor", desc: "Agentic coding tier" };
    if (low.includes("1.3")) return { name: "Spark 1.3", desc: "High-capacity agentic reasoning" };
    if (low.includes("1.2")) return { name: "Spark 1.2", desc: "Fast answers" };
    if (low.includes("spark")) return { name: "Spark", desc: "Agentic help" };
  }
  return { name: String(id).replace(/^models\//, ""), desc: providerById(providerId).name };
}

const NOT_CHAT = /embed|whisper|tts|dall-e|moderation|image|audio|transcribe|realtime|rerank|guard|vision-preview|babbage|davinci/i;

function headers(provider, key) {
  const h = { "Content-Type": "application/json" };
  if (provider.kind === "anthropic") {
    h["x-api-key"] = key;
    h["anthropic-version"] = "2023-06-01";
    h["anthropic-dangerous-direct-browser-access"] = "true";
  } else if (key) h.Authorization = `Bearer ${key}`;
  return h;
}

export async function fetchModels(provider, key, cfg) {
  const base = baseUrlFor(provider, cfg);
  if (!base) throw new Error("Enter the base URL first");
  if (!key && !provider.custom) throw new Error("Key is empty");
  let res;
  try {
    res = await fetch(`${base}/models${provider.kind === "anthropic" ? "?limit=100" : ""}`, { headers: headers(provider, key) });
  } catch (e) {
    throw new Error(`Cannot reach ${new URL(base).host}. The provider may block direct browser calls (CORS), or you are offline.`);
  }
  if (!res.ok) {
    throw new Error(`${provider.name} ${res.status}${res.status === 401 || res.status === 403 ? ": key rejected" : ""}`);
  }
  const data = await res.json();
  const ids = (data?.data || data?.models || []).map((m) => (typeof m === "string" ? m : m.id || m.name)).filter(Boolean).map((id) => String(id).replace(/^models\//, "")).filter((id) => !NOT_CHAT.test(id));
  if (!ids.length) throw new Error("The provider returned no chat models");
  return [...new Set(ids)];
}

export function pickModelText(d) {
  if (!d) return "";
  if (typeof d === "string") return d;
  if (Array.isArray(d.content)) return d.content.map((p) => p?.text || "").join(""); // anthropic
  const c = d.choices?.[0];
  const m = c?.message?.content;
  if (typeof m === "string") return m;
  if (Array.isArray(m)) return m.map((p) => p?.text || "").join("");
  return c?.text || d.output_text || "";
}

/* ---------- anthropic message conversion ---------- */
function toAnthropic(messages) {
  const system = messages.filter((m) => m.role === "system").map((m) => (typeof m.content === "string" ? m.content : "")).join("\n\n");
  const out = [];
  for (const m of messages.filter((x) => x.role !== "system")) {
    const role = m.role === "assistant" ? "assistant" : "user";
    let content;
    if (Array.isArray(m.content)) {
      content = m.content
        .map((p) => {
          if (p.type === "image_url") {
            const mm = String(p.image_url?.url || "").match(/^data:(.+?);base64,(.+)$/);
            return mm ? { type: "image", source: { type: "base64", media_type: mm[1], data: mm[2] } } : null;
          }
          return { type: "text", text: p.text || "" };
        })
        .filter(Boolean);
    } else content = [{ type: "text", text: String(m.content ?? "") || "(empty)" }];
    const last = out[out.length - 1];
    if (last && last.role === role) last.content.push(...content);
    else out.push({ role, content });
  }
  if (out.length && out[0].role !== "user") out.unshift({ role: "user", content: [{ type: "text", text: "Begin." }] });
  return { system, messages: out };
}

async function readSSE(res, onEvent) {
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  const feed = (chunk) => {
    buf += chunk;
    const parts = buf.replace(/\r\n/g, "\n").split("\n\n");
    buf = parts.pop() || "";
    for (const part of parts) {
      for (const line of part.split("\n")) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        const payload = t.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          onEvent(JSON.parse(payload));
        } catch {}
      }
    }
  };
  for (;;) {
    const { done, value } = await reader.read();
    if (value) feed(dec.decode(value, { stream: true }));
    if (done) break;
  }
  feed("\n\n");
}

/**
 * One chat turn. messages: [{role, content}] in OpenAI shape (images as image_url parts).
 * Streams via onToken(chunk). Retries once on 5xx; Meta also falls back to sibling models on 400.
 */
export async function chat({ provider, key, model, baseUrl, messages, onToken, signal, maxTokens = 131072 }) {
  const base = String(baseUrl || provider.baseUrl).replace(/\/+$/, "");
  if (!base) throw new Error("No base URL set for this provider. Open More, then Settings, then AI.");
  if (!key && !provider.custom) throw new Error(`No ${provider.name} key yet. Open More, then Settings, then AI.`);

  const candidates =
    provider.id === "meta"
      ? [model, ...(String(model).includes("contributor") ? [String(model).replace("-contributor", "")] : []), "muse-spark-1.3", "muse-spark-1.2"].filter((m, i, a) => m && a.indexOf(m) === i)
      : [model];

  let lastErr = null;
  for (let attempt = 0; attempt < (provider.id === "meta" ? 3 : 2); attempt++) {
    if (signal?.aborted) throw new Error("Stopped.");
    const current = candidates[Math.min(attempt, candidates.length - 1)];
    try {
      let res;
      if (provider.kind === "anthropic") {
        const conv = toAnthropic(messages);
        res = await fetch(`${base}/messages`, {
          method: "POST",
          headers: headers(provider, key),
          body: JSON.stringify({ model: current, max_tokens: maxTokens, system: conv.system || undefined, messages: conv.messages, stream: true }),
          signal,
        });
      } else {
        res = await fetch(`${base}/chat/completions`, {
          method: "POST",
          headers: headers(provider, key),
          body: JSON.stringify({ model: current, messages: attempt >= 2 ? [messages[0], messages[messages.length - 1]] : messages, max_tokens: maxTokens, ...(attempt === 0 ? { stream: true } : {}) }),
          signal,
        });
      }
      if (!res.ok) {
        let detail = `${provider.name} ${res.status}`;
        try {
          const err = await res.json();
          detail += `: ${err?.error?.message || err?.message || JSON.stringify(err).slice(0, 160)}`;
        } catch {}
        if ((res.status === 400 && provider.id === "meta") || res.status >= 500) {
          lastErr = new Error(detail);
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
        throw new Error(detail);
      }

      const streaming = provider.kind === "anthropic" || attempt === 0;
      if (streaming && res.body?.getReader) {
        let full = "";
        let last = null;
        await readSSE(res, (d) => {
          last = d;
          let s = "";
          if (provider.kind === "anthropic") {
            if (d.type === "content_block_delta") s = d.delta?.text || "";
            if (d.type === "error") throw new Error(d.error?.message || "Anthropic stream error");
          } else {
            s = d.choices?.[0]?.delta?.content || (typeof d.choices?.[0]?.message?.content === "string" ? d.choices[0].message.content : "") || d.choices?.[0]?.delta?.text || d.choices?.[0]?.text || d.output_text || "";
          }
          if (s) {
            full += s;
            onToken?.(s, full);
          }
        });
        if (full.trim()) return full.trim();
        const t = pickModelText(last);
        if (t) return t;
        continue;
      }
      const data = await res.json();
      const text = pickModelText(data);
      if (text) {
        onToken?.(text, text);
        return text;
      }
      throw new Error("Empty model response");
    } catch (e) {
      if (signal?.aborted || e?.name === "AbortError") throw new Error("Stopped.");
      if (e instanceof TypeError) e = new Error(`Cannot reach ${new URL(base).host}. The provider may block direct browser calls (CORS), or you are offline.`);
      lastErr = e;
      if (attempt < 1 && /5\d\d/.test(String(e.message))) continue;
      throw e;
    }
  }
  throw lastErr || new Error(`${provider.name} failed after retries`);
}
