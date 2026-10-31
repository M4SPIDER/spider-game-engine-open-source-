import React, { Suspense } from 'react';
import { useGLTF, Float, Text } from '@react-three/drei';

function BlenderScene() {
  const gltf = useGLTF('./assets/blender_sync.glb');
  return (
    <group position={[0, 0, 0]}>
      <primitive object={gltf.scene} scale={1.5} />
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Text
          position={[0, 4.5, 0]}
          fontSize={0.6}
          color="#38bdf8"
          anchorX="center"
          anchorY="middle"
        >
          SPIDER ENGINE x BLENDER 3D LIVE
        </Text>
      </Float>
    </group>
  );
}

export default function GameComponent() {
  return (
    <group>
      <ambientLight intensity={1.8} />
      <directionalLight position={[10, 20, 10]} intensity={2.5} castShadow />
      <pointLight position={[-10, 10, -10]} intensity={1.2} color="#818cf8" />
      <Suspense fallback={null}>
        <BlenderScene />
      </Suspense>
      <gridHelper args={[30, 30, '#4f46e5', '#334155']} />
    </group>
  );
}