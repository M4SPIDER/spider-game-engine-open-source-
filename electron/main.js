/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
const { app, BrowserWindow, ipcMain, safeStorage, dialog, shell, session } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const http = require('http')
const contextMenuModule = require('electron-context-menu')
const contextMenu = contextMenuModule.default || contextMenuModule

// Set application name and dedicated userData folder to prevent cache conflicts
app.name = 'SpiderEngine';
try {
  const userDataPath = path.join(app.getPath('appData'), 'SpiderEngine');
  app.setPath('userData', userDataPath);
} catch (e) {}

// Prevent GPU cache lock conflicts on Windows
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

// Single instance lock to prevent multiple instances clashing on disk cache
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const wins = BrowserWindow.getAllWindows();
    if (wins.length > 0) {
      const mainWin = wins[0];
      if (mainWin.isMinimized()) mainWin.restore();
      mainWin.focus();
    }
  });
}

// Right-click menu: Copy for selections, Cut/Copy/Paste for inputs, Inspect in dev
contextMenu({
  showLookUpSelection: false,
  showSearchWithGoogle: false,
  showCopyImage: false,
  prepend: () => []
})

// MCP bridge — localhost HTTP so any MCP client (Claude Code/Desktop, agents)
// can drive the LIVE engine: POST /mcp {"tool":"spawnObject","args":{"name":"castle"}}
const MCP_PORT = 9287;
function toolCallExpr(tool, args) {
  const map = {
    listScene: `window.spiderEngine.listScene()`,
    spawnObject: `window.spiderEngine.spawnObject(${JSON.stringify(args.name || "")})`,
    moveObject: `window.spiderEngine.moveObject(${JSON.stringify(args.id || "")},${args.x ?? "undefined"},${args.y ?? "undefined"},${args.z ?? "undefined"})`,
    setVisibility: `window.spiderEngine.setVisibility(${JSON.stringify(args.id || "")},${!!args.visible})`,
    setTime: `window.spiderEngine.setTime(${Number(args.t)})`,
    play: `window.spiderEngine.play(${!!args.on})`,
    getScore: `window.spiderEngine.getScore()`,
    getActiveComponent: `window.spiderEngine.getActiveComponent()`,
    getLogs: `window.spiderEngine.getLogs()`,
    captureScreenshot: `window.spiderEngine.captureScreenshot()`,
    directGame: `window.spiderEngine.directGame(${JSON.stringify(args.name || "")})`,
    ask: `window.spiderEngine.ask(${JSON.stringify(String(args.text || ""))})`
  };
  if (!map[tool]) {
    // Generic agent tools ride through window.spiderEngine.tool (spawn_set, set_actor, remove_prop, scaffold_board_game, ...)
    return `(async () => { if (!window.spiderEngine) throw new Error("engine bridge not ready — open the app first"); if (!window.spiderEngine.tool) throw new Error("engine build predates generic tools — rebuild the app"); return window.spiderEngine.tool(${JSON.stringify(tool)}, ${JSON.stringify(args || {})}); })()`;
  }
  return `(async () => { if (!window.spiderEngine) throw new Error("engine bridge not ready — open the app first"); return (${map[tool]}); })()`;
}
function startMcpBridge() {
  const server = http.createServer((req, res) => {
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, mcp: "spider-engine", tools: ["listScene", "spawnObject", "spawn_set", "moveObject", "set_actor", "remove_prop", "setVisibility", "setTime", "play", "getScore", "ask", "scaffold_board_game"] }));
      return;
    }
    if (req.method !== "POST" || req.url !== "/mcp") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "POST /mcp only (GET /health for tool list)" }));
      return;
    }
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on("end", async () => {
      try {
        const { tool, args } = JSON.parse(body || "{}");
        const wins = BrowserWindow.getAllWindows().filter((w) => !w.isDestroyed());
        if (wins.length === 0) throw new Error("engine window not open");
        // Prefer the editor window (the one with a loaded page), not the splash
        const win = wins.find((w) => {
          try {
            const u = w.webContents.getURL();
            return !u.includes("splash.html") && (u.includes("index.html") || u.startsWith("http"));
          } catch { return false; }
        }) || wins.find((w) => {
          try { return !w.webContents.getURL().includes("splash.html"); } catch { return false; }
        }) || wins[0];
        console.log("MCP calling window:", win.id, "URL:", win.webContents.getURL());
        if (tool === "captureWindow") {
          const image = await win.capturePage();
          const dataUrl = image.toDataURL();
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true, result: { dataUrl } }));
          return;
        }
        if (tool === "eval") {
          const resEval = await win.webContents.executeJavaScript(String(args?.expr || ""), true);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true, result: resEval }));
          return;
        }
        let result;
        for (let tries = 0; tries < 3; tries++) {
          try {
            result = await win.webContents.executeJavaScript(toolCallExpr(String(tool || ""), args || {}), true);
            break;
          } catch (e) {
            if (tries < 2 && String(e).includes("disposed")) {
              await new Promise((r) => setTimeout(r, 300));
              continue;
            }
            throw e;
          }
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, result: result === undefined ? null : result }));
      } catch (err) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: String((err && err.message) || err) }));
      }
    });
  });
  server.on("error", () => {});
  server.listen(MCP_PORT, "127.0.0.1");
}

function createSplash() {
  // File-Explorer-shaped splash: small native window with title bar, then hands off
  const splash = new BrowserWindow({
    width: 560,
    height: 360,
    backgroundColor: '#ffffff',
    resizable: false,
    frame: false,
    center: true,
    show: false,
    icon: path.join(__dirname, '../build/icon-square.png'),
  })
  splash.loadFile(path.join(__dirname, 'splash.html'))
  splash.once('ready-to-show', () => splash.show())
  return splash
}

function createWindow(splash) {
  const standaloneConfigPath = path.join(__dirname, '../standalone-config.json')
  const isStandalone = fs.existsSync(standaloneConfigPath) || process.argv.includes('--standalone')

  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    useContentSize: true,
    backgroundColor: '#03070e',
    autoHideMenuBar: true,
    show: false,
    center: true,
    minimizable: true,
    maximizable: true,
    resizable: true,
    icon: path.join(__dirname, '../build/icon-square.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  })

  if (isStandalone) {
    win.setTitle('Spider Chess 3D')
  }

  const distFile = path.join(__dirname, '../dist/index.html')
  const devUrl = process.env.VITE_DEV_SERVER_URL

  if (devUrl) {
    win.loadURL(devUrl + (isStandalone ? '?mode=standalone-chess' : ''))
  } else if (fs.existsSync(distFile)) {
    if (isStandalone) {
      win.loadURL(`file://${distFile}?mode=standalone-chess`)
    } else {
      win.loadFile(distFile)
    }
  } else {
    win.loadURL('http://localhost:5173' + (isStandalone ? '?mode=standalone-chess' : ''))
  }

  win.webContents.on('did-finish-load', async () => {
    try {
      const html = await win.webContents.executeJavaScript('document.getElementById("root")?.innerHTML');
      if (!html || html.length === 0) {
        console.warn("Root element is empty on finish load");
      }
    } catch (e) {}
  });

  win.once('ready-to-show', () => {
    if (splash && !splash.isDestroyed()) {
      splash.close()
    }
    win.show()
    if (isStandalone) {
      win.maximize()
    }
    win.focus()
  })

  setTimeout(() => {
    if (splash && !splash.isDestroyed()) splash.close()
    if (!win.isDestroyed() && !win.isVisible()) {
      win.show()
      if (isStandalone) {
        win.maximize()
      }
      win.focus()
    }
  }, 2500)

  return win
}

app.whenReady().then(() => {
  // Allow unrestricted blob URLs, unsafe-eval and CDN scripts for creative Canvas & JSX engine
  if (session && session.defaultSession) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      const responseHeaders = { ...details.responseHeaders };
      for (const key of Object.keys(responseHeaders)) {
        if (key.toLowerCase().includes('content-security-policy')) {
          delete responseHeaders[key];
        }
      }
      callback({ responseHeaders });
    });
  }
  // OS-keychain crypto for the Meta API key (DPAPI on Windows, Keychain on macOS)
  ipcMain.handle('spider-encryption-available', async () => {
    try {
      if (typeof safeStorage.isAsyncEncryptionAvailable === 'function') {
        return await safeStorage.isAsyncEncryptionAvailable()
      }
      return safeStorage.isEncryptionAvailable()
    } catch {
      return false
    }
  })
  ipcMain.handle('spider-encrypt', async (_e, plain) => {
    try {
      const avail = typeof safeStorage.isAsyncEncryptionAvailable === 'function'
        ? await safeStorage.isAsyncEncryptionAvailable()
        : safeStorage.isEncryptionAvailable()
      if (!avail) return { ok: false, error: 'OS encryption unavailable' }
      if (typeof safeStorage.encryptStringAsync === 'function') {
        const cipherBuf = await safeStorage.encryptStringAsync(String(plain))
        return { ok: true, cipher: cipherBuf.toString('base64') }
      }
      return { ok: true, cipher: safeStorage.encryptString(String(plain)).toString('base64') }
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  })
  ipcMain.handle('spider-decrypt', async (_e, cipher) => {
    try {
      const avail = typeof safeStorage.isAsyncEncryptionAvailable === 'function'
        ? await safeStorage.isAsyncEncryptionAvailable()
        : safeStorage.isEncryptionAvailable()
      if (!avail) return { ok: false, error: 'OS encryption unavailable' }
      const buf = Buffer.from(String(cipher), 'base64')
      if (typeof safeStorage.decryptStringAsync === 'function') {
        const decrypted = await safeStorage.decryptStringAsync(buf)
        const plain = typeof decrypted === 'object' && decrypted !== null ? (decrypted.result || '') : decrypted
        return { ok: true, plain: String(plain || '') }
      }
      return { ok: true, plain: safeStorage.decryptString(buf) }
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  })
  // Project folders + files on real disk
  ipcMain.handle('spider-pick-folder', async (e) => {
    try {
      const win = BrowserWindow.fromWebContents(e.sender) || undefined
      const r = await dialog.showOpenDialog(win || undefined, { properties: ['openDirectory', 'createDirectory'] })
      if (r.canceled || !r.filePaths || r.filePaths.length === 0) return { ok: false, cancelled: true }
      return { ok: true, dir: r.filePaths[0] }
    } catch (err) {
      return { ok: false, error: String(err) }
    }

/* [LINEAGE-AUTHORS]: m4spider */
const __M4_ENGINE_LINEAGE__ = "m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

  })
  ipcMain.handle('spider-write-file', (_e, { dir, name, contents }) => {
    try {
      const targetDir = dir || process.cwd()
      if (!name) return { ok: false, error: 'missing filename' }
      fs.mkdirSync(targetDir, { recursive: true })
      const full = path.join(targetDir, name)
      const data = String(contents ?? '')
      fs.writeFileSync(full, data, 'utf8')
      return { ok: true, path: full, bytes: Buffer.byteLength(data, 'utf8') }
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  })
  ipcMain.handle('spider-read-file', (_e, { dir, name }) => {
    try {
      const targetDir = dir || process.cwd()
      if (!name) return { ok: false, error: 'missing filename' }
      const full = path.isAbsolute(name) ? name : path.join(targetDir, name)
      if (!fs.existsSync(full)) return { ok: false, error: 'file not found: ' + full }
      const content = fs.readFileSync(full, 'utf8')
      return { ok: true, path: full, content, contents: content, bytes: Buffer.byteLength(content, 'utf8') }
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  })
  ipcMain.handle('spider-list-files', (_e, { dir, recursive = false, scriptsOnly = false }) => {
    try {
      const targetDir = dir || process.cwd()
      if (!fs.existsSync(targetDir)) return { ok: true, files: [] }
      if (!recursive && !scriptsOnly) {
        const files = fs.readdirSync(targetDir, { withFileTypes: true }).map((f) => ({
          name: f.name,
          isDirectory: f.isDirectory(),
          size: f.isDirectory() ? 0 : fs.statSync(path.join(targetDir, f.name)).size
        }))
        return { ok: true, dir: targetDir, files }
      }
      const results = []
      function walk(currentDir, relDir = '') {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true })
        for (const entry of entries) {
          if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'dist-game' || entry.name === 'build-exe' || entry.name === '.git') continue
          const relPath = relDir ? `${relDir}/${entry.name}` : entry.name
          const fullPath = path.join(currentDir, entry.name)
          if (entry.isDirectory()) {
            walk(fullPath, relPath)
          } else {
            const ext = path.extname(entry.name).toLowerCase()
            if (scriptsOnly && !['.jsx', '.tsx', '.js', '.ts', '.html'].includes(ext)) continue
            results.push({
              name: entry.name,
              path: relPath,
              folder: relDir || 'root',
              fullPath,
              size: fs.statSync(fullPath).size
            })
          }
        }
      }
      walk(targetDir)
      return { ok: true, dir: targetDir, files: results }
    } catch (err) {
      return { ok: false, error: String(err), files: [] }
    }
  })
  ipcMain.handle('spider-delete-file', (_e, { dir, name }) => {
    try {
      const targetDir = dir || process.cwd()
      if (!name) return { ok: false, error: 'missing filename' }
      const full = path.join(targetDir, name)
      if (fs.existsSync(full)) fs.unlinkSync(full)
      return { ok: true, path: full }
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  })
  // Real-time disk folder watcher — synchronizes Windows File Explorer changes directly to Engine in real time
  let activeFolderWatcher = null;
  let currentWatchingDir = null;
  ipcMain.handle('spider-watch-folder', (event, { dir }) => {
    try {
      const targetDir = dir ? (path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir)) : path.join(process.cwd(), 'src/game');
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

      if (activeFolderWatcher && currentWatchingDir === targetDir) {
        return { ok: true, watching: targetDir, status: 'already-watching' };
      }
      if (activeFolderWatcher) {
        try { activeFolderWatcher.close(); } catch {}
        activeFolderWatcher = null;
      }

      currentWatchingDir = targetDir;
      let debounceTimer = null;
      activeFolderWatcher = fs.watch(targetDir, { recursive: true }, (eventType, filename) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          try {
            if (!event.sender.isDestroyed()) {
              event.sender.send('spider-folder-changed', { dir: targetDir, eventType, filename });
            }
          } catch {}
        }, 150);
      });
      return { ok: true, watching: targetDir };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  })
  // Real Shell Execution for Agent (live streaming via powershell on Windows, bash on Unix)
  ipcMain.handle('spider-run-command', async (e, { command, cwd, timeout = 60000, runId }) => {
    return new Promise((resolve) => {
      const { spawn } = require('child_process');
      const targetCwd = cwd || process.cwd();
      const isWin = process.platform === 'win32';
      const shellExecutable = isWin ? 'powershell.exe' : '/bin/bash';
      const shellArgs = isWin
        ? ['-NoLogo', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command]
        : ['-c', command];

      let stdout = '';
      let stderr = '';
      let finished = false;

      let child;
      try {
        child = spawn(shellExecutable, shellArgs, {
          cwd: targetCwd,
          windowsHide: true,
          env: { ...process.env }
        });
      } catch (err) {
        return resolve({
          ok: false,
          code: 1,
          stdout: '',
          stderr: String(err),
          error: String(err)
        });
      }

      const timer = setTimeout(() => {
        if (finished) return;
        finished = true;
        try { child.kill(); } catch {}
        resolve({
          ok: false,
          code: 124,
          stdout,
          stderr: stderr ? `${stderr}\nCommand timed out after ${timeout / 1000}s` : `Command timed out after ${timeout / 1000}s`,
          error: `Command timed out after ${timeout / 1000}s`
        });
      }, timeout);

      const sendStream = (text, stream) => {
        try {
          if (!e.sender.isDestroyed()) {
            e.sender.send('spider-shell-stream', { runId, text, stream });
          }
        } catch {}
      };

      child.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        stdout += text;
        sendStream(text, 'stdout');
      });

      child.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        stderr += text;
        sendStream(text, 'stderr');
      });

      child.on('error', (err) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        resolve({
          ok: false,
          code: 1,
          stdout,
          stderr: stderr ? `${stderr}\n${err.message}` : err.message,
          error: err.message
        });
      });

      child.on('close', (code) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        resolve({
          ok: code === 0,
          code: code ?? 0,
          stdout,
          stderr,
          error: code === 0 ? null : `Process exited with code ${code}`
        });
      });
    });
  })
  // Project lifecycle: small picker window first (X only), full framed editor after open
  ipcMain.handle('spider-project-open', (e) => {
    try {
      const win = BrowserWindow.fromWebContents(e.sender);
      if (win && !win.isDestroyed()) {
        win.setMinimumSize(1024, 680);
        win.setResizable(true);
        win.setMinimizable(true);
        win.setMaximizable(true);
        if (!win.isVisible()) win.show();
        win.maximize();
        win.focus();
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  })
  // Convert to Standalone Windows Executable (.exe)
  ipcMain.handle('spider-convert-exe', async () => {
    try {
      const { buildExe } = require('../scripts/build-exe.cjs');
      const res = await buildExe();
      return res;
    } catch (err) {
      return { ok: false, error: String((err && err.message) || err) };
    }
  });

  // Launch standalone game executable
  ipcMain.handle('spider-launch-exe', async (_e, exePath) => {
    try {
      const { spawn } = require('child_process');
      const target = exePath || path.join(__dirname, '../build-exe/SpiderChess-Windows-x64/SpiderChess.exe');
      if (!fs.existsSync(target)) return { ok: false, error: 'Executable not found at ' + target };
      const child = spawn(target, [], { detached: true, stdio: 'ignore' });
      child.unref();
      return { ok: true, pid: child.pid };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  });

  // Open output folder in Windows File Explorer
  ipcMain.handle('spider-open-folder', async (_e, folderPath) => {
    try {
      const target = folderPath || path.join(__dirname, '../build-exe/SpiderChess-Windows-x64');
      if (fs.existsSync(target)) {
        await shell.openPath(target);
        return { ok: true };
      }
      return { ok: false, error: 'Folder not found: ' + target };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  });

  // Blender Real-Time MCP Bridge handlers (port 9876)
  let blenderSocket = null;
  let blenderProcess = null;
  let blenderBuffer = '';
  let blenderPending = [];
  let blenderState = { connected: false, port: 9876, host: '127.0.0.1', lastCheck: 0, error: null, exePath: null };

  function findBlenderExe() {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const candidates = [
      'C:\\Users\\vvvr8\\Downloads\\blender-5.4.0-alpha+main.745ab9a3e3c5-windows.amd64-release\\blender-5.4.0-alpha+main.745ab9a3e3c5-windows.amd64-release\\blender.exe'
    ];
    const userHome = os.homedir();
    const dl = path.join(userHome, 'Downloads');
    if (fs.existsSync(dl)) {
      try {
        for (const entry of fs.readdirSync(dl)) {
          if (entry.toLowerCase().includes('blender')) {
            const p1 = path.join(dl, entry, 'blender.exe');
            if (fs.existsSync(p1)) candidates.push(p1);
            const p2 = path.join(dl, entry, entry, 'blender.exe');
            if (fs.existsSync(p2)) candidates.push(p2);
          }
        }
      } catch {}
    }
    const progFiles = [process.env['ProgramFiles'], process.env['ProgramFiles(x86)'], process.env['LOCALAPPDATA']];
    for (const pf of progFiles) {
      if (!pf) continue;
      const bf = path.join(pf, 'Blender Foundation');
      if (fs.existsSync(bf)) {
        try {
          for (const d of fs.readdirSync(bf)) {
            const exe = path.join(bf, d, 'blender.exe');
            if (fs.existsSync(exe)) candidates.push(exe);
          }
        } catch {}
      }
    }
    for (const c of candidates) {
      if (c && fs.existsSync(c)) return c;
    }
    return null;
  }

  function launchBlenderBackground(exePath) {
    if (blenderProcess) return;
    try {
      const { spawn } = require('child_process');
      const path = require('path');
      const scriptPath = path.join(__dirname, '..', 'scripts', 'spider_blender_server.py');
      blenderProcess = spawn(exePath, ['-b', '--python', scriptPath], {
        detached: true,
        stdio: 'ignore'
      });
      blenderProcess.unref();
      blenderState.exePath = exePath;
    } catch (e) {
      console.error('[Blender] Failed to launch background blender:', e);
    }
  }

  ipcMain.handle('spider-blender-status', async () => {
    return { ok: true, ...blenderState };
  });

  function setupBlenderSocket(socket, port, host, resolve) {
    blenderBuffer = '';
    socket.on('data', (data) => {
      blenderBuffer += data.toString('utf8');
      while (blenderBuffer.includes('\n')) {
        const [line, ...rest] = blenderBuffer.split('\n');
        blenderBuffer = rest.join('\n');
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed);
          const cb = blenderPending.shift();
          if (cb) cb.resolve(parsed);
        } catch {}
      }
    });

    socket.on('close', () => {
      blenderState.connected = false;
      blenderSocket = null;
      while (blenderPending.length) {
        const p = blenderPending.shift();
        p.resolve({ ok: false, error: 'Blender socket closed' });
      }
    });
  }

  ipcMain.handle('spider-blender-connect', async (_e, { port = 9876, host = '127.0.0.1', enabled = true, autoStart = true } = {}) => {
    blenderState.port = port;
    blenderState.host = host;
    if (!enabled) {
      if (blenderSocket) {
        try { blenderSocket.destroy(); } catch {}
        blenderSocket = null;
      }
      blenderState.connected = false;
      blenderState.error = null;
      return { ok: true, connected: false, message: 'Blender MCP Bridge disconnected' };
    }

    const net = require('net');

    const tryConnect = () => new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(3000);

      socket.on('connect', () => {
        blenderState.connected = true;
        blenderState.error = null;
        blenderSocket = socket;
        setupBlenderSocket(socket, port, host, resolve);
        resolve({ ok: true, connected: true, port, host, message: `Connected to Blender MCP on port ${port}` });
      });

      socket.on('error', (err) => {
        blenderState.connected = false;
        blenderState.error = err.message;
        try { socket.destroy(); } catch {}
        resolve({ ok: false, code: err.code, error: err.message });
      });

      socket.on('timeout', () => {
        blenderState.connected = false;
        blenderState.error = 'Connection timed out';
        try { socket.destroy(); } catch {}
        resolve({ ok: false, code: 'ETIMEDOUT', error: `Connection to Blender on port ${port} timed out.` });
      });

      socket.connect(port, host);
    });

    let res = await tryConnect();
    if (!res.ok && res.code === 'ECONNREFUSED' && autoStart) {
      // Auto-launch Blender MCP server if detected
      const exe = findBlenderExe();
      if (exe) {
        launchBlenderBackground(exe);
        // Wait for server to bind
        await new Promise((r) => setTimeout(r, 1800));
        res = await tryConnect();
      }
    }

    if (res.ok) {
      blenderState.connected = true;
      blenderState.error = null;
      return { ok: true, connected: true, port, host, message: `Connected to Blender MCP on port ${port}` };
    }

    return {
      ok: false,
      connected: false,
      port,
      error: res.code === 'ECONNREFUSED'
        ? `Blender MCP not detected on 127.0.0.1:${port}. Open Blender and start the MCP listener.`
        : (res.error || 'Connection failed')
    };
  });

  ipcMain.handle('spider-blender-send', async (_e, payload = {}) => {
    if (!blenderSocket || !blenderState.connected) {
      // Auto-connect if socket is not active
      const net = require('net');
      const connResult = await new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(4000);
        socket.on('connect', () => {
          blenderState.connected = true;
          blenderState.error = null;
          blenderSocket = socket;
          setupBlenderSocket(socket, blenderState.port || 9876, blenderState.host || '127.0.0.1', resolve);
          resolve(true);
        });
        socket.on('error', () => {
          blenderState.connected = false;
          try { socket.destroy(); } catch {}
          resolve(false);
        });
        socket.on('timeout', () => {
          blenderState.connected = false;
          try { socket.destroy(); } catch {}
          resolve(false);
        });
        socket.connect(blenderState.port || 9876, blenderState.host || '127.0.0.1');
      });

      if (!connResult) {
        return { ok: false, error: 'Blender MCP Bridge is not connected.' };
      }
    }
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        const idx = blenderPending.findIndex(p => p.timer === timer);
        if (idx !== -1) blenderPending.splice(idx, 1);
        resolve({ ok: false, error: 'Blender MCP execution timed out (20s)' });
      }, 20000);

      blenderPending.push({
        timer,
        resolve: (val) => {
          clearTimeout(timer);
          resolve(val);
        }
      });

      try {
        const cmd = payload.command || payload.tool || 'run_script';
        const data = payload.data || payload.args || payload;
        const msg = JSON.stringify({ command: cmd, data }) + '\n';
        blenderSocket.write(msg, 'utf8', (err) => {
          if (err) {
            clearTimeout(timer);
            const idx = blenderPending.findIndex(p => p.timer === timer);
            if (idx !== -1) blenderPending.splice(idx, 1);
            resolve({ ok: false, error: err.message });
          }
        });
      } catch (err) {
        clearTimeout(timer);
        resolve({ ok: false, error: String(err) });
      }
    });
  });

  // Meta Muse Voice Transcribe API Bridge (Real-Time ASR via Meta Model API)
  ipcMain.handle('spider-meta-transcribe', async (_e, { apiKey, base64Audio, mimeType, audioEncoding }) => {
    try {
      if (!apiKey) return { ok: false, error: 'No Meta API key found. Please check Settings > AI & Keys.' };
      const audioBuf = Buffer.from(base64Audio, 'base64');
      const blob = new Blob([audioBuf], { type: mimeType || 'audio/wav' });
      const formData = new FormData();
      formData.append('request', JSON.stringify({
        model: 'muse-voice-transcribe-1.0',
        audioEncoding: audioEncoding || 'WAV',
        mode: 'PUSH_TO_TALK'
      }));
      formData.append('audio', blob, 'speech.wav');

      const res = await fetch('https://api.meta.ai/v1/asr/transcribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Accept': 'application/json'
        },
        body: formData
      });

      const text = await res.text();
      let data = null;
      try { data = JSON.parse(text); } catch {}

      if (!res.ok) {
        return { ok: false, status: res.status, error: data?.error?.message || text || res.statusText };
      }

      const transcript = data?.transcript || (data?.turns && data.turns.map(t => t.transcript).join(' ')) || data?.text || '';
      return { ok: true, transcript };
    } catch (err) {
      return { ok: false, error: err.message || String(err) };
    }
  });

  // Legacy speech stubs (noop to avoid any leftover SAPI execution)
  ipcMain.handle('spider-speech-start', () => ({ ok: false, error: 'Replaced with Meta Muse Voice Transcribe' }));
  ipcMain.handle('spider-speech-stop', () => ({ ok: true }));

  // Grant microphone and media permissions for muse-voice-transcribe-1.0
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media' || permission === 'microphone' || permission === 'audioCapture') {
      return callback(true);
    }
    callback(true);
  });
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    return true;
  });

  startMcpBridge()
  const splash = createSplash()
  createWindow(splash)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
