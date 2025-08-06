import React, { useState, useEffect, useRef } from 'react';
import type { KeyboardControls, TouchControls, ControlSettings } from '@gameboilerplate/shared';
import { KEYBOARD_PRESETS, getKeyDisplayName } from './shared/useGameKeyboardControls';
import { TOUCH_PRESETS, validateTouchControls } from './shared/useGameTouchControls';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  controlSettings: ControlSettings;
  onControlSettingsChange: (settings: ControlSettings) => void;
}

type TabName = 'Game' | 'Display' | 'Controls' | 'Dev';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  controlSettings,
  onControlSettingsChange,
}) => {
  const [activeTab, setActiveTab] = useState<TabName>('Controls');
  const [tempKeyboardControls, setTempKeyboardControls] = useState<KeyboardControls>(controlSettings.keyboard);
  const [tempTouchControls, setTempTouchControls] = useState<TouchControls>(controlSettings.touch);
  const [isListeningForKey, setIsListeningForKey] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const tabs: TabName[] = ['Game', 'Display', 'Controls', 'Dev'];

  // Update temp controls when props change
  useEffect(() => {
    setTempKeyboardControls(controlSettings.keyboard);
    setTempTouchControls(controlSettings.touch);
  }, [controlSettings]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isListeningForKey) {
          setIsListeningForKey(null);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose, isListeningForKey]);

  // Handle key listening for remapping
  useEffect(() => {
    const handleKeyCapture = (event: KeyboardEvent) => {
      if (isListeningForKey) {
        event.preventDefault();
        event.stopPropagation();
        
        const key = event.code || event.key;
        setTempKeyboardControls(prev => ({
          ...prev,
          [isListeningForKey]: key,
        }));
        setIsListeningForKey(null);
      }
    };

    if (isListeningForKey) {
      document.addEventListener('keydown', handleKeyCapture, true);
      return () => document.removeEventListener('keydown', handleKeyCapture, true);
    }
  }, [isListeningForKey]);

  const handleSave = () => {
    onControlSettingsChange({
      keyboard: tempKeyboardControls,
      touch: validateTouchControls(tempTouchControls),
    });
    onClose();
  };

  const handleCancel = () => {
    setTempKeyboardControls(controlSettings.keyboard);
    setTempTouchControls(controlSettings.touch);
    setIsListeningForKey(null);
    onClose();
  };

  const applyKeyboardPreset = (presetName: string) => {
    const preset = KEYBOARD_PRESETS[presetName];
    if (preset) {
      setTempKeyboardControls(preset);
    }
  };

  const applyTouchPreset = (presetName: string) => {
    const preset = TOUCH_PRESETS[presetName];
    if (preset) {
      setTempTouchControls(preset);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div
        ref={modalRef}
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          width: '600px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Header with tabs */}
        <div style={{
          borderBottom: '1px solid #e0e0e0',
          padding: '16px 24px 0',
        }}>
          <h2 style={{ margin: '0 0 16px 0', color: '#333' }}>Settings</h2>
          <div style={{ display: 'flex', gap: '4px' }}>
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  backgroundColor: activeTab === tab ? '#007bff' : 'transparent',
                  color: activeTab === tab ? 'white' : '#666',
                  borderRadius: '4px 4px 0 0',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeTab === tab ? 'bold' : 'normal',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {activeTab === 'Game' && (
            <div>
              <h3>Game Settings</h3>
              <p>Game-specific settings will be added here.</p>
            </div>
          )}

          {activeTab === 'Display' && (
            <div>
              <h3>Display Settings</h3>
              <p>Display and graphics settings will be added here.</p>
            </div>
          )}

          {activeTab === 'Controls' && (
            <div>
              <h3>Controls Settings</h3>
              
              {/* Keyboard Controls */}
              <div style={{ marginBottom: '32px' }}>
                <h4>Keyboard Controls</h4>
                <div style={{ marginBottom: '16px' }}>
                  <label>Presets: </label>
                  <select
                    onChange={(e) => applyKeyboardPreset(e.target.value)}
                    style={{ marginLeft: '8px', padding: '4px' }}
                  >
                    <option value="">Select preset...</option>
                    <option value="arrows">Arrow Keys</option>
                    <option value="wasd">WASD</option>
                    <option value="numpad">Numpad</option>
                  </select>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {Object.entries(tempKeyboardControls).map(([direction, key]) => (
                    <div key={direction} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ minWidth: '60px', textTransform: 'capitalize' }}>
                        {direction}:
                      </label>
                      <button
                        onClick={() => setIsListeningForKey(direction)}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          backgroundColor: isListeningForKey === direction ? '#ffeb3b' : 'white',
                          cursor: 'pointer',
                          minWidth: '80px',
                        }}
                      >
                        {isListeningForKey === direction ? 'Press key...' : getKeyDisplayName(key)}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Touch Controls */}
              <div>
                <h4>Touch Controls</h4>
                <div style={{ marginBottom: '16px' }}>
                  <label>Presets: </label>
                  <select
                    onChange={(e) => applyTouchPreset(e.target.value)}
                    style={{ marginLeft: '8px', padding: '4px' }}
                  >
                    <option value="">Select preset...</option>
                    <option value="default">Default</option>
                    <option value="restricted">Restricted</option>
                    <option value="panOnly">Pan Only</option>
                    <option value="viewOnly">View Only</option>
                    <option value="sensitive">Sensitive</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gap: '12px' }}>
                  {/* Enable/Disable toggles */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={tempTouchControls.panEnabled}
                        onChange={(e) => setTempTouchControls(prev => ({
                          ...prev,
                          panEnabled: e.target.checked
                        }))}
                      />
                      Pan
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={tempTouchControls.rotateEnabled}
                        onChange={(e) => setTempTouchControls(prev => ({
                          ...prev,
                          rotateEnabled: e.target.checked
                        }))}
                      />
                      Rotate
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={tempTouchControls.zoomEnabled}
                        onChange={(e) => setTempTouchControls(prev => ({
                          ...prev,
                          zoomEnabled: e.target.checked
                        }))}
                      />
                      Zoom
                    </label>
                  </div>

                  {/* Sensitivity sliders */}
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <label>
                      Pan Sensitivity: {tempTouchControls.panSensitivity}
                      <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={tempTouchControls.panSensitivity}
                        onChange={(e) => setTempTouchControls(prev => ({
                          ...prev,
                          panSensitivity: parseFloat(e.target.value)
                        }))}
                        style={{ width: '100%', marginLeft: '8px' }}
                      />
                    </label>
                    <label>
                      Rotate Sensitivity: {tempTouchControls.rotateSensitivity}
                      <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={tempTouchControls.rotateSensitivity}
                        onChange={(e) => setTempTouchControls(prev => ({
                          ...prev,
                          rotateSensitivity: parseFloat(e.target.value)
                        }))}
                        style={{ width: '100%', marginLeft: '8px' }}
                      />
                    </label>
                    <label>
                      Zoom Sensitivity: {tempTouchControls.zoomSensitivity}
                      <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={tempTouchControls.zoomSensitivity}
                        onChange={(e) => setTempTouchControls(prev => ({
                          ...prev,
                          zoomSensitivity: parseFloat(e.target.value)
                        }))}
                        style={{ width: '100%', marginLeft: '8px' }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Dev' && (
            <div>
              <h3>Developer Settings</h3>
              <p>Developer tools and debug settings will be added here.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid #e0e0e0',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}>
          <button
            onClick={handleCancel}
            style={{
              padding: '8px 16px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#007bff',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};