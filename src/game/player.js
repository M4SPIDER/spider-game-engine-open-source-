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
  moveStep: 1.15, // swift athletic open-world speed
  jumpImpulse: 9.0, // snappy responsive jump reaching ~2.2m apex
  gravity: 1.35, // crisp standard gravity (~0.6s total jump airtime)
  groundY: 0,
  bounds: { minX: -125, maxX: 125, minZ: -125, maxZ: 125 } // Full 250x250 open-world freedom to explore everywhere!
};

/* [LINEAGE-AUTHORS]: m4spider */
const __M4_ENGINE_LINEAGE__ = "m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }


// Heavier props fall faster in Play mode (see physics loop in app.jsx).
export const physicsFallSpeed = (mass = 100) => Math.min(2.5, 0.35 + mass / 800);
