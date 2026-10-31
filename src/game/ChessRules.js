/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
// Chess Rules Engine - pure logic
export function initialBoard(){
  const b = Array.from({length:8},()=>Array(8).fill(null));
  const back=['r','n','b','q','k','b','n','r'];
  for(let c=0;c<8;c++){
    b[0][c]={type:back[c],color:'b',hasMoved:false};
    b[1][c]={type:'p',color:'b',hasMoved:false};
    b[6][c]={type:'p',color:'w',hasMoved:false};
    b[7][c]={type:back[c],color:'w',hasMoved:false};
  }
  return b;
}
export const inside=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
export function clone(b){return b.map(row=>row.map(p=>p?{...p}:null));}
export function findKing(b,color){
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=b[r][c];if(p&&p.type==='k'&&p.color===color)return[r,c];}
  return null;
}
export function isAttacked(b,r,c,by){
  for(let rr=0;rr<8;rr++)for(let cc=0;cc<8;cc++){
    const p=b[rr][cc];if(!p||p.color!==by)continue;
    const dr=r-rr,dc=c-cc;
    if(p.type==='p'){
      const dir=by==='w'?-1:1;
      if(rr+dir===r&&Math.abs(cc-c)===1)return true;
    } else if(p.type==='n'){
      if((Math.abs(dr)===2&&Math.abs(dc)===1)||(Math.abs(dr)===1&&Math.abs(dc)===2))return true;
    } else if(p.type==='k'){
      if(Math.max(Math.abs(dr),Math.abs(dc))===1)return true;
    } else {
      let dirs=[];
      if(p.type==='b'||p.type==='q')dirs.push([1,1],[1,-1],[-1,1],[-1,-1]);
      if(p.type==='r'||p.type==='q')dirs.push([1,0],[-1,0],[0,1],[0,-1]);
      for(const[dr2,dc2]of dirs){
        let nr=rr+dr2,nc=cc+dc2;
        while(inside(nr,nc)){
          if(nr===r&&nc===c)return true;
          if(b[nr][nc])break;
          nr+=dr2;nc+=dc2;
        }
      }
    }
  }
  return false;
}
export function inCheck(b,color){const k=findKing(b,color);if(!k)return false;return isAttacked(b,k[0],k[1],color==='w'?'b':'w');}
export function pseudoMoves(b,r,c,enPassant){
  const p=b[r][c];if(!p)return[];
  const moves=[];
  const push=(tr,tc,extra={})=>{if(inside(tr,tc)){const t=b[tr][tc];if(!t||t.color!==p.color)moves.push({from:[r,c],to:[tr,tc],capture:!!t,...extra});}};
  const slide=(dirs)=>{for(const[dr,dc]of dirs){let nr=r+dr,nc=c+dc;while(inside(nr,nc)){const t=b[nr][nc];if(!t)moves.push({from:[r,c],to:[nr,nc],capture:false});else{if(t.color!==p.color)moves.push({from:[r,c],to:[nr,nc],capture:true});break;}nr+=dr;nc+=dc;}}};
  if(p.type==='p'){
    const dir=p.color==='w'?-1:1;
    const start=p.color==='w'?6:1;
    if(inside(r+dir,c)&&!b[r+dir][c]){
      const promo=(r+dir===0||r+dir===7)?'q':null;
      moves.push({from:[r,c],to:[r+dir,c],capture:false,promotion:promo});
      if(r===start&&!b[r+2*dir][c])moves.push({from:[r,c],to:[r+2*dir,c],capture:false,double:true});
    }
    for(const dc of[-1,1]){
      if(!inside(r+dir,c+dc))continue;
      const t=b[r+dir][c+dc];
      if(t&&t.color!==p.color){const promo=(r+dir===0||r+dir===7)?'q':null;moves.push({from:[r,c],to:[r+dir,c+dc],capture:true,promotion:promo});}
      else if(enPassant&&enPassant[0]===r+dir&&enPassant[1]===c+dc){moves.push({from:[r,c],to:[r+dir,c+dc],capture:true,enPassantTake:true});}
    }
  } else if(p.type==='n'){
    for(const[dr,dc]of[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]])push(r+dr,c+dc);
  } else if(p.type==='b'){slide([[1,1],[1,-1],[-1,1],[-1,-1]]);}
  else if(p.type==='r'){slide([[1,0],[-1,0],[0,1],[0,-1]]);}
  else if(p.type==='q'){slide([[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]]);}
  else if(p.type==='k'){
    for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;push(r+dr,c+dc);}
    if(!p.hasMoved&&!inCheck(b,p.color)){
      const row=p.color==='w'?7:0;
      if(r===row&&c===4){
        if(!b[row][5]&&!b[row][6]&&b[row][7]&&b[row][7].type==='r'&&!b[row][7].hasMoved){
          if(!isAttacked(b,row,5,p.color==='w'?'b':'w')&&!isAttacked(b,row,6,p.color==='w'?'b':'w'))moves.push({from:[r,c],to:[row,6],castle:'K'});
        }

/* [LINEAGE-AUTHORS]: m4spider */
const __M4_ENGINE_LINEAGE__ = "m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

        if(!b[row][3]&&!b[row][2]&&!b[row][1]&&b[row][0]&&b[row][0].type==='r'&&!b[row][0].hasMoved){
          if(!isAttacked(b,row,3,p.color==='w'?'b':'w')&&!isAttacked(b,row,2,p.color==='w'?'b':'w'))moves.push({from:[r,c],to:[row,2],castle:'Q'});
        }
      }
    }
  }
  return moves;
}
export function legalMoves(b,r,c,enPassant){
  const p=b[r][c];if(!p)return[];
  return pseudoMoves(b,r,c,enPassant).filter(m=>{
    const nb=applyMove(b,m);
    return !inCheck(nb,p.color);
  });
}
export function allLegal(b,color,enPassant){
  const all=[];
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=b[r][c];if(p&&p.color===color){for(const m of legalMoves(b,r,c,enPassant))all.push(m);}}
  return all;
}
export function applyMove(b,m,promoChoice){
  const nb=clone(b);
  const [fr,fc]=m.from;const [tr,tc]=m.to;
  const p=nb[fr][fc];
  nb[fr][fc]=null;
  if(m.enPassantTake){const dir=p.color==='w'?1:-1;nb[tr+dir][tc]=null;}
  if(m.castle){
    const row=fr;
    if(m.castle==='K'){nb[row][5]=nb[row][7];nb[row][7]=null;if(nb[row][5])nb[row][5].hasMoved=true;}
    else{nb[row][3]=nb[row][0];nb[row][0]=null;if(nb[row][3])nb[row][3].hasMoved=true;}
  }
  p.hasMoved=true;
  if(m.promotion){p.type=promoChoice||'q';}
  nb[tr][tc]=p;
  return nb;
}
const VAL={p:100,n:320,b:330,r:500,q:900,k:0};
export function evaluate(b){
  let s=0;
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=b[r][c];if(!p)continue;let v=VAL[p.type]||0;if(p.type==='p')v+=(p.color==='w'?(6-r)*8:(r)*8);if(p.color==='w')s+=v;else s-=v;}
  return s;
}
export function aiBestMove(board,color,enPassant,difficulty){
  const moves=allLegal(board,color,enPassant);
  if(!moves.length)return null;
  if(difficulty==='easy')return moves[Math.floor(Math.random()*moves.length)];
  let best=null,bestScore=color==='w'?-1e9:1e9;
  const shuffled=[...moves].sort(()=>Math.random()-0.5);
  for(const m of shuffled.slice(0,40)){
    const nb=applyMove(board,m);
    let score=evaluate(nb);
    if(m.capture)score+= (color==='w'?50:-50);
    if(difficulty==='hard'){
      const opp=allLegal(nb,color==='w'?'b':'w',null);
      let oppBest=color==='w'?1e9:-1e9;
      if(opp.length===0){score+=color==='w'?10000:-10000;}
      else{for(const om of opp.slice(0,20)){const nb2=applyMove(nb,om);const s2=evaluate(nb2);if(color==='w'){if(s2<oppBest)oppBest=s2;}else{if(s2>oppBest)oppBest=s2;}}score=oppBest;}
    }
    if(color==='w'){if(score>bestScore){bestScore=score;best=m;}}
    else{if(score<bestScore){bestScore=score;best=m;}}
  }
  return best;
}
