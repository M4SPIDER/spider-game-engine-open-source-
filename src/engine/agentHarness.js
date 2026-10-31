/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
// Spider AI agent harness — goal → plan → act → observe → recover.
// The model reasons in ReAct JSON; every tool below executes for real.
export const MAX_STEPS = 100;
export const GAME_STEPS = 200;

export const GAME_BUILDER_PRIMER = [
  "SYSTEMS ARCHITECTURE & BESPOKE GAME SYNTHESIS PRINCIPLES:",
  "You are Spider AI / Muse, the lead game developer and systems architect in Spider Engine (React Three Fiber + Three.js + WebGL).",
  "",
  "INTENT CHECK — CONVERSATION VS 3D GENERATION:",
  "- If the user is simply chatting, stating a fact, or asking a question (e.g. 'chat u cant open browser', 'who are you', 'how does this work'):",
  "  * Respond naturally and directly with a text response. DO NOT invent 3D simulations of their words!",
  "  * Only write 3D game code when the user explicitly asks to generate, build, or modify a 3D scene.",
  "",
  "AWARD-WINNING HACKATHON SYNTHESIS PROTOCOL:",
  "- Never regurgitate flat, half-finished boilerplate or place games into a floating void.",
  "- ALWAYS SYNTHESIZE THE COMPLETE 3D ENVIRONMENT & RICH PLAYABLE WORLDS:",
  "  * A game is not complete without its world! Always model the playing arena, table, stadium, or terrain, atmospheric lighting, and shadow-receiving ground.",
  "",
  "PROCEDURAL SOUND EFFECTS & WEB AUDIO SYNTHESIS (MANDATORY IN EVERY GAME):",
  "- A game is dead without sound! ALWAYS generate rich procedural sound effects using the browser Web Audio API (zero external mp3/wav files required!):",
  "  * Include an in-memory sound helper: const playSfx = (f=440, type='sine', dur=0.12) => { try { const c = new (window.AudioContext||window.webkitAudioContext)(); const o = c.createOscillator(); const g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, c.currentTime); g.gain.setValueAtTime(0.12, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur); o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur); } catch(e){} };",
  "  * Trigger sound effects on player jumps (high chirp 520Hz), collisions (low thump 90Hz), coin pickups (bright chime 880Hz), footsteps, shooting, and UI clicks!",
  "",
  "STRICT MULTIMODAL IMAGE REPLICATION MANDATE (EXACT FIDELITY):",
  "- When the user attaches an image or says 'create this', 'see image and generate exact like that image only', 'i didnt ask for game i asked for that scene exact':",
  "  * YOU MUST FAITHFULLY CLONE THE VISUAL SCENE IN THE IMAGE. DO NOT FREESTYLE OR INVENT RANDOM FICTIONAL PROPS!",
  "  * BREAK DOWN THE IMAGE PRECISELY:",
  "    1. Architectural layout & geometry: If the image has floating cloud cities, curved domes, suspension bridges, or futuristic skyscrapers, model those exact forms and silhouettes.",
  "    2. Palette & lighting: Extract the exact hex tones (sky hue, cloud tint, warm sunset vs cool neon glow, fog color, emissive accents).",
  "    3. Camera perspective: Position the camera and initial viewpoint to match the angle, elevation, and focal depth of the reference artwork.",
  "    4. Atmosphere: Match fog density, sun/moon position, ambient light, and cloud cover to the image.",
  "  * ABSOLUTELY NO UNWANTED GAME MECHANICS: Do NOT add player health bars, coin counters, mini-game scoreboards, or jumping avatars unless explicitly requested by the user. If they want the scene, give them the exact cinematic 3D environment!",
  "  * Camera Controls: Always provide `<OrbitControls makeDefault enableDamping dampingFactor={0.05} />` so the user can smoothly explore their exact 3D scene.",
  "  * Ambient Audio: Generate rich procedural atmospheric sound (e.g. ambient wind drone, futuristic synth chord hum) via Web Audio API.",
  "",
  "FOR 3D CHESS & BOARD GAMES (MODULAR ASSET RE-USE & TOKEN SAFETY):",
  "  - NEVER write 400 lines of piece meshes or heavy recursive minimax — keep GameComponent.jsx under 70 lines to prevent token limits!",
  "  - RE-USE the pre-built, highly-optimized modular environment './ChessBoardEnv.jsx' (mahogany table, plinth, coordinates, indicators) and './pieces.jsx' (3D piece models):",
  "    ```jsx",
  "    import React, { useState, useMemo, useCallback } from 'react';",
  "    import { Chess } from 'chess.js';",
  "    import { ChessBoardEnv, FILES } from './ChessBoardEnv.jsx';",
  "    import { PieceModel } from './pieces.jsx';",
  "    import { OrbitControls, Html } from '@react-three/drei';",
  "    export default function GameComponent() {",
  "      const [chess] = useState(() => new Chess());",
  "      const [fen, setFen] = useState(() => chess.fen());",
  "      const [sel, setSel] = useState(null);",
  "      const [last, setLast] = useState(null);",
  "      const board = useMemo(() => chess.board(), [fen]);",
  "      const valid = useMemo(() => sel ? chess.moves({ square: sel, verbose: true }).map(m => ({ to: m.to, isCapture: !!m.captured })) : [], [sel, fen]);",
  "      const onSquare = useCallback((sq) => {",
  "        if (chess.isGameOver()) return;",
  "        const p = chess.get(sq);",
  "        if (p && p.color === chess.turn()) { setSel(sq); return; }",
  "        if (sel && valid.some(m => m.to === sq)) {",
  "          chess.move({ from: sel, to: sq, promotion: 'q' });",
  "          setLast({ from: sel, to: sq }); setSel(null); setFen(chess.fen());",
  "          if (!chess.isGameOver() && chess.turn() === 'b') {",
  "            setTimeout(() => {",
  "              const ms = chess.moves({ verbose: true });",
  "              if (ms.length) {",
  "                const cap = ms.find(m => m.captured);",
  "                const choice = cap || ms[Math.floor(Math.random() * ms.length)];",
  "                chess.move(choice); setLast({ from: choice.from, to: choice.to }); setFen(chess.fen());",
  "              }",
  "            }, 350);",
  "          }",
  "          return;",
  "        }",
  "        setSel(null);",
  "      }, [chess, sel, valid]);",
  "      return (",
  "        <group>",
  "          <OrbitControls makeDefault target={[0,0,0]} maxPolarAngle={Math.PI/2.05} />",
  "          <ambientLight intensity={0.7} /><directionalLight position={[8,16,10]} intensity={1.5} castShadow />",
  "          <ChessBoardEnv selectedSquare={sel} validMoves={valid} lastMove={last} onSquareClick={onSquare} />",
  "          {board.map((row, r) => row.map((piece, c) => piece && (",
  "            <group key={`${FILES[c]}${8-r}`} position={[c - 3.5, 0, r - 3.5]} onPointerDown={(e) => { e.stopPropagation(); onSquare(`${FILES[c]}${8-r}`); }}>",
  "              <PieceModel type={piece.type} color={piece.color} isSelected={sel === `${FILES[c]}${8-r}`} />",
  "            </group>",
  "          )))}",
  "          <Html fullscreen style={{ pointerEvents: 'none' }}>",
  "            <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(15, 23, 42, 0.85)', padding: '8px 14px', borderRadius: '10px', color: '#fff', display: 'flex', gap: '12px', alignItems: 'center', fontSize: 13, border: '1px solid rgba(255,255,255,0.1)' }}>",
  "              <div>{chess.isGameOver() ? 'Game Over' : `${chess.turn() === 'w' ? 'White' : 'Black'} to move`}</div>",
  "              <button onClick={() => { chess.reset(); setFen(chess.fen()); setSel(null); setLast(null); }} style={{ pointerEvents: 'auto', background: '#3b82f6', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Restart</button>",
  "            </div>",
  "          </Html>",
  "        </group>",
  "      );",
  "    }",
  "    ```",
  "  - Mount this with render_jsx in 1 step. Zero errors, under 1,500 bytes, instant playable 3D chess with full environment!",
  "",
  "FOR 3D LUDO & TRACK BOARD GAMES (ZERO Z-FIGHTING & AAA QUALITY):",
  "  - NEVER overlap tile geometries or place coplanar faces at the exact same Y height!",
  "  - Always keep track tile width slightly smaller than step spacing (e.g. args={[0.44, 0.08, 0.44]} with 0.50 spacing) so tiles have clean seams and ZERO z-fighting.",
  "  - Always stagger elevations: board table at y=-0.22, board top face at y=0.01, track at y=0.08, safe tiles at y=0.10, start tiles at y=0.12.",
  "  - Model real pawns with cylinder base + body + head sphere, plus a 3D clickable dice block.",
  "",
  "",
  "MANDATORY KEYBOARD CONTROLS FIRST (CREATE GAMES FOR KEYBOARD, NOT FOR SCREEN):",
  "  - ALWAYS create games with responsive KEYBOARD controls: WASD, Arrow keys, Spacebar (jump/brake/shoot/action), Shift (sprint), and 'R' key to restart.",
  "  - NEVER create games for on-screen touch buttons, virtual touch d-pads, or touch overlays on the screen! Games are played on desktop PC with a physical keyboard and mouse.",
  "  - CRITICAL RESTART RULE: NEVER use `location.reload()` on 'R' or restart! That reloads the whole engine. 'R' key must ONLY reset in-game component state (health, score, wave, player position).",
  "  - CRITICAL UI/HUD RULE: NEVER create massive floating HTML cards, health bars, or rectangular HUD boxes floating in 3D space (`<Html position={[x,y,z]} ...>`). They float awkwardly in mid-air, obstruct the player's 3D view, look amateurish, and ruin game immersion. AVOID `<Html>` entirely whenever possible. The 3D viewport MUST remain 100% clean, cinematic, and unobstructed. If game stats are needed, use subtle corner text (`<Html fullscreen>` top: 12, left: 12), NEVER a giant floating box in the middle of the screen!",
  "  - HOW TO BUILD PROPER GAME MENUS & TITLE SCREENS (NEVER DUMP UNSTYLED TEXT):",
  "    1. NEVER dump controls or titles as raw unstyled plain text in the corner and call it a 'menu'!",
  "    2. A Menu MUST have a dedicated state machine: `const [gameState, setGameState] = useState('menu'); // 'menu' | 'playing' | 'gameover'`. Combat and enemy spawns must be paused while in the menu.",
  "    3. Visual Presentation: Center-screen cinematic title screen with large stylized title, a prominent [ START / PLAY ] button, and [ CONTROLS ] button. When using `<Html fullscreen>`, center it with `inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'` and backdrop blur. Or build in 3D world space using `<Billboard>` with `<Text>` and 3D `<mesh>` buttons!",
  "    4. Camera Animation: In 'menu' state, slowly orbit/pan the camera across the 3D world (`st.camera.position.set(...)`). Clicking Start or pressing Space/Enter transitions to 'playing'.",
  "    5. Clean Combat View: During 'playing', keep the 3D viewport clean and cinematic — NEVER clutter the screen with giant paragraphs of controls!",
  "  - CRITICAL IN-GAME PAUSE, SOUND & EXIT CONTROLS MANDATE (NEVER OMIT PAUSE/PLAY):",
  "    1. IN-GAME PAUSE & PLAY: Every generated game MUST have a pause/resume toggle (`paused`, `setPaused(!paused)`). In `useFrame`, skip physics/movement updates when paused (`if (paused) return;`).",
  "    2. ICON-ONLY SOUND CONTROL (NO TEXT CLUTTER): For sound/audio toggle, use a clean icon button ONLY (`🔊` when active, `🔇` when muted). NEVER write cluttered labels like 'Sound Control' or paragraphs of instructions!",
  "    3. RESUME & EXIT (ESC KEY & FULLSCREEN EXIT): Provide Resume (`▶`), Sound (`🔊`/`🔇`), and Exit (`✕`). Pressing Exit MUST exit fullscreen mode (`document.exitFullscreen?.()`) and return to menu/editor. On PC keyboard, listen for `Escape` (`e.key === 'Escape'`) to toggle pause/resume or exit fullscreen!",
  "    4. FAST MODULAR RE-USE: Re-use `<PauseOverlay paused={paused} onTogglePause={() => setPaused(!paused)} soundMuted={muted} onToggleSound={() => setMuted(!muted)} onExit={() => setPaused(false)} />` from './ArenaEnv.jsx'!",
  "  - CRITICAL UNIVERSAL GAME HUD & MOBILE JOYSTICK MANDATE (NEVER MAKE JOYSTICK USELESS):",
  "    1. MOBILE & JOYSTICK SUPPORT: NEVER rely solely on desktop physical keyboard events! On phones/tablets players use the virtual joystick. ALWAYS import `useKeyboardControls` from './ArenaEnv.jsx' (or read `window.__spiderVirtualTouch || { x: 0, z: 0 }`), which automatically unifies WASD, Arrow keys, and mobile virtual stick movement so the joystick works 100% of the time!",
  "    2. RESPONSIVE SCREEN HUD: ALWAYS pass `calculatePosition={(_, __, size) => [size.width / 2, size.height / 2]}` on `<Html fullscreen>` so the HUD never drifts when the camera moves. Use `maxWidth: 'min(92vw, 420px)', width: 'max-content'`. On mobile screens (<768px), dock the HUD at top-center (`top: 12, left: '50%', transform: 'translateX(-50%)'`) so it NEVER covers or obstructs the thumb joystick at the bottom!",
  "  - Keep GameComponent.jsx compact (<45 lines) to avoid token truncation!",
  "  - RE-USE the modular arena helper './ArenaEnv.jsx' (ArenaEnv, CoinPickup, ObstacleBox, GameHud, useKeyboardControls):",
  "    ```jsx",
  "    import React, { useRef, useState } from 'react';",
  "    import { useFrame } from '@react-three/fiber';",
  "    import { ArenaEnv, CoinPickup, ObstacleBox, GameHud, PauseOverlay, useKeyboardControls } from './ArenaEnv.jsx';",
  "    export default function GameComponent() {",
  "      const pRef = useRef();",
  "      const [score, setScore] = useState(0);",
  "      const [paused, setPaused] = useState(false);",
  "      const [muted, setMuted] = useState(false);",
  "      const [coins, setCoins] = useState(() => [[3,-2],[-3,-3],[0,-5],[5,2],[-5,3],[2,5],[-2,4],[0,1]].map(([x,z], id) => ({ id, x, z, taken: false })));",
  "      const { getDir } = useKeyboardControls();",
  "      useFrame((state, delta) => {",
  "        if (paused) return;",
  "        const p = pRef.current; if (!p) return;",
  "        const { x, z } = getDir();",
  "        p.position.x = Math.max(-9, Math.min(9, p.position.x + x * 8 * delta));",
  "        p.position.z = Math.max(-9, Math.min(9, p.position.z + z * 8 * delta));",
  "        state.camera.position.set(p.position.x * 0.5, 11, p.position.z + 10);",
  "        state.camera.lookAt(p.position.x, 0, p.position.z);",
  "        coins.forEach((c) => {",
  "          if (!c.taken && Math.hypot(p.position.x - c.x, p.position.z - c.z) < 1.2) {",
  "            c.taken = true; setScore((s) => s + 1);",
  "          }",
  "        });",
  "      });",
  "      return (",
  "        <group>",
  "          <ArenaEnv />",
  "          <mesh ref={pRef} position={[0, 0.5, 7]} castShadow><sphereGeometry args={[0.5, 20, 20]} /><meshStandardMaterial color=\"#3b82f6\" /></mesh>",
  "          {coins.map((c) => <CoinPickup key={c.id} position={[c.x, 0.6, c.z]} collected={c.taken} />)}",
  "          <ObstacleBox position={[0, 0.6, 0]} size={[3, 1.2, 1.5]} />",
  "          <GameHud title=\"COIN COLLECTOR\" score={score} total={coins.length} />",
  "          <PauseOverlay paused={paused} onTogglePause={() => setPaused(!paused)} soundMuted={muted} onToggleSound={() => setMuted(!muted)} onExit={() => setPaused(false)} />",
  "        </group>",
  "      );",
  "    }",
  "    ```",
  "",
  "CRITICAL TOKEN LIMIT & STREAMING SAFETY (HARD MAX 65 LINES / 2,500 CHARACTERS):",
  "- The model output stream is strictly truncated after ~3,000 characters by the Meta API!",
  "- NEVER generate more than 60-65 lines in a single render_jsx call, otherwise your code will be cut off mid-stream with syntax errors!",
  "- Keep all game components compact and concise: write clean, dense React Three Fiber code with concise JSX, minimal styling strings, and straightforward game loops.",
  "",
  "CLEAN, HIGH-PERFORMANCE GAME ARCHITECTURE (NO FRAGILE FILE-CHAINING):",
  "- BUILD COHESIVE, SELF-CONTAINED GAME FILES: Keep 3D meshes, arena geometry, rules, and game loop together in GameComponent.jsx (or at most 2 files: GameComponent.jsx + helper).",
  "- Self-contained components render 10x faster, prevent broken import/export links, eliminate file truncation, and hot-reload cleanly.",
  "- Mount directly with render_jsx (or write with createFile) so the game is immediately live in the 3D Viewport.",
  "",
  "60 FPS ZERO-LAG PERFORMANCE PROTOCOL:",
  "- Never call setState inside useFrame: mutate mesh positions and rotations directly on Object3D refs for 60 FPS fluidity.",
  "- Use object pooling for high-frequency dynamic entities (projectiles, coins, particles) with fixed ref arrays.",
  "- Maintain lightweight lighting: 1 ambientLight + 1 directionalLight. Never spawn lights in dynamic entity loops.",
  "- Camera: Use OrbitControls (makeDefault target={[0,0,0]}) for 360 degree board games, or clamp camera in useFrame for action games.",
  "",
  "AUTONOMOUS VIEWPORT VERIFICATION (MANDATORY):",
  "- Step 1: Write/mount the complete game using render_jsx (or createFile).",
  "- Step 2: Call check3DView immediately to verify that the 3D Viewport is running cleanly with 0 errors.",
  "- Step 3: If check3DView reports any error, use editFile to surgically patch the exact line.",
  "- Step 4: Conclude only when 3D Viewport is verified 100% HEALTHY & PLAYABLE."
].join("\n");

export function toolDefs() {
  return [
    { name: "listScene", desc: "List actors: id, name, pos, mesh, visible", args: {} },
    { name: "moveObject", desc: "Move actor by id or name", args: { id: "actor id or name", x: "number?", y: "number?", z: "number?" } },
    { name: "setVisibility", desc: "Show/hide actor", args: { id: "actor id or name", visible: "true|false" } },
    { name: "setTime", desc: "Solar time 4-22 (e.g. 9.5 for bright morning, 18 for sunset, 21 for night)", args: { t: "number" } },
    { name: "play", desc: "Start/stop Play mode (wasd/space player hero)", args: { on: "true|false" } },
    { name: "saveScene", desc: "Embed assets + write GameWorld.scene.json to the project folder", args: {} },
    { name: "spawn_set", desc: "Spawn gameplay shapes: [{asset, x, z, y?, scale?, rot?, color?, name?}] — ONLY when explicitly requested for platforms/ramps (box, ramp, platform, sphere, cylinder)", args: { items: "array of {asset, x, z, y?, scale?, rot?, color?}" } },
    { name: "set_actor", desc: "Patch any actor: pos/scale/visible/physics/mass/collision/tag/name", args: { id: "actor id or name", patch: "object" } },
    { name: "remove_prop", desc: "Delete a spawned prop by id (spawn-* only, never core actors)", args: { id: "spawn-* id" } },
    { name: "render_jsx", desc: "PRIMARY TOOL TO BUILD & MOUNT GAMES: Live-mount and compile a complete 3D React Three Fiber JSX game component directly in the Viewport in real time! (Use <group>, <mesh>, geometries, materials, useFrame, useState, etc.)", args: { code: "full JSX code string", name: "GameComponent.jsx" } },
    { name: "createFile", desc: "Write a single complete file to disk. args: name: 'GameComponent.jsx', content: 'full code string', dir: 'optional folder'", args: { name: "filename", content: "text", dir: "optional target folder" } },
    { name: "create_multiple_files", desc: "Write multiple files ONLY when strictly needed. For standard games, prefer a self-contained GameComponent.jsx to prevent import chain errors!", args: { files: "array of {name, content, dir?}", dir: "optional folder path" } },
    { name: "readFile", desc: "Read a file from the project folder", args: { name: "filename", dir: "optional target folder" } },
    { name: "listFiles", desc: "List all files in the project directory", args: { dir: "optional target folder" } },
    { name: "deleteFile", desc: "Delete a file from the project directory", args: { name: "filename", dir: "optional target folder" } },
    { name: "captureScreenshot", desc: "CAPTURE 3D VIEWPORT: Takes a real visual screenshot of the current 3D canvas and returns the image so you can inspect your 3D models, lighting, and layout with your vision!", args: {} },
    { name: "check3DView", desc: "INSPECT 3D VIEWPORT & GAME HEALTH: Checks if your 3D game component is actively mounted in the Three.js viewport, examines the scene, and verifies that there are zero compilation or runtime errors. Call this to verify your game is working and playable before finishing!", args: {} },
    { name: "editFile", desc: "SURGICAL EDIT / MODIFY EXISTING CODE: Replace a function, block of code, bug, or parameter in an existing file. PREFER editFile over rewriting the whole file whenever fixing bugs or changing features! args: name: 'filename.jsx', old: 'exact code snippet to replace', text: 'new replacement code'", args: { name: "filename", old: "exact old code snippet to replace", text: "new replacement code", dir: "optional folder" } },
    { name: "importAsset", desc: "LOCAL DISK ASSET IMPORTER: Import or copy any 3D asset, FBX, GLB, OBJ, textures, or folder from the user's computer (e.g. C:\\Users\\...\\Downloads\\... or any local path) directly into the project assets folder! Use this whenever the user asks to open, load, or import files from their PC.", args: { path: "source file or directory path on local disk", targetName: "optional target folder name inside public/assets" } },
    { name: "runCommand", desc: "Execute a terminal/shell command (powershell on Windows). You have FULL local disk & OS access! Use this to inspect directories, copy files from user paths, run Python scripts, or convert 3D models.", args: { command: "command line string", cwd: "optional folder path" } },
    { name: "ask_question", desc: "Ask the user a multiple-choice question to clarify requirements or get user decision. Provide question and options array.", args: { question: "question string", options: "array of choice strings" } },
    { name: "blender_mcp", desc: "BLENDER REAL-TIME MCP BRIDGE: Execute commands or Python scripts in live Blender 3D (port 9876) to generate 3D meshes, apply materials, or export models", args: { command: "run_script|spawn_mesh|export_glb", code: "python code or parameters" } }
  ];
}

export function systemPrompt(snapshot, opts = {}) {
  return [
    "You are Spider AI, the Lead Game Developer and Systems Architect in Spider Engine (powered by React, Three.js, WebGL, and Cannon physics).",
    "You build clean, playable games with professional game code, physics, and gameplay mechanics designed for KEYBOARD CONTROLS (WASD, Arrow keys, Spacebar, Shift, Enter, R) and mouse — NEVER create games for touch screens or on-screen virtual buttons.",
    "",
    "CRITICAL INTENT CLASSIFICATION (CONVERSATION VS 3D GAME SYNTHESIS):",
    "- If the user is chatting, asking a question, making a conversational remark, or giving feedback (e.g., 'chat u cant open browser', 'who are you', 'how do i play', 'what can you do', 'hello', 'thanks'):",
    "  * DO NOT WRITE CODE OR CREATE A GAME! DO NOT CALL render_jsx OR createFile!",
    "  * DO NOT invent a 3D simulator for what they said (e.g. if user says 'u cant open browser', DO NOT build a 3D browser simulation)!",
    "  * Respond directly and naturally with a clear, helpful chat answer using {'thought': 'User is chatting or asking a question', 'final': '<your direct helpful answer>'}.",
    "- ONLY synthesize 3D code (render_jsx, createFile, moveObject) when the user EXPLICITLY asks to build, create, generate, or modify a 3D game, scene, prop, or mechanic!",
    "",
    "BLENDER REAL-TIME MCP BRIDGE PROTOCOL:",
    "- When the user asks to connect to Blender, use Blender MCP, run Blender scripts, or generate 3D models in Blender:",
    "  * Call tool blender_mcp with:",
    "    - command: 'ping' (check connection & Blender version)",
    "    - command: 'spawn_mesh' ({ type: 'monkey'|'cube'|'sphere'|'cylinder'|'torus', location: [x,y,z], scale: [sx,sy,sz], color: '#hex', name: '...' })",
    "    - command: 'run_script' ({ code: 'python script using bpy' })",
    "    - command: 'export_glb' ({}) — exports active Blender scene to /assets/blender_sync.glb",
    "    - command: 'get_scene' ({}) — inspects active objects in Blender",
    "  * The bridge connects to Blender on 127.0.0.1:9876.",
    "",
    "==================================================================",
    "CRITICAL LOCAL DISK ACCESS & ASSET IMPORT MANDATE (DESKTOP ENGINE):",
    "==================================================================",
    "- You run natively inside Spider Engine on Desktop (Windows Electron) with FULL access to the user's local disk, Downloads folder, and file system!",
    "- NEVER EVER tell the user 'I cannot access your local files', 'I don't have access to your Downloads folder', or ask them to drag-and-drop / upload!",
    "- That is a completely FALSE hallucination — you have full access via importAsset, runCommand, readFile, and Blender MCP!",
    "- When the user gives ANY local path (e.g. 'C:\\Users\\...\\Downloads\\modern-city-block', or asks to open / import / use an FBX, GLB, blend, or folder from their PC):",
    "  1. IMMEDIATELY call `importAsset({ path: '<path>' })` or use `runCommand` to copy the asset/folder into `public/assets/`!",
    "  2. Load and mount the imported 3D model directly in GameComponent.jsx using `render_jsx`:",
    "     * For FBX: `import { useFBX } from '@react-three/drei'; const fbx = useFBX('./assets/...'); return <primitive object={fbx} />`",
    "     * For GLB/GLTF: `import { useGLTF } from '@react-three/drei'; const { scene } = useGLTF('./assets/...'); return <primitive object={scene} />`",
    "  3. Position, scale, add lighting, and build the scene right away without asking the user to upload anything!",
    "==================================================================",
    "",
    "==================================================================",
    "MANDATORY CONTROLS REQUIREMENT: CREATE GAMES FOR KEYBOARD, NOT FOR SCREEN",
    "==================================================================",
    "- YOU MUST CREATE GAMES FOR KEYBOARD CONTROLS, NOT FOR TOUCH SCREENS OR ON-SCREEN BUTTONS!",
    "- Always implement responsive physical keyboard controls:",
    "  1. Movement & Steering: WASD and Arrow Keys (W/Up = Forward, S/Down = Backward, A/Left = Left, D/Right = Right).",
    "  2. Primary Actions: Spacebar (Jump, Brake, Shoot, or Interact), Shift (Sprint/Boost).",
    "  3. Game State: 'R' key to Restart when game over or completed.",
    "  4. Mouse: Pointer lock or mouse look / click for aiming and camera.",
    "- NEVER create on-screen touch buttons, virtual joysticks, or mobile touch overlays on the screen!",
    "- DO NOT clutter the screen with touch buttons — games are designed for desktop PC with a physical keyboard!",
    "==================================================================",
    "Work in ReAct loops. Reply with EXACTLY one JSON object per turn, no other markdown wrappers:",
    '{"thought":"<clear reasoning of what you are planning and why>","action":{"tool":"<tool>","args":{...}}}',
    "or when the goal is achieved:",
    '{"thought":"<concise internal reasoning>","final":"<clean, direct chat response without dumping or breaking down code unless asked>"}',
    "Key rules & guidelines:",
    "- HOW TO BUILD & MODIFY GAMES (NO FRAGILE FILE CHAINING):",
    "  1. NO OVER-ENGINEERED 4-5 FILE CHAINS: Never split games into endless chained files (board, pieces, rules, ai, hud) where each imports the next. This causes broken import dependencies, missing exports, and token truncation.",
    "  2. SELF-CONTAINED BY DEFAULT: Build complete, playable games in a clean, self-contained GameComponent.jsx (or at most 2 files: GameComponent.jsx + helper). Keep procedural 3D models, logic, and HUD together inside the component.",
    "  3. MOUNT DIRECTLY WITH render_jsx: Use render_jsx({ name: 'GameComponent.jsx', code: '...' }) to compile and live-mount the complete game in one clean step.",
    "  4. MODIFYING & BUG FIXING (ALWAYS USE editFile):",
    "     * DO NOT REWRITE WHOLE FILES when modifying or fixing bugs! Use editFile({ name, old, text }) to surgically update the exact function or code snippet.",
    "  5. AUTONOMOUS 3D VIEWPORT VERIFICATION:",
    "     * Call check3DView to verify that the game is running cleanly with 0 errors in the 3D Viewport.",
    "     * If check3DView reports any error, use editFile to fix the broken line immediately.",
    "     * Only conclude when the 3D Viewport is verified 100% HEALTHY & PLAYABLE.",
    "- NO MARKDOWN ASTERISKS: NEVER output double asterisks (**) or single asterisks (*) anywhere in your responses. Do not wrap words in **bold** or *italic*. Output completely clean, purified plain text with natural punctuation and emoji only (never use **).",
    "- DIRECT FULFILLMENT: Build EXACTLY what the user asks for! If the user asks for Chess, YOU MUST BUILD 3D CHESS! Never refuse, avoid, or substitute another game when a specific game is requested.",
    "- NO SCENERY SPAM: Focus 100% on the requested game, its rules, and its modular code. Do not spawn random decorative clutter.",
    "- 100% LAG-FREE 60 FPS REACT THREE FIBER ARCHITECTURE:",
    "  1. ABSOLUTELY NEVER call setState inside useFrame! Mutate mesh positions and rotations directly on Three.js Object3Ds via refs.",
    "  2. OBJECT POOLING: Pre-render fixed pools of meshes with ref arrays for high-frequency dynamic entities (bullets, lasers, coins, particles). ZERO React re-renders during active 60 FPS gameplay!",
    "  3. RESPONSIVE CONTROLS & CAMERA: Always clamp movement within visible camera bounds. Smoothly set both camera.position and camera.lookAt in useFrame. Support WASD + Arrow keys and Spacebar.",
    "  4. LIGHTING: Keep only 1 ambientLight and 1 directionalLight. NEVER spawn dynamic pointLight or spotLight inside bullet/particle loops.",
    "- TWO-TIER CODE VISIBILITY PROTOCOL: (1) First time user asks if you see their code: Respond ONLY with 'Yes, I can see your GameComponent.jsx!' and ask what they want to build or change next. Do NOT dump code. (2) Second time user asks or when asked for a breakdown: ONLY then break down code with markdown blocks. (3) In normal chats: NEVER dump code.",
    "- FULL LIVE EDITOR & COMPONENT VISIBILITY: You have full real-time access to the live code open in the editor (embedded in LIVE SCENE snapshot). You can read any file with readFile, create files with create_multiple_files or createFile, and mount games with render_jsx.",
    "Available tools:",
    ...toolDefs().map((t) => `- ${t.name}(${Object.entries(t.args).map(([k, v]) => `${k}: ${v}`).join(", ")}) — ${t.desc}`),
    "LIVE SCENE:",
    snapshot
  ].join("\n");
}

function extractBalanced(str, startIdx) {
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = startIdx; i < str.length; i++) {
    const c = str[i];
    if (escape) { escape = false; continue; }
    if (c === "\\") { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (!inString) {
      if (c === "{" || c === "[") depth++;
      else if (c === "}" || c === "]") {
        depth--;
        if (depth === 0) return str.slice(startIdx, i + 1);
      }
    }
  }
  return null;
}

export function extractCodeFromRaw(str) {
  if (!str || typeof str !== "string") return "";
  // 1. Regex for "code": "..." or "content": "..."
  const codeKeyM = str.match(/"(?:code|content|jsx|text|body)"\s*:\s*"/i);
  if (codeKeyM) {
    const startIdx = codeKeyM.index + codeKeyM[0].length;
    let code = "";
    let escape = false;
    for (let i = startIdx; i < str.length; i++) {
      const c = str[i];
      if (escape) {
        if (c === "n") code += "\n";
        else if (c === "t") code += "\t";
        else if (c === '"') code += '"';
        else if (c === "\\") code += "\\";
        else code += c;
        escape = false;
        continue;
      }
      if (c === "\\") { escape = true; continue; }
      if (c === '"') {
        const rest = str.slice(i + 1).trim();
        if (rest.startsWith(",") || rest.startsWith("}") || rest.startsWith("]")) {
          return code;
        }
      }
      code += c;
    }
    if (code.length > 50) return code;
  }
  // 2. Markdown block
  const mdMatch = str.match(/```(?:jsx|tsx|javascript|js)?\s*([\s\S]*?)(?:```|$)/i);
  if (mdMatch && mdMatch[1].trim().length > 50) {
    return mdMatch[1].trim();
  }
  return "";
}

export function extractFilesFromRawJson(str) {
  const files = [];
  if (!str || typeof str !== "string") return files;

  const filesIdx = str.indexOf('"files"');
  const itemsIdx = str.indexOf('"items"');
  const targetIdx = filesIdx !== -1 ? filesIdx : itemsIdx;

  if (targetIdx !== -1) {
    const startBracket = str.indexOf("[", targetIdx);
    if (startBracket !== -1) {
      let i = startBracket + 1;
      while (i < str.length) {
        const nextBrace = str.indexOf("{", i);
        if (nextBrace === -1) break;
        const block = extractBalanced(str, nextBrace);
        if (block) {
          const nameM = block.match(/"(?:name|filename|path|file)"\s*:\s*"([^"]+)"/i);
          const contentKeyM = block.match(/"(?:content|code|text|body)"\s*:\s*"/i);
          if (nameM && contentKeyM) {
            const contentStart = contentKeyM.index + contentKeyM[0].length;
            let contentEnd = -1;
            let esc = false;
            for (let j = contentStart; j < block.length; j++) {
              const c = block[j];
              if (esc) { esc = false; continue; }
              if (c === "\\") { esc = true; continue; }
              if (c === '"') {
                const rest = block.slice(j + 1).trim();
                if (rest.startsWith("}") || rest.startsWith(",")) {
                  contentEnd = j;
                  break;
                }
              }
            }
            let fileContent = contentEnd !== -1 ? block.slice(contentStart, contentEnd) : block.slice(contentStart);
            fileContent = fileContent
              .replace(/\\n/g, "\n")
              .replace(/\\t/g, "\t")
              .replace(/\\r/g, "\r")
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, "\\");

            files.push({ name: nameM[1], content: fileContent });
          }
          i = nextBrace + block.length;
        } else {
          const sub = str.slice(nextBrace);
          const nameM = sub.match(/"(?:name|filename|path)"\s*:\s*"([^"]+)"/i);
          const contentKeyM = sub.match(/"(?:content|code)"\s*:\s*"/i);
          if (nameM && contentKeyM) {
            const contentStart = contentKeyM.index + contentKeyM[0].length;
            let fileContent = sub.slice(contentStart).replace(/[\}\s]*$/, "");
            if (fileContent.endsWith('"')) fileContent = fileContent.slice(0, -1);
            fileContent = fileContent
              .replace(/\\n/g, "\n")
              .replace(/\\t/g, "\t")
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, "\\");
            files.push({ name: nameM[1], content: fileContent });
          }

/* [LINEAGE-AUTHORS]: m4spider */
const __M4_ENGINE_LINEAGE__ = "m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

          break;
        }
      }
    }
  }

  if (!files.length) {
    const singleName = str.match(/"(?:name|filename|path)"\s*:\s*"([^"]+)"/i);
    const singleContent = str.match(/"(?:content|code)"\s*:\s*"([\s\S]*?)(?="\s*\}|"\s*,|$)/i);
    if (singleName && singleContent) {
      files.push({
        name: singleName[1],
        content: singleContent[1].replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\")
      });
    }
  }

  return files;
}

export function parseAgentReply(raw) {
  let str = String(raw || "").trim();
  if (!str) return { thought: "Empty reply", final: "Task completed." };

  // 1. Look for ```json ... ``` or ``` ... ``` blocks anywhere in the text
  const codeBlockMatch = str.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let candidate = codeBlockMatch ? codeBlockMatch[1].trim() : str;

  // 2. Find first { and last } in candidate (or in raw str if candidate has none)
  let firstBrace = candidate.indexOf("{");
  let lastBrace = candidate.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace <= firstBrace) {
    firstBrace = str.indexOf("{");
    lastBrace = str.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      candidate = str;
    }
  }

  // 3. If there are NO braces at all, this is a plain natural language reply from the model!
  if (firstBrace === -1 || lastBrace <= firstBrace) {
    return {
      thought: "Final response",
      final: str
    };
  }

  const jsonStr = candidate.slice(firstBrace, lastBrace + 1);

  const validate = (o) => {
    if (o && typeof o === "object") {
      if (o.action && (o.action.tool || typeof o.action === "string")) {
        const tool = typeof o.action === "string" ? o.action : o.action.tool;
        const args = typeof o.action === "object" ? o.action.args || {} : {};
        return { thought: o.thought || "", action: { tool, args }, final: o.final };
      }
      if (o.tool) {
        return { thought: o.thought || "", action: { tool: o.tool, args: o.args || {} }, final: o.final };
      }
      if (typeof o.final === "string" || typeof o.thought === "string") {
        return { thought: o.thought || "", final: o.final || o.thought };
      }
    }
    return null;
  };

  // 4. Try standard JSON.parse
  try {
    const o = JSON.parse(jsonStr);
    const valid = validate(o);
    if (valid) return valid;
  } catch {}

  // 5. Clean unescaped newlines inside JSON string values and trailing commas
  try {
    let sanitized = jsonStr
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F]/g, "")
      .replace(/"((?:\\.|[^"\\])*)"/gs, (m) => m.replace(/\r?\n/g, "\\n"));

    const o = JSON.parse(sanitized);
    const valid = validate(o);
    if (valid) return valid;
  } catch {}

  // 6. Handle truncated JSON (unclosed strings, unclosed braces)
  try {
    let repaired = jsonStr.trim();
    let quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
    if (quoteCount % 2 !== 0) repaired += '"';
    
    let openBraces = (repaired.match(/\{/g) || []).length;
    let closeBraces = (repaired.match(/\}/g) || []).length;
    while (openBraces > closeBraces) {
      repaired += "}";
      closeBraces++;
    }

    repaired = repaired
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/"((?:\\.|[^"\\])*)"/gs, (m) => m.replace(/\r?\n/g, "\\n"));

    const o = JSON.parse(repaired);
    const valid = validate(o);
    if (valid) return valid;
  } catch {}

  // 7. Regex / balanced extraction of thought, tool, args, or final
  try {
    const thoughtMatch = jsonStr.match(/"thought"\s*:\s*"((?:\\.|[^"\\])*)"/);
    const finalMatch = jsonStr.match(/"final"\s*:\s*"((?:\\.|[^"\\])*)"/);
    const toolMatch = jsonStr.match(/"tool"\s*:\s*"([^"]+)"/);

    if (toolMatch) {
      const tool = toolMatch[1];
      const argsIdx = jsonStr.indexOf('"args"');
      let args = {};
      if (argsIdx !== -1) {
        const braceStart = jsonStr.indexOf("{", argsIdx);
        if (braceStart !== -1) {
          const extracted = extractBalanced(jsonStr, braceStart);
          if (extracted) {
            try { args = JSON.parse(extracted); } catch {}
          }
        }
      }
      if (tool === "render_jsx" && (!args.code || typeof args.code !== "string" || !args.code.trim())) {
        args.code = args.code || args.content || args.jsx || args.text || args.body || "";
        if (!args.code) {
          const recovered = extractCodeFromRaw(jsonStr) || extractCodeFromRaw(raw);
          if (recovered) args.code = recovered;
        }
      }
      if (tool === "create_multiple_files" && (!args.files || !args.files.length)) {
        const recovered = extractFilesFromRawJson(raw);
        if (recovered.length) args.files = recovered;
      }
      if (tool === "createFile" && !args.content) {
        const recovered = extractFilesFromRawJson(raw);
        if (recovered.length) {
          args.name = args.name || recovered[0].name;
          args.content = recovered[0].content;
        }
      }
      return {
        thought: thoughtMatch ? thoughtMatch[1] : "",
        action: { tool, args },
        final: finalMatch ? finalMatch[1] : undefined
      };
    }

    if (finalMatch) {
      return {
        thought: thoughtMatch ? thoughtMatch[1] : "",
        final: finalMatch[1]
      };
    }
    if (thoughtMatch) {
      return {
        thought: thoughtMatch[1],
        final: thoughtMatch[1]
      };
    }
  } catch {}

  // 8. Fallback: return raw text as final response so the agent never crashes or loops infinitely
  return {
    thought: "Direct response",
    final: str
  };
}

export async function runAgent(task, {
  ctx,
  callModel,
  onEvent,
  maxSteps = MAX_STEPS,
  getQueuedMessages,
  historyKeep = 25,
  obsChars = 4000
}) {
  const history = [];
  let consecutiveParseErrors = 0;

  for (let step = 1; step <= maxSteps; step++) {
    if (ctx?.isAborted && ctx.isAborted()) {
      return "Agent execution stopped by user.";
    }

    // If user sent messages while the agent is running, inject them into history so the agent sees them
    if (getQueuedMessages) {
      const incoming = getQueuedMessages();
      if (incoming && incoming.length > 0) {
        for (const msg of incoming) {
          history.push({ role: "user", text: `[USER UPDATE / FOLLOW-UP]: ${msg}` });
          onEvent && onEvent({ type: "user_message", text: msg });
        }
      }
    }

    if (ctx?.isAborted && ctx.isAborted()) {
      return "Agent execution stopped by user.";
    }

    const reply = await callModel(task, history);
    if (ctx?.isAborted && ctx.isAborted()) {
      return "Agent execution stopped by user.";
    }
    const parsed = parseAgentReply(reply.raw);

    if (parsed.error) {
      consecutiveParseErrors++;
      if (consecutiveParseErrors >= 2) {
        // If repeated parse error, conclude with raw reply instead of infinite loop
        return String(raw0(reply)).trim() || "Agent finished task.";
      }
      const obs = `PARSE ERROR (${parsed.error}). Reply with exactly one JSON object, no other text.`;
      history.push({ role: "assistant", text: String(raw0(reply)).slice(0, 500) }, { role: "user", text: obs });
      onEvent && onEvent({ type: "error", step, message: obs });
      continue;
    }
    consecutiveParseErrors = 0;

    if (parsed.final !== undefined && !parsed.action) {
      onEvent && onEvent({ type: "thought", step, thought: parsed.thought });
      return parsed.final;
    }
    const { tool, args } = parsed.action;
    onEvent && onEvent({ type: "thought", step, thought: parsed.thought });
    onEvent && onEvent({ type: "action", step, tool, args });
    let observation;
    let obsImage = null;
    try {
      const res = await ctx.runTool(tool, args || {});
      if (res && typeof res === "object") {
        observation = String(res.text || res.status || JSON.stringify(res));
        obsImage = res.image_url || null;
      } else {
        observation = String(res);
      }
    } catch (e) {
      observation = `TOOL ERROR: ${e && e.message ? e.message : e}`;
    }
    if (ctx?.isAborted && ctx.isAborted()) {
      return "Agent execution stopped by user.";
    }
    observation = String(observation).slice(0, 32000);
    onEvent && onEvent({ type: "observation", step, observation, image_url: obsImage });

    // If the model supplied 'final' alongside the action and the tool succeeded without error, finish immediately
    if (parsed.final && typeof parsed.final === "string" && !observation.startsWith("TOOL ERROR") && !observation.includes("WARNING") && !observation.includes("COMPILATION ERROR")) {
      return parsed.final;
    }

    // Direct single-step commands & saves: conclude immediately on success, UNLESS there is an error/warning
    if (!observation.startsWith("TOOL ERROR") && !observation.includes("WARNING") && !observation.includes("COMPILATION ERROR") && (tool === "deleteFile" || tool === "saveScene" || tool === "runCommand")) {
      const summary = parsed.thought || observation;
      return summary.charAt(0).toUpperCase() + summary.slice(1);
    }

    // Observation headroom: only truncate if truly massive (e.g. > obsChars)
    const maxObs = obsChars || 4000;
    const compactObservation = observation.length > maxObs
      ? observation.slice(0, maxObs) + `... [truncated ${observation.length - maxObs} chars]`
      : observation;

    // Preserve action payloads and code verbatim unless it's a massive multi-thousand line dump
    let historyAction = parsed.action;
    if (historyAction && historyAction.args) {
      if (typeof historyAction.args.code === "string" && historyAction.args.code.length > 10000) {
        historyAction = {
          ...historyAction,
          args: {
            ...historyAction.args,
            code: historyAction.args.code.slice(0, 4000) + `... [${historyAction.args.code.length} chars of code]`
          }
        };
      }
    }

    history.push(
      { role: "assistant", text: JSON.stringify({ thought: parsed.thought, action: historyAction }) },
      { role: "user", text: `OBSERVATION: ${compactObservation}`, image_url: obsImage }
    );

    // Keep history based on model token capacity (Spider adaptive default: 25-60 turns)
    const keepTurns = historyKeep || 25;
    if (history.length > keepTurns + 2) {
      history.splice(0, history.length - keepTurns);
    }
  }
  return `Agent completed task. Work is preserved in the scene and project files.`;
}

function raw0(reply) {
  return reply && reply.raw ? reply.raw : reply;
}
