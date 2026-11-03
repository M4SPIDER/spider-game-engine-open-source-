/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Pocket Studio: Spider Store (browse + publish)
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft, Check, Sparkles, ImagePlus, Layers, Package, Rocket, Search, ShieldCheck, X, AlertTriangle, Clock, ArrowRight, Download, Flame, Gamepad2,
  Home, Library, Play, RefreshCw, Star,
} from "lucide-react";
import {
  LIMITS, RULES, STORE_CATEGORIES, buildPackage, buildProvenance, checkListing, formatBytes, getLibrary, listGames, processImage,
  getGame, listShots, rememberDeveloper, removeShot, resolveTarget, savedDeveloper, setLibraryVersion, storeMode, submitGame,
} from "./storeApi.js";
import { assistProvider, suggestListing } from "./storeAi.js";
import { cx } from "./ui.jsx";
import "./store.css";

function Head({ title, onBack, right }) {
  return (
    <header className="sp-page-head">
      {onBack && <button type="button" className="sp-icon-btn" onClick={onBack} aria-label="Back"><ChevronLeft size={22} /></button>}
      <h1>{title}</h1>
      <span className="sp-grow" />
      {right}
    </header>
  );
}

/* ----------------------------- shared bits ----------------------------- */
const posterOf = (g) => g.images?.[0]?.dataUrl || g.images?.[0]?.url || "";
const genre = (g) => (g.subtitle ? `${g.category} • ${g.subtitle}` : g.category);
const latestOf = (g) => g.versions[0].version;
const stateOf = (g, lib) => (lib[g.slug] == null ? "get" : lib[g.slug] < latestOf(g) ? "update" : "installed");

/** Get / Installed / Update, one control used on every card. */
function GetButton({ game, lib, onGet, round }) {
  const st = stateOf(game, lib);
  const label = st === "get" ? "Get" : st === "update" ? "Update" : "Installed";
  if (round) {
    return (
      <button type="button" className={cx("st-round", st !== "get" && "is-on")} aria-label={`${label} ${game.name}`} onClick={(e) => { e.stopPropagation(); if (st !== "installed") onGet(game); }}>
        {st === "installed" ? <Check size={17} strokeWidth={3} /> : st === "update" ? <RefreshCw size={16} /> : <Download size={17} />}
      </button>
    );
  }
  return (
    <button type="button" className={cx("st-get", st === "installed" && "is-done")} onClick={(e) => { e.stopPropagation(); if (st !== "installed") onGet(game); }}>
      {st === "installed" ? <Check size={16} strokeWidth={3} /> : st === "update" ? <RefreshCw size={15} /> : <Download size={16} />} {label}
    </button>
  );
}

/** Play Now: fetches the build from the Store and runs it in the app. */
function PlayButton({ game, onPlay, light }) {
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" className={cx("st-play", light && "is-light")} disabled={busy} onClick={async (e) => { e.stopPropagation(); setBusy(true); try { await onPlay(game); } finally { setBusy(false); } }}>
      <Play size={16} fill="currentColor" /> {busy ? "Loading…" : "Play Now"}
    </button>
  );
}

/* ----------------------------- game page ----------------------------- */
function GamePage({ slug, onBack, lib, onGet, onPlay }) {
  const [game, setGame] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { getGame(slug).then(setGame).catch((e) => setErr(e.message)); }, [slug]);
  if (err) return <><Head title="Game" onBack={onBack} /><p className="st-note is-bad">{err}</p></>;
  if (!game) return <><Head title="Game" onBack={onBack} /><p className="st-note">Loading…</p></>;
  const latest = game.versions[0];
  return (
    <>
      <Head title={game.name} onBack={onBack} />
      <div className="sp-scroll st-page">
        <div className="st-banner-img" style={{ backgroundImage: `url("${posterOf(game)}")` }}>
          <div className="st-banner-fade">
            <span className="st-pill">{genre(game)}</span>
            <h2>{game.name}</h2>
            <p>{game.developer}</p>
          </div>
        </div>
        <div className="st-actions"><PlayButton game={game} onPlay={onPlay} /><GetButton game={game} lib={lib} onGet={onGet} /></div>
        <section className="st-block">
          <h3>About</h3>
          <p className="st-text">{game.description}</p>
        </section>
        {game.images.length > 1 && (
          <div className="st-shots" role="list">
            {game.images.map((im) => <img key={im.sha256 || im.name} role="listitem" src={im.dataUrl || im.url} alt={`${game.name} screenshot`} loading="lazy" />)}
          </div>
        )}
        <section className="st-block">
          <h3>Versions</h3>
          <ul className="st-versions">
            {game.versions.map((v, i) => (
              <li key={v.version}>
                <b>Version {v.version}{i === 0 && <em> Latest</em>}</b>
                <small>{new Date(v.createdAt).toLocaleDateString()} · {formatBytes(v.bytes)}</small>
                {v.notes && <p>{v.notes}</p>}
              </li>
            ))}
          </ul>
        </section>
        {game.demo
          ? <p className="st-foot"><Package size={14} /> Built by Muse Spark inside Spider Engine. Play Now runs it here.</p>
          : game.sample
          ? <p className="st-foot"><Package size={14} /> Sample listing for the demo. It has no playable build yet.</p>
          : <p className="st-foot"><ShieldCheck size={14} /> Screenshots are metadata-free. Provenance recorded for version {latest.version}.</p>}
      </div>
    </>
  );
}

/* ----------------------------- browse (Explore) ----------------------------- */
function Featured({ games, onOpen, lib, onGet, onPlay }) {
  const [i, setI] = useState(0);
  const ref = useRef(null);
  const onScroll = () => { const el = ref.current; if (el) setI(Math.round(el.scrollLeft / el.clientWidth)); };
  return (
    <div className="st-feat">
      <div className="st-feat-track" ref={ref} onScroll={onScroll}>
        {games.map((g) => (
          <article key={g.slug} className="st-slide" style={{ backgroundImage: `url("${posterOf(g)}")` }} onClick={() => onOpen(g.slug)}>
            <div className="st-slide-fade">
              <span className="st-tag">FEATURED</span>
              <h2>{g.name}</h2>
              <p>{g.description}</p>
              <div className="st-slide-btns" onClick={(e) => e.stopPropagation()}>
                <PlayButton game={g} onPlay={onPlay} light />
                <button type="button" className="st-ghost" onClick={() => onOpen(g.slug)}>View Details</button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="st-dots" aria-hidden="true">{games.map((g, k) => <i key={g.slug} className={k === i ? "is-on" : ""} />)}</div>
    </div>
  );
}

function Shelf({ icon: Icon, title, hint, games, onOpen, onAll, lib, onGet }) {
  if (!games.length) return null;
  return (
    <section className="st-shelf">
      <header>
        <span className="st-shelf-ico"><Icon size={17} /></span>
        <div><h3>{title}</h3><small>{hint}</small></div>
        <button type="button" className="st-all" onClick={onAll}>View All <ArrowRight size={14} /></button>
      </header>
      <ul className="st-row">
        {games.map((g) => (
          <li key={g.slug}>
            <div className="st-tile" role="button" tabIndex={0} onClick={() => onOpen(g.slug)} onKeyDown={(e) => e.key === "Enter" && onOpen(g.slug)}>
              <span className="st-tile-art" style={{ backgroundImage: `url("${posterOf(g)}")` }} />
              <span className="st-tile-body">
                <span><b>{g.name}</b><small>{genre(g)}</small></span>
                <GetButton game={g} lib={lib} onGet={onGet} round />
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Grid({ games, onOpen, lib, onGet }) {
  return (
    <ul className="st-grid">
      {games.map((g) => (
        <li key={g.slug}>
          <div className="st-tile" role="button" tabIndex={0} onClick={() => onOpen(g.slug)} onKeyDown={(e) => e.key === "Enter" && onOpen(g.slug)}>
            <span className="st-tile-art" style={{ backgroundImage: `url("${posterOf(g)}")` }} />
            <span className="st-tile-body">
              <span><b>{g.name}</b><small>{genre(g)}{g.versions.length > 1 && !g.sample ? ` • v${latestOf(g)}` : ""}</small></span>
              <GetButton game={g} lib={lib} onGet={onGet} round />
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

const SECTIONS = [["home", "Home", Home], ["games", "Games", Gamepad2], ["library", "My Library", Library], ["updates", "Updates", Download]];

export function StoreBrowse({ onBack, onPublish, notify, onPlay }) {
  const [games, setGames] = useState(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(null);
  const [sec, setSec] = useState("home");
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [lib, setLib] = useState(getLibrary);
  useEffect(() => { listGames().then(setGames).catch((e) => setErr(e.message)); }, []);
  const onGet = useCallback((g) => { setLib(setLibraryVersion(g.slug, latestOf(g))); notify?.(`${g.name} added to your library`, "ok"); }, [notify]);

  const playIt = useCallback(async (g) => {
    try { await onPlay?.(g); } catch (e) { notify?.(e.message || "Could not start the game.", "warn"); }
  }, [onPlay, notify]);
  if (open) return <GamePage slug={open} onBack={() => setOpen(null)} lib={lib} onGet={onGet} onPlay={playIt} />;
  const all = games || [];
  const needle = q.trim().toLowerCase();
  const searching = needle.length > 0;
  const match = (g) => `${g.name} ${g.developer} ${g.category} ${g.subtitle || ""} ${g.description}`.toLowerCase().includes(needle);
  const owned = all.filter((g) => lib[g.slug] != null);
  const updates = owned.filter((g) => stateOf(g, lib) === "update");
  const byNew = [...all].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  const cats = ["All", ...new Set(all.map((g) => g.category))];
  const counts = { library: owned.length, updates: updates.length };
  const featured = all.filter((g) => g.featured).slice(0, 4);

  let body = null;
  if (games) {
    if (searching) {
      const r = all.filter(match);
      body = r.length ? <Grid games={r} onOpen={setOpen} lib={lib} onGet={onGet} /> : <Empty title="No games match" text="Try another word." action={<button type="button" className="sp-btn" onClick={() => setQ("")}>Clear search</button>} />;
    } else if (sec === "home") {
      body = (
        <>
          {featured.length > 0 && <Featured games={featured} onOpen={setOpen} lib={lib} onGet={onGet} onPlay={playIt} />}
          <Shelf icon={Flame} title="Trending Games" hint="Top games loved by the Spider community" games={all.slice(0, 6)} onOpen={setOpen} onAll={() => setSec("games")} lib={lib} onGet={onGet} />
          <Shelf icon={Star} title="New Releases" hint="Fresh games on Spider Store" games={byNew.slice(0, 6)} onOpen={setOpen} onAll={() => setSec("games")} lib={lib} onGet={onGet} />
        </>
      );
    } else if (sec === "games") {
      const r = all.filter((g) => cat === "All" || g.category === cat);
      body = (
        <>
          <div className="sp-chips sp-chips-row" role="tablist" aria-label="Category filter">
            {cats.map((c) => <button key={c} type="button" role="tab" aria-selected={cat === c} className={cx("sp-chip", cat === c && "is-on")} onClick={() => setCat(c)}>{c}</button>)}
          </div>
          {r.length ? <Grid games={r} onOpen={setOpen} lib={lib} onGet={onGet} /> : <Empty title="No games here yet" text="Try another category." />}
        </>
      );
    } else if (sec === "library") {
      body = owned.length ? <Grid games={owned} onOpen={setOpen} lib={lib} onGet={onGet} /> : <Empty title="Your library is empty" text="Games you get from the Store show up here." action={<button type="button" className="sp-btn is-primary" onClick={() => setSec("games")}>Browse games</button>} />;
    } else {
      body = updates.length ? (
        <ul className="st-updates">
          {updates.map((g) => (
            <li key={g.slug}>
              <span className="st-tile-art" style={{ backgroundImage: `url("${posterOf(g)}")` }} />
              <span className="st-up-text"><b>{g.name}</b><small>Version {lib[g.slug]} → {latestOf(g)}</small>{g.versions[0].notes && <em>{g.versions[0].notes}</em>}</span>
              <GetButton game={g} lib={lib} onGet={onGet} />
            </li>
          ))}
        </ul>
      ) : <Empty title="Everything is up to date" text="New versions of your games appear here." />;
    }
  }

  return (
    <>
      <header className="st-top">
        {onBack && <button type="button" className="sp-icon-btn" onClick={onBack} aria-label="Back"><ChevronLeft size={22} /></button>}
        <span className="st-brand-ico" aria-hidden="true"><Gamepad2 size={20} /></span>
        <div className="st-brand"><b>SPIDER STORE</b><small>Games Only</small></div>
        <span className="sp-grow" />
        {onPublish && <button type="button" className="sp-btn is-primary" onClick={onPublish}><Rocket size={16} /> Publish</button>}
      </header>
      <div className="sp-scroll st-page">
        <label className="st-search">
          <Search size={17} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search games..." aria-label="Search games" />
        </label>
        {!searching && (
          <nav className="st-secs" role="tablist" aria-label="Store sections">
            {SECTIONS.map(([id, label, Icon]) => (
              <button key={id} type="button" role="tab" aria-selected={sec === id} className={cx(sec === id && "is-on")} onClick={() => setSec(id)}>
                <Icon size={16} /> {label}{counts[id] > 0 && <i>{counts[id]}</i>}
              </button>
            ))}
          </nav>
        )}
        {err && <p className="st-note is-bad">{err}</p>}
        {!games && !err && <p className="st-note">Loading…</p>}
        {body}
      </div>
    </>
  );
}

function Empty({ title, text, action }) {
  return (
    <div className="st-empty">
      <span><Package size={30} /></span>
      <b>{title}</b>
      <small>{text}</small>
      {action}
    </div>
  );
}

/* ----------------------------- publish ----------------------------- */
function Step({ n, title, hint, done, children }) {
  return (
    <section className="st-step">
      <header>
        <span className={cx("st-num", done && "is-done")}>{done ? <Check size={14} strokeWidth={3} /> : n}</span>
        <div><h3>{title}</h3>{hint && <small>{hint}</small>}</div>
      </header>
      {children}
    </section>
  );
}

export function StorePublish({ s, notify, onBack, onDone }) {
  const [developer, setDeveloper] = useState(savedDeveloper());
  const [name, setName] = useState(s.project.name || "");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState([]);
  const [busyImg, setBusyImg] = useState(0);
  const [rules, setRules] = useState({});
  const [target, setTarget] = useState(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const file = useRef(null);
  const [tray, setTray] = useState([]);
  const [writing, setWriting] = useState(false);
  const assist = assistProvider();

  useEffect(() => { listShots(s.project.id).then(setTray).catch(() => {}); }, [s.project.id]);

  // Studio screenshots (camera button) that are not in the listing yet
  const fromStudio = async () => {
    const room = LIMITS.maxImages - images.length;
    const picks = tray.slice(-Math.max(0, room));
    if (!picks.length) return;
    setBusyImg((n) => n + picks.length);
    for (const t of picks) {
      try {
        const blob = await (await fetch(t.dataUrl)).blob();
        const im = await processImage(new File([blob], `studio-${t.id}.jpg`, { type: blob.type || "image/jpeg" }));
        setImages((cur) => (cur.some((x) => x.sha256 === im.sha256) ? cur : [...cur, im]));
        await removeShot(t.id);
      } catch (e) {
        notify(e.message, "warn");
      } finally {
        setBusyImg((n) => n - 1);
      }
    }
    setTray(await listShots(s.project.id));
  };

  const writeWithMuse = async () => {
    setWriting(true);
    try {
      const r = await suggestListing(s.project);
      setDescription(r.description);
      setCategory((c) => c || r.category);
      notify(`Written by ${r.by}. Edit it freely.`, "ok");
    } catch (e) {
      notify(e.message || "Could not write the listing.", "warn");
    } finally {
      setWriting(false);
    }
  };

  const pkg = useMemo(() => buildPackage(s.project, { name: s.activeJsxName, code: s.activeJsx }), [s.project, s.activeJsx, s.activeJsxName]);
  const tooBig = pkg.bytes > LIMITS.maxGameBytes;
  const problems = checkListing({ name, developer, category, description });
  const ruleOk = RULES.every((r) => rules[r.id]);
  const imagesOk = images.length >= LIMITS.minImages;
  const ready = !problems.length && imagesOk && ruleOk && !tooBig && !pkg.empty && target?.kind !== "taken" && !busyImg;

  // What would this submission do? (new game, new version, or the name is taken)
  useEffect(() => {
    if (!name.trim() || !developer.trim()) { setTarget(null); return undefined; }
    let live = true;
    const t = setTimeout(() => { resolveTarget({ name, developer }).then((r) => live && setTarget(r)).catch(() => live && setTarget(null)); }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [name, developer]);

  const addFiles = async (list) => {
    const room = LIMITS.maxImages - images.length;
    const picked = [...list].slice(0, Math.max(0, room));
    if (list.length > picked.length) notify(`Up to ${LIMITS.maxImages} screenshots`, "warn");
    setBusyImg((n) => n + picked.length);
    for (const f of picked) {
      try {
        const im = await processImage(f);
        setImages((cur) => (cur.some((x) => x.sha256 === im.sha256) ? cur : [...cur, im]));
      } catch (e) {
        notify(e.message, "warn");
      } finally {
        setBusyImg((n) => n - 1);
      }
    }
  };

  const submit = async () => {
    if (!ready || sending) return;
    setSending(true);
    setErr("");
    try {
      const fresh = await resolveTarget({ name, developer });
      if (fresh.kind === "taken") throw new Error(`"${fresh.existing.name}" already belongs to ${fresh.existing.developer}. Pick another name.`);
      const dev = developer.trim();
      const provenance = await buildProvenance({ developer: dev, name: name.trim(), version: fresh.version, pkg, images });
      const game = await submitGame({
        slug: fresh.slug, name: name.trim(), developer: dev, category, description: description.trim(), notes: notes.trim(), version: fresh.version,
        images: images.map(({ id, name: n, type, width, height, bytes, sha256, dataUrl }) => ({ id, name: n, type, width, height, bytes, sha256, dataUrl })),
        package: { bytes: pkg.bytes, base64: btoa(unescape(encodeURIComponent(pkg.body))) },
        provenance,
      });
      rememberDeveloper(dev);
      setResult({ game, kind: fresh.kind, version: fresh.version });
      s.log?.("Success", `Published ${game.name} v${fresh.version} to the Spider Store`);
    } catch (e) {
      setErr(e.message || "Could not publish.");
    } finally {
      setSending(false);
    }
  };

  if (result) {
    return (
      <>
        <Head title="Published" onBack={onDone} />
        <div className="sp-scroll st-page st-success">
          <span className="st-tick"><Check size={34} strokeWidth={3} /></span>
          <h2>{result.kind === "version" ? `Version ${result.version} is live` : "Your game is live"}</h2>
          <p>{result.game.name} {result.kind === "version" ? "was added under the same game." : `by ${result.game.developer} is in the Spider Store.`}</p>
          {result.game.localOnly && <p className="st-note is-info">The Store server could not be reached, so it is saved on this device and shows in Explore here.</p>}
          <button type="button" className="sp-btn is-primary is-block" onClick={onDone}>View in the Store</button>
        </div>
      </>
    );
  }

  return (
    <>
      <Head title="Export to Store" onBack={onBack} />
      <div className="sp-scroll st-page st-form">
        <div className="st-lead">
          <h2>Publish {s.project.name}</h2>
          <p>Four steps. The listing is checked on this device before anything is sent.</p>
        </div>

        <Step n={1} title="About you and the game" done={!problems.length}>
          <label className="sp-field"><span>Developer name</span>
            <input value={developer} onChange={(e) => setDeveloper(e.target.value)} placeholder="Your name or studio" autoComplete="nickname" /></label>
          <label className="sp-field"><span>Game name</span>
            <input value={name} maxLength={LIMITS.nameMax + 10} onChange={(e) => setName(e.target.value)} placeholder="Neon Rift" /></label>
          <div className="sp-field"><span>Category</span>
            <div className="sp-chips">{STORE_CATEGORIES.map((c) => <button key={c} type="button" className={cx("sp-chip", category === c && "is-on")} onClick={() => setCategory(c)}>{c}</button>)}</div></div>
          <button type="button" className="st-muse" onClick={writeWithMuse} disabled={!assist || writing} title={assist ? `Written by ${assist.provider.name}` : "Add an AI key in More, Settings"}>
            <Sparkles size={16} /> {writing ? "Writing…" : assist ? "Write description with Muse" : "Add an AI key to write it with Muse"}
          </button>
          <label className="sp-field"><span>Description <em className="st-count">{description.length}/{LIMITS.descMax}</em></span>
            <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What do you do in this game? What makes it fun?" /></label>
          {target?.kind === "version" && (
            <p className="st-note is-info"><Layers size={15} /> “{target.existing.name}” is already in the Store. This will be added under the same game as version {target.version}.</p>
          )}
          {target?.kind === "version" && (
            <label className="sp-field"><span>What changed in this version</span>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="New level, bug fixes…" /></label>
          )}
          {target?.kind === "taken" && (
            <p className="st-note is-bad"><AlertTriangle size={15} /> “{target.existing.name}” already belongs to {target.existing.developer}. Choose another name.</p>
          )}
        </Step>

        <Step n={2} title="Screenshots" hint={`At least ${LIMITS.minImages}, up to ${LIMITS.maxImages}`} done={imagesOk}>
          <button type="button" className="st-muse" onClick={fromStudio} disabled={!tray.length || !!busyImg || images.length >= LIMITS.maxImages}>
            <ImagePlus size={16} /> {tray.length ? `Use ${tray.length} Studio screenshot${tray.length > 1 ? "s" : ""}` : "Studio screenshots: play, then tap the camera"}
          </button>
          <div className="st-thumbs">
            {images.map((im) => (
              <figure key={im.id}>
                <img src={im.dataUrl} alt="" />
                <button type="button" aria-label="Remove screenshot" onClick={() => setImages((c) => c.filter((x) => x.id !== im.id))}><X size={14} /></button>
                <figcaption>{formatBytes(im.bytes)}</figcaption>
              </figure>
            ))}
            {images.length < LIMITS.maxImages && (
              <button type="button" className="st-add" onClick={() => file.current?.click()} disabled={!!busyImg}>
                <ImagePlus size={22} /><span>{busyImg ? "Processing…" : "Add"}</span>
              </button>
            )}
          </div>
          <input ref={file} type="file" accept="image/*" multiple hidden onChange={(e) => { const l = e.target.files; if (l?.length) addFiles(l); e.target.value = ""; }} />
          <p className="st-foot"><ShieldCheck size={14} /> Each image is compressed and its metadata (location, camera, edit history) is removed on this device. {images.length > 0 && `${images.length} of ${LIMITS.minImages} needed.`}</p>
        </Step>

        <Step n={3} title="Game package" done={!tooBig}>
          <div className={cx("st-size", tooBig && "is-bad")}>
            <Package size={20} />
            <div><b>{formatBytes(pkg.bytes)}</b><small>Limit {formatBytes(LIMITS.maxGameBytes)}</small></div>
            <i style={{ "--w": `${Math.min(100, (pkg.bytes / LIMITS.maxGameBytes) * 100)}%` }} />
          </div>
          <p className={cx("st-note", pkg.empty ? "is-bad" : "is-info")}>
            <Layers size={15} />
            {pkg.empty
              ? "The 3D view is empty. Build or open a game in Studio first, then publish."
              : <span>Publishing what the 3D view shows now: {pkg.mountedFile ? <b>{pkg.mountedFile}</b> : "the scene"}{pkg.objects ? `, ${pkg.objects} scene object${pkg.objects > 1 ? "s" : ""}` : ""}.</span>}
          </p>
          {tooBig && (
            <p className="st-note is-warn"><Clock size={15} /> Games over 5 MB need an additional review with team support and a verified developer account. That process is coming soon. Reduce textures or models to publish now.</p>
          )}
        </Step>

        <Step n={4} title="Store rules" done={ruleOk}>
          <ul className="st-rules">
            {RULES.map((r) => (
              <li key={r.id}>
                <button type="button" role="checkbox" aria-checked={!!rules[r.id]} className={cx(rules[r.id] && "is-on")} onClick={() => setRules((c) => ({ ...c, [r.id]: !c[r.id] }))}>
                  <span><Check size={14} strokeWidth={3} /></span>{r.text}
                </button>
              </li>
            ))}
          </ul>
        </Step>

        {err && <p className="st-note is-bad"><AlertTriangle size={15} /> {err}</p>}
        {!ready && !sending && (problems[0] || (!imagesOk && `Add ${LIMITS.minImages - images.length} more screenshot${LIMITS.minImages - images.length > 1 ? "s" : ""}.`) || (!ruleOk && "Accept the Store rules.") || (pkg.empty && "The 3D view is empty.") || (tooBig && "The package is over the size limit.")) && (
          <p className="st-hint">{problems[0] || (!imagesOk && `Add ${LIMITS.minImages - images.length} more screenshot${LIMITS.minImages - images.length > 1 ? "s" : ""}.`) || (!ruleOk && "Accept the Store rules.") || (pkg.empty && "The 3D view is empty.") || "The package is over the size limit."}</p>
        )}
        <button type="button" className="sp-btn is-primary is-block st-submit" disabled={!ready || sending} onClick={submit}>
          <Rocket size={18} /> {sending ? "Publishing…" : target?.kind === "version" ? `Publish version ${target.version}` : "Publish to Store"}
        </button>
      </div>
    </>
  );
}

/** The Store tab in the bottom bar: Explore. Publishing starts from More, Projects, Export to Store. */
export function StoreTab({ notify, onPlay }) {
  return (
    <section className="sp-page">
      <StoreBrowse notify={notify} onPlay={onPlay} />
    </section>
  );
}
