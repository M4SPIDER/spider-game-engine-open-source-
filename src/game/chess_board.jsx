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
export function BoardSquares({ selected, legalMoves=[], lastMove=null, checkSquare=null, onSquareClick, hoverSquare }) {
  const light = '#E9D8B4';
  const dark = '#7A5A38';
  const squares = [];
  const legalSet = new Set(legalMoves.map(m => m.to[0]*8+m.to[1]));
  const captureSet = new Set(legalMoves.filter(m=>m.captured||m.isEnPassant).map(m=>m.to[0]*8+m.to[1]));
  for (let r=0;r<8;r++) {
    for (let c=0;c<8;c++) {
      const isLight = (r+c)%2===1;
      const key = r*8+c;
      const isSel = selected && selected[0]===r && selected[1]===c;
      const isLegal = legalSet.has(key);
      const isCap = captureSet.has(key);
      const isLast = lastMove && ((lastMove.from[0]===r&&lastMove.from[1]===c)||(lastMove.to[0]===r&&lastMove.to[1]===c));
      const isCheck = checkSquare && checkSquare[0]===r && checkSquare[1]===c;
      let col = isLight?light:dark;
      if (isLast) col = isLight?'#F5E68A':'#C9A44A';
      if (isSel) col = '#7ED957';
      if (isCheck) col = '#FF4D4D';
      const x = (c-3.5); const z = (r-3.5);
      squares.push(
        <group key={key} position={[x,0,z]}>
          <mesh position={[0,-0.15,0]} onClick={(e)=>{e.stopPropagation(); onSquareClick(r,c);}} onPointerOver={(e)=>{e.stopPropagation(); document.body.style.cursor='pointer';}}>
            <boxGeometry args={[1,0.3,1]} />
            <meshStandardMaterial color={col} roughness={0.55} metalness={0.05} />
          </mesh>
          {isLegal && !isCap && (
            <mesh position={[0,0.05,0]}>
              <cylinderGeometry args={[0.14,0.14,0.04,20]} />
              <meshStandardMaterial color="#2ECC71" roughness={0.3} />
            </mesh>
          )}
          {isCap && (
            <mesh position={[0,0.02,0]}>
              <torusGeometry args={[0.38,0.05,12,28]} />
              <meshStandardMaterial color="#FF3B3B" roughness={0.3} />
            </mesh>
          )}
          {isSel && (
            <mesh position={[0,0.03,0]}>
              <torusGeometry args={[0.42,0.03,10,32]} />
              <meshStandardMaterial color="#1AFF66" />
            </mesh>
          )}
        </group>
      );
    }

/* [LINEAGE-AUTHORS]: m4spider */
const __M4_ENGINE_LINEAGE__ = "m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

  }
  return <group>{squares}</group>;
}
export function BoardFrame(){
  return (
    <group>
      <mesh position={[0,-0.45,0]}>
        <boxGeometry args={[9.2,0.4,9.2]} />
        <meshStandardMaterial color="#3B2412" roughness={0.5} />
      </mesh>
      <mesh position={[0,-0.7,0]}>
        <boxGeometry args={[10,0.3,10]} />
        <meshStandardMaterial color="#1E130A" roughness={0.6} />
      </mesh>
    </group>
  );
}
