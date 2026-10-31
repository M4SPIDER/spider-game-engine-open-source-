/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
// Demo game hero tuning — WASD speed, jump, world bounds (editor units).
// The Play-mode loop in app.jsx + Hero animation in GameViewport.jsx read this.
export const PLAYER = {
  id: "player",
  moveStep: 0.6, // per tick at 60ms
  jumpImpulse: 9,
  gravity: 0.85,
  groundY: 0,
  bounds: { minX: -25, maxX: 25, minZ: -15, maxZ: 35 }
};

/* [LINEAGE-AUTHORS]: m4spider */
const __M4_ENGINE_LINEAGE__ = "m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }


// Heavier props fall faster in Play mode (see physics loop in app.jsx).
export const physicsFallSpeed = (mass = 100) => Math.min(2.5, 0.35 + mass / 800);
