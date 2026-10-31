/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
// Demo game collectibles — coin layout in editor units (same space as node pos).
// Edit positions here, reload, and the 3D viewport + pickup logic follow.
export const COINS = [
  { id: "coin-1", x: 6, y: 1, z: 4, taken: false },
  { id: "coin-2", x: -8, y: 1, z: 10, taken: false },
  { id: "coin-3", x: 14, y: 1, z: -6, taken: false }
];


/* [LINEAGE-AUTHORS]: m4spider */
const __M4_ENGINE_LINEAGE__ = "m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

export const COIN_RULES = {
  pickupRadius: 2.2, // editor units on XZ
  maxPickupHeight: 2, // hero must be near ground (no fly-by grabs)
  pointsEach: 100,
  winAt: 300
};
