import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Shared entity interface
export interface SimpleEntity {
  id: string;
  position: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  type: string;
  color?: string;
}

// Entity renderer component that works in both 2D and 3D
export function EntityRenderer({ entity }: { entity: SimpleEntity }) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Animate entities slightly for visual appeal
  useFrame((state) => {
    if (meshRef.current) {
      if (entity.type === 'player') {
        meshRef.current.rotation.y += 0.01;
      }
    }
  });

  const getGeometry = () => {
    switch (entity.type) {
      case 'player':
        return <boxGeometry args={[0.5, 0.5, 0.5]} />;
      case 'enemy':
        return <sphereGeometry args={[0.3, 8, 8]} />;
      case 'item':
        return <sphereGeometry args={[0.2, 6, 6]} />;
      default:
        return <boxGeometry args={[0.3, 0.3, 0.3]} />;
    }
  };

  const getColor = () => {
    if (entity.color) return entity.color;
    
    switch (entity.type) {
      case 'player':
        return '#3498db';
      case 'enemy':
        return '#e74c3c';
      case 'item':
        return '#f39c12';
      default:
        return '#95a5a6';
    }
  };

  return (
    <mesh
      ref={meshRef}
      position={[entity.position.x, entity.position.y, entity.position.z]}
      scale={[entity.scale.x, entity.scale.y, entity.scale.z]}
      castShadow
      receiveShadow
    >
      {getGeometry()}
      <meshLambertMaterial color={getColor()} />
    </mesh>
  );
}

// Ground plane component
export function GroundPlane({ 
  size = 10, 
  color = '#95a5a6', 
  wireframe = false 
}: { 
  size?: number; 
  color?: string; 
  wireframe?: boolean; 
}) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size, 10, 10]} />
      <meshLambertMaterial 
        color={color} 
        wireframe={wireframe} 
        transparent={wireframe} 
        opacity={wireframe ? 0.3 : 1} 
      />
    </mesh>
  );
}

// Lighting setup component
export function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
    </>
  );
}

// Camera controller for different modes
export function CameraController({ 
  mode, 
  playerPosition 
}: { 
  mode: '2d' | '3d'; 
  playerPosition?: { x: number; y: number; z: number };
}) {
  useFrame((state) => {
    if (mode === '2d' && playerPosition) {
      // In 2D mode, follow the player from above
      state.camera.position.set(
        playerPosition.x,
        10, // Fixed height above
        playerPosition.z + 5 // Slightly offset for better view
      );
      state.camera.lookAt(playerPosition.x, 0, playerPosition.z);
    }
  });

  if (mode === '2d') {
    return (
      <OrbitControls
        enableRotate={false}
        enableZoom={true}
        enablePan={true}
        maxPolarAngle={Math.PI / 3} // Limit rotation to keep top-down feel
        minPolarAngle={Math.PI / 6}
      />
    );
  }

  return (
    <OrbitControls
      enableRotate={true}
      enableZoom={true}
      enablePan={true}
    />
  );
}

// Main R3F scene component that works for both 2D and 3D
export function R3FScene({
  mode,
  entities = [],
  connectionStatus,
  children
}: {
  mode: '2d' | '3d';
  entities: SimpleEntity[];
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  children?: React.ReactNode;
}) {
  const playerEntity = entities.find(e => e.type === 'player');
  
  // Camera settings based on mode
  const cameraProps = mode === '2d' 
    ? {
        position: [0, 10, 5] as [number, number, number],
        fov: 60,
        near: 0.1,
        far: 1000
      }
    : {
        position: [8, 6, 8] as [number, number, number],
        fov: 75,
        near: 0.1,
        far: 1000
      };

  const clearColor = connectionStatus === 'connected' ? '#2c3e50' : '#34495e';
  const groundColor = connectionStatus === 'connected' ? '#95a5a6' : '#7f8c8d';

  return (
    <Canvas
      camera={cameraProps}
      shadows
      style={{ 
        width: '400px', 
        height: '400px',
        border: mode === '2d' ? '2px solid #bdc3c7' : '2px solid #34495e',
        borderRadius: '8px'
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(clearColor);
      }}
    >
      <SceneLighting />
      
      <GroundPlane 
        size={10} 
        color={groundColor} 
        wireframe={mode === '2d'} 
      />

      {/* Render all entities */}
      {entities.map(entity => (
        <EntityRenderer key={entity.id} entity={entity} />
      ))}

      {/* Default entity when disconnected */}
      {connectionStatus !== 'connected' && entities.length === 0 && (
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshLambertMaterial color="#95a5a6" />
        </mesh>
      )}

      <CameraController 
        mode={mode} 
        playerPosition={playerEntity?.position} 
      />

      {children}
    </Canvas>
  );
}