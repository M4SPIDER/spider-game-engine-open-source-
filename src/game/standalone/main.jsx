/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — game.html Standalone Entry Point
 * Author: M4SPIDER (support@m4spider.com)
 */
import React from "react";
import ReactDOM from "react-dom/client";
import StandaloneGameViewer from "./StandaloneGameViewer.jsx";

/* [LINEAGE-AUTHORS]: m4spider */
const __M4_ENGINE_LINEAGE__ = "m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

const rootEl = document.getElementById("root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <StandaloneGameViewer />
    </React.StrictMode>
  );
} else {
  console.error("game.html: #root element not found!");
}

export { StandaloneGameViewer };
