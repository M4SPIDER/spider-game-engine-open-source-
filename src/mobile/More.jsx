/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Pocket Studio: more tab
 * (projects, console, settings, licenses, about)
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 */
import React, { useEffect, useRef, useState } from "react";
import {
  ChevronLeft, ChevronRight, Download, HelpCircle, Eye, EyeOff, FileText, FolderKanban, Gamepad2, Hammer, Info, KeyRound, Palette,
  Plus, RefreshCw, Terminal, Trash2, Upload, Sun, CornerDownLeft, Settings as Cog, Check,
} from "lucide-react";
import { PLAYER, PRIMITIVE_SHAPES } from "../game/index.js";
import licenses from "../../THIRD_PARTY_LICENSES.md?raw";
import Markdown from "./Markdown.jsx";
import { TEMPLATES } from "./store.js";
import { Empty, Segmented, Sheet, TemplateIcon, Toggle, cx } from "./ui.jsx";

function Row({ icon: Icon, title, hint, onClick, tone }) {
  return (
    <button type="button" className={cx("sp-menu-row", tone)} onClick={onClick}>
      <span className="sp-menu-ico">
        <Icon size={19} />
      </span>
      <span className="sp-menu-text">
        <b>{title}</b>
        {hint && <small>{hint}</small>}
      </span>
      <ChevronRight size={17} />
    </button>
  );
}

function Back({ title, onBack, right }) {
  return (
    <header className="sp-page-head">
      <button type="button" className="sp-icon-btn" onClick={onBack} aria-label="Back">
        <ChevronLeft size={22} />
      </button>
      <h1>{title}</h1>
      <span className="sp-grow" />
      {right}
    </header>
  );
}

/* ----------------------------- Projects ----------------------------- */
function Projects({ s, onBack, notify, onOpened }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [tpl, setTpl] = useState("code");
  const [del, setDel] = useState(null);
  const file = useRef(null);

  return (
    <>
      <Back
        title="Projects"
        onBack={onBack}
        right={
          <button type="button" className="sp-btn is-primary" onClick={() => setCreating(true)}>
            <Plus size={16} /> New
          </button>
        }
      />
      <div className="sp-scroll">
        <ul className="sp-projects">
          {s.projects.map((p) => {
            const count = p.groups.reduce((n, g) => n + (g.children || []).length, 0);
            const cur = p.id === s.project.id;
            return (
              <li key={p.id} className={cx("sp-project", cur && "is-on")}>
                <button type="button" className="sp-project-main" onClick={() => { s.openProject(p.id); onOpened(); }}>
                  <span className="sp-project-art"><TemplateIcon id={p.template} /></span>
                  <span className="sp-project-text">
                    <b>{p.name}</b>
                    <small>
                      {count} objects · {p.files.length} file{p.files.length > 1 ? "s" : ""} · {new Date(p.updatedAt).toLocaleDateString()}
                    </small>
                  </span>
                  {cur && <span className="sp-badge">Open</span>}
                </button>
                <button type="button" className="sp-icon-btn is-danger" onClick={() => setDel(p)} aria-label={`Delete ${p.name}`}>
                  <Trash2 size={17} />
                </button>
              </li>
            );
          })}
        </ul>
        <div className="sp-row-actions">
          <button type="button" className="sp-btn" onClick={() => file.current?.click()}>
            <Upload size={16} /> Import project
          </button>
          <button type="button" className="sp-btn" onClick={() => { s.exportProject(); notify("Project exported", "ok"); }}>
            <Download size={16} /> Export current
          </button>
        </div>
        <input
          ref={file}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            try {
              await s.importProject(f);
              notify("Project imported", "ok");
              onOpened();
            } catch (err) {
              notify(`Import failed: ${err.message}`, "warn");
            }
          }}
        />
      </div>

      <Sheet open={creating} onClose={() => setCreating(false)} title="New project" tall>
        <form
          className="sp-stack"
          onSubmit={(e) => {
            e.preventDefault();
            s.createProject(name, tpl);
            setCreating(false);
            setName("");
            notify("Project created", "ok");
            onOpened();
          }}
        >
          <label className="sp-field">
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My game" autoFocus enterKeyHint="done" />
          </label>
          <div className="sp-field">
            <span>Template</span>
            <div className="sp-tpls" role="radiogroup" aria-label="Template">
              {TEMPLATES.map((t) => (
                <button key={t.id} type="button" role="radio" aria-checked={tpl === t.id} className={cx("sp-tpl", tpl === t.id && "is-on")} onClick={() => setTpl(t.id)}>
                  <i><TemplateIcon id={t.id} /></i>
                  <b>{t.name}</b>
                  <small>{t.blurb}</small>
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="sp-btn is-primary is-block">
            <Check size={16} /> Create project
          </button>
        </form>
      </Sheet>

      <Sheet open={!!del} onClose={() => setDel(null)} title={`Delete “${del?.name}”?`} subtitle="This can't be undone.">
        <div className="sp-row-actions">
          <button type="button" className="sp-btn" onClick={() => setDel(null)}>Cancel</button>
          <button type="button" className="sp-btn is-danger" onClick={() => { s.deleteProject(del.id); setDel(null); notify("Project deleted", "ok"); }}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </Sheet>
    </>
  );
}

/* ----------------------------- Console ----------------------------- */
function Console({ s, onBack }) {
  const [filter, setFilter] = useState("All");
  const [cmd, setCmd] = useState("");
  const end = useRef(null);
  const rows = s.logs.filter((l) => filter === "All" || l.level === filter);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [rows.length]);

  const run = (e) => {
    e.preventDefault();
    const c = cmd.trim();
    if (!c) return;
    s.log("Info", `> ${c}`);
    const [base, ...rest] = c.toLowerCase().split(/\s+/);
    const arg = rest.join(" ");
    if (base === "help") s.log("Info", "Commands: help, clear, stat fps, spawn <name>, wireframe 0|1, shadows 0|1, time <4-22>, play, stop");
    else if (base === "stat" && rest[0] === "fps") s.log("Info", `Frame rate: ${s.fps} fps`);
    else if (base === "spawn") {
      const pool = arg && arg !== "random" ? PRIMITIVE_SHAPES.filter((a) => a.name.toLowerCase().includes(arg) || a.shape.toLowerCase().includes(arg)) : PRIMITIVE_SHAPES;
      if (!pool.length) s.log("Warning", `No shape matches '${arg}'. Try box, sphere, cylinder, cone, torus, ramp.`);
      else s.spawn(pool[Math.floor(Math.random() * pool.length)]);
    } else if (base === "wireframe") s.setSettings({ viewMode: arg === "0" ? "Lit" : "Wireframe" });
    else if (base === "shadows") s.setSettings({ rtx: arg !== "0" });
    else if (base === "time") {
      const t = Number(arg);
      if (Number.isFinite(t) && t >= 4 && t <= 22) s.setTimeOfDay(t);
      else s.log("Warning", "Usage: time <4-22>");
    } else if (base === "play") !s.isPlaying && s.togglePlay();
    else if (base === "stop") s.isPlaying && s.togglePlay();
    else if (base === "clear") s.setLogs([]);
    else s.log("Warning", `Unknown command '${c}'. Type help.`);
    setCmd("");
  };

  return (
    <>
      <Back title="Console" onBack={onBack} right={<button type="button" className="sp-btn" onClick={() => s.setLogs([])}>Clear</button>} />
      <Segmented label="Log filter" value={filter} onChange={setFilter} size="sm" options={["All", "Info", "Success", "Warning"]} />
      <div className="sp-console" role="log">
        {!rows.length && <p className="sp-muted">Nothing here yet.</p>}
        {rows.map((l) => (
          <div key={l.id} className={cx("sp-log", `is-${l.level.toLowerCase()}`)}>
            <time>{new Date(l.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time>
            <span>{l.text}</span>
          </div>
        ))}
        <div ref={end} />
      </div>
      <form className="sp-cmd" onSubmit={run}>
        <Terminal size={16} />
        <input value={cmd} onChange={(e) => setCmd(e.target.value)} placeholder="Type a command (help)" autoCapitalize="off" autoCorrect="off" spellCheck={false} enterKeyHint="send" aria-label="Console command" />
        <button type="submit" className="sp-icon-btn" aria-label="Run">
          <CornerDownLeft size={18} />
        </button>
      </form>
    </>
  );
}

/* ----------------------------- AI providers ----------------------------- */
function AiSettings({ s, notify }) {
  const { settings, setSettings, provider } = s;
  const [keyInput, setKeyInput] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [urlDraft, setUrlDraft] = useState(s.baseUrl);
  const [modelDraft, setModelDraft] = useState("");
  useEffect(() => {
    setKeyInput("");
    setUrlDraft(s.baseUrl);
    setModelDraft("");
  }, [s.providerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveKey = async (e) => {
    e.preventDefault();
    if (provider.custom && urlDraft !== s.baseUrl) s.setBaseUrl(urlDraft);
    if (!keyInput.trim() && !provider.custom) return;
    setBusy(true);
    const ok = await s.setProviderKey(provider.id, keyInput);
    setBusy(false);
    setKeyInput("");
    notify(ok ? "Key saved" : "Saved, but models could not be loaded", ok ? "ok" : "warn");
  };

  return (
    <section className="sp-card sp-stack-sm">
      <h3 className="sp-h3"><KeyRound size={16} /> AI providers</h3>

      <div className="sp-field">
        <span>Provider</span>
        <div className="sp-chips" role="listbox" aria-label="Provider">
          {s.providers.map((p) => (
            <button key={p.id} type="button" role="option" aria-selected={p.id === s.providerId} className={cx("sp-chip", p.id === s.providerId && "is-on")} onClick={() => s.setProvider(p.id)}>
              <i className={cx("sp-pdot", s.isConfigured(p.id) && "is-ok")} />
              {p.short || p.name}
            </button>
          ))}
        </div>
        <small className="sp-muted">The green dot marks providers with a saved key. The one you pick here is used by the AI tab.</small>
      </div>

      <form className="sp-stack-sm" onSubmit={saveKey}>
        {provider.custom && (
          <label className="sp-field">
            <span>Base URL</span>
            <input value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} placeholder="https://host/v1" inputMode="url" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
          </label>
        )}
        <label className="sp-field">
          <span>{provider.name} API key {s.providerKey && <em className="sp-ok">saved</em>}</span>
          <div className="sp-keyrow">
            <input
              type={show ? "text" : "password"}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder={s.providerKey ? "••••••••  paste to replace" : provider.keyHint}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="button" className="sp-icon-btn" onClick={() => setShow(!show)} aria-label={show ? "Hide key" : "Show key"}>
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        <div className="sp-row-actions">
          <button type="submit" className="sp-btn is-primary" disabled={busy || (!provider.custom && !keyInput.trim())}>
            <KeyRound size={16} /> {busy ? "Checking…" : "Save and load models"}
          </button>
          {s.providerKey && (
            <button type="button" className="sp-btn is-danger" onClick={() => { s.setProviderKey(provider.id, ""); notify("Key removed", "ok"); }}>
              Remove
            </button>
          )}
        </div>
        {s.modelsError && <div className="sp-error">{s.modelsError}</div>}
        <small className="sp-muted">Keys stay in this browser and go only to {provider.custom ? "your base URL" : new URL(provider.baseUrl).host}. If a provider blocks direct browser calls, use OpenRouter or your own proxy as Custom.</small>
      </form>

      <div className="sp-field">
        <span>Model</span>
        <div className="sp-list">
          {s.models.map((id) => {
            const f = s.friendlyModel(id);
            return (
              <button key={id} type="button" className={cx("sp-list-row", id === s.model && "is-on")} onClick={() => s.setModel(id)}>
                <span>
                  <b>{f.name}</b>
                  <small>{f.desc}</small>
                </span>
                {id === s.model && <Check size={18} />}
              </button>
            );
          })}
        </div>
        <div className="sp-keyrow">
          <input value={modelDraft} onChange={(e) => setModelDraft(e.target.value)} placeholder="Or type any model id" autoCapitalize="off" autoCorrect="off" spellCheck={false} enterKeyHint="done" />
          <button type="button" className="sp-btn" disabled={!modelDraft.trim()} onClick={() => { s.setModel(modelDraft.trim()); setModelDraft(""); notify("Model set", "ok"); }}>
            Use
          </button>
        </div>
        <button type="button" className="sp-btn" disabled={s.loadingModels || (!s.providerKey && !provider.custom)} onClick={async () => notify((await s.refreshModels()) ? "Models updated" : "Could not load models", "ok")}>
          <RefreshCw size={16} /> {s.loadingModels ? "Loading…" : "Refresh model list"}
        </button>
      </div>

      <div className="sp-field">
        <span>Context window</span>
        <Segmented label="Context window" value={settings.contextWindow || "auto"} onChange={(contextWindow) => setSettings({ contextWindow })} options={[{ value: "auto", label: "Auto" }, { value: "128k", label: "128K" }, { value: "200k", label: "200K" }, { value: "1m", label: "1M" }]} />
        <small className="sp-muted">How much text the agent may keep in mind. Earlier chat is compacted automatically before it fills the window. Auto uses 1M for Meta Muse, Gemini and GPT-4.1, 200K for Claude and 128K for others.</small>
      </div>

      <div className="sp-field">
        <span>Voice input language</span>
        <Segmented label="Voice language" value={settings.voiceLang} onChange={(voiceLang) => setSettings({ voiceLang })} options={[{ value: "auto", label: "Auto" }, { value: "en", label: "English" }, { value: "ru", label: "Русский" }]} />
        <small className="sp-muted">The mic button in the AI tab uses your browser's speech recognition (Chrome, Edge, Safari).</small>
      </div>

      <div className="sp-field">
        <span>Agent permissions</span>
        <Segmented label="Permissions" value={settings.permission} onChange={(permission) => setSettings({ permission })} options={[{ value: "ask", label: "Ask first" }, { value: "auto", label: "Auto" }]} />
        <small className="sp-muted">{settings.permission === "ask" ? "The agent asks before writing, editing or deleting files." : "The agent edits files without asking. Use for fast prototypes."}</small>
      </div>
    </section>
  );
}

/* ----------------------------- Settings ----------------------------- */
function Settings({ s, onBack, notify }) {
  const [keyInput, setKeyInput] = useState("");
  const [show, setShow] = useState(false);
  const [checking, setChecking] = useState(false);
  const { settings, setSettings } = s;

  return (
    <>
      <Back title="Settings" onBack={onBack} />
      <div className="sp-scroll sp-stack">
        <section className="sp-card sp-stack-sm">
          <h3 className="sp-h3"><Palette size={16} /> Appearance</h3>
          <Toggle
            checked={settings.theme === "dark"}
            onChange={(on) => setSettings({ theme: on ? "dark" : "light" })}
            label="Dark theme"
            hint="Off = light theme"
          />
          <Toggle checked={settings.haptics} onChange={(haptics) => setSettings({ haptics })} label="Haptics" hint="Light vibration on taps and pickups" />
        </section>

        <section className="sp-card sp-stack-sm">
          <h3 className="sp-h3"><Sun size={16} /> Rendering</h3>
          <Toggle checked={settings.rtx} onChange={(rtx) => setSettings({ rtx })} label="Real-time shadows" />
          <Toggle checked={settings.grid} onChange={(grid) => setSettings({ grid })} label="Helper grid" />
        </section>

        <section className="sp-card sp-stack-sm">
          <h3 className="sp-h3"><Gamepad2 size={16} /> Play &amp; game</h3>
          <dl className="sp-kv">
            <dt>Move step</dt><dd>{PLAYER.moveStep}/tick</dd>
            <dt>Jump impulse</dt><dd>{PLAYER.jumpImpulse}</dd>
            <dt>Gravity</dt><dd>{PLAYER.gravity}</dd>
            <dt>Score</dt><dd>{s.score}</dd>
            <dt>Coins left</dt><dd>{s.coins.filter((c) => !c.taken).length}</dd>
          </dl>
          <button type="button" className="sp-btn" onClick={() => { s.resetScore(); notify("Score reset", "ok"); }}>Reset score</button>
        </section>

        <section className="sp-card sp-stack-sm">
          <h3 className="sp-h3"><FolderKanban size={16} /> Scene &amp; data</h3>
          <Toggle checked={settings.autosave} onChange={(autosave) => setSettings({ autosave })} label="Autosave to this device" hint="Projects, code and chats" />
          <div className="sp-row-actions">
            <button type="button" className="sp-btn" onClick={() => { s.exportProject(); notify("Exported", "ok"); }}><Download size={16} /> Export</button>
            <button type="button" className="sp-btn" onClick={() => { s.exportStandalone(); notify("Component saved", "ok"); }}><Hammer size={16} /> Build JSX</button>
          </div>
        </section>

        <AiSettings s={s} notify={notify} />
      </div>
    </>
  );
}

/* ----------------------------- About / licenses ----------------------------- */
function About({ onBack }) {
  const [lic, setLic] = useState(false);
  return (
    <>
      <Back title="About" onBack={onBack} />
      <div className="sp-scroll sp-stack">
        <div className="sp-about">
          <span className="sp-logo">S</span>
          <h2>Spider Engine</h2>
          <p>v0.9.0 · Pocket Studio · WebGL</p>
        </div>
        <p className="sp-muted">
          An agentic 3D game engine on React, Three.js and WebGL. Games created or run with this engine are strictly at your own risk.
        </p>
        <dl className="sp-kv">
          <dt>Author</dt><dd>M4SPIDER</dd>
          <dt>License</dt><dd>MIT</dd>
          <dt>Lineage</dt><dd>M4SPIDER · DarQQ</dd>
          <dt>GitHub</dt><dd><a className="sp-link-inline" href="https://github.com/DimkaQQ" target="_blank" rel="noopener noreferrer">github.com/DimkaQQ</a></dd>
        </dl>
        <Row icon={FileText} title="Third-party licenses" hint="Open-source notices" onClick={() => setLic(true)} />
      </div>
      <Sheet open={lic} onClose={() => setLic(false)} title="Licenses" tall>
        <div className="sp-licenses"><Markdown source={licenses} /></div>
      </Sheet>
    </>
  );
}

/* ----------------------------- Hub ----------------------------- */
export default function More({ s, notify, onTour, onOpened, initialPage = null, onPageChange }) {
  const [page, setPageState] = useState(initialPage);
  const setPage = (p) => {
    setPageState(p);
    onPageChange?.(p);
  };
  useEffect(() => setPageState(initialPage), [initialPage]);

  const warnings = s.logs.filter((l) => l.level === "Warning").length;
  return (
    <section className="sp-page">
      {page === null && (
        <>
          <header className="sp-page-head">
            <h1>More</h1>
          </header>
          <div className="sp-scroll">
            <button type="button" className="sp-current" onClick={() => setPage("projects")}>
              <span className="sp-project-art"><TemplateIcon id={s.project.template} /></span>
              <span className="sp-project-text">
                <small>Current project</small>
                <b>{s.project.name}</b>
              </span>
              <ChevronRight size={18} />
            </button>
            <div className="sp-menu-list">
              <Row icon={FolderKanban} title="Projects" hint={`${s.projects.length} on this device`} onClick={() => setPage("projects")} />
              <Row icon={Terminal} title="Console" hint={warnings ? `${warnings} warning${warnings > 1 ? "s" : ""}` : "Logs and commands"} onClick={() => setPage("console")} />
              <Row icon={Cog} title="Settings" hint="Appearance, rendering, AI keys" onClick={() => setPage("settings")} />
              <Row icon={HelpCircle} title="Help" hint="Quick tour of the app" onClick={() => onTour?.()} />
              <Row icon={Info} title="About" hint="Version and licenses" onClick={() => setPage("about")} />
            </div>
          </div>
        </>
      )}
      {page === "projects" && <Projects s={s} notify={notify} onBack={() => setPage(null)} onOpened={() => { setPage(null); onOpened(); }} />}
      {page === "console" && <Console s={s} onBack={() => setPage(null)} />}
      {page === "settings" && <Settings s={s} notify={notify} onBack={() => setPage(null)} />}
      {page === "about" && <About onBack={() => setPage(null)} />}
    </section>
  );
}

export { Empty };
