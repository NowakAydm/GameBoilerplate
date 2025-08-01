import React, { useState, useRef } from 'react';
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
 */
function ThreeDScene() {
  return (
    <>
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
      <Plane
        position={[0, -2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        args={[10, 10]}
        receiveShadow
      >
        <meshStandardMaterial color="#95a5a6" />
      </Plane>

      {/* Animated 3D objects */}
      <RotatingCube position={[-2, 0, 0]} color="#4a90e2" />
      <RotatingCube position={[2, 0, 0]} color="#2ecc71" />
      <FloatingSphere position={[0, 1, -2]} />

      {/* 3D Text display */}
      <Text
        position={[0, 3, 0]}
        fontSize={0.5}
        color="#2c3e50"
        anchorX="center"
        anchorY="middle"
      >
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
    </>
  );
}

/**
 * 2D placeholder component shown when in 2D mode
 */
function TwoDPlaceholder() {
  return (
    <div
      style={{
        height: '400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ecf0f1',
        border: '2px dashed #bdc3c7',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎨</div>
      <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>2D Mode Active</h3>
      <p style={{ color: '#7f8c8d', maxWidth: '400px', lineHeight: '1.6' }}>
        This is the 2D placeholder view. Switch to 3D mode to experience an interactive 
        React Three Fiber scene with animated objects, lighting, and orbital controls.
      </p>
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#ffffff', borderRadius: '8px' }}>
        <strong>Features in 3D mode:</strong>
        <ul style={{ textAlign: 'left', marginTop: '10px' }}>
          <li>Rotating cubes with different colors</li>
          <li>Floating animated sphere</li>
          <li>Interactive OrbitControls (mouse to zoom, pan, rotate)</li>
          <li>Realistic lighting and shadows</li>
          <li>3D text rendering</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Main component that demonstrates React Three Fiber capabilities
 * Features a toggle between 2D placeholder and 3D interactive scene
 */
export const ThreeFiberDemo: React.FC = () => {
  const [is3DMode, setIs3DMode] = useState(false);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header and mode toggle */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>
          React Three Fiber Demonstration
        </h2>
        <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
          Toggle between 2D and 3D modes to explore React Three Fiber capabilities
        </p>
        
        {/* Mode toggle button */}
        <button
          onClick={() => setIs3DMode(!is3DMode)}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: is3DMode ? '#e74c3c' : '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          }}
        >
          {is3DMode ? '🎨 Switch to 2D Mode' : '🎮 Switch to 3D Mode'}
        </button>
      </div>

      {/* Current mode indicator */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: is3DMode ? '#fff3cd' : '#d1ecf1',
          borderRadius: '6px',
          border: `1px solid ${is3DMode ? '#ffeaa7' : '#bee5eb'}`,
        }}
      >
        <strong>Current Mode: </strong>
        <span style={{ color: is3DMode ? '#856404' : '#0c5460' }}>
          {is3DMode ? '3D Interactive Scene' : '2D Placeholder View'}
        </span>
      </div>

      {/* Render either 2D placeholder or 3D Canvas based on mode */}
      {is3DMode ? (
        <div style={{ height: '400px', border: '1px solid #bdc3c7', borderRadius: '8px', overflow: 'hidden' }}>
          <Canvas
            shadows
            camera={{ position: [5, 5, 5], fov: 60 }}
            style={{ width: '100%', height: '100%' }}
          >
            <ThreeDScene />
          </Canvas>
        </div>
      ) : (
        <TwoDPlaceholder />
      )}

      {/* Information panel */}
      <div
        style={{
          marginTop: '20px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
        }}
      >
        <h4 style={{ color: '#495057', marginBottom: '15px' }}>
          About this Demo
        </h4>
        <p style={{ color: '#6c757d', lineHeight: '1.6', marginBottom: '15px' }}>
          This component demonstrates the integration of React Three Fiber with @react-three/drei 
          components in a React application. It showcases fundamental 3D concepts including:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <strong>🎮 Controls:</strong>
            <ul style={{ marginTop: '5px', color: '#6c757d' }}>
              <li>Mouse drag to rotate</li>
              <li>Scroll to zoom</li>
              <li>Right-click drag to pan</li>
            </ul>
          </div>
          <div>
            <strong>🔧 Technologies:</strong>
            <ul style={{ marginTop: '5px', color: '#6c757d' }}>
              <li>React Three Fiber</li>
              <li>@react-three/drei</li>
              <li>Three.js</li>
              <li>TypeScript</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};