/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
// Suppress upstream Three.js r186 internal deprecations triggered by @react-three/fiber
const _origWarn = console.warn;
console.warn = function (...args) {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('THREE.Clock: This module has been deprecated') ||
    msg.includes('PCFSoftShadowMap has been removed')
  ) {
    return;
  }
  _origWarn.apply(console, args);
};

import React from 'react'
import ReactDOM from 'react-dom/client'
import * as THREE from 'three'
import { Chess } from 'chess.js'
import App from '../app.jsx'
import './index.css'

// Expose on window for sandboxed ArtifactPreview fallback
if (typeof window !== 'undefined') {
  window.React = React;
  window.ReactDOM = ReactDOM;
  window.THREE = THREE;
  window.Chess = Chess;
}

/* [LINEAGE-AUTHORS]: m4spider */
const __M4_ENGINE_LINEAGE__ = "m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("FATAL ROOT ERROR IN APP:", error, errorInfo);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, background: '#0f172a', color: '#f43f5e', fontFamily: 'monospace', height: '100vh', boxSizing: 'border-box', overflow: 'auto' }}>
          <h1 style={{ color: '#ef4444', fontSize: '20px', marginBottom: '12px' }}>Spider Engine Startup Error</h1>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>An unhandled error occurred while mounting the application:</p>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#1e293b', padding: '16px', borderRadius: '8px', color: '#fca5a5', fontSize: '12px', border: '1px solid #334155' }}>
            {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

try {
  console.log("src/main.jsx: Rendering App into #root...");
  const rootEl = document.getElementById('root');
  if (!rootEl) {
    console.error("src/main.jsx: #root element NOT FOUND!");
  } else {
    ReactDOM.createRoot(rootEl).render(
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    );
    console.log("src/main.jsx: root.render called successfully!");
  }
} catch (e) {
  console.error("FATAL ERROR IN src/main.jsx:", e);
}
