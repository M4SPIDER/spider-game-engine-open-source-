/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Pocket Studio: AI tab
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 */
import React, { useEffect, useRef, useState } from "react";
import { startVoice, voiceLang, voiceSupported } from "./voice.js";
import { hasMetaKey, museVoiceSupported, startMuseVoice } from "./meta.js";
import { ATTACH_ACCEPT, MAX_ATTACH, buildGoal, prepareAttachment } from "./attach.js";
import Markdown from "./Markdown.jsx";
import {
  ArrowUp, Mic, Check, RotateCcw, MoreHorizontal, Pencil, Copy, ChevronDown, FileCode2, History, KeyRound, Loader2, Plus, Shield, Square, Trash2, Undo2, X, Zap, AlertTriangle, Bot, Crown, Dices, Coins, Rocket,
} from "lucide-react";
import { Sheet, cx } from "./ui.jsx";

const QUICK = [
  { label: "Chess", icon: Crown, task: "3D chess board with full rules, tap pieces to move, blue restart button" },
  { label: "Ludo", icon: Dices, task: "3D ludo board 52 tiles staggered elevations, 4 colored pawns, tap dice to roll and tap pawn to move" },
  { label: "Coin arena", icon: Coins, task: "arena 20x20 green ground blue walls, ball hero, 8 gold coins, tap to jump swipe to steer, score HUD" },
  { label: "Shooter", icon: Rocket, task: "spaceship shooter, drag to move touch to shoot, enemies drones, score and lives HUD" },
];

function Step({ s }) {
  return (
    <span className={cx("sp-step", `is-${s.state}`)}>
      {s.state === "run" ? <Loader2 size={12} className="sp-spin" /> : s.state === "ok" ? <Check size={12} /> : <AlertTriangle size={12} />}
      {s.tool}
    </span>
  );
}

function Message({ m, last, onUndo, onRetry, busy, onMenu }) {
  const more = (
    <button type="button" className="sp-msg-more" onClick={() => onMenu(m)} aria-label="Message options">
      <MoreHorizontal size={16} />
    </button>
  );
  if (m.role === "user") {
    return (
      <div className="sp-msg is-user">
        <div className="sp-msg-text">
          <Markdown source={m.text} />
        </div>
        {m.queued && <small>queued: sent mid-run</small>}
        {more}
      </div>
    );
  }
  return (
    <div className={cx("sp-msg is-ai", m.ok === false && "is-bad")}>
      {!!m.steps?.length && (
        <div className="sp-steps">
          {m.steps.map((s, i) => (
            <Step key={i} s={{ ...s, state: s.state === "run" ? "ok" : s.state }} />
          ))}
        </div>
      )}
      <div className="sp-msg-text">
        <Markdown source={m.text} />
      </div>
      {!!m.images?.length && (
        <div className="sp-msg-images">
          {m.images.map((u, i) => <img key={i} src={u} alt="Created with Muse Image" />)}
        </div>
      )}
      {m.interrupted && last && (
        <button type="button" className="sp-btn is-primary" disabled={busy} onClick={() => onRetry(m.retryText)}>
          <RotateCcw size={15} /> Retry
        </button>
      )}
      {last && m.canUndo && (
        <button type="button" className="sp-link" onClick={onUndo}>
          <Undo2 size={14} /> Undo scene changes
        </button>
      )}
      {more}
    </div>
  );
}

export default function Chat({ s, onOpenSettings, notify, onShowStudio }) {
  const { session, sessions, busy, stream, permission, question, queued, settings, setSettings, hasKey } = s;
  const [text, setText] = useState("");
  const [sheet, setSheet] = useState(null); // 'history' | 'model'
  const end = useRef(null);
  const input = useRef(null);
  const [listening, setListening] = useState(false);
  const voice = useRef(null);
  const [files, setFiles] = useState([]);
  const [reading, setReading] = useState(false);
  const picker = useRef(null);
  const useMuse = settings.voiceEngine === "muse" || (settings.voiceEngine !== "browser" && hasMetaKey());
  const canVoice = (useMuse && museVoiceSupported()) || voiceSupported();

  const toggleVoice = () => {
    if (voice.current) {
      voice.current.stop();
      return;
    }
    const base = text.trim() ? `${text.trim()} ` : "";
    setListening(true);
    const handlers = {
      lang: voiceLang(settings.voiceLang),
      language: settings.voiceLang === "auto" ? undefined : settings.voiceLang,
      onText: (t) => {
        setText(base + t);
        requestAnimationFrame(() => grow(input.current));
      },
      onEnd: () => {
        voice.current = null;
        setListening(false);
      },
      onError: (m) => notify(m, "warn"),
    };
    if (useMuse && museVoiceSupported()) {
      // Muse Voice: the recording goes to Meta (muse-voice-transcribe-1.0); the handle arrives after the mic permission
      let handle = null;
      let stopAsked = false;
      voice.current = { stop: () => { stopAsked = true; handle?.stop(); } };
      startMuseVoice(handlers).then((h) => {
        handle = h;
        if (stopAsked) h.stop();
      });
    } else {
      voice.current = startVoice(handlers);
    }
  };
  useEffect(() => () => voice.current?.stop(), []);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [session.messages.length, stream?.thought, stream?.steps?.length, permission, question]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const onViewportResize = () => {
      end.current?.scrollIntoView({ block: "nearest" });
    };
    window.visualViewport.addEventListener("resize", onViewportResize);
    return () => window.visualViewport.removeEventListener("resize", onViewportResize);
  }, []);

  const grow = (el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  };

  const [menu, setMenu] = useState(null); // message whose options are open
  const [editing, setEditing] = useState(null); // user message being edited

  const startEdit = (m) => {
    setEditing(m);
    setText(m.text);
    setMenu(null);
    requestAnimationFrame(() => {
      grow(input.current);
      input.current?.focus();
    });
  };

  const pickFiles = async (list) => {
    const room = MAX_ATTACH - files.length;
    for (const f of [...list].slice(0, Math.max(0, room))) {
      try {
        const a = await prepareAttachment(f);
        setFiles((cur) => [...cur, a]);
      } catch (e) {
        notify(e.message, "warn");
      }
    }
    if (list.length > room) notify(`Up to ${MAX_ATTACH} attachments`, "warn");
  };

  const submit = async () => {
    const t = text.trim();
    if ((!t && !files.length) || reading) return;
    let goal = t || "Use the attached files.";
    if (files.length) {
      setReading(true);
      try {
        goal = await buildGoal(goal, files);
      } catch (e) {
        notify(e.message || "Could not read the attachment.", "warn");
        setReading(false);
        return;
      }
      setReading(false);
    }
    if (editing) {
      s.editAndSend(editing.id, goal);
      setEditing(null);
    } else s.send(goal);
    setText("");
    setFiles([]);
    requestAnimationFrame(() => grow(input.current));
  };

  const auto = settings.permission === "auto";
  const friendly = s.friendlyModel(s.model);
  const empty = session.messages.length === 0 && !busy;

  return (
    <section className="sp-chat">
      <header className="sp-chat-head">
        <button type="button" className="sp-model" onClick={() => setSheet("model")} aria-label="Choose model">
          <Bot size={16} />
          <span className="sp-model-name">
            <small>{s.provider.short || s.provider.name}</small>
            {friendly.name}
          </span>
          <ChevronDown size={14} />
        </button>
        <span className="sp-grow" />
        <button
          type="button"
          className={cx("sp-mode", auto && "is-auto")}
          onClick={() => setSettings({ permission: auto ? "ask" : "auto" })}
          aria-pressed={auto}
          title={auto ? "Auto: agent writes files without asking" : "Ask: agent asks before writing files"}
        >
          {auto ? <Zap size={14} /> : <Shield size={14} />}
          {auto ? "Auto" : "Ask first"}
        </button>
        <button type="button" className="sp-icon-btn" onClick={() => setSheet("history")} aria-label="Chat history">
          <History size={19} />
        </button>
        <button type="button" className="sp-icon-btn" onClick={s.startSession} aria-label="New chat">
          <Plus size={20} />
        </button>
      </header>

      <div className="sp-thread" role="log" aria-live="polite">
        {empty && (
          <div className="sp-ai-welcome">
            <span className="sp-ai-orb">
              <Bot size={26} />
            </span>
            <h2>What are we building?</h2>
            <p>Describe a game. The assistant writes the code, mounts it in the viewport and checks it for errors.</p>
            {!hasKey && (
              <button type="button" className="sp-keycard" onClick={onOpenSettings}>
                <KeyRound size={18} />
                <span>
                  <b>Add your {s.provider.short || s.provider.name} API key</b>
                  <small>Needed once, stays on this device</small>
                </span>
              </button>
            )}
            <div className="sp-quick">
              {QUICK.map((q) => (
                <button key={q.label} type="button" onClick={() => { setText(q.task); requestAnimationFrame(() => { grow(input.current); input.current?.focus(); }); }}>
                  <i><q.icon size={19} strokeWidth={1.8} /></i>
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {session.messages.map((m, i) => (
          <Message key={m.id} m={m} onMenu={setMenu} last={i === session.messages.length - 1} busy={busy} onRetry={s.send} onUndo={() => { s.undoAgent(); notify("Scene restored", "ok"); }} />
        ))}

        {busy && stream && (
          <div className="sp-msg is-ai is-live">
            {!!stream.steps?.length && (
              <div className="sp-steps">
                {stream.steps.map((st, i) => (
                  <Step key={i} s={st} />
                ))}
              </div>
            )}
            {stream.code && (
              <div className="sp-writing">
                <FileCode2 size={15} /> Writing <b>{stream.code.name}</b> · {stream.code.lines} lines
              </div>
            )}
            <p className="sp-thinking">
              <span className="sp-dots"><i /><i /><i /></span>
              {stream.thought}
            </p>
            {!!stream.code && (
              <button type="button" className="sp-link" onClick={onShowStudio}>
                Watch in Studio
              </button>
            )}
          </div>
        )}

        {permission && (
          <div className="sp-ask" role="alertdialog" aria-label="Permission request">
            <div className="sp-ask-head">
              <Shield size={16} /> <b>Allow {permission.tool}?</b>
            </div>
            <code>{String(permission.detail).slice(0, 160)}</code>
            <div className="sp-ask-actions">
              <button type="button" className="sp-btn" onClick={permission.deny}>
                <X size={15} /> Deny
              </button>
              <button type="button" className="sp-btn is-primary" onClick={permission.allow}>
                <Check size={15} /> Allow
              </button>
            </div>
          </div>
        )}

        {question && (
          <div className="sp-ask" role="group" aria-label="Agent question">
            <div className="sp-ask-head">
              <Bot size={16} /> <b>{question.question}</b>
            </div>
            <div className="sp-ask-opts">
              {question.options.map((o) => (
                <button key={o} type="button" className="sp-btn" onClick={() => question.answer(o)}>
                  {o}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={end} />
      </div>

      <div className="sp-composer">
        {editing && (
          <div className="sp-editing">
            <Pencil size={14} /> <span>Editing message. Sending replaces it and the replies after it.</span>
            <button type="button" className="sp-icon-btn" onClick={() => { setEditing(null); setText(""); }} aria-label="Cancel edit">
              <X size={16} />
            </button>
          </div>
        )}
        {!!queued.length && <div className="sp-queued">{queued.length} message{queued.length > 1 ? "s" : ""} queued</div>}
        {(files.length > 0 || reading) && (
          <div className="sp-attached">
            {files.map((a) => (
              <span key={a.id} className="sp-att">
                {a.kind === "image" ? <img src={a.dataUrl} alt="" /> : <FileCode2 size={15} />}
                <i>{a.name}</i>
                <button type="button" aria-label={`Remove ${a.name}`} onClick={() => setFiles((c) => c.filter((x) => x.id !== a.id))}><X size={13} /></button>
              </span>
            ))}
            {reading && <span className="sp-att is-busy"><Loader2 size={15} className="sp-spin" /> <i>Reading with Muse Spark…</i></span>}
          </div>
        )}
        <div className="sp-composer-row">
          <button type="button" className="sp-attach" onClick={() => picker.current?.click()} disabled={files.length >= MAX_ATTACH || reading} aria-label="Attach images or files" title="Attach images or files">
            <Plus size={20} />
          </button>
          <input ref={picker} type="file" multiple hidden accept={ATTACH_ACCEPT} onChange={(e) => { const l = e.target.files; if (l?.length) pickFiles(l); e.target.value = ""; }} />
          <textarea
            ref={input}
            rows={1}
            value={text}
            placeholder={listening ? "Listening…" : busy ? "Steer the agent…" : "Describe a game or change…"}
            onChange={(e) => {
              setText(e.target.value);
              grow(e.target);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            enterKeyHint="send"
            aria-label="Message"
          />
          {canVoice && (
            <button type="button" className={cx("sp-mic", listening && "is-on")} onClick={toggleVoice} aria-pressed={listening} aria-label={listening ? "Stop listening" : "Speak your prompt"}>
              <Mic size={20} />
            </button>
          )}
          {busy && !text.trim() ? (
            <button type="button" className="sp-send is-stop" onClick={s.stop} aria-label="Stop agent">
              <Square size={16} fill="currentColor" />
            </button>
          ) : (
            <button type="button" className="sp-send" onClick={submit} disabled={(!text.trim() && !files.length) || reading} aria-label="Send">
              <ArrowUp size={20} strokeWidth={2.4} />
            </button>
          )}
        </div>
      </div>

      <Sheet open={!!menu} onClose={() => setMenu(null)} title="Message" subtitle={menu ? (menu.role === "user" ? "You" : "Assistant") : ""}>
        {menu && (
          <div className="sp-menu">
            {menu.role === "user" && (
              <button type="button" disabled={busy} onClick={() => startEdit(menu)}>
                <Pencil size={18} /> Edit
              </button>
            )}
            {menu.role === "user" && (
              <button
                type="button"
                onClick={() => {
                  setText(menu.text);
                  setMenu(null);
                  requestAnimationFrame(() => {
                    grow(input.current);
                    input.current?.focus();
                  });
                }}
              >
                <RotateCcw size={18} /> Reuse
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(menu.text);
                setMenu(null);
                notify("Copied", "ok");
              }}
            >
              <Copy size={18} /> Copy
            </button>
            <button type="button" className="is-danger" onClick={() => { s.deleteMessage(menu.id); setMenu(null); notify("Deleted", "ok"); }}>
              <Trash2 size={18} /> Delete
            </button>
          </div>
        )}
      </Sheet>

      <Sheet open={sheet === "model"} onClose={() => setSheet(null)} title="Model" subtitle={s.modelsError || `${s.provider.name}`}>
        <div className="sp-stack-sm">
          <div className="sp-chips sp-chips-row" role="tablist" aria-label="Providers">
            {s.providers.map((p) => (
              <button key={p.id} type="button" role="tab" aria-selected={p.id === s.providerId} className={cx("sp-chip", p.id === s.providerId && "is-on")} onClick={() => s.setProvider(p.id)}>
                <i className={cx("sp-pdot", s.isConfigured(p.id) && "is-ok")} />
                {p.short || p.name}
              </button>
            ))}
          </div>
          {!s.hasKey ? (
            <div className="sp-empty">
              <h3>No {s.provider.short || s.provider.name} key</h3>
              <p>Add a key once and pick a model.</p>
              <button type="button" className="sp-btn is-primary" onClick={() => { setSheet(null); onOpenSettings(); }}>
                <KeyRound size={16} /> Add key
              </button>
            </div>
          ) : (
            <div className="sp-list">
              {s.models.map((id) => {
                const f = s.friendlyModel(id);
                return (
                  <button key={id} type="button" className={cx("sp-list-row", id === s.model && "is-on")} onClick={() => { s.setModel(id); setSheet(null); }}>
                    <span>
                      <b>{f.name}</b>
                      <small>{f.desc}</small>
                    </span>
                    {id === s.model && <Check size={18} />}
                  </button>
                );
              })}
              <button type="button" className="sp-link" onClick={() => { setSheet(null); onOpenSettings(); }}>
                More models and settings
              </button>
            </div>
          )}
        </div>
      </Sheet>

      <Sheet open={sheet === "history"} onClose={() => setSheet(null)} title="Chats">
        <div className="sp-list">
          {sessions.map((c) => (
            <div key={c.id} className={cx("sp-list-row", c.id === s.sessionId && "is-on")}>
              <button type="button" className="sp-list-main" onClick={() => { s.setSessionId(c.id); setSheet(null); }}>
                <b>{c.title}</b>
                <small>{c.messages.length} messages</small>
              </button>
              <button type="button" className="sp-icon-btn is-danger" onClick={() => s.deleteSession(c.id)} aria-label="Delete chat">
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      </Sheet>
    </section>
  );
}

