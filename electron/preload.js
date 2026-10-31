/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
const { contextBridge, ipcRenderer } = require('electron')

// Spider Engine shell API. The live MCP tool surface (listScene, spawnObject,
// moveObject, setVisibility, setTime, play, getScore, ask) is attached by the
// React app itself as window.spiderEngine once the scene boots — see app.jsx.
/* [LINEAGE-AUTHORS]: m4spider */
const __M4_ENGINE_LINEAGE__ = "m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

// Keeping that namespace free (no stub) so the page can own it.
contextBridge.exposeInMainWorld('spiderShell', {
  version: '0.9.0',
  platform: process.platform,
  // OS-keychain encryption (DPAPI on Windows) — Meta API key never sits in plain text
  encryptString: (plain) => ipcRenderer.invoke('spider-encrypt', plain),
  decryptString: (cipher) => ipcRenderer.invoke('spider-decrypt', cipher),
  encryptionAvailable: () => ipcRenderer.invoke('spider-encryption-available'),
  // Project folders on real disk
  pickFolder: () => ipcRenderer.invoke('spider-pick-folder'),

  writeProjectFile: (dir, name, contents) => ipcRenderer.invoke('spider-write-file', { dir, name, contents }),
  readProjectFile: (dir, name) => ipcRenderer.invoke('spider-read-file', { dir, name }),
  listFiles: (dir, opts = {}) => ipcRenderer.invoke('spider-list-files', { dir, ...opts }),
  deleteProjectFile: (dir, name) => ipcRenderer.invoke('spider-delete-file', { dir, name }),
  watchFolder: (dir) => ipcRenderer.invoke('spider-watch-folder', { dir }),
  onFolderChange: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('spider-folder-changed', handler);
    return () => ipcRenderer.removeListener('spider-folder-changed', handler);
  },
  // Real Shell Execution (cmd/powershell/bash) with live output streaming
  runCommand: (command, cwd, timeout, runId) => ipcRenderer.invoke('spider-run-command', { command, cwd, timeout, runId }),
  onShellStream: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('spider-shell-stream', handler);
    return () => ipcRenderer.removeListener('spider-shell-stream', handler);
  },
  // Tell the shell a project is open → expand to the full editor window
  projectOpened: () => ipcRenderer.invoke('spider-project-open'),
  // Standalone game compilation & launch
  convertExe: () => ipcRenderer.invoke('spider-convert-exe'),
  launchExe: (exePath) => ipcRenderer.invoke('spider-launch-exe', exePath),
  openFolder: (folderPath) => ipcRenderer.invoke('spider-open-folder', folderPath),
  // Blender Real-Time MCP Bridge
  blenderConnect: (opts) => ipcRenderer.invoke('spider-blender-connect', opts),
  blenderStatus: () => ipcRenderer.invoke('spider-blender-status'),
  blenderSend: (payload) => ipcRenderer.invoke('spider-blender-send', payload),
  // Meta Muse Voice Transcribe Engine
  transcribeWithMeta: (opts) => ipcRenderer.invoke('spider-meta-transcribe', opts),
  startSpeechRecognition: () => ipcRenderer.invoke('spider-speech-start'),
  stopSpeechRecognition: () => ipcRenderer.invoke('spider-speech-stop'),
  onSpeechStream: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('spider-speech-stream', handler);
    return () => ipcRenderer.removeListener('spider-speech-stream', handler);
  }
})
