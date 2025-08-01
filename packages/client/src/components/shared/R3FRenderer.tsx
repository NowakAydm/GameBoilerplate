import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

// Shared entity interface
export interface SimpleEntity {
  id: string;
  position: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  type: string;
  color?: string;
}

// Simple entity renderer component
export function EntityRenderer({ entity }: { entity: SimpleEntity }) {
  const meshRef = useRef<any>(null);

  // Simple rotation animation for player
  useFrame(() => {
    if (meshRef.current && entity.type === 'player') {
      meshRef.current.rotation.y += 0.01;
    }
  });

  const getGeometry = () => {
    switch (entity.type) {
      case 'player':
        return <boxGeometry args={[0.5, 0.5, 0.5]} />;
      case 'enemy':
        return <sphereGeometry args={[0.3, 8, 8]} />;
      default:
        return <boxGeometry args={[0.3, 0.3, 0.3]} />;
    }
  };

  const getColor = () => {
    if (entity.color) return entity.color;
    
    switch (entity.type) {
      case 'player': return '#3498db';
      case 'enemy': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  return (
    <mesh
      ref={meshRef}
      position={[entity.position.x, entity.position.y, entity.position.z]}
      scale={[entity.scale.x, entity.scale.y, entity.scale.z]}
    >
      {getGeometry()}
      <meshLambertMaterial color={getColor()} />
    </mesh>
  );
}

// Simple ground plane
export function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[10, 10]} />
      <meshLambertMaterial color="#95a5a6" wireframe />
    </mesh>
  );
}

// Main R3F scene component
export function R3FScene({
  mode,
  entities = [],
  connectionStatus
}: {
  mode: '2d' | '3d';
  entities: SimpleEntity[];
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
}) {
  // Camera settings based on mode
  const cameraPosition = mode === '2d' 
    ? [0, 10, 5] as [number, number, number]
    : [8, 6, 8] as [number, number, number];

  return (
    <div style={{ width: '400px', height: '400px' }}>
      <Canvas
        camera={{ position: cameraPosition, fov: 60 }}
        style={{ 
          border: '2px solid #bdc3c7',
          borderRadius: '8px'
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* Ground */}
        <GroundPlane />

        {/* Entities */}
        {entities.map(entity => (
          <EntityRenderer key={entity.id} entity={entity} />
        ))}

        {/* Default cube when no entities */}
        {entities.length === 0 && (
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshLambertMaterial color="#95a5a6" />
          </mesh>
        )}

        {/* Controls */}
        <OrbitControls
          enableRotate={mode === '3d'}
          enableZoom={true}
          enablePan={true}
        />
      </Canvas>
    </div>
  );
}