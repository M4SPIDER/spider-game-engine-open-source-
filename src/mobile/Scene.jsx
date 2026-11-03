/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Pocket Studio: scene tab (hierarchy + library)
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 */
import React, { useMemo, useRef, useState } from "react";
import { Boxes, ChevronDown, Upload, ChevronRight, Copy, Eye, EyeOff, MoreHorizontal, Plus, Search, Trash2, Pencil, Crosshair, Sparkles } from "lucide-react";
import { PRIMITIVE_SHAPES } from "../game/index.js";
import { Empty, Segmented, Sheet, cx } from "./ui.jsx";
import MetaCreate from "./MetaCreate.jsx";

const GLYPH = {
  box: "▣", sphere: "●", cylinder: "▮", cone: "▲", torus: "◎", ramp: "◢", platform: "▬",
  pawn: "♟", knight: "♞", bishop: "♝", rook: "♜", queen: "♛", king: "♚", chessboard: "▦",
};

function NodeRow({ n, active, onSelect, onToggle, onMore }) {
  return (
    <li className={cx("sp-node", active && "is-active", n.visible === false && "is-hidden")}>
      <button type="button" className="sp-node-main" onClick={() => onSelect(n.id)} aria-current={active ? "true" : undefined}>
        <span className="sp-dot" style={{ background: n.tint || n.color || "#6366f1" }} />
        <span className="sp-node-text">
          <b>{n.name || n.id}</b>
          <small>{n.mesh || n.type || "actor"}</small>
        </span>
      </button>
      <button type="button" className="sp-icon-btn" onClick={() => onToggle(n.id)} aria-label={n.visible === false ? "Show" : "Hide"}>
        {n.visible === false ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
      <button type="button" className="sp-icon-btn" onClick={() => onMore(n)} aria-label="More">
        <MoreHorizontal size={18} />
      </button>
    </li>
  );
}

export default function Scene({ s, onOpenInspector, onShowInStudio, notify }) {
  const [mode, setMode] = useState("tree");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Primitive");
  const [menu, setMenu] = useState(null);
  const fileRef = useRef(null);
  const [metaOpen, setMetaOpen] = useState(false);

  const query = q.trim().toLowerCase();
  const groups = useMemo(
    () =>
      s.groups
        .map((g) => ({
          ...g,
          shown: (g.children || []).filter((c) => !query || String(c.name || c.id).toLowerCase().includes(query) || String(c.mesh || "").toLowerCase().includes(query)),
        }))
        .filter((g) => !query || g.shown.length),
    [s.groups, query]
  );

  // things the user imported live in the scene itself; list each file once so it can be re-added
  const imported = useMemo(() => {
    const seen = new Map();
    for (const n of s.flat) {
      if ((n.modelUrl || n.textureUrl) && !seen.has(n.mesh)) {
        seen.set(n.mesh, { id: `imp-${n.mesh}`, name: (n.name || n.mesh).replace(/_\d+$/, ""), mesh: n.mesh, category: "Imported", color: n.color, modelUrl: n.modelUrl, modelFormat: n.modelFormat, textureUrl: n.textureUrl });
      }
    }
    return [...seen.values()];
  }, [s.flat]);
  const cats = useMemo(() => [...new Set(PRIMITIVE_SHAPES.map((a) => a.category)), ...(imported.length ? ["Imported"] : [])], [imported.length]);
  const assets = cat === "Imported" ? imported : PRIMITIVE_SHAPES.filter((a) => a.category === cat);

  const onPick = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    for (const f of files) {
      const r = await s.importFile(f);
      notify(r.message, r.ok ? "ok" : "warn");
    }
    if (files.length) setCat("Imported");
  };

  return (
    <section className="sp-page">
      <header className="sp-page-head">
        <h1>Scene</h1>
        <span className="sp-count">{s.flat.length} objects</span>
      </header>
      <Segmented
        label="Scene view"
        value={mode}
        onChange={setMode}
        options={[
          { value: "tree", label: "Hierarchy" },
          { value: "lib", label: "Library" },
        ]}
      />

      {mode === "tree" && (
        <>
          <label className="sp-search">
            <Search size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search objects" inputMode="search" enterKeyHint="search" />
          </label>
          <div className="sp-scroll">
            {!groups.length ? (
              <Empty icon={Boxes} title={query ? "No matches" : "Empty scene"} text={query ? `Nothing named “${q}”.` : "Open the Library to add your first object."} action={!query && <button type="button" className="sp-btn is-primary" onClick={() => setMode("lib")}>Open library</button>} />
            ) : (
              groups.map((g) => {
                const open = query ? true : g.expanded !== false;
                return (
                  <div key={g.id} className="sp-group">
                    <button type="button" className="sp-group-head" onClick={() => s.toggleGroup(g.id)} aria-expanded={open}>
                      {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <b>{g.name}</b>
                      <span>{(g.children || []).length}</span>
                    </button>
                    {open && (
                      <ul>
                        {g.shown.map((n) => (
                          <NodeRow
                            key={n.id}
                            n={n}
                            active={s.selectedId === n.id}
                            onSelect={(id) => {
                              s.setSelectedId(id);
                              onOpenInspector(true);
                            }}
                            onToggle={s.toggleVisible}
                            onMore={setMenu}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {mode === "lib" && (
        <>
          <div className="sp-chips sp-chips-row" role="tablist" aria-label="Asset categories">
            {cats.map((c) => (
              <button key={c} type="button" role="tab" aria-selected={cat === c} className={cx("sp-chip", cat === c && "is-on")} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="sp-scroll">
            <button type="button" className="sp-import" onClick={() => fileRef.current?.click()}>
              <span className="sp-import-ico">
                <Upload size={20} />
              </span>
              <span className="sp-import-text">
                <b>Import from files</b>
                <small>3D models (.glb .gltf .fbx .obj), images, or a .json project</small>
              </span>
            </button>
            <button type="button" className="sp-import" onClick={() => setMetaOpen(true)}>
              <span className="sp-import-ico">
                <Sparkles size={20} />
              </span>
              <span className="sp-import-text">
                <b>Create with Meta AI</b>
                <small>Muse Image from a sentence, or SAM 3.1 cutout from a photo</small>
              </span>
            </button>
            <input ref={fileRef} type="file" multiple hidden accept=".glb,.gltf,.fbx,.obj,.png,.jpg,.jpeg,.webp,.json,model/gltf-binary,image/*,application/json" onChange={onPick} />
            {cat === "Imported" && !imported.length && <p className="sp-muted">Nothing imported yet.</p>}
            <ul className="sp-assets">
              {assets.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    className="sp-asset"
                    onClick={() => {
                      const n = s.spawn(a, a.modelUrl ? { modelUrl: a.modelUrl, modelFormat: a.modelFormat } : a.textureUrl ? { textureUrl: a.textureUrl } : {});
                      notify(`Added ${n.name}`, "ok");
                    }}
                  >
                    <span className="sp-asset-art" style={{ "--c": a.color || "#6366f1", ...(a.textureUrl ? { backgroundImage: `url(${a.textureUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}) }}>
                      {a.textureUrl ? "" : GLYPH[a.mesh] || (a.modelUrl ? "◆" : "◆")}
                    </span>
                    <span className="sp-asset-row">
                      <b>{a.name}</b>
                      <span className="sp-asset-add">
                        <Plus size={14} />
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <Sheet open={!!menu} onClose={() => setMenu(null)} title={menu?.name || menu?.id} subtitle={menu?.mesh}>
        {menu && (
          <div className="sp-menu">
            <button type="button" onClick={() => { s.setSelectedId(menu.id); setMenu(null); onShowInStudio(); }}>
              <Crosshair size={18} /> Show in Studio
            </button>
            <button type="button" onClick={() => { s.setSelectedId(menu.id); setMenu(null); onOpenInspector(true); }}>
              <Pencil size={18} /> Edit properties
            </button>
            <button type="button" onClick={() => { s.duplicate(menu.id); setMenu(null); notify("Duplicated", "ok"); }}>
              <Copy size={18} /> Duplicate
            </button>
            <button type="button" className="is-danger" onClick={() => { s.removeNode(menu.id); setMenu(null); notify("Deleted", "ok"); }}>
              <Trash2 size={18} /> Delete
            </button>
          </div>
        )}
      </Sheet>
      <MetaCreate s={s} open={metaOpen} onClose={() => setMetaOpen(false)} notify={notify} />
    </section>
  );
}
