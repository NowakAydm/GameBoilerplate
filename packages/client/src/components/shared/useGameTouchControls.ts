import { useRef, useEffect } from 'react';
import type { TouchControls } from '@gameboilerplate/shared';

interface TouchControlsConfig {
  controls: TouchControls;
  enabled?: boolean;
}

interface TouchControlsReturn {
  getOrbitControlsProps: () => {
    enablePan: boolean;
    enableRotate: boolean;
    enableZoom: boolean;
    panSpeed: number;
    rotateSpeed: number;
    zoomSpeed: number;
  };
  controls: TouchControls;
}

export function useGameTouchControls({
  controls,
  enabled = true,
}: TouchControlsConfig): TouchControlsReturn {
  const controlsRef = useRef<TouchControls>(controls);

  // Update controls ref when controls change
  useEffect(() => {
    controlsRef.current = controls;
  }, [controls]);

  const getOrbitControlsProps = () => {
    const currentControls = controlsRef.current;
    
    return {
      enablePan: enabled && currentControls.panEnabled,
      enableRotate: enabled && currentControls.rotateEnabled,
      enableZoom: enabled && currentControls.zoomEnabled,
      panSpeed: currentControls.panSensitivity,
      rotateSpeed: currentControls.rotateSensitivity,
      zoomSpeed: currentControls.zoomSensitivity,
      // Additional OrbitControls settings for better touch experience
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 1,
      maxDistance: 100,
      maxPolarAngle: Math.PI, // Allow full rotation
    };
  };

  return {
    getOrbitControlsProps,
    controls: controlsRef.current,
  };
}

// Touch gesture presets
export const TOUCH_PRESETS: Record<string, TouchControls> = {
  default: {
    panEnabled: true,
    rotateEnabled: true,
    zoomEnabled: true,
    panSensitivity: 1,
    rotateSensitivity: 1,
    zoomSensitivity: 1,
  },
  restricted: {
    panEnabled: true,
    rotateEnabled: false,
    zoomEnabled: true,
    panSensitivity: 0.5,
    rotateSensitivity: 0.5,
    zoomSensitivity: 0.5,
  },
  panOnly: {
    panEnabled: true,
    rotateEnabled: false,
    zoomEnabled: false,
    panSensitivity: 1,
    rotateSensitivity: 0,
    zoomSensitivity: 0,
  },
  viewOnly: {
    panEnabled: false,
    rotateEnabled: true,
    zoomEnabled: true,
    panSensitivity: 0,
    rotateSensitivity: 1,
    zoomSensitivity: 1,
  },
  sensitive: {
    panEnabled: true,
    rotateEnabled: true,
    zoomEnabled: true,
    panSensitivity: 2,
    rotateSensitivity: 2,
    zoomSensitivity: 2,
  },
};

// Utility function to validate touch controls
export function validateTouchControls(controls: Partial<TouchControls>): TouchControls {
  return {
    panEnabled: controls.panEnabled ?? true,
    rotateEnabled: controls.rotateEnabled ?? true,
    zoomEnabled: controls.zoomEnabled ?? true,
    panSensitivity: Math.max(0.1, Math.min(5, controls.panSensitivity ?? 1)),
    rotateSensitivity: Math.max(0.1, Math.min(5, controls.rotateSensitivity ?? 1)),
    zoomSensitivity: Math.max(0.1, Math.min(5, controls.zoomSensitivity ?? 1)),
  };
}