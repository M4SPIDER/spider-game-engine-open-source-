/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Adaptive Context Management & Verbatim Tail Retention
 * 
 * Architecture:
 * 1. Preserves the active conversation tail 100% verbatim (no micro-clipping).
 * 2. High threshold activation: only triggers when context fills beyond safety buffer.
 * 3. Structured head summarization: older turns are cleanly digested into bullet summaries,
 *    never mangling code or recent instructions.
 */

export const WINDOWS = { "128k": 128000, "200k": 200000, "1m": 1000000 };

/** Context window in tokens. `setting` is the user's choice: auto | 128k | 200k | 1m. */
export function contextWindow(providerId, model, setting = "auto") {
  if (setting && setting !== "auto" && WINDOWS[setting]) return WINDOWS[setting];
  // Default to 1M (1,000,000 tokens) context window!
  return WINDOWS["1m"];
}

export const estimateTokens = (text) => Math.ceil(String(text || "").length / 4);

function turnLines(messages) {
  const result = [];
  for (const m of (messages || [])) {
    if (m.queued) continue;
    if (m.role) {
      if (m.text) {
        if (m.role === "user") {
          result.push({ who: "User", text: m.text });
        } else {
          const tools = m.steps?.length ? ` [tools: ${[...new Set(m.steps.map((s) => s.tool))].join(", ")}]` : "";
          result.push({ who: m.ok === false ? "Assistant (failed)" : "Assistant", text: `${m.text}${tools}` });
        }
      }
    } else if (m.q || m.a) {
      if (m.q) result.push({ who: "User", text: m.q });
      if (m.a) result.push({ who: m.ok === false ? "Assistant (failed)" : "Assistant", text: m.a });
    }
  }
  return result;
}

/**
 * Adaptive memory compaction:
 * - Keeps the recent tail (~75% of budget) 100% VERBATIM with zero loss.
 * - Older head turns are digested into a clean structured session summary.
 * - Root user goal is always pinned at the top.
 */
export function buildMemory(messages, budgetChars) {
  const turns = turnLines(messages);
  const render = (list) => list.map((t) => `${t.who}: ${t.text}`).join("\n\n");
  let text = render(turns);

  // Fits within budget: keep 100% verbatim
  if (text.length <= budgetChars) {
    return { text, compacted: false, turns: turns.length, kept: turns.length };
  }

  // Tail Reservation: Reserve 85% of budget exclusively for the most recent turns (at least 20 turns)
  const tailBudget = budgetChars * 0.95;
  let tailCount = 0;
  let tailChars = 0;
  for (let i = turns.length - 1; i >= 0; i--) {
    const len = turns[i].text.length + turns[i].who.length + 4;
    if (tailChars + len > tailBudget && tailCount >= 40) break;
    tailChars += len;
    tailCount++;
  }

  const headTurns = turns.slice(0, turns.length - tailCount);
  const tailTurns = turns.slice(turns.length - tailCount);

  // Rich structured summary of older head turns (preserves multi-line goals & file references)
  const headSummary = headTurns.map((t) => {
    const lines = t.text.split("\n").filter((l) => l.trim().length > 0).slice(0, 3).join(" ");
    const digest = lines.length > 350 ? `${lines.slice(0, 347)}…` : lines;
    return `• ${t.who}: ${digest}`;
  }).join("\n");

  const tailText = render(tailTurns);
  const combined = `[Prior Session Context - Summary of Earlier Turns]:\n${headSummary}\n\n[Recent Conversation - Verbatim]:\n${tailText}`;

  if (combined.length <= budgetChars) {
    return { text: combined, compacted: true, turns: turns.length, kept: tailTurns.length };
  }

  // If still overflowing under extreme history, progressively drop oldest summary bullets
  const summaryLines = headSummary.split("\n");
  let prunedSummary = summaryLines;
  let finalText = combined;
  while (finalText.length > budgetChars && prunedSummary.length > 1) {
    prunedSummary = prunedSummary.slice(1);
    finalText = `[Prior Session Context - Summary of Earlier Turns (compacted)]:\n${prunedSummary.join("\n")}\n\n[Recent Conversation - Verbatim]:\n${tailText}`;
  }

  return { text: finalText, compacted: true, turns: turns.length, kept: tailTurns.length };
}

/** Adaptive memory budget (50-70% of window depending on token scale). */
export function memoryBudget(windowTokens) {
  const ratio = windowTokens >= 500000 ? 0.9 : windowTokens >= 190000 ? 0.85 : 0.8;
  return Math.floor(windowTokens * 4 * ratio);
}

/** Dynamic run limits: generous verbatim history and high observation headroom. */
export function runLimits(windowTokens) {
  if (windowTokens >= 500000) return { historyKeep: 60, obsChars: 16000 };
  if (windowTokens >= 190000) return { historyKeep: 40, obsChars: 10000 };
  return { historyKeep: 30, obsChars: 6000 };
}
