/*
 * ============================================================================
 * SPIDER GAME ENGINE — Pocket Studio (mobile edition)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 * The full engine, reshaped for one hand and a thumb:
 *   Studio  live viewport, transform tools, play with a virtual stick
 *   Scene   hierarchy + asset library, search, per-object actions
 *   AI      game-building agent on the Meta Model API, steerable mid-run
 *   Code    multi-file editor with a code-key row, render to viewport
 *   More    projects, console, settings, licenses
 * ============================================================================
 */
import React, { Suspense, useCallback, useEffect, useState } from "react";
import { Boxes, Code2, Layers, MoreHorizontal, Play, MessageSquare, Square } from "lucide-react";
import { useStudio } from "./useStudio.js";
import { InspectorSheet, ViewSheet } from "./Sheets.jsx";
import { cx, useToast } from "./ui.jsx";
import Studio from "./Studio.jsx";
import Scene from "./Scene.jsx";
import Chat from "./Chat.jsx";
import Code from "./Code.jsx";
import More from "./More.jsx";
import TourSheet from "./Tour.jsx";
import { tourSeen, markTourSeen } from "../onboarding.js";

/* [LINEAGE-AUTHORS]: m4spider */
const __M4_ENGINE_LINEAGE__ = "m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

const TABS = [
  { id: "studio", label: "Studio", icon: Layers },
  { id: "scene", label: "Scene", icon: Boxes },
  { id: "ai", label: "AI", icon: MessageSquare },
  { id: "code", label: "Code", icon: Code2 },
  { id: "more", label: "More", icon: MoreHorizontal },
];

/** Apply theme to <html> and keep the browser chrome (status bar) in step. */
function useTheme(theme) {
  useEffect(() => {
    document.documentElement.classList.add("sp-mobile");
    document.documentElement.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", theme === "dark" ? "#101114" : "#f4f4f1"));
    return () => document.documentElement.classList.remove("sp-mobile");
  }, [theme]);
}

export default function MobileApp() {
  const s = useStudio();
  const [tab, setTab] = useState("studio");
  const [inspector, setInspector] = useState(false);
  const [view, setView] = useState(false);
  const [morePage, setMorePage] = useState(null);
  const [toast, toastNode] = useToast();
  const [tour, setTour] = useState(() => !tourSeen());
  const closeTour = () => { markTourSeen(); setTour(false); };
  useTheme(s.settings.theme);

  const notify = useCallback((text, tone = "ok") => toast(text, tone), [toast]);
  const go = useCallback((id, page = null) => {
    setTab(id);
    if (id === "more") setMorePage(page);
    if (id === "studio") {
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 50);
    }
  }, []);

  const eff = tab;
  const onStudio = eff === "studio";
  const keepStudio = onStudio || s.busy;
  const hideChrome = onStudio && s.isPlaying;
  const [full, setFull] = useState(false);

  // Fullscreen: Pure CSS immersive viewport layout + optional native Fullscreen API
  const toggleFull = useCallback(() => {
    setFull((prev) => {
      const next = !prev;
      try {
        if (next) {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
          } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
          }
        } else {
          if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          }
        }
      } catch {}
      setTimeout(() => window.dispatchEvent(new Event("resize")), 60);
      setTimeout(() => window.dispatchEvent(new Event("resize")), 250);
      return next;
    });
  }, []);

  useEffect(() => {
    let timer = null;
    const handleOrientation = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 150);
    };
    window.addEventListener("orientationchange", handleOrientation);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("orientationchange", handleOrientation);
    };
  }, []);
  useEffect(() => {
    if (tab !== "studio" && full) toggleFull();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);
  const nav = TABS;

  // Opening the inspector from the viewport should not steal the tab.
  const openInspector = useCallback((force = true) => {
    if (force || s.selectedId) setInspector(true);
  }, [s.selectedId]);

  const playBtn = (
    <button
      type="button"
      className={cx("sp-play", s.isPlaying && "is-live")}
      onClick={() => {
        if (!s.isPlaying) setTab("studio");
        s.togglePlay();
      }}
      aria-pressed={s.isPlaying}
    >
      {s.isPlaying ? <Square size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
      {s.isPlaying ? "Stop" : "Play"}
    </button>
  );

  const studio = keepStudio && (
    <div className={cx("sp-pane", !onStudio && "is-parked")} aria-hidden={!onStudio}>
      <Studio s={s} full={full} onToggleFull={toggleFull} notify={notify} onOpenInspector={openInspector} onOpenView={() => setView(true)} onGoAI={() => go("ai")} />
    </div>
  );

  const others = (
    <>
      {tab === "scene" && (
        <div className="sp-pane">
          <Scene s={s} notify={notify} onOpenInspector={openInspector} onShowStudio={() => go("studio")} />
        </div>
      )}
      {eff === "ai" && (
        <div className="sp-pane">
          <Chat s={s} notify={notify} onOpenSettings={() => go("more", "settings")} onShowStudio={() => go("studio")} />
        </div>
      )}
      {eff === "code" && (
        <div className="sp-pane">
          <Code s={s} notify={notify} />
        </div>
      )}
      {eff === "more" && (
        <div className="sp-pane">
          <More s={s} notify={notify} onTour={() => setTour(true)} initialPage={morePage} onPageChange={setMorePage} onOpened={() => go("studio")} />
        </div>
      )}
    </>
  );

  const sheets = (
    <>
      <InspectorSheet s={s} open={inspector} onClose={() => setInspector(false)} notify={notify} onFocusStudio={() => { setInspector(false); go("studio"); }} />
      <ViewSheet s={s} open={view} onClose={() => setView(false)} />
      <TourSheet open={tour} onClose={closeTour} />
      <div className="sp-toast-wrap">{toastNode}</div>
    </>
  );

  return (
    <div className={cx("sp-app", hideChrome && "is-playing", full && onStudio && "is-full")}>
      <header className="sp-top">
        <button type="button" className="sp-project-btn" onClick={() => go("more", "projects")} aria-label="Switch project">
          <span className="sp-logo" aria-hidden="true">S</span>
          <span className="sp-project-name">
            <small>Spider Engine</small>
            <b>{s.project.name}</b>
          </span>
        </button>
        {playBtn}
      </header>

      <main className="sp-main">
        {studio}
        {others}
      </main>

      {!hideChrome && (
        <nav className="sp-tabbar" aria-label="Sections">
          {nav.map((t) => (
            <button key={t.id} type="button" className={cx("sp-tab", tab === t.id && "is-on", t.id === "ai" && s.busy && "is-busy")} aria-current={tab === t.id ? "page" : undefined} onClick={() => go(t.id)}>
              <span className="sp-tab-ico">
                <t.icon size={21} strokeWidth={tab === t.id ? 2.4 : 2} />
              </span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      )}
      {sheets}
    </div>
  );
}
