import React, { useState, useRef, useEffect } from 'react';

interface GameVisualizationProps {
  gameState: any;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  user: any;
}

interface SimpleEntity {
  id: string;
  position: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  type: string;
}

// Simple 3D Canvas using vanilla Three.js (without React Three Fiber to avoid conflicts)
function Simple3DView({ gameState, connectionStatus, user }: GameVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let scene: any, camera: any, renderer: any, animationId: number;
    
    const initThreeJS = async () => {
      try {
        // Dynamic import to avoid conflicts
        const THREE = await import('three');
        
        if (!canvasRef.current) return;

        // Setup scene
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, 400 / 400, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
        renderer.setSize(400, 400);
        renderer.setClearColor(0x2c3e50);

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 5);
        scene.add(directionalLight);

        // Create default objects
        const cubeGeometry = new THREE.BoxGeometry();
        const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x3498db });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.position.set(-2, 0, 0);
        scene.add(cube);

        const sphereGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xe74c3c });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(2, 0, 0);
        scene.add(sphere);

        // Position camera
        camera.position.set(5, 5, 5);
        camera.lookAt(0, 0, 0);

        // Animation loop
        const animate = () => {
          animationId = requestAnimationFrame(animate);
          
          cube.rotation.x += 0.01;
          cube.rotation.y += 0.01;
          sphere.rotation.x += 0.005;
          sphere.rotation.y += 0.01;
          
          renderer.render(scene, camera);
        };
        
        animate();
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing Three.js:', error);
      }
    };

    initThreeJS();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (renderer) renderer.dispose();
    };
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      height: '400px',
      backgroundColor: '#ecf0f1',
      borderRadius: '8px',
      padding: '20px'
    }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          border: '2px solid #bdc3c7',
          borderRadius: '8px',
          marginBottom: '10px'
        }} 
      />
      <div style={{ textAlign: 'center', color: '#2c3e50' }}>
        <p><strong>Status:</strong> {connectionStatus}</p>
        {user && <p><strong>Player:</strong> {user.username}</p>}
        <p><strong>3D Mode:</strong> {isInitialized ? 'Active' : 'Loading...'}</p>
      </div>
    </div>
  );
}

// 2D Status component
function GameStatus2D({ gameState, connectionStatus, user }: GameVisualizationProps) {
  // Calculate entities count safely
  let entitiesCount = 0;
  if (gameState?.entities) {
    try {
      if (gameState.entities instanceof Map) {
        entitiesCount = gameState.entities.size;
      } else if (typeof gameState.entities === 'object') {
        entitiesCount = Object.keys(gameState.entities).length;
      }
    } catch (error) {
      console.warn('Error counting entities:', error);
    }
  }
  
  return (
    <div style={{
      height: '400px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '8px',
      padding: '20px',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '20px' }}>
        {connectionStatus === 'connected' ? '🟢' : connectionStatus === 'connecting' ? '🟡' : '🔴'}
      </div>
      
      <h3 style={{ margin: '0 0 10px 0' }}>Connection: {connectionStatus}</h3>
      
      {user && (
        <p style={{ margin: '0 0 10px 0', fontSize: '18px' }}>
          Player: {user.username} ({user.role})
        </p>
      )}
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '20px', 
        width: '100%',
        maxWidth: '400px',
        marginTop: '20px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{entitiesCount}</div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>Game Entities</div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {gameState?.totalTime ? Math.floor(gameState.totalTime / 1000) : 0}s
          </div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>Uptime</div>
        </div>
      </div>
      
      {gameState && entitiesCount > 0 && (
        <div style={{ marginTop: '20px', fontSize: '14px', opacity: 0.9 }}>
          <strong>Game Mode:</strong> {gameState.gameMode || 'Unknown'}
        </div>
      )}
    </div>
  );
}

export const GameVisualization: React.FC<GameVisualizationProps> = ({ 
  gameState, 
  connectionStatus, 
  user 
}) => {
  const [is3DMode, setIs3DMode] = useState(false);

  return (
    <div style={{ marginTop: '20px', maxWidth: '800px' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '10px' }}>
          Game State Visualization
        </h2>
        
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
          {is3DMode ? '📊 Switch to 2D' : '🎮 Switch to 3D'}
        </button>
      </div>

      {is3DMode ? (
        <Simple3DView 
          gameState={gameState} 
          connectionStatus={connectionStatus} 
          user={user} 
        />
      ) : (
        <GameStatus2D 
          gameState={gameState} 
          connectionStatus={connectionStatus} 
          user={user} 
        />
      )}
    </div>
  );
};