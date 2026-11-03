/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
// Chess rules engine - pure logic
export function createInitialBoard(){
  const b = Array.from({length:8},()=>Array(8).fill(null));
  const back=['r','n','b','q','k','b','n','r'];
  for(let x=0;x<8;x++){
    b[0][x]={type:back[x],color:'b'};
    b[1][x]={type:'p',color:'b'};
    b[6][x]={type:'p',color:'w'};
    b[7][x]={type:back[x],color:'w'};
  }
  return b;
}
export const initialCastling=()=>({wK:true,wQ:true,bK:true,bQ:true});
export function inB(x,y){return x>=0&&x<8&&y>=0&&y<8;}
export function findKing(board,color){
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){const p=board[y][x]; if(p&&p.type==='k'&&p.color===color) return [x,y];}
  return null;
}
export function isAttacked(board,tx,ty,byColor){
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){
    const p=board[y][x]; if(!p||p.color!==byColor) continue;
    const dx=tx-x, dy=ty-y;
    if(p.type==='p'){
      const dir=byColor==='w'?-1:1;
      if(dy===dir&&(dx===1||dx===-1)) return true;
    } else if(p.type==='n'){
      if((Math.abs(dx)===1&&Math.abs(dy)===2)||(Math.abs(dx)===2&&Math.abs(dy)===1)) return true;
    } else if(p.type==='k'){
      if(Math.abs(dx)<=1&&Math.abs(dy)<=1&&(dx||dy)) return true;
    } else {
      const diag=Math.abs(dx)===Math.abs(dy);
      const straight=dx===0||dy===0;
      let ok=false;
      if(p.type==='b'&&diag) ok=true;
      if(p.type==='r'&&straight) ok=true;
      if(p.type==='q'&&(diag||straight)) ok=true;
      if(ok){
        const sx=Math.sign(dx), sy=Math.sign(dy);
        let cx=x+sx, cy=y+sy, blocked=false;
        while(cx!==tx||cy!==ty){ if(board[cy][cx]){blocked=true;break;} cx+=sx; cy+=sy; }
        if(!blocked) return true;
      }
    }
  }
  return false;
}
export function inCheck(board,color){ const k=findKing(board,color); if(!k) return false; return isAttacked(board,k[0],k[1],color==='w'?'b':'w'); }
export function getPseudoMoves(board,x,y,lastMove,castling){
  const p=board[y][x]; if(!p) return [];
  const moves=[]; const c=p.color; const dir=c==='w'?-1:1;
  const push=(tx,ty,extra={})=>{ if(inB(tx,ty)){ const t=board[ty][tx]; if(!t||t.color!==c) moves.push({from:[x,y],to:[tx,ty],capture:!!t,...extra}); }};
  const slide=(dirs)=>{ for(const [dx,dy] of dirs){ let tx=x+dx,ty=y+dy; while(inB(tx,ty)){ const t=board[ty][tx]; if(!t){moves.push({from:[x,y],to:[tx,ty],capture:false});} else { if(t.color!==c) moves.push({from:[x,y],to:[tx,ty],capture:true}); break; } tx+=dx; ty+=dy; } }};
  if(p.type==='p'){
    const start=c==='w'?6:1; const promRow=c==='w'?0:7;
    if(inB(x,y+dir)&&!board[y+dir][x]){
      if(y+dir===promRow) ['q','r','b','n'].forEach(pr=>moves.push({from:[x,y],to:[x,y+dir],capture:false,promote:pr}));
      else moves.push({from:[x,y],to:[x,y+dir],capture:false});
      if(y===start&&!board[y+2*dir][x]) moves.push({from:[x,y],to:[x,y+2*dir],capture:false,double:true});
    }
    for(const dx of [-1,1]){
      const tx=x+dx,ty=y+dir; if(!inB(tx,ty)) continue;
      const t=board[ty][tx];
      if(t&&t.color!==c){ if(ty===promRow) ['q','r','b','n'].forEach(pr=>moves.push({from:[x,y],to:[tx,ty],capture:true,promote:pr})); else moves.push({from:[x,y],to:[tx,ty],capture:true}); }
      if(lastMove&&lastMove.double&&lastMove.color!==c){
        const [lx,ly]=lastMove.to; const [fx,fy]=lastMove.from;
        if(Math.abs(fy-ly)===2&&ly===y&&lx===tx) moves.push({from:[x,y],to:[tx,ty],capture:true,enPassant:true});
      }
    }
  } else if(p.type==='n'){ for(const [dx,dy] of [[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]]) push(x+dx,y+dy); }
  else if(p.type==='b') slide([[1,1],[1,-1],[-1,1],[-1,-1]]);
  else if(p.type==='r') slide([[1,0],[-1,0],[0,1],[0,-1]]);
  else if(p.type==='q') slide([[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]);
  else if(p.type==='k'){
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){ if(!dx&&!dy) continue; push(x+dx,y+dy); }
    if(castling){
      const row=c==='w'?7:0;
      if(y===row&&x===4){
        const enemy=c==='w'?'b':'w';
        const ks=c==='w'?castling.wK:castling.bK; const qs=c==='w'?castling.wQ:castling.bQ;
        if(ks&&!board[row][5]&&!board[row][6]&&board[row][7]?.type==='r'&&board[row][7]?.color===c){
          if(!isAttacked(board,4,row,enemy)&&!isAttacked(board,5,row,enemy)&&!isAttacked(board,6,row,enemy)) moves.push({from:[x,y],to:[6,row],castle:'K'});
        }

/* [LINEAGE-AUTHORS]: m4spider */
const __M4_ENGINE_LINEAGE__ = "m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

        if(qs&&!board[row][1]&&!board[row][2]&&!board[row][3]&&board[row][0]?.type==='r'&&board[row][0]?.color===c){
          if(!isAttacked(board,4,row,enemy)&&!isAttacked(board,3,row,enemy)&&!isAttacked(board,2,row,enemy)) moves.push({from:[x,y],to:[2,row],castle:'Q'});
        }
      }
    }
  }
  return moves;
}
export function applyMoveRaw(board,move){
  const nb=board.map(r=>r.slice());
  const [fx,fy]=move.from; const [tx,ty]=move.to;
  const piece=nb[fy][fx];
  nb[fy][fx]=null;
  if(move.enPassant){ const dir=piece.color==='w'?1:-1; nb[ty-dir*-1+ (piece.color==='w'?1:-1)][tx]=null; nb[ty+1*(piece.color==='w'?1:-1)][tx]=null; }
  // fix en passant clear: pawn captured is on same rank as from
  // (already cleared above generically)
  if(move.castle){
    const row=fy;
    if(move.castle==='K'){ nb[row][5]=nb[row][7]; nb[row][7]=null; }
    else { nb[row][3]=nb[row][0]; nb[row][0]=null; }
  }
  nb[ty][tx]=move.promote?{type:move.promote,color:piece.color}:piece;
  // en passant captured pawn square
  if(move.enPassant){ nb[fy][tx]=null; }
  return nb;
}
export function getLegalMoves(board,x,y,turn,lastMove,castling){
  const p=board[y][x]; if(!p||p.color!==turn) return [];
  return getPseudoMoves(board,x,y,lastMove,castling).filter(m=>{
    const nb=applyMoveRaw(board,m);
    return !inCheck(nb,turn);
  });
}
export function getAllLegalMoves(board,turn,lastMove,castling){
  const all=[];
  for(let y=0;y<8;y++)for(let x=0;x<8;x++) if(board[y][x]?.color===turn){
    const ms=getLegalMoves(board,x,y,turn,lastMove,castling);
    ms.forEach(m=>all.push(m));
  }
  return all;
}
export function pieceValue(t){ return t==='q'?9:t==='r'?5:t==='b'||t==='n'?3:t==='p'?1:0; }
// greedy AI: pick best capture / check
 export function chooseAIMove(board,turn,lastMove,castling){
  const all=getAllLegalMoves(board,turn,lastMove,castling);
  if(!all.length) return null;
  let best=null,bestScore=-1e9;
  for(const m of all){
    const [fx,fy]=m.from; const [tx,ty]=m.to;
    const victim=board[ty][tx]; let s=Math.random()*1.5;
    if(m.capture&&victim) s+=pieceValue(victim.type)*10 - pieceValue(board[fy][fx].type)*0.2;
    if(m.promote) s+=80;
    if(m.castle) s+=6;
    const nb=applyMoveRaw(board,m);
    if(inCheck(nb,turn==='w'?'b':'w')) s+=4;
    // center control
    const cx=Math.abs(3.5-tx)+Math.abs(3.5-ty); s+=(7-cx)*0.4;
    // advancement for pawns
    if(board[fy][fx].type==='p') s+=(turn==='b'?ty-fy:fy-ty)*0.5;
    if(s>bestScore){bestScore=s;best=m;}
  }
  // 15% random for variety among equals
  if(Math.random()<0.15) return all[Math.floor(Math.random()*all.length)];
  return best;
}
