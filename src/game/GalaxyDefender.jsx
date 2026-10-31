/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
function GameComponent(){
  const keys = useRef({});
  const mouseFire = useRef(false);
  const playerPos = useRef({ x: 0, y: 1.2, z: 4 });
  const vel = useRef({ x: 0, y: 0 });
  const shipRef = useRef();
  const tiltRef = useRef();
  const invuln = useRef(0);
  const fireCd = useRef(0);
  const spawnT = useRef(0.6);
  const elapsed = useRef(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const overRef = useRef(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const laserData = useRef(Array.from({length:24},()=>({active:false,x:0,y:-10,z:-100})));
  const laserRefs = useRef([]);
  const enemyData = useRef(Array.from({length:12},()=>({active:false,x:0,y:1.5,z:-30,speed:5,hp:1,phase:Math.random()*6.28,spin:1})));
  const enemyRefs = useRef([]);
  const partData = useRef(Array.from({length:36},()=>({active:false,x:0,y:0,z:0,vx:0,vy:0,vz:0,life:0,max:1})));
  const partRefs = useRef([]);
  const starData = useRef(Array.from({length:90},()=>({x:(Math.random()-0.5)*32,y:Math.random()*11-0.5,z:Math.random()*-42+6,s:Math.random()*0.11+0.04,sp:Math.random()*3+2})));
  const starRefs = useRef([]);

  useEffect(()=>{
    const dn=(e)=>{ keys.current[e.code]=true; if(e.key) keys.current[e.key.toLowerCase()]=true; if(e.code==='Space'||e.key===' '){ e.preventDefault(); } };
    const up=(e)=>{ keys.current[e.code]=false; if(e.key) keys.current[e.key.toLowerCase()]=false; };
    const md=()=>{ mouseFire.current=true; };
    const mu=()=>{ mouseFire.current=false; };
    window.addEventListener('keydown',dn); window.addEventListener('keyup',up);
    window.addEventListener('mousedown',md); window.addEventListener('mouseup',mu);
    return()=>{ window.removeEventListener('keydown',dn); window.removeEventListener('keyup',up); window.removeEventListener('mousedown',md); window.removeEventListener('mouseup',mu); };
  },[]);

  const spawnExplosion=(x,y,z,color)=>{
    let c=0;
    for(let i=0;i<partData.current.length;i++){
      const p=partData.current[i];
      if(!p.active){
        p.active=true; p.x=x; p.y=y; p.z=z;
        const a=Math.random()*Math.PI*2; const b=Math.random()*2-1;
        const sp=3+Math.random()*5;
        p.vx=Math.cos(a)*sp; p.vz=Math.sin(a)*sp; p.vy=Math.random()*4+1;
        p.life=p.max=0.6+Math.random()*0.5;
        if(partRefs.current[i]){ partRefs.current[i].visible=true; }
        c++; if(c>=8) break;
      }
    }
  };

  const restart=()=>{
    scoreRef.current=0; livesRef.current=3; overRef.current=false;
    invuln.current=0; fireCd.current=0; spawnT.current=0.6; elapsed.current=0;
    playerPos.current.x=0; playerPos.current.y=1.2;
    vel.current.x=0; vel.current.y=0;
    laserData.current.forEach(l=>{l.active=false;});
    enemyData.current.forEach(e=>{e.active=false; e.z=-30;});
    partData.current.forEach(p=>{p.active=false;});
    laserRefs.current.forEach(m=>{ if(m) m.visible=false; });
    enemyRefs.current.forEach(m=>{ if(m) m.visible=false; });
    partRefs.current.forEach(m=>{ if(m) m.visible=false; });
    setScore(0); setLives(3); setGameOver(false);
  };

  useFrame((state, rawDelta)=>{
    const dt=Math.min(rawDelta||0.016,0.05);
    const k=keys.current;
    // CAMERA LOCK EVERY FRAME
    state.camera.position.set(playerPos.current.x*0.45, 4.6, 11.2);
    state.camera.lookAt(playerPos.current.x*0.5, 1.6, -6);
    // stars drift always
    for(let i=0;i<starData.current.length;i++){
      const s=starData.current[i]; const m=starRefs.current[i];
      if(!m) continue;
      s.z+=s.sp*dt;
      if(s.z>7){ s.z=-36; s.x=(Math.random()-0.5)*32; s.y=Math.random()*11-0.5; }
      m.position.set(s.x,s.y,s.z);
    }
    // particles always update
    for(let i=0;i<partData.current.length;i++){
      const p=partData.current[i]; const m=partRefs.current[i];
      if(!p.active||!m) continue;
      p.life-=dt;
      if(p.life<=0){ p.active=false; m.visible=false; continue; }
      p.x+=p.vx*dt; p.y+=p.vy*dt; p.z+=p.vz*dt;
      p.vy-=6*dt;
      m.position.set(p.x,p.y,p.z);
      const sc=Math.max(0.01,(p.life/p.max)*0.35);
      m.scale.setScalar(sc/0.22);
    }
    if(overRef.current){
      if(shipRef.current){ shipRef.current.position.set(playerPos.current.x,playerPos.current.y,playerPos.current.z); }
      return;
    }
    elapsed.current+=dt;
    if(invuln.current>0) invuln.current-=dt;
    if(fireCd.current>0) fireCd.current-=dt;
    // MOVEMENT
    let dx=0, dy=0;
    if(k['KeyA']||k['a']||k['ArrowLeft']) dx-=1;
    if(k['KeyD']||k['d']||k['ArrowRight']) dx+=1;
    if(k['KeyW']||k['w']||k['ArrowUp']) dy+=1;
    if(k['KeyS']||k['s']||k['ArrowDown']) dy-=1;
    const speed=11;
    const blend=1-Math.exp(-12*dt);
    vel.current.x+=(dx*speed-vel.current.x)*blend;
    vel.current.y+=(dy*speed*0.6-vel.current.y)*blend;
    playerPos.current.x=THREE.MathUtils.clamp(playerPos.current.x+vel.current.x*dt,-7.5,7.5);
    playerPos.current.y=THREE.MathUtils.clamp(playerPos.current.y+vel.current.y*dt,0.6,4.4);
    if(shipRef.current){
      shipRef.current.position.set(playerPos.current.x,playerPos.current.y,playerPos.current.z);
      if(tiltRef.current){
        tiltRef.current.rotation.z=THREE.MathUtils.lerp(tiltRef.current.rotation.z,-vel.current.x*0.045,0.2);
        tiltRef.current.rotation.x=THREE.MathUtils.lerp(tiltRef.current.rotation.x,vel.current.y*0.03,0.2);
      }
      // invuln flicker
      const vis=invuln.current>0 ? (Math.floor(elapsed.current*12)%2===0) : true;
      shipRef.current.visible=vis;
    }
    // FIRING
    const wantFire=(k['Space']||k[' ']||mouseFire.current);
    if(wantFire&&fireCd.current<=0){
      for(let i=0;i<laserData.current.length;i++){
        const L=laserData.current[i];
        if(!L.active){
          L.active=true; L.x=playerPos.current.x; L.y=playerPos.current.y+0.1; L.z=playerPos.current.z-1.2;
          const m=laserRefs.current[i];
          if(m){ m.visible=true; m.position.set(L.x,L.y,L.z); }
          fireCd.current=0.17; break;
        }
      }
    }
    // LASERS
    for(let i=0;i<laserData.current.length;i++){
      const L=laserData.current[i]; const m=laserRefs.current[i];
      if(!L.active||!m) continue;
      L.z-=26*dt;
      if(L.z<-26){ L.active=false; m.visible=false; continue; }
      m.position.set(L.x,L.y,L.z);
    }
    // SPAWN ENEMIES
    spawnT.current-=dt;
    if(spawnT.current<=0){
      const diff=Math.min(1,elapsed.current/75);
      spawnT.current=THREE.MathUtils.lerp(1.15,0.45,diff)+Math.random()*0.4;
      for(let i=0;i<enemyData.current.length;i++){
        const E=enemyData.current[i];
        if(!E.active){
          E.active=true;
          E.x=(Math.random()-0.5)*14;
          E.y=0.8+Math.random()*3.2;
          E.z=-22-Math.random()*3;
          E.speed=4.2+diff*3.5+Math.random()*2;
          E.hp=1;
          E.phase=Math.random()*6.28;
          const m=enemyRefs.current[i]; if(m) m.visible=true;
          break;
        }
      }
    }

/* [LINEAGE-AUTHORS]: m4spider */
const __M4_ENGINE_LINEAGE__ = "m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

    // ENEMIES MOVE
    for(let i=0;i<enemyData.current.length;i++){
      const E=enemyData.current[i]; const m=enemyRefs.current[i];
      if(!E.active||!m) continue;
      E.z+=E.speed*dt;
      E.phase+=dt*2.2;
      E.x+=Math.sin(E.phase)*dt*1.2;
      m.position.set(E.x,E.y,E.z);
      m.rotation.y+=dt*E.spin*1.5;
      if(E.z>8.5){ E.active=false; m.visible=false; continue; }
    }
    // LASER vs ENEMY
    for(let li=0;li<laserData.current.length;li++){
      const L=laserData.current[li];
      if(!L.active) continue;
      for(let ei=0;ei<enemyData.current.length;ei++){
        const E=enemyData.current[ei];
        if(!E.active) continue;
        const ddx=Math.abs(L.x-E.x), ddy=Math.abs(L.y-E.y), ddz=Math.abs(L.z-E.z);
        if(ddx<1.15&&ddy<1.15&&ddz<1.5){
          L.active=false; const lm=laserRefs.current[li]; if(lm) lm.visible=false;
          E.hp-=1;
          if(E.hp<=0){
            E.active=false; const em=enemyRefs.current[ei]; if(em) em.visible=false;
            spawnExplosion(E.x,E.y,E.z);
            scoreRef.current+=100; setScore(scoreRef.current);
          } else {
            spawnExplosion(L.x,L.y,L.z);
          }
          break;
        }
      }
    }
    // ENEMY vs PLAYER
    if(invuln.current<=0){
      for(let i=0;i<enemyData.current.length;i++){
        const E=enemyData.current[i];
        if(!E.active) continue;
        const ddx=Math.abs(E.x-playerPos.current.x), ddy=Math.abs(E.y-playerPos.current.y), ddz=Math.abs(E.z-playerPos.current.z);
        if(ddx<1.2&&ddy<1.1&&ddz<1.4){
          E.active=false; const em=enemyRefs.current[i]; if(em) em.visible=false;
          spawnExplosion(playerPos.current.x,playerPos.current.y,playerPos.current.z);
          livesRef.current-=1; setLives(livesRef.current);
          invuln.current=2.0;
          if(livesRef.current<=0){
            overRef.current=true; setGameOver(true);
            spawnExplosion(playerPos.current.x,playerPos.current.y,playerPos.current.z);
          }
          break;
        }
      }
    }
  });

  return(<>
    <color attach="background" args={['#050914']} />
    <fog attach="fog" args={['#050914',18,44]} />
    <ambientLight intensity={0.75} />
    <directionalLight position={[5,10,6]} intensity={1.2} />
    <mesh rotation-x={-Math.PI/2} position={[0,-0.55,-8]}>
      <planeGeometry args={[60,60]} />
      <meshStandardMaterial color="#0a1226" roughness={0.9} metalness={0.1} />
    </mesh>
    <gridHelper args={[44,22,'#38bdf8','#1b2a4a']} position={[0,-0.5,-8]} />
    {/* STARS */}
    {starData.current.map((s,i)=>(
      <mesh key={'s'+i} ref={(el)=>{starRefs.current[i]=el;}} position={[s.x,s.y,s.z]}>
        <sphereGeometry args={[s.s,6,6]} />
        <meshBasicMaterial color={i%5===0?'#38bdf8':'#ffffff'} />
      </mesh>
    ))}
    {/* PLAYER SHIP composite */}
    <group ref={shipRef} position={[0,1.2,4]}>
      <group ref={tiltRef}>
        <mesh rotation-x={-Math.PI/2} position={[0,0,-0.2]}>
          <coneGeometry args={[0.55,2.2,8]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.3} metalness={0.6} />
        </mesh>
        <mesh position={[0,0.32,-0.15]}>
          <sphereGeometry args={[0.32,16,16]} />
          <meshStandardMaterial color="#e0f2fe" roughness={0.15} metalness={0.2} emissive="#38bdf8" emissiveIntensity={0.35} />
        </mesh>
        <mesh position={[-0.85,0,0.35]} rotation-z={0.35}>
          <boxGeometry args={[1.1,0.12,0.7]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[0.85,0,0.35]} rotation-z={-0.35}>
          <boxGeometry args={[1.1,0.12,0.7]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[-0.85,-0.05,0.35]}>
          <cylinderGeometry args={[0.09,0.09,1.1,8]} />
          <meshStandardMaterial color="#f43f5e" roughness={0.35} metalness={0.4} />
        </mesh>
        <mesh position={[0.85,-0.05,0.35]}>
          <cylinderGeometry args={[0.09,0.09,1.1,8]} />
          <meshStandardMaterial color="#f43f5e" roughness={0.35} metalness={0.4} />
        </mesh>
        <mesh position={[0,0.05,0.9]} rotation-x={Math.PI/2}>
          <sphereGeometry args={[0.22,12,12]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
        <mesh position={[-0.55,0,0.7]}>
          <boxGeometry args={[0.18,0.18,0.5]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>
        <mesh position={[0.55,0,0.7]}>
          <boxGeometry args={[0.18,0.18,0.5]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>
      </group>
    </group>
    {/* LASER POOL */}
    {laserData.current.map((l,i)=>(
      <mesh key={'l'+i} ref={(el)=>{laserRefs.current[i]=el;}} visible={false}>
        <boxGeometry args={[0.18,0.18,1.5]} />
        <meshBasicMaterial color="#4ade80" />
      </mesh>
    ))}
    {/* ENEMY POOL - drones */}
    {enemyData.current.map((e,i)=>(
      <group key={'e'+i} ref={(el)=>{enemyRefs.current[i]=el;}} visible={false}>
        <mesh>
          <octahedronGeometry args={[0.75,0]} />
          <meshStandardMaterial color="#7c2d12" roughness={0.5} metalness={0.55} />
        </mesh>
        <mesh>
          <octahedronGeometry args={[0.45,0]} />
          <meshStandardMaterial color="#f43f5e" roughness={0.3} metalness={0.3} emissive="#f43f5e" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[-0.85,0,0]} rotation-z={0.5}>
          <boxGeometry args={[0.9,0.14,0.4]} />
          <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.6} />
        </mesh>
        <mesh position={[0.85,0,0]} rotation-z={-0.5}>
          <boxGeometry args={[0.9,0.14,0.4]} />
          <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.6} />
        </mesh>
        <mesh position={[0,0.55,0]}>
          <sphereGeometry args={[0.18,10,10]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      </group>
    ))}
    {/* PARTICLE POOL */}
    {partData.current.map((p,i)=>(
      <mesh key={'p'+i} ref={(el)=>{partRefs.current[i]=el;}} visible={false}>
        <sphereGeometry args={[0.22,8,8]} />
        <meshBasicMaterial color={i%3===0?'#fbbf24':i%3===1?'#f43f5e':'#38bdf8'} />
      </mesh>
    ))}
    <Html fullscreen style={{pointerEvents:'none'}}>
      <div style={{position:'absolute',top:14,left:0,right:0,display:'flex',justifyContent:'center',gap:14,pointerEvents:'none'}}>
        <div style={{background:'rgba(5,10,25,0.72)',border:'1px solid #38bdf8',borderRadius:12,padding:'8px 18px',color:'#fff',fontFamily:'sans-serif',fontSize:18,fontWeight:700}}>SCORE: <span style={{color:'#4ade80'}}>{score}</span></div>
        <div style={{background:'rgba(5,10,25,0.72)',border:'1px solid #f43f5e',borderRadius:12,padding:'8px 18px',color:'#fff',fontFamily:'sans-serif',fontSize:18,fontWeight:700}}>LIVES: <span style={{color:'#fbbf24'}}>{'❤'.repeat(Math.max(0,lives))||'—'}</span></div>
      </div>
      <div style={{position:'absolute',bottom:12,left:0,right:0,textAlign:'center',color:'#94a3b8',fontFamily:'sans-serif',fontSize:13}}>WASD / Arrows move • SPACE / Click shoot</div>
      {gameOver&&(
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(2,6,18,0.62)',pointerEvents:'auto'}}>
          <div style={{background:'#0b1430',border:'2px solid #38bdf8',borderRadius:18,padding:32,textAlign:'center',fontFamily:'sans-serif'}}>
            <div style={{color:'#f43f5e',fontSize:42,fontWeight:900}}>GAME OVER</div>
            <div style={{color:'#fff',fontSize:20,margin:'10px 0'}}>Final Score: {score}</div>
            <button onClick={restart} style={{marginTop:10,background:'#38bdf8',border:'none',borderRadius:10,padding:'12px 28px',fontSize:18,fontWeight:800,cursor:'pointer',color:'#04121f'}}>RESTART</button>
          </div>
        </div>
      )}
    </Html>
  </>);
}