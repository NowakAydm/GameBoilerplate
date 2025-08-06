import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GameCamera } from './GameCamera';

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
  connectionStatus,
  onMove,
  onModeSwitch,
  showMoveButtons = false,
  playerName,
  showStatusInfo = false,
  isAuthenticated = false,
  onLogout,
  onOpenSettings,
  orbitControlsProps
}: {
  mode: '2d' | '3d';
  entities: SimpleEntity[];
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  onMove?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onModeSwitch?: () => void;
  showMoveButtons?: boolean;
  playerName?: string;
  showStatusInfo?: boolean;
  isAuthenticated?: boolean;
  onLogout?: () => void;
  onOpenSettings?: () => void;
  orbitControlsProps?: any;
}) {

  // Button click handler
  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (onMove) onMove(direction);
    // Optionally, you could emit a custom event or handle movement here
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <Canvas
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          border: 'none',
          borderRadius: '0px',
          boxSizing: 'border-box',
        }}
      >
        <GameCamera mode={mode} />
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
          {...orbitControlsProps}
        />
      </Canvas>
      
      {/* 2D/3D Mode Switch - Top Left */}
      {onModeSwitch && (
        <button
          onClick={onModeSwitch}
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 'bold',
            backgroundColor: mode === '3d' ? '#e74c3c' : '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            zIndex: 10,
            pointerEvents: 'auto',
          }}
        >
          {mode === '3d' ? '📊 Switch to 2D (R3F)' : '🎮 Switch to 3D (R3F)'}
        </button>
      )}

      {/* Logout Button - Below Mode Switch */}
      {isAuthenticated && onLogout && (
        <button
          onClick={onLogout}
          style={{
            position: 'absolute',
            top: 60, // Position below the mode switch button
            left: 16,
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 'bold',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            zIndex: 10,
            pointerEvents: 'auto',
          }}
        >
          Logout
        </button>
      )}

      {/* Settings Button - Top Right */}
      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            padding: '8px 12px',
            fontSize: '14px',
            fontWeight: 'bold',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            zIndex: 10,
            pointerEvents: 'auto',
          }}
        >
          ⚙️ Settings
        </button>
      )}

      {/* Status Info - Top Right */}
      {showStatusInfo && (
        <div
          style={{
            position: 'absolute',
            top: 60, // Move down to make room for settings button
            right: 16,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '12px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            zIndex: 10,
            fontSize: '14px',
            color: '#2c3e50',
            textAlign: 'right',
            minWidth: '150px',
          }}
        >
          <div><strong>Status:</strong> {connectionStatus}</div>
          {playerName && <div><strong>Player:</strong> {playerName}</div>}
        </div>
      )}

      {/* Move buttons overlay - Bottom Center */}
      {showMoveButtons && onMove && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10,
            pointerEvents: 'none', // allow canvas interaction except on buttons
          }}
        >
          <button
            style={{ 
              margin: 2, 
              width: 40, 
              height: 40, 
              pointerEvents: 'auto',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
            onClick={() => handleMove('up')}
            aria-label="Move Up"
          >▲</button>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <button
              style={{ 
                margin: 2, 
                width: 40, 
                height: 40, 
                pointerEvents: 'auto',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
              onClick={() => handleMove('left')}
              aria-label="Move Left"
            >◀</button>
            <button
              style={{ 
                margin: 2, 
                width: 40, 
                height: 40, 
                pointerEvents: 'auto',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
              onClick={() => handleMove('down')}
              aria-label="Move Down"
            >▼</button>
            <button
              style={{ 
                margin: 2, 
                width: 40, 
                height: 40, 
                pointerEvents: 'auto',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
              onClick={() => handleMove('right')}
              aria-label="Move Right"
            >▶</button>
          </div>
        </div>
      )}
    </div>
  );
}