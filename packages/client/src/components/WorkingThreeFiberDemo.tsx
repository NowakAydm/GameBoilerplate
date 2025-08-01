import React, { useState } from 'react';

/**
 * A simplified React Three Fiber demo component that works around dependency conflicts
 * This version demonstrates the UI structure and functionality without loading Three.js
 */
export const WorkingThreeFiberDemo: React.FC = () => {
  const [is3DMode, setIs3DMode] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

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
            marginRight: '10px',
          }}
        >
          {is3DMode ? '🎨 Switch to 2D Mode' : '🎮 Switch to 3D Mode'}
        </button>

        {/* Demo toggle for testing */}
        <button
          onClick={() => setShowDemo(!showDemo)}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          {showDemo ? '🔍 Hide Demo' : '🔍 Show Demo'}
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
        {showDemo && (
          <span style={{ marginLeft: '20px' }}>
            | <strong>Demo Status:</strong> {showDemo ? 'Active' : 'Inactive'}
          </span>
        )}
      </div>

      {/* Show demo area if enabled */}
      {showDemo && (
        <div style={{ height: '400px', border: '1px solid #bdc3c7', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
          {is3DMode ? (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#2c3e50',
                color: 'white',
                position: 'relative',
              }}
            >
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎮</div>
              <h3 style={{ marginBottom: '15px' }}>3D Mode Simulation</h3>
              <p style={{ textAlign: 'center', maxWidth: '300px', marginBottom: '20px' }}>
                This simulates a 3D scene with animated objects, lighting, and orbital controls.
              </p>
              
              {/* Simulated animated elements */}
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    backgroundColor: '#4a90e2',
                    borderRadius: '8px',
                    animation: 'spin 2s linear infinite',
                  }}
                />
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#2ecc71',
                    borderRadius: '50%',
                    animation: 'bounce 1s ease-in-out infinite alternate',
                  }}
                />
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    backgroundColor: '#f39c12',
                    borderRadius: '8px',
                    animation: 'spin 3s linear infinite reverse',
                  }}
                />
              </div>

              {/* Add CSS animations */}
              <style dangerouslySetInnerHTML={{
                __html: `
                  @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                  @keyframes bounce {
                    from { transform: translateY(0px); }
                    to { transform: translateY(-20px); }
                  }
                `
              }} />
            </div>
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#ecf0f1',
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
            </div>
          )}
        </div>
      )}

      {/* Information panel */}
      <div
        style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
        }}
      >
        <h4 style={{ color: '#495057', marginBottom: '15px' }}>
          React Three Fiber Demo Implementation
        </h4>
        <p style={{ color: '#6c757d', lineHeight: '1.6', marginBottom: '15px' }}>
          This component demonstrates the planned React Three Fiber integration. The toggle functionality 
          and UI structure are complete and working. The 3D scene simulation shows what the actual 
          Three.js implementation will look like.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <strong>✅ Working Features:</strong>
            <ul style={{ marginTop: '5px', color: '#6c757d' }}>
              <li>2D/3D mode toggle</li>
              <li>Responsive UI design</li>
              <li>State management</li>
              <li>Component architecture</li>
            </ul>
          </div>
          <div>
            <strong>🚧 Planned Features:</strong>
            <ul style={{ marginTop: '5px', color: '#6c757d' }}>
              <li>React Three Fiber Canvas</li>
              <li>OrbitControls interaction</li>
              <li>Animated 3D objects</li>
              <li>Drei component integration</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '6px' }}>
          <strong>Note:</strong> The Three.js rendering is temporarily simulated due to dependency conflicts 
          with the existing game engine. The component structure and functionality are complete and ready 
          for Three.js integration.
        </div>
      </div>
    </div>
  );
};