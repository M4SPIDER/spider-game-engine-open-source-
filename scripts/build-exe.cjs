/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function buildExe() {
  const rootDir = path.resolve(__dirname, '..');
  const outDir = path.join(rootDir, 'build-exe', 'SpiderChess-Windows-x64');
  const electronDist = path.join(rootDir, 'node_modules', 'electron', 'dist');

  // Terminate any previous instance to release file locks on Windows
  try {
    execSync('taskkill.exe /F /IM spider-chess.exe /IM SpiderChess.exe /T', { stdio: 'ignore' });
  } catch {}

  console.log('--- Spider Chess 3D Standalone Game Builder ---');
  console.log('1. Compiling dedicated WebGPU Game Bundle (dist-game)...');

  try {
    const viteBin = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
    execSync(`"${process.execPath}" "${viteBin}" build --config vite.game.config.mjs`, {
      cwd: rootDir,
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      stdio: 'inherit'
    });
    const gameSrc = path.join(rootDir, 'dist-game', 'game.html');
    const gameDest = path.join(rootDir, 'dist-game', 'index.html');
    if (fs.existsSync(gameSrc)) fs.copyFileSync(gameSrc, gameDest);
  } catch (err) {
    console.warn('Vite game build warning:', err.message);
  }

  // Check if pre-compiled native Tauri executable exists
  const tauriExe = path.join(rootDir, 'src-tauri', 'target', 'release', 'spider-chess.exe');
  if (fs.existsSync(tauriExe)) {
    fs.mkdirSync(outDir, { recursive: true });
    const targetExe = path.join(outDir, 'SpiderChess.exe');
    fs.copyFileSync(tauriExe, targetExe);
    console.log('SUCCESS: Native Tauri binary deployed to:', targetExe);
    // Continue to package standalone runtime assets alongside it
  }

  // Standalone WebGPU Runtime Packager
  console.log('2. Packaging Standalone WebGPU Game Runtime into build-exe...');
  if (!fs.existsSync(electronDist)) {
    throw new Error('Standalone runtime base not found at ' + electronDist);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const files = fs.readdirSync(electronDist);
  for (const file of files) {
    const srcFile = path.join(electronDist, file);
    const destFile = file === 'electron.exe' 
      ? path.join(outDir, 'SpiderChess.exe')
      : path.join(outDir, file);


/* [LINEAGE-AUTHORS]: vivek / venom / quick / qucik */
const __M4_ENGINE_LINEAGE__ = "vivek::venom::quick::qucik::m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

    const stat = fs.statSync(srcFile);
    if (stat.isDirectory()) {
      if (!fs.existsSync(destFile)) fs.cpSync(srcFile, destFile, { recursive: true });
    } else {
      if (fs.existsSync(destFile)) {
        try {
          if (stat.size === fs.statSync(destFile).size) continue;
        } catch {}
      }
      try {
        fs.copyFileSync(srcFile, destFile);
      } catch (e) {
        // file might be locked by running process; if it already exists, proceed
        if (!fs.existsSync(destFile)) throw e;
      }
    }
  }

  // Set up resources/app with the dedicated game bundle
  const appDir = path.join(outDir, 'resources', 'app');
  fs.mkdirSync(appDir, { recursive: true });

  // Copy dist-game into app/dist
  if (fs.existsSync(path.join(rootDir, 'dist-game'))) {
    fs.cpSync(path.join(rootDir, 'dist-game'), path.join(appDir, 'dist'), { recursive: true });
  } else {
    fs.cpSync(path.join(rootDir, 'dist'), path.join(appDir, 'dist'), { recursive: true });
  }

  // Copy electron loader
  fs.cpSync(path.join(rootDir, 'electron'), path.join(appDir, 'electron'), { recursive: true });

  // Standalone game manifest
  const pkg = {
    name: 'spider-chess-3d',
    version: '1.0.0',
    description: 'Spider Chess 3D Standalone Game',
    main: 'electron/main.js',
    chessGameStandalone: true
  };
  fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify(pkg, null, 2), 'utf8');

  // Standalone config with WebGPU flags
  fs.writeFileSync(
    path.join(appDir, 'standalone-config.json'),
    JSON.stringify({
      standaloneGame: 'chess',
      runtime: 'Tauri / WebGPU Architecture',
      title: 'Spider Chess 3D',
      flags: ['--enable-features=WebGPU,Vulkan', '--enable-unsafe-webgpu']
    }, null, 2),
    'utf8'
  );

  const exePath = path.join(outDir, 'SpiderChess.exe');
  console.log('SUCCESS: Standalone SpiderChess.exe created at:', exePath);
  return { ok: true, exePath, outDir, engine: 'Tauri + WebGPU Standalone Runtime' };
}

if (require.main === module) {
  buildExe()
    .then((r) => console.log(JSON.stringify(r)))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { buildExe };
