import { useEffect, useCallback } from 'react';
import type { KeyboardControls } from '@gameboilerplate/shared';

interface KeyboardControlsConfig {
  controls: KeyboardControls;
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
  enabled?: boolean;
}

export function useGameKeyboardControls({
  controls,
  onMove,
  enabled = true,
}: KeyboardControlsConfig) {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;
      
      // Prevent handling if user is typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Map key to direction based on current control settings
      const { up, down, left, right } = controls;
      
      switch (event.code || event.key) {
        case up:
        case up.replace('Arrow', '').toLowerCase(): // Support both 'ArrowUp' and 'Up'
          event.preventDefault();
          onMove('up');
          break;
        case down:
        case down.replace('Arrow', '').toLowerCase():
          event.preventDefault();
          onMove('down');
          break;
        case left:
        case left.replace('Arrow', '').toLowerCase():
          event.preventDefault();
          onMove('left');
          break;
        case right:
        case right.replace('Arrow', '').toLowerCase():
          event.preventDefault();
          onMove('right');
          break;
        // Support common WASD alternatives
        case 'KeyW':
        case 'w':
          if (up === 'KeyW' || up === 'w') {
            event.preventDefault();
            onMove('up');
          }
          break;
        case 'KeyS':
        case 's':
          if (down === 'KeyS' || down === 's') {
            event.preventDefault();
            onMove('down');
          }
          break;
        case 'KeyA':
        case 'a':
          if (left === 'KeyA' || left === 'a') {
            event.preventDefault();
            onMove('left');
          }
          break;
        case 'KeyD':
        case 'd':
          if (right === 'KeyD' || right === 'd') {
            event.preventDefault();
            onMove('right');
          }
          break;
      }
    },
    [controls, onMove, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    // Use keydown for better responsiveness but prevent repeat
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.repeat) {
        handleKeyPress(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyPress, enabled]);

  return {
    // Return utility functions for manual control
    simulateKeyPress: (direction: 'up' | 'down' | 'left' | 'right') => {
      if (enabled) {
        onMove(direction);
      }
    },
    controls,
  };
}

// Utility function to get display name for a key
export function getKeyDisplayName(key: string): string {
  const keyMap: Record<string, string> = {
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    KeyW: 'W',
    KeyS: 'S',
    KeyA: 'A',
    KeyD: 'D',
    Space: 'Spacebar',
    Enter: 'Enter',
    Escape: 'Esc',
  };

  return keyMap[key] || key;
}

// Default control presets
export const KEYBOARD_PRESETS: Record<string, KeyboardControls> = {
  arrows: {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
  },
  wasd: {
    up: 'KeyW',
    down: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
  },
  numpad: {
    up: 'Numpad8',
    down: 'Numpad2',
    left: 'Numpad4',
    right: 'Numpad6',
  },
};