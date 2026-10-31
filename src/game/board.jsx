/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
import React from 'react';

export function squareToPos(f, r) {
  return [(f - 3.5) * 1.1, 0, (3.5 - r) * 1.1];
}

export function ChessBoardMesh({ selected, legalMoves = [], lastMove, checkSquare, onSquareClick, flipped }) {
  const squares = [];
  const isLight = (f, r) => (f + r) % 2 === 1;
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const df = flipped ? 7 - f : f;
      const dr = flipped ? 7 - r : r;
      const [x, y, z] = squareToPos(df, dr);
      const light = isLight(f, r);
      const isSel = selected && selected[0] === f && selected[1] === r;
      const isLegal = legalMoves.some((m) => m[0] === f && m[1] === r);
      const isLast = lastMove && ((lastMove.from[0] === f && lastMove.from[1] === r) || (lastMove.to[0] === f && lastMove.to[1] === r));
      const isCheck = checkSquare && checkSquare[0] === f && checkSquare[1] === r;
      let col = light ? '#ebcfa3' : '#8a5a3b';
      if (isLast) col = light ? '#f5e27a' : '#c9a13a';
      if (isSel) col = '#4ade80';
      if (isCheck) col = '#ef4444';
      squares.push(
        <mesh key={`${f}-${r}`} position={[x, 0, z]} onClick={(e) => { e.stopPropagation(); onSquareClick(f, r); }} onPointerOver={(e)=>{document.body.style.cursor='pointer';}} onPointerOut={()=>{document.body.style.cursor='auto';}}>
          <boxGeometry args={[1.1, 0.18, 1.1]} />
          <meshStandardMaterial color={col} roughness={0.55} metalness={0.05} />
          {isLegal && (
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.16, 0.16, 0.04, 20]} />
              <meshStandardMaterial color={isSel ? '#ffffff' : '#22c55e'} emissive="#22c55e" emissiveIntensity={0.6} roughness={0.3} />
            </mesh>
          )}
        </mesh>
      );
    }

/* [LINEAGE-AUTHORS]: m4spider */
const __M4_ENGINE_LINEAGE__ = "m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

  }
  return (
    <group>
      {/* plinth */}
      <mesh position={[0, -0.22, 0]}>
        <boxGeometry args={[10.2, 0.3, 10.2]} />
        <meshStandardMaterial color="#3b2416" roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[0, -0.42, 0]}>
        <boxGeometry args={[11, 0.25, 11]} />
        <meshStandardMaterial color="#1c1210" roughness={0.6} />
      </mesh>
      {/* gold trim */}
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[9.1, 0.06, 9.1]} />
        <meshStandardMaterial color="#d4af37" metalness={0.7} roughness={0.25} />
      </mesh>
      {squares}
      {/* coordinate labels rim */}
      {Array.from({ length: 8 }).map((_, i) => {
        const files = ['a','b','c','d','e','f','g','h'];
        const label = flipped ? files[7-i] : files[i];
        const [x,,z] = squareToPos(i, flipped ? 0 : 7);
        return null;
      })}
    </group>
  );
}
