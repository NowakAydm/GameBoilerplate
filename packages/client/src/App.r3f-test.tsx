import React from 'react';
import { Canvas } from '@react-three/fiber';

export default function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>GameBoilerplate Client - R3F Test</h1>
      <div style={{ width: '400px', height: '400px', border: '1px solid #ccc' }}>
        <Canvas>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} />
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="orange" />
          </mesh>
        </Canvas>
      </div>
    </div>
  );
}