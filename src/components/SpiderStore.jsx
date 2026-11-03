/*
 * ============================================================================
 * SPIDER GAME ENGINE — SPIDER STORE (GAMES ONLY)
 * ============================================================================
 * Zero Backend • Client-Side IndexedDB & LocalStorage Catalog
 * Pure offline execution: Directly show PLAY option for all published games.
 * ============================================================================
 */
import React, { useState, useMemo, useEffect } from "react";
import {
  Home,
  Gamepad2,
  Layers,
  Settings,
  Search,
  ChevronRight,
  ChevronLeft,
  X,
  Play,
  Flame,
  Star,
  Check,
  Sparkles,
  Upload,
  ArrowRight,
  Trash2,
  Image as ImageIcon
} from "lucide-react";

const SPIDER_DB_NAME = "SpiderEngineDB";
const SPIDER_DB_VERSION = 2;

async function idbLoadSubmissions() {
  if (typeof indexedDB === "undefined") return [];
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(SPIDER_DB_NAME, SPIDER_DB_VERSION);
      req.onsuccess = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("submissions")) {
          return resolve([]);
        }
        const tx = db.transaction("submissions", "readonly");
        const store = tx.objectStore("submissions");
        const getAll = store.getAll();
        getAll.onsuccess = () => resolve(getAll.result || []);
        getAll.onerror = () => resolve([]);
      };
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

async function idbDeleteSubmission(id) {
  if (typeof indexedDB === "undefined") return false;
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(SPIDER_DB_NAME, SPIDER_DB_VERSION);
      req.onsuccess = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("submissions")) {
          return resolve(false);
        }
        const tx = db.transaction("submissions", "readwrite");
        const store = tx.objectStore("submissions");
        const del = store.delete(id);
        del.onsuccess = () => resolve(true);
        del.onerror = () => resolve(false);
      };
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export default function SpiderStore({ isOpen, onClose, onLaunchGame, onOpenPublish }) {
  const [activeTab, setActiveTab] = useState("home"); // home | games | settings
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [games, setGames] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);

  // Load published games strictly from client-side storage (IndexedDB & LocalStorage)
  const refreshGamesFromStorage = async () => {
    try {
      // 1. Check LocalStorage
      const stored = localStorage.getItem("spider-portal-submissions");
      let list = [];
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) list = parsed;
        } catch {}
      }

      // 2. Check IndexedDB
      const idbList = await idbLoadSubmissions();
      if (Array.isArray(idbList) && idbList.length > 0) {
        const map = new Map();
        for (const g of idbList) map.set(g.id, g);
        for (const g of list) map.set(g.id, g);
        list = Array.from(map.values());
      }

      // 3. Transform submissions into store game entries
      const storeGames = list.map((item) => {
        const screenshots = Array.isArray(item.screenshots) && item.screenshots.length > 0
          ? item.screenshots
          : [];

        const profileImage = item.thumbnail || (screenshots.length > 0 ? screenshots[0] : "");

        return {
          id: item.id || `game-${Date.now()}`,
          title: item.title || "Untitled Game",
          developer: item.developer || "Spider Creator",
          category: item.gameType || "Action",
          genre: Array.isArray(item.tags) ? item.tags.join(" • ") : (item.gameType || "Action 3D"),
          version: item.version || "v1.0.0",
          size: item.size || "185 MB",
          description: item.description || "Created with Spider Game Engine. Zero backend client-side execution.",
          thumbUrl: profileImage,
          bannerUrl: screenshots[0] || profileImage,
          screenshots: screenshots,
          publishedOn: item.submittedOn || "Just now",
          platforms: item.platforms || ["Universal Web", "Windows PC"],
          status: "ready",
          gameCode: item.gameCode || "",
          gameName: item.gameName || "",
          projectFiles: item.projectFiles || []
        };
      });

      setGames(storeGames);
    } catch {
      setGames([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshGamesFromStorage();
    }
  }, [isOpen]);

  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      const matchSearch =
        !searchQuery ||
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.developer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat =
        selectedCategory === "All" ||
        g.category.toLowerCase().includes(selectedCategory.toLowerCase());
      return matchSearch && matchCat;
    });
  }, [games, searchQuery, selectedCategory]);

  const currentHero = filteredGames[heroIndex % (filteredGames.length || 1)] || filteredGames[0];

  const handlePlay = (game, e) => {
    if (e) e.stopPropagation();
    if (onLaunchGame) {
      onLaunchGame(game);
    } else {
      alert(`Launching ${game.title} directly in the Spider Game Viewport!`);
    }
  };

  const handleDeleteGame = async (gameId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this game from Spider Store?")) {
      return;
    }
    try {
      // 1. Delete from IndexedDB
      await idbDeleteSubmission(gameId);

      // 2. Delete from LocalStorage
      const stored = localStorage.getItem("spider-portal-submissions");
      if (stored) {
        try {
          const list = JSON.parse(stored);
          const updated = list.filter((g) => g.id !== gameId);
          localStorage.setItem("spider-portal-submissions", JSON.stringify(updated));
        } catch {}
      }

      // 3. Clear selected if it was open
      if (selectedGame && selectedGame.id === gameId) {
        setSelectedGame(null);
      }

      // 4. Refresh list
      await refreshGamesFromStorage();
    } catch (err) {
      console.error("Delete game error:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 select-none">
      <div className="w-[1100px] max-w-[96vw] h-[85vh] max-h-[760px] bg-[#f8fafc] rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* ================= HEADER ================= */}
        <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-2xs">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-950 via-indigo-950 to-purple-900 flex items-center justify-center p-1.5 shadow-xs border border-indigo-500/20">
              <Gamepad2 className="w-5 h-5 text-purple-300" />
            </div>
            <div className="flex flex-col -space-y-0.5">
              <span className="text-sm font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                SPIDER STORE
                <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Direct Play
                </span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                0-Backend • Client-Side IndexedDB
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-sm mx-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search published games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-100 hover:bg-slate-50 focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-full border border-slate-200 focus:border-indigo-500 outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {onOpenPublish && (
              <button
                onClick={onOpenPublish}
                className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Publish Game</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition font-bold"
              title="Close Store"
            >
              ✕
            </button>
          </div>
        </header>

        {/* ================= BODY ================= */}
        <div className="flex-1 flex overflow-hidden">
          {/* SIDEBAR NAVIGATION */}
          <aside className="w-52 bg-white border-r border-slate-200 p-3.5 flex flex-col justify-between shrink-0">
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => {
                  setActiveTab("home");
                  setSelectedCategory("All");
                }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === "home"
                    ? "bg-indigo-50 text-indigo-700 font-bold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Home className={`w-4 h-4 ${activeTab === "home" ? "text-indigo-600" : "text-slate-400"}`} />
                <span>Store Home</span>
              </button>

              <button
                onClick={() => setActiveTab("games")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === "games"
                    ? "bg-indigo-50 text-indigo-700 font-bold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Gamepad2 className={`w-4 h-4 ${activeTab === "games" ? "text-indigo-600" : "text-slate-400"}`} />
                  <span>All Games</span>
                </div>
                {games.length > 0 && (
                  <span className="text-[10px] px-2 py-0.2 bg-slate-100 text-slate-700 font-bold rounded-full">
                    {games.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === "settings"
                    ? "bg-indigo-50 text-indigo-700 font-bold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Settings className={`w-4 h-4 ${activeTab === "settings" ? "text-indigo-600" : "text-slate-400"}`} />
                <span>Store Info</span>
              </button>
            </nav>

            {/* Bottom Status Card */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>0 Backend Active</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Published games live entirely inside browser IndexedDB.
              </p>
            </div>
          </aside>

          {/* MAIN SCROLLABLE CONTENT */}
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* If store has no published games */}
            {games.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-4 bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                  <Gamepad2 className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold text-slate-800">Spider Store is Empty</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    All fake placeholder games have been removed. Click below or go to <strong>Build &gt; Publish to Store</strong> to upload your 1 Profile image, 4 Screenshots, Name &amp; Description. Your game will appear here immediately with a direct 1-click <strong>Play</strong> option!
                  </p>
                </div>
                {onOpenPublish && (
                  <button
                    onClick={onOpenPublish}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition active:scale-95 flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Publish Your Game to Store</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* TAB: HOME */}
                {activeTab === "home" && currentHero && (
                  <>
                    {/* HERO BANNER FEATURING PUBLISHED GAME */}
                    <div className="relative w-full h-[220px] rounded-2xl overflow-hidden shadow-md border border-slate-200 group bg-slate-900">
                      {currentHero.bannerUrl || currentHero.thumbUrl ? (
                        <img
                          src={currentHero.bannerUrl || currentHero.thumbUrl}
                          alt={currentHero.title}
                          className="w-full h-full object-cover object-center group-hover:scale-102 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 flex items-center justify-center">
                          <Gamepad2 className="w-16 h-16 text-indigo-500/30" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent flex flex-col justify-between p-6">
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-600/90 border border-white/20 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                            FEATURED COMMUNITY RELEASE
                          </span>
                        </div>

                        <div className="max-w-md space-y-1.5">
                          <h1 className="text-2xl font-black text-white drop-shadow-md">
                            {currentHero.title}
                          </h1>
                          <p className="text-xs text-slate-200 font-medium line-clamp-2 drop-shadow-xs">
                            {currentHero.description}
                          </p>

                          <div className="pt-2 flex items-center gap-3">
                            {/* DIRECT PLAY BUTTON */}
                            <button
                              onClick={(e) => handlePlay(currentHero, e)}
                              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full font-extrabold text-xs flex items-center gap-2 shadow-lg cursor-pointer transition active:scale-95"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Play Now</span>
                            </button>
                            <button
                              onClick={() => setSelectedGame(currentHero)}
                              className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full font-semibold text-xs border border-white/20 backdrop-blur-xs cursor-pointer transition"
                            >
                              View Details &amp; Screenshots
                            </button>
                            <button
                              onClick={(e) => handleDeleteGame(currentHero.id, e)}
                              className="px-3 py-2 bg-rose-600/80 hover:bg-rose-600 text-white rounded-full font-semibold text-xs border border-white/20 backdrop-blur-xs cursor-pointer transition flex items-center gap-1.5"
                              title="Delete Game from Store"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Game</span>
                            </button>
                          </div>
                        </div>

                        {/* Pagination if multiple games */}
                        {filteredGames.length > 1 && (
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1.5">
                              {filteredGames.map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() => setHeroIndex(i)}
                                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                    i === heroIndex % filteredGames.length
                                      ? "w-6 bg-white"
                                      : "w-1.5 bg-white/40"
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setHeroIndex((p) => (p > 0 ? p - 1 : filteredGames.length - 1))}
                                className="w-6 h-6 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center cursor-pointer transition text-xs"
                              >
                                ‹
                              </button>
                              <button
                                onClick={() => setHeroIndex((p) => (p + 1) % filteredGames.length)}
                                className="w-6 h-6 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center cursor-pointer transition text-xs"
                              >
                                ›
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* PUBLISHED GAMES LIST */}
                    <section className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs">
                            ✓
                          </div>
                          <div>
                            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                              Published Games ({filteredGames.length})
                            </h2>
                            <p className="text-[11px] text-slate-400">
                              Direct 1-click play ready • 0 backend
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {filteredGames.map((game) => (
                          <div
                            key={game.id}
                            onClick={() => setSelectedGame(game)}
                            className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer"
                          >
                            {/* Card Art / Profile Image */}
                            <div className="h-32 w-full relative overflow-hidden bg-slate-900">
                              {game.thumbUrl ? (
                                <img
                                  src={game.thumbUrl}
                                  alt={game.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600">
                                  <ImageIcon className="w-8 h-8" />
                                </div>
                              )}
                              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/60 text-white backdrop-blur-xs">
                                {game.version}
                              </span>
                            </div>

                            {/* Card Info & Direct Play */}
                            <div className="p-3.5 flex items-center justify-between gap-3 bg-white">
                              <div className="min-w-0">
                                <h3 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition">
                                  {game.title}
                                </h3>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {game.developer}
                                </p>
                              </div>

                              {/* DIRECT PLAY & DELETE BUTTONS */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={(e) => handleDeleteGame(game.id, e)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                                  title="Delete Game from Store"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handlePlay(game, e)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                                  title="Play Immediately"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  <span>Play</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}

                {/* TAB: ALL GAMES */}
                {activeTab === "games" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-extrabold text-slate-900">
                        All Published Games ({filteredGames.length})
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {filteredGames.map((game) => (
                        <div
                          key={game.id}
                          onClick={() => setSelectedGame(game)}
                          className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-300 transition cursor-pointer flex flex-col group"
                        >
                          <div className="h-32 w-full relative overflow-hidden bg-slate-900">
                            {game.thumbUrl ? (
                              <img
                                src={game.thumbUrl}
                                alt={game.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600">
                                <ImageIcon className="w-8 h-8" />
                              </div>
                            )}
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/60 text-white backdrop-blur-xs">
                              {game.version}
                            </span>
                          </div>

                          <div className="p-3.5 flex items-center justify-between gap-3 bg-white">
                            <div className="min-w-0">
                              <h3 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600">
                                {game.title}
                              </h3>
                              <p className="text-[11px] text-slate-400 truncate">
                                {game.genre}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={(e) => handleDeleteGame(game.id, e)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                                title="Delete Game from Store"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handlePlay(game, e)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                                title="Play Immediately"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Play</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB: SETTINGS / INFO */}
                {activeTab === "settings" && (
                  <div className="space-y-4 max-w-xl">
                    <h2 className="text-sm font-extrabold text-slate-900">Spider Store Info</h2>
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-800">Zero-Backend Client Catalog</div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          All published games are verified and stored directly inside browser IndexedDB (<code>SpiderEngineDB</code>) and LocalStorage. No server or cloud backend required.
                        </p>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">Storage Engine</span>
                        <span className="text-xs font-mono font-bold text-indigo-600">IndexedDB v2</span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">Total Games Loaded</span>
                        <span className="text-xs font-mono font-bold text-emerald-600">{games.length}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>

        {/* ================= DETAIL MODAL ================= */}
        {selectedGame && (
          <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
              {/* Banner / Cover */}
              <div className="h-52 relative bg-slate-900 shrink-0">
                {selectedGame.bannerUrl || selectedGame.thumbUrl ? (
                  <img
                    src={selectedGame.bannerUrl || selectedGame.thumbUrl}
                    alt={selectedGame.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                    <Gamepad2 className="w-12 h-12" />
                  </div>
                )}
                <button
                  onClick={() => setSelectedGame(null)}
                  className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center cursor-pointer transition shadow-xs text-xs font-bold"
                >
                  ✕
                </button>
                <div className="absolute bottom-3.5 left-4 text-white">
                  <h2 className="text-xl font-black drop-shadow-md">{selectedGame.title}</h2>
                  <p className="text-xs text-slate-200 drop-shadow-xs">
                    {selectedGame.developer} • {selectedGame.version}
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto space-y-4">
                {/* Description */}
                <div className="space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Game Description
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedGame.description}
                  </p>
                </div>

                {/* 4 STORE SHOWCASE SCREENSHOTS */}
                {selectedGame.screenshots && selectedGame.screenshots.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Showcase Screenshots ({selectedGame.screenshots.length})
                      </div>
                      <span className="text-[10px] text-slate-400">Click to enlarge</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {selectedGame.screenshots.map((shot, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedScreenshot(shot)}
                          className="h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 cursor-pointer hover:border-indigo-400 hover:scale-102 transition shadow-2xs relative group"
                        >
                          <img
                            src={shot}
                            alt={`Screenshot ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded-md bg-black/60 text-white text-[9px] font-bold">
                            #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meta details */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl text-center border border-slate-100 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Status</div>
                    <div className="font-extrabold text-emerald-600">Ready to Play</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Size</div>
                    <div className="font-extrabold text-slate-700">{selectedGame.size}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Platform</div>
                    <div className="font-extrabold text-slate-700">Universal Web</div>
                  </div>
                </div>

                {/* DIRECT PLAY & DELETE BUTTONS IN DETAIL MODAL */}
                <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleDeleteGame(selectedGame.id)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                    title="Delete Game from Store"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Game</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedGame(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        handlePlay(selectedGame);
                        setSelectedGame(null);
                      }}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-md cursor-pointer transition active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play Now</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Screenshot Lightbox */}
        {selectedScreenshot && (
          <div
            onClick={() => setSelectedScreenshot(null)}
            className="fixed inset-0 bg-black/85 z-60 flex items-center justify-center p-6 cursor-pointer"
          >
            <div className="relative max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={selectedScreenshot}
                alt="Enlarged Screenshot"
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setSelectedScreenshot(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
