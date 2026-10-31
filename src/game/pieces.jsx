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
export function PieceModel({type,color,isSelected}){
const c=color==='w'?'#f8fafc':'#111827';

/* [LINEAGE-AUTHORS]: m4spider */
const __M4_ENGINE_LINEAGE__ = "m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

const e=isSelected?'#f5c542':'#00000000';
return <group>
<mesh position={[0,0.12,0]}><cylinderGeometry args={[0.32,0.36,0.08,16]}/><meshStandardMaterial color={c}/></mesh>
{type==='p'&&<group><mesh position={[0,0.4,0]}><cylinderGeometry args={[0.12,0.2,0.4,12]}/><meshStandardMaterial color={c}/></mesh><mesh position={[0,0.68,0]}><sphereGeometry args={[0.16,12,12]}/><meshStandardMaterial color={c}/></mesh></group>}
{type==='r'&&<group><mesh position={[0,0.45,0]}><cylinderGeometry args={[0.2,0.24,0.55,12]}/><meshStandardMaterial color={c}/></mesh><mesh position={[0,0.8,0]}><boxGeometry args={[0.42,0.2,0.42]}/><meshStandardMaterial color={c}/></mesh></group>}
{type==='n'&&<group><mesh position={[0,0.45,0]}><boxGeometry args={[0.22,0.5,0.28]}/><meshStandardMaterial color={c}/></mesh><mesh position={[0,0.7,0.1]} rotation-x={0.4}><boxGeometry args={[0.2,0.35,0.4]}/><meshStandardMaterial color={c}/></mesh></group>}
{type==='b'&&<group><mesh position={[0,0.45,0]}><cylinderGeometry args={[0.14,0.22,0.5,12]}/><meshStandardMaterial color={c}/></mesh><mesh position={[0,0.82,0]}><sphereGeometry args={[0.16,12,12]}/><meshStandardMaterial color={c}/></mesh></group>}
{type==='q'&&<group><mesh position={[0,0.5,0]}><cylinderGeometry args={[0.18,0.26,0.65,12]}/><meshStandardMaterial color={c}/></mesh><mesh position={[0,0.95,0]}><sphereGeometry args={[0.18,12,12]}/><meshStandardMaterial color={c}/></mesh></group>}
{type==='k'&&<group><mesh position={[0,0.5,0]}><cylinderGeometry args={[0.18,0.26,0.7,12]}/><meshStandardMaterial color={c}/></mesh><mesh position={[0,1.0,0]}><boxGeometry args={[0.1,0.3,0.1]}/><meshStandardMaterial color={c}/></mesh><mesh position={[0,1.0,0]}><boxGeometry args={[0.24,0.1,0.1]}/><meshStandardMaterial color={c}/></mesh></group>}
{isSelected&&<mesh position={[0,0.15,0]}><torusGeometry args={[0.42,0.04,8,24]}/><meshBasicMaterial color="#f5c542"/></mesh>}
</group>}
