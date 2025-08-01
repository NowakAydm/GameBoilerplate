import React, { useState, Suspense, lazy } from 'react';

// Dynamically import the Three.js component to avoid initial conflicts
const LazyThreeFiberScene = lazy(() => import('./LazyThreeFiberScene'));

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
        This is the 2D placeholder view. Switch to 3D mode to experience an interactive React Three
        Fiber scene with animated objects, lighting, and orbital controls.
      </p>
      <div
        style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
        }}
      >
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
 * Loading component while Three.js loads
 */
function ThreeJSLoading() {
  return (
    <div
      style={{
        height: '400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
      }}
    >
      <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔄</div>
      <p style={{ color: '#6c757d' }}>Loading 3D Scene...</p>
    </div>
  );
}

/**
 * Main component that demonstrates React Three Fiber capabilities
 * Uses dynamic imports to avoid dependency conflicts
 */
export const DynamicThreeFiberDemo: React.FC = () => {
  const [is3DMode, setIs3DMode] = useState(false);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header and mode toggle */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>React Three Fiber Demonstration</h2>
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
        <div
          style={{
            height: '400px',
            border: '1px solid #bdc3c7',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <Suspense fallback={<ThreeJSLoading />}>
            <LazyThreeFiberScene />
          </Suspense>
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
        <h4 style={{ color: '#495057', marginBottom: '15px' }}>About this Demo</h4>
        <p style={{ color: '#6c757d', lineHeight: '1.6', marginBottom: '15px' }}>
          This component demonstrates the integration of React Three Fiber with @react-three/drei
          components in a React application. It uses dynamic imports to avoid dependency conflicts
          and showcases fundamental 3D concepts.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
          }}
        >
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
