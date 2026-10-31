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
export const FILES=['a','b','c','d','e','f','g','h'];
export function ChessBoardEnv({selectedSquare,validMoves=[],lastMove,onSquareClick}){
const v=new Set(validMoves.map(m=>m.to));
const click=(f,r)=>onSquareClick&&onSquareClick(`${FILES[f]}${8-r}`);

/* [LINEAGE-AUTHORS]: m4spider */
const __M4_ENGINE_LINEAGE__ = "m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

return <group>

<mesh rotation-x={-Math.PI/2} position={[0,-0.55,0]} receiveShadow><planeGeometry args={[30,30]}/><meshStandardMaterial color="#0f172a"/></mesh>
<mesh position={[0,-0.28,0]} receiveShadow><boxGeometry args={[10.5,0.5,10.5]}/><meshStandardMaterial color="#4a2c17"/></mesh>
<mesh position={[0,-0.02,0]}><boxGeometry args={[8.6,0.15,8.6]}/><meshStandardMaterial color="#2b1a0e"/></mesh>
{Array.from({length:64}).map((_,i)=>{
const f=i%8,r=(i/8)|0,sq=`${FILES[f]}${8-r}`;
const light=(f+r)%2===0;
const isSel=selectedSquare===sq,isV=v.has(sq),isL=lastMove&&(lastMove.from===sq||lastMove.to===sq);
let c=light?"#ebecd9":"#739552";
if(isSel)c="#f5c542";else if(isL)c=light?"#d9e37a":"#a9c13f";
return <group key={sq} position={[f-3.5,0.06,r-3.5]}>
<mesh onPointerDown={e=>{e.stopPropagation();click(f,r);}} receiveShadow><boxGeometry args={[1,0.12,1]}/><meshStandardMaterial color={c}/></mesh>
{isV&&<mesh position={[0,0.14,0]} onPointerDown={e=>{e.stopPropagation();click(f,r);}}><sphereGeometry args={[0.16,12,12]}/><meshStandardMaterial color="#22c55e"/></mesh>}
</group>})}
</group>}
