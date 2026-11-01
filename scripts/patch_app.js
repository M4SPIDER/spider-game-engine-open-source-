const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'app.jsx');
const gameCompPath = path.join(__dirname, '..', 'src', 'game', 'GameComponent.jsx');

let appCode = fs.readFileSync(appPath, 'utf8');
const gameCompCode = fs.readFileSync(gameCompPath, 'utf8');

console.log('App length:', appCode.length);
console.log('GameComponent length:', gameCompCode.length);

// 1. Audio Tap hook near top of app.jsx
const audioTapHook = `
// Spider Engine Direct Internal Audio Destination Tap for 60 FPS Video Recorder
if (typeof window !== "undefined" && !window.__spiderAudioTapInstalled) {
  window.__spiderAudioTapInstalled = true;
  window.__spiderAudioDests = new Set();
  const origConnect = typeof AudioNode !== "undefined" ? AudioNode.prototype.connect : null;
  if (origConnect) {
    AudioNode.prototype.connect = function(destination, ...rest) {
      try {
        if (this.context && (destination === this.context.destination || destination === undefined)) {
          if (!this.context.__spiderRecordDest && this.context.createMediaStreamDestination) {
            const rd = this.context.createMediaStreamDestination();
            this.context.__spiderRecordDest = rd;
            window.__spiderAudioDests.add(rd);
          }
          if (this.context.__spiderRecordDest && destination !== this.context.__spiderRecordDest) {
            try { origConnect.call(this, this.context.__spiderRecordDest); } catch(e) {}
          }
        }
      } catch (err) {}
      return origConnect.call(this, destination, ...rest);
    };
  }
}
`;

if (!appCode.includes('window.__spiderAudioTapInstalled')) {
  appCode = appCode.replace(
    'import { sfx } from "./src/engine/audioSynthesizer.js";',
    'import { sfx } from "./src/engine/audioSynthesizer.js";\n' + audioTapHook
  );
  console.log('Added Audio Tap hook');
}

// 2. Replace DEFAULT_JSX_GAME content with GameComponent.jsx
const defaultGameStart = 'const DEFAULT_JSX_GAME = `';
const defaultGameEnd = '`;\n\nconst BUILTIN_PROJECT_SCRIPTS = [';

const sIdx = appCode.indexOf(defaultGameStart);
const eIdx = appCode.indexOf(defaultGameEnd);

if (sIdx !== -1 && eIdx !== -1) {
  const safeGameCode = gameCompCode.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\${/g, '\\${');
  appCode = appCode.slice(0, sIdx + defaultGameStart.length) + safeGameCode + appCode.slice(eIdx);
  console.log('Replaced DEFAULT_JSX_GAME with clean Ball Runner code');
} else {
  console.error('Could not find DEFAULT_JSX_GAME boundaries!', sIdx, eIdx);
}

// 3. Make DEFAULT_JSX_GAME default for activeJsxCode
appCode = appCode.replace(
  'return saved && saved.trim() ? saved : null;',
  'return saved && saved.trim() ? saved : DEFAULT_JSX_GAME;'
);
appCode = appCode.replace(
  'return localStorage.getItem("spider-active-jsx-name") || null;',
  'return localStorage.getItem("spider-active-jsx-name") || "GameComponent.jsx";'
);

// 4. Default viewportTab to "Viewport" instead of "Title Menu"
appCode = appCode.replace(
  'const [viewportTab, setViewportTab] = useState("Title Menu");',
  'const [viewportTab, setViewportTab] = useState("Viewport");'
);

// 5. In startViewportRecording, add audio tracks
const streamCaptureTarget = 'const stream = canvas.captureStream ? canvas.captureStream(60) : canvas.mozCaptureStream?.(60);';
const streamAudioInject = `const stream = canvas.captureStream ? canvas.captureStream(60) : canvas.mozCaptureStream?.(60);
      if (stream) {
        // Collect internal game audio tracks from active AudioContexts
        try {
          if (window.__spiderAudioDests) {
            for (const dest of window.__spiderAudioDests) {
              if (dest?.stream) {
                dest.stream.getAudioTracks().forEach((track) => {
                  if (track && track.readyState === "live") {
                    stream.addTrack(track);
                  }
                });
              }
            }
          }
        } catch (e) {}
      }`;

if (!appCode.includes('dest.stream.getAudioTracks()')) {
  appCode = appCode.replace(streamCaptureTarget, streamAudioInject);
  console.log('Added internal audio stream injection into MediaRecorder');
}

// 6. Remove annoying cursorLockToast state and toast rendering
// Remove state setter calls
appCode = appCode.replace(/setCursorLockToast\(\{[^}]+\}\);/g, '/* cursor toast removed */');
appCode = appCode.replace(/setCursorLockToast\(null\);/g, '/* cursor toast removed */');

// Remove automatic cursor lock on canvas click
appCode = appCode.replace(
  /if \(e\.target\.tagName === 'CANVAS' \|\| e\.target === e\.currentTarget \|\| e\.target\.closest\?\.?\('canvas'\) \|\| e\.target\.closest\?\.?\('\.viewport-stage-container'\)\) \{\s*requestViewportCursorLock\(\);\s*\}/g,
  '/* auto cursor lock removed */'
);

// Remove cursorLockToast rendering block
const toastRenderPattern = /\{cursorLockToast && \([\s\S]*?<\/div>\s*\)\}/;
if (toastRenderPattern.test(appCode)) {
  appCode = appCode.replace(toastRenderPattern, '{/* cursor lock toast removed */}');
  console.log('Removed cursorLockToast rendering block');
}

// 7. Draggable Controls position state & drag handler
const controlsStateSearch = 'const [isGameControlsCollapsed, setIsGameControlsCollapsed] = useState(false);';
const controlsStateInsert = `const [isGameControlsCollapsed, setIsGameControlsCollapsed] = useState(false);
  const [controlsPos, setControlsPos] = useState(() => {
    try {
      const saved = localStorage.getItem("spider-game-controls-pos");
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const controlsDragRef = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0, hasMoved: false });

  const handleControlsPointerDown = useCallback((e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.stopPropagation();
    const el = e.currentTarget.closest(".spider-floating-controls");
    const rect = el ? el.getBoundingClientRect() : { left: window.innerWidth - 320, top: 12 };
    controlsDragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: rect.left,
      origY: rect.top,
      hasMoved: false
    };

    const handlePointerMove = (ev) => {
      if (!controlsDragRef.current.dragging) return;
      const dx = ev.clientX - controlsDragRef.current.startX;
      const dy = ev.clientY - controlsDragRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        controlsDragRef.current.hasMoved = true;
      }
      const newX = Math.max(10, Math.min(window.innerWidth - 120, controlsDragRef.current.origX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 50, controlsDragRef.current.origY + dy));
      setControlsPos({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      if (controlsDragRef.current.dragging) {
        controlsDragRef.current.dragging = false;
        setControlsPos((cur) => {
          if (cur) {
            try { localStorage.setItem("spider-game-controls-pos", JSON.stringify(cur)); } catch {}
          }
          return cur;
        });
      }
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }, []);`;

if (!appCode.includes('handleControlsPointerDown')) {
  appCode = appCode.replace(controlsStateSearch, controlsStateInsert);
  console.log('Added controlsPos state and handleControlsPointerDown');
}

// 8. Replace floating controls rendering with draggable container and Edit Game button
const controlsDivOld = '<div className="absolute top-3 right-3 z-30 flex items-center gap-2 select-none">';
const controlsDivNew = `<div
                    className="spider-floating-controls fixed z-40 flex items-center gap-2 select-none transition-shadow"
                    style={controlsPos ? { left: controlsPos.x, top: controlsPos.y } : { top: 12, right: 12 }}
                  >
                    {/* Draggable Grip Handle */}
                    <div
                      onPointerDown={handleControlsPointerDown}
                      title="Click & Drag controls anywhere on screen"
                      className="p-1.5 cursor-grab active:cursor-grabbing text-slate-400 hover:text-white bg-slate-900/85 hover:bg-slate-900 rounded-xl border border-slate-700/80 shadow-lg backdrop-blur-md transition flex items-center justify-center active:scale-95"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>`;

if (appCode.includes(controlsDivOld)) {
  appCode = appCode.replace(controlsDivOld, controlsDivNew);
  console.log('Replaced controls container with draggable wrapper');
}

// Add Edit Game button inside controls toolbar
const recorderBtnAnchor = '{/* Screen Recorder Button on side of Game View */}';
const editGameBtn = `
                        {/* Edit Game Code Button */}
                        <button
                          onClick={() => setArtifactViewMode("code")}
                          title="Edit Game Code (Script Editor)"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl border border-emerald-400/60 shadow-lg cursor-pointer transition select-none backdrop-blur-md active:scale-95 text-xs font-bold"
                        >
                          <Code2 className="w-3.5 h-3.5 text-emerald-200" />
                          <span>Edit Game</span>
                        </button>
`;

if (appCode.includes(recorderBtnAnchor) && !appCode.includes('Edit Game Code (Script Editor)')) {
  appCode = appCode.replace(recorderBtnAnchor, editGameBtn + '\n                        ' + recorderBtnAnchor);
  console.log('Added Edit Game button to Controls toolbar');
}

fs.writeFileSync(appPath, appCode, 'utf8');
console.log('Successfully written updated app.jsx!');
