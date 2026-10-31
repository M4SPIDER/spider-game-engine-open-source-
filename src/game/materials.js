/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
// Material library — name ↔ color binding. Element 0 drives the primary
// channel (via node.tint), Element 1 drives the secondary (via node.tint2).
export const MATERIAL_PRESETS = {
  "M_Player_Body": "#1e3a8a",
  "M_Player_Cloth": "#f59e0b",
  "M_PineNeedles_Subsurface": "#15803d",
  "M_Bark_Pine": "#451a03",
  "M_Granite_Mossy": "#78716c",
  "M_CastleWall_Limestone": "#d6d3d1",
  "M_SlateRoof_Blue": "#475569",
  "M_AgedOak_Planks": "#92400e",
  "M_Canvas_Sail": "#fef3c7",
  "M_PlateArmor_Silver": "#9ca3af",
  "M_RoyalCape": "#7c3aed",
  "M_Weapon_Carbon": "#27272a",
  "M_Gold": "#fbbf24",
  "M_Lava": "#ef4444",
  "M_Ocean": "#0284c7",
  "M_Snow": "#f8fafc",
  "M_Forest": "#166534",
  "M_Rose": "#f43f5e"
};

/* [LINEAGE-AUTHORS]: m4spider */
const __M4_ENGINE_LINEAGE__ = "m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }


export const matColor = (name) => MATERIAL_PRESETS[name];
