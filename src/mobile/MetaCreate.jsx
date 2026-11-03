/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Pocket Studio: make props with Meta AI
 * Muse Image turns a sentence into a texture or a sprite prop; SAM 3.1 cuts an object out of a photo.
 */
import React, { useRef, useState } from "react";
import { ImagePlus, Scissors, Sparkles } from "lucide-react";
import { Segmented, Sheet } from "./ui.jsx";
import { cutOut, generateImage, hasMetaKey } from "./meta.js";

export default function MetaCreate({ s, open, onClose, notify }) {
  const [tab, setTab] = useState("image");
  const [prompt, setPrompt] = useState("");
  const [what, setWhat] = useState("");
  const [as, setAs] = useState("sprite");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);
  const keyed = hasMetaKey();

  const add = (url, name) => {
    // near the middle of the scene, where the default camera looks, instead of a random spot far away
    if (s.activeJsx) s.unmountCode?.(); // a mounted game replaces the scene objects in the viewport; its code stays in Code
    s.spawn({ name, mesh: name, category: "Imported" }, { textureUrl: url, sprite: as === "sprite", pos: { x: Number(((Math.random() - 0.5) * 8).toFixed(1)), y: 0, z: Number((8 + Math.random() * 6).toFixed(1)) } });
    notify(`Added ${name}`, "ok");
    onClose();
  };

  const make = async () => {
    if (!prompt.trim()) return;
    setBusy(true);
    try {
      let url = await generateImage(prompt.trim(), { transparent: as === "sprite" });
      if (as === "sprite") {
        // Muse Image paints the picture, then SAM 3.1 cuts the object out of its background so it can stand in 3D.
        setStep("Cutting it out with SAM 3.1…");
        try {
          const blob = await (await fetch(url)).blob();
          const what = prompt.split(",")[0].replace(/^(a|an|the)\s+/i, "").trim().split(/\s+/).slice(-3).join(" ");
          const r = await cutOut(new File([blob], "generated.png", { type: blob.type || "image/png" }), what);
          if (r.matched) url = r.url;
        } catch {
          // keep the plain picture when the cutout is not possible
        }
        setStep("");
      }
      setPreview(url);
    } catch (e) {
      notify(e.message, "warn");
    }
    setBusy(false);
  };

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const r = await cutOut(file, what);
      setPreview(r.url);
      if (!r.matched) notify("SAM found nothing to cut, using the whole photo", "warn");
    } catch (err) {
      notify(err.message, "warn");
    }
    setBusy(false);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Create with Meta AI" subtitle="Muse Image and SAM 3.1">
      <div className="sp-stack">
        {!keyed && <p className="sp-muted">Save a Meta key in More, Settings, AI providers to use these tools.</p>}
        <Segmented label="Tool" value={tab} onChange={(v) => { setTab(v); setPreview(null); }} options={[{ value: "image", label: "Muse Image" }, { value: "sam", label: "SAM cutout" }]} />
        <div className="sp-field">
          <span>Use as</span>
          <Segmented label="Use as" value={as} onChange={setAs} options={[{ value: "sprite", label: "Standing sprite" }, { value: "box", label: "Textured box" }]} />
        </div>
        {tab === "image" ? (
          <>
            <label className="sp-field">
              <span>Describe it</span>
              <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="a mossy stone statue" enterKeyHint="go" />
            </label>
            <button type="button" className="sp-btn is-primary" disabled={busy || !keyed || !prompt.trim()} onClick={make}>
              <Sparkles size={16} /> {busy ? (step || "Generating…") : "Generate"}
            </button>
          </>
        ) : (
          <>
            <label className="sp-field">
              <span>What to cut out (a short name)</span>
              <input value={what} onChange={(e) => setWhat(e.target.value)} placeholder="red car" />
            </label>
            <button type="button" className="sp-btn is-primary" disabled={busy || !keyed || !what.trim()} onClick={() => fileRef.current?.click()}>
              <Scissors size={16} /> {busy ? "Cutting…" : "Choose a photo"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
          </>
        )}
        {preview && (
          <>
            <img src={preview} alt="Result" style={{ width: "100%", maxHeight: 240, objectFit: "contain", borderRadius: 12, background: "repeating-conic-gradient(#8881 0% 25%, transparent 0% 50%) 50% / 16px 16px" }} />
            {s.activeJsx && <p className="sp-muted">A game is mounted in the viewport. Adding this unmounts it so you can see your scene. The game's code stays in the Code tab.</p>}
            <button type="button" className="sp-btn is-primary" onClick={() => add(preview, tab === "image" ? prompt.trim().slice(0, 24) || "Generated" : what.slice(0, 24) || "Cutout")}>
              <ImagePlus size={16} /> Add to scene
            </button>
          </>
        )}
      </div>
    </Sheet>
  );
}
