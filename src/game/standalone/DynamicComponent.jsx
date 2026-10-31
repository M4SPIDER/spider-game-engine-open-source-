import React, { Suspense } from 'react';
import { useFBX } from '@react-three/drei';

function CityModel() {
  const fbx = useFBX('./assets/modern-city-block/source/city_block.fbx');
  return <primitive object={fbx} scale={0.01} position={[0, 0, 0]} />;
}

export default function GameComponent() {
  return (
    <group>
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 20, 10]} intensity={2.0} />
      <Suspense fallback={null}>
        <CityModel />
      </Suspense>
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
    </group>
  );
}