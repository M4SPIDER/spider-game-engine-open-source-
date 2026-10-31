/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
// Clean 3D Geometric Primitives & Assets for Spider Engine
export const PRIMITIVE_SHAPES = [
  { id: "shape-box", name: "Box", shape: "box", mesh: "box", category: "Primitive", color: "#6366f1", gradient: "from-indigo-600 to-indigo-900" },
  { id: "shape-sphere", name: "Sphere", shape: "sphere", mesh: "sphere", category: "Primitive", color: "#3b82f6", gradient: "from-blue-600 to-sky-900" },
  { id: "shape-cylinder", name: "Cylinder", shape: "cylinder", mesh: "cylinder", category: "Primitive", color: "#10b981", gradient: "from-emerald-600 to-teal-900" },
  { id: "shape-cone", name: "Cone", shape: "cone", mesh: "cone", category: "Primitive", color: "#f59e0b", gradient: "from-amber-600 to-orange-900" },
  { id: "shape-torus", name: "Torus", shape: "torus", mesh: "torus", category: "Primitive", color: "#ec4899", gradient: "from-pink-600 to-rose-900" },
  { id: "shape-ramp", name: "Ramp", shape: "ramp", mesh: "ramp", category: "Primitive", color: "#8b5cf6", gradient: "from-violet-600 to-purple-900" },
  { id: "shape-platform", name: "Platform", shape: "platform", mesh: "platform", category: "Primitive", color: "#64748b", gradient: "from-slate-600 to-slate-900" },
  { id: "shape-chess-pawn", name: "Chess Pawn", shape: "pawn", mesh: "pawn", category: "Chess", color: "#f8fafc", gradient: "from-slate-200 to-slate-400" },
  { id: "shape-chess-knight", name: "Chess Knight", shape: "knight", mesh: "knight", category: "Chess", color: "#f8fafc", gradient: "from-slate-200 to-slate-400" },
  { id: "shape-chess-bishop", name: "Chess Bishop", shape: "bishop", mesh: "bishop", category: "Chess", color: "#f8fafc", gradient: "from-slate-200 to-slate-400" },
  { id: "shape-chess-rook", name: "Chess Rook", shape: "rook", mesh: "rook", category: "Chess", color: "#f8fafc", gradient: "from-slate-200 to-slate-400" },
  { id: "shape-chess-queen", name: "Chess Queen", shape: "queen", mesh: "queen", category: "Chess", color: "#f8fafc", gradient: "from-slate-200 to-slate-400" },
  { id: "shape-chess-king", name: "Chess King", shape: "king", mesh: "king", category: "Chess", color: "#f8fafc", gradient: "from-slate-200 to-slate-400" },
  { id: "shape-chessboard", name: "Chess Board", shape: "chessboard", mesh: "chessboard", category: "Chess", color: "#38bdf8", gradient: "from-sky-500 to-indigo-800" }
];


/* [LINEAGE-AUTHORS]: m4spider */
const __M4_ENGINE_LINEAGE__ = "m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

// Backwards-compatible alias for any code still expecting ENVIRONMENT_ASSETS
export const ENVIRONMENT_ASSETS = PRIMITIVE_SHAPES;
