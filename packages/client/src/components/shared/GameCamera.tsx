import React from 'react';
import { OrthographicCamera, PerspectiveCamera } from '@react-three/drei';

export function GameCamera({ mode }: { mode: '2d' | '3d' }) {
  if (mode === '2d') {
    // Orthographic camera for 2D
    return (
      <OrthographicCamera
        makeDefault
        position={[0, 10, 0]}
        zoom={50}
        near={0.1}
        far={100}
      />
    );
  }
  // Perspective camera for 3D
  return (
    <PerspectiveCamera
      makeDefault
      position={[0, 6, 8]}
      fov={60}
      near={0.1}
      far={100}
    />
  );
}
