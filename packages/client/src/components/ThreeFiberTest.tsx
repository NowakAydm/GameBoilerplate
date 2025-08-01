import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

/**
 * Minimal test component to verify React Three Fiber works
 */
export const ThreeFiberTest: React.FC = () => {
  const [is3D, setIs3D] = useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <h3>React Three Fiber Test</h3>
      <button onClick={() => setIs3D(!is3D)}>
        {is3D ? 'Switch to 2D' : 'Switch to 3D'}
      </button>
      
      {is3D ? (
        <div style={{ height: '300px', marginTop: '20px' }}>
          <Canvas>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="orange" />
            </mesh>
            <OrbitControls />
          </Canvas>
        </div>
      ) : (
        <div style={{ height: '300px', marginTop: '20px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>2D Mode - Click "Switch to 3D" to see the Three.js scene</p>
        </div>
      )}
    </div>
  );
};