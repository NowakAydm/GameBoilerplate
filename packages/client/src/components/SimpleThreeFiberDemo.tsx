import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

/**
 * A simple rotating cube component using only React Three Fiber (no Drei)
 */
function RotatingCube() {
  const meshRef = useRef<any>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#4a90e2" />
    </mesh>
  );
}

/**
 * Simple React Three Fiber Demo Component
 * This component demonstrates basic React Three Fiber functionality without Drei dependencies
 */
export const SimpleThreeFiberDemo: React.FC = () => {
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
            camera={{ position: [3, 3, 3], fov: 60 }}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Basic lighting */}
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            
            {/* Our rotating cube */}
            <RotatingCube />
            
            {/* Ground plane */}
            <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[10, 10]} />
              <meshStandardMaterial color="#95a5a6" />
            </mesh>
          </Canvas>
        </div>
      ) : (
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
            React Three Fiber scene with a rotating cube and basic lighting.
          </p>
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#ffffff', borderRadius: '8px' }}>
            <strong>Features in 3D mode:</strong>
            <ul style={{ textAlign: 'left', marginTop: '10px' }}>
              <li>Rotating cube with smooth animation</li>
              <li>3D camera perspective</li>
              <li>Ambient and directional lighting</li>
              <li>Ground plane for spatial reference</li>
            </ul>
          </div>
        </div>
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
          This component demonstrates the basic integration of React Three Fiber in a React application. 
          It showcases fundamental 3D concepts including geometric shapes, materials, lighting, and frame-based animation.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <strong>🎮 Technologies:</strong>
            <ul style={{ marginTop: '5px', color: '#6c757d' }}>
              <li>React Three Fiber</li>
              <li>Three.js</li>
              <li>TypeScript</li>
              <li>React Hooks</li>
            </ul>
          </div>
          <div>
            <strong>🔧 Features:</strong>
            <ul style={{ marginTop: '5px', color: '#6c757d' }}>
              <li>2D/3D mode switching</li>
              <li>Animated 3D objects</li>
              <li>Responsive design</li>
              <li>Well-commented code</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};