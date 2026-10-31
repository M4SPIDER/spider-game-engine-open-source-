/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */

/* [LINEAGE-AUTHORS]: m4spider */
const __M4_ENGINE_LINEAGE__ = "m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
// Spider Engine demo game — all gameplay data in one place.
export { GAME_WORLD } from "./scene.js";
export { ENVIRONMENT_ASSETS, PRIMITIVE_SHAPES } from "./assets.js";
export { COINS, COIN_RULES } from "./coins.js";
export { PLAYER, physicsFallSpeed } from "./player.js";
export { MATERIAL_PRESETS, matColor } from "./materials.js";
export { TUTORIALS } from "./tutorials.js";
