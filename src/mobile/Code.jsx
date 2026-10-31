/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Pocket Studio: code tab
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { highlight, highlightLines } from "./highlight.js";
import { AlignLeft, Check, ClipboardCopy, WrapText, FilePlus2, Pencil, Play, RotateCcw, Square, Trash2, Wand2, Copy as CopyIcon, Download, Code2, Cpu, FileText } from "lucide-react";
import { STARTER_CODE, download } from "./store.js";
import { transpileJsxToCpp, transpileJsxToSpy, generateCMakeLists } from "../engine/spiderCppExporter.js";
import { Sheet, cx } from "./ui.jsx";

const SNIPPETS = [
  { label: "Box", code: `<mesh position={[0,0.5,0]} castShadow>\n  <boxGeometry args={[1,1,1]} />\n  <meshStandardMaterial color="#3b82f6" />\n</mesh>` },
  { label: "Ball", code: `<mesh position={[0,0.5,0]} castShadow>\n  <sphereGeometry args={[0.5,20,20]} />\n  <meshStandardMaterial color="#ef4444" />\n</mesh>` },
  { label: "Light", code: `<directionalLight position={[8,16,10]} intensity={1.5} castShadow />` },
  { label: "Ground", code: `<mesh rotation-x={-Math.PI/2} receiveShadow>\n  <planeGeometry args={[20,20]} />\n  <meshStandardMaterial color="#15803d" />\n</mesh>` },
  { label: "useFrame", code: `useFrame((_, dt) => {\n  // runs every frame\n});` },
  { label: "Tap", code: `onPointerDown={(e) => { e.stopPropagation(); /* tap */ }}` },
];

const KEYS = ["Tab", "{", "}", "(", ")", "<", ">", "/", "=", '"', ";", "[", "]", "$"];

/**
 * Break dense one-line code into readable lines. Aware of strings, template literals,
 * comments and parentheses (so `for (a; b; c)` stays on one line). Not a full prettier.
 */
function formatCode(src) {
  let out = "";
  let depth = 0;
  let paren = 0;
  let i = 0;
  const nl = () => {
    out = out.replace(/[ \t]+$/, "");
    if (!out.endsWith("\n")) out += "\n";
    out += "  ".repeat(Math.max(0, depth));
  };
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (c === "/" && n === "/") {
      const e = src.indexOf("\n", i);
      const end = e === -1 ? src.length : e;
      out += src.slice(i, end);
      i = end;
      continue;
    }
    if (c === "/" && n === "*") {
      const e = src.indexOf("*/", i + 2);
      const end = e === -1 ? src.length : e + 2;
      out += src.slice(i, end);
      i = end;
      continue;
    }
    if (c === "'" || c === '"' || c === "`") {
      let j = i + 1;
      while (j < src.length && src[j] !== c) j += src[j] === "\\" ? 2 : 1;
      out += src.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (c === "(") paren++;
    if (c === ")") paren = Math.max(0, paren - 1);
    if (c === "\n") {
      out += c + "  ".repeat(Math.max(0, depth));
      i++;
      while (src[i] === " " || src[i] === "\t") i++;
      continue;
    }
    if (c === "{" && paren === 0) {
      depth++;
      out += c;
      i++;
      if (src[i] !== "}") nl();
      continue;
    }
    if (c === "}" && paren === 0) {
      depth = Math.max(0, depth - 1);
      nl();
      out += c;
      i++;
      if (src[i] === ";" || src[i] === ",") { out += src[i]; i++; }
      if (src[i] !== undefined && src[i] !== ")" && src[i] !== "\n") nl();
      continue;
    }
    if (c === ";" && paren === 0) {
      out += c;
      i++;
      while (src[i] === " ") i++;
      if (src[i] !== "\n" && src[i] !== undefined) nl();
      continue;
    }
    out += c;
    i++;
  }
  return out.replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

export default function Code({ s, notify }) {
  const { files, activeJsxName, codeError } = s;
  const [active, setActive] = useState(() => s.project.mountedFile || files[0]?.name);
  const [draft, setDraft] = useState("");
  const [dirty, setDirty] = useState(false);
  const [menu, setMenu] = useState(false);
  const [beforeFormat, setBeforeFormat] = useState(null);
  const wrap = s.settings.wrapCode !== false;
  const [dialog, setDialog] = useState(null); // {type:'new'|'rename', value}
  const gutter = useRef(null);
  const area = useRef(null);
  const hl = useRef(null);

  const file = files.find((f) => f.name === active) || files[0];

  useEffect(() => {
    if (!files.find((f) => f.name === active)) setActive(files[0]?.name);
  }, [files, active]);

  // pull the file into the editor when it changes underneath us (switch tab, AI edit)
  useEffect(() => {
    if (!dirty) setDraft(file?.content ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?.name, file?.content]);

  const switchTo = (name) => {
    if (dirty && file) s.saveFile(file.name, draft);
    setDirty(false);
    setActive(name);
  };

  // autosave typing
  useEffect(() => {
    if (!file || !dirty) return undefined;
    const t = setTimeout(() => {
      s.saveFile(file.name, draft);
      setDirty(false);
    }, 600);
    return () => clearTimeout(t);
  }, [draft, dirty, file, s]);

  const lines = draft.split("\n").length;
  const html = useMemo(
    () =>
      wrap
        ? highlightLines(draft)
            .map((l, i) => `<div class="hl-line" data-n="${i + 1}">${l || "&#8203;"}</div>`)
            .join("")
        : highlight(draft),
    [draft, wrap]
  );
  const syncScroll = (el) => {
    if (gutter.current) gutter.current.scrollTop = el.scrollTop;
    if (hl.current) hl.current.style.transform = `translate(${-el.scrollLeft}px, ${-el.scrollTop}px)`;
  };
  const mounted = activeJsxName === file?.name;

  const insertAtCursor = (text) => {
    const el = area.current;
    if (!el) return;
    const a = el.selectionStart ?? draft.length;
    const b = el.selectionEnd ?? a;
    const ins = text === "Tab" ? "  " : text;
    const next = draft.slice(0, a) + ins + draft.slice(b);
    setDraft(next);
    setDirty(true);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = a + ins.length;
    });
  };

  const insertSnippet = (code) => {
    const marker = "    </group>";
    const idx = draft.lastIndexOf(marker);
    const block = `      ${code.split("\n").join("\n      ")}\n`;
    const next = idx === -1 ? `${draft}\n${code}\n` : draft.slice(0, idx) + block + draft.slice(idx);
    setDraft(next);
    setDirty(true);
    notify("Snippet added", "ok");
  };

  const render = () => {
    const r = s.mountCode(file.name, draft);
    setDirty(false);
    if (r.ok) notify("Mounted in viewport", "ok");
    else notify("Compile error", "warn");
    return r.ok;
  };

  if (!file) {
    return (
      <section className="sp-page">
        <header className="sp-page-head">
          <h1>Code</h1>
        </header>
        <button type="button" className="sp-btn is-primary" onClick={() => setDialog({ type: "new", value: "GameComponent.jsx" })}>
          <FilePlus2 size={16} /> New file
        </button>
      </section>
    );
  }

  return (
    <section className="sp-code-page">
      <div className="sp-filebar" role="tablist" aria-label="Project files">
        {files.map((f) => (
          <button
            key={f.name}
            type="button"
            role="tab"
            aria-selected={f.name === file.name}
            className={cx("sp-file", f.name === file.name && "is-on")}
            onClick={() => switchTo(f.name)}
          >
            {f.name === activeJsxName && <i className="sp-live" title="Mounted" />}
            {f.name}
          </button>
        ))}
        <button type="button" className="sp-file is-add" onClick={() => setDialog({ type: "new", value: "" })} aria-label="New file">
          <FilePlus2 size={16} />
        </button>
      </div>

      <div className="sp-code-bar">
        <button type="button" className="sp-btn is-primary" onClick={render}>
          <Play size={16} /> Render
        </button>
        {mounted && (
          <button type="button" className="sp-btn" onClick={() => { s.unmountCode(); notify("Unmounted", "ok"); }}>
            <Square size={15} /> Unmount
          </button>
        )}
        <span className="sp-grow" />
        <span className="sp-save-state">{dirty ? "Saving…" : "Saved"}</span>
        <button type="button" className="sp-icon-btn" onClick={() => setMenu(true)} aria-label="File actions">
          <Wand2 size={18} />
        </button>
      </div>

      {codeError && <div className="sp-error" role="alert">{codeError}</div>}

      <div className="sp-snippets" role="toolbar" aria-label="Snippets">
        {SNIPPETS.map((x) => (
          <button key={x.label} type="button" className="sp-chip" onClick={() => insertSnippet(x.code)}>
            + {x.label}
          </button>
        ))}
      </div>

      <div className="sp-editor">
        {!wrap && (
          <div className="sp-gutter" ref={gutter} aria-hidden="true">
            <pre>{Array.from({ length: lines }, (_, i) => i + 1).join("\n")}</pre>
          </div>
        )}
        <div className="sp-code-stack">
        <pre ref={hl} className={cx("sp-hl", wrap && "is-wrap")} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
        <textarea
          ref={area}
          className={cx("sp-textarea", wrap && "is-wrap has-nums")}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setDirty(true);
          }}
          onScroll={(e) => syncScroll(e.currentTarget)}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              insertAtCursor("Tab");
            }
          }}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          wrap={wrap ? "soft" : "off"}
          aria-label={`Editing ${file.name}`}
        />
        </div>
      </div>

      <div className="sp-keys" role="toolbar" aria-label="Code keys">
        {KEYS.map((k) => (
          <button key={k} type="button" onPointerDown={(e) => e.preventDefault()} onClick={() => insertAtCursor(k)}>
            {k === "Tab" ? "⇥" : k}
          </button>
        ))}
      </div>

      <Sheet open={menu} onClose={() => setMenu(false)} title={file.name} subtitle={`${lines} lines`}>
        <div className="sp-menu">
          <button type="button" onClick={() => { navigator.clipboard?.writeText(draft); setMenu(false); notify("Copied", "ok"); }}>
            <ClipboardCopy size={18} /> Copy code
          </button>
          <button
            type="button"
            onClick={() => {
              download(file.name || "GameComponent.jsx", draft, "text/javascript");
              setMenu(false);
              notify(`Downloaded ${file.name}`, "ok");
            }}
          >
            <Download size={18} /> Download JSX (.jsx)
          </button>
          <button
            type="button"
            onClick={() => {
              const baseName = (file.name || "GameComponent").replace(/\.[^/.]+$/, "");
              const cpp = transpileJsxToCpp(draft, baseName);
              download(`${baseName}_native.cpp`, cpp, "text/x-c++src");
              setMenu(false);
              notify(`Exported ${baseName}_native.cpp`, "ok");
            }}
          >
            <Code2 size={18} /> Export Native C++ (.cpp)
          </button>
          <button
            type="button"
            onClick={() => {
              const baseName = (file.name || "GameComponent").replace(/\.[^/.]+$/, "");
              const spy = transpileJsxToSpy(draft, baseName);
              download(`${baseName}.spy`, spy, "text/plain");
              setMenu(false);
              notify(`Exported ${baseName}.spy`, "ok");
            }}
          >
            <Cpu size={18} /> Export SPY Script (.spy)
          </button>
          <button
            type="button"
            onClick={() => {
              const baseName = (file.name || "GameComponent").replace(/\.[^/.]+$/, "");
              const cmake = generateCMakeLists(baseName);
              download("CMakeLists.txt", cmake, "text/plain");
              setMenu(false);
              notify("Exported CMakeLists.txt", "ok");
            }}
          >
            <FileText size={18} /> Export CMake Project
          </button>
          <button type="button" onClick={() => { s.setSettings({ wrapCode: !wrap }); setMenu(false); }}>
            <WrapText size={18} /> Wrap long lines: {wrap ? "on" : "off"}
          </button>
          <button type="button" onClick={() => { setBeforeFormat(draft); setDraft(formatCode(draft)); setDirty(true); setMenu(false); notify("Formatted", "ok"); }}>
            <AlignLeft size={18} /> Format code (one statement per line)
          </button>
          {beforeFormat != null && (
            <button type="button" onClick={() => { setDraft(beforeFormat); setDirty(true); setBeforeFormat(null); setMenu(false); notify("Format undone", "ok"); }}>
              <RotateCcw size={18} /> Undo format
            </button>
          )}
          <button type="button" onClick={() => { setMenu(false); setDialog({ type: "rename", value: file.name }); }}>
            <Pencil size={18} /> Rename
          </button>
          <button type="button" onClick={() => { const n = s.createFile(file.name.replace(/(\.\w+)$/, "_copy$1"), draft); setActive(n); setMenu(false); notify("Duplicated", "ok"); }}>
            <CopyIcon size={18} /> Duplicate
          </button>
          <button type="button" onClick={() => { setDraft(STARTER_CODE); setDirty(true); setMenu(false); }}>
            <RotateCcw size={18} /> Reset to starter
          </button>
          <button type="button" className="is-danger" disabled={files.length < 2} onClick={() => { s.deleteFile(file.name); setMenu(false); notify("File deleted", "ok"); }}>
            <Trash2 size={18} /> Delete file
          </button>
        </div>
      </Sheet>

      <Sheet open={!!dialog} onClose={() => setDialog(null)} title={dialog?.type === "new" ? "New file" : "Rename file"}>
        {dialog && (
          <form
            className="sp-stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (!dialog.value.trim()) return;
              if (dialog.type === "new") {
                const n = s.createFile(dialog.value);
                setActive(n);
              } else {
                s.renameFile(file.name, dialog.value);
                setActive(dialog.value.trim().replace(/[^\w.\-]/g, "_"));
              }
              setDialog(null);
            }}
          >
            <label className="sp-field">
              <span>File name</span>
              <input autoFocus value={dialog.value} onChange={(e) => setDialog({ ...dialog, value: e.target.value })} placeholder="Player.jsx" autoCapitalize="off" autoCorrect="off" spellCheck={false} enterKeyHint="done" />
            </label>
            <button type="submit" className="sp-btn is-primary is-block">
              <Check size={16} /> {dialog.type === "new" ? "Create" : "Rename"}
            </button>
          </form>
        )}
      </Sheet>
    </section>
  );
}

