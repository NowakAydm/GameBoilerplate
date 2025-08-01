import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Sphere, Plane, Text } from '@react-three/drei';
import * as THREE from 'three';

/**
 * A rotating cube component that demonstrates basic Three.js mesh animation
 */
function RotatingCube({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  // useFrame hook runs on every frame, allowing for smooth animations
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <Box ref={meshRef} position={position} args={[1, 1, 1]}>
      <meshStandardMaterial color={color} />
    </Box>
  );
}

/**
 * A floating sphere that moves up and down using sine wave animation
 */
function FloatingSphere({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Use sine wave for smooth up/down floating motion
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.5;
    }
  });

  return (
    <Sphere ref={meshRef} position={position} args={[0.5, 32, 32]}>
      <meshStandardMaterial color="#ff6b6b" wireframe />
    </Sphere>
  );
}

/**
 * The 3D scene component containing all 3D elements and lighting
 * This component is dynamically loaded to avoid initial dependency conflicts
 */
function LazyThreeFiberScene() {
  return (
    <Canvas
      shadows
      camera={{ position: [5, 5, 5], fov: 60 }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Lighting setup for proper material rendering */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#ffeaa7" />

      {/* Ground plane for visual reference */}
      <Plane position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]} args={[10, 10]} receiveShadow>
        <meshStandardMaterial color="#95a5a6" />
      </Plane>

      {/* Animated 3D objects */}
      <RotatingCube position={[-2, 0, 0]} color="#4a90e2" />
      <RotatingCube position={[2, 0, 0]} color="#2ecc71" />
      <FloatingSphere position={[0, 1, -2]} />

      {/* 3D Text display */}
      <Text position={[0, 3, 0]} fontSize={0.5} color="#2c3e50" anchorX="center" anchorY="middle">
        React Three Fiber Demo
      </Text>

      {/* OrbitControls enable mouse interaction (zoom, pan, rotate) */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={20}
      />
    </Canvas>
  );
}

export default LazyThreeFiberScene;
