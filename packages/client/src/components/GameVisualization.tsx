import React, { useState, useRef, useEffect } from 'react';
import type { GameAction } from '../types/local';

interface GameVisualizationProps {
  gameState: any;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  user: any;
  sendGameAction: (action: GameAction) => void;
  isAuthenticated: boolean;
}

interface SimpleEntity {
  id: string;
  position: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  type: string;
}

// Simple 3D Canvas using vanilla Three.js (without React Three Fiber to avoid conflicts)
function Simple3DView({ gameState, connectionStatus, user, sendGameAction, isAuthenticated }: GameVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let scene: any, camera: any, renderer: any, animationId: number;
    let playerCube: any, plane: any;
    
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
        renderer.setClearColor(connectionStatus === 'connected' ? 0x2c3e50 : 0x34495e);

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 5);
        scene.add(directionalLight);

        // Create ground plane
        const planeGeometry = new THREE.PlaneGeometry(10, 10, 10, 10);
        const planeMaterial = new THREE.MeshLambertMaterial({ 
          color: connectionStatus === 'connected' ? 0x95a5a6 : 0x7f8c8d,
          wireframe: true 
        });
        plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        scene.add(plane);

        if (connectionStatus === 'connected' && user) {
          // Player position from game state or default
          const playerPos =
            gameState?.player?.position ||
            gameState?.entities?.[user.id]?.position ||
            gameState?.position ||
            { x: 0, y: 0, z: 0 };
          
          // Create player cube
          const cubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
          const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x3498db });
          playerCube = new THREE.Mesh(cubeGeometry, cubeMaterial);
          playerCube.position.set(playerPos.x, 0.25, playerPos.z);
          scene.add(playerCube);

          // Add other entities if any
          if (gameState?.entities) {
            Object.entries(gameState.entities).forEach(([id, entity]: [string, any]) => {
              if (id !== user.id && entity.position) {
                const entityGeometry = new THREE.SphereGeometry(0.3, 8, 8);
                const entityMaterial = new THREE.MeshLambertMaterial({ color: 0xe74c3c });
                const entityMesh = new THREE.Mesh(entityGeometry, entityMaterial);
                entityMesh.position.set(entity.position.x, 0.3, entity.position.z);
                scene.add(entityMesh);
              }
            });
          }
        } else {
          // Default disconnected state - single rotating cube
          const cubeGeometry = new THREE.BoxGeometry();
          const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x95a5a6 });
          const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
          cube.position.set(0, 0.5, 0);
          scene.add(cube);
          
          const animate = () => {
            animationId = requestAnimationFrame(animate);
            cube.rotation.x += 0.005;
            cube.rotation.y += 0.005;
            renderer.render(scene, camera);
          };
          animate();
        }

        // Position camera
        camera.position.set(8, 6, 8);
        camera.lookAt(0, 0, 0);

        // Animation loop for connected state
        if (connectionStatus === 'connected') {
          const animate = () => {
            animationId = requestAnimationFrame(animate);
            
            if (playerCube) {
              playerCube.rotation.y += 0.01;
            }
            
            renderer.render(scene, camera);
          };
          animate();
        }
        
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
  }, [connectionStatus, gameState, user]);

  const handleGameAction = (action: GameAction) => {
    if (isAuthenticated && connectionStatus === 'connected') {
      sendGameAction(action);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      backgroundColor: '#ecf0f1',
      borderRadius: '8px',
      padding: '20px'
    }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          border: '2px solid #bdc3c7',
          borderRadius: '8px',
          marginBottom: '15px'
        }} 
      />
      
      {/* Game State Text */}
      <div style={{ 
        textAlign: 'center', 
        color: '#2c3e50', 
        marginBottom: '15px',
        minHeight: '60px'
      }}>
        <p><strong>Status:</strong> {connectionStatus}</p>
        {user && <p><strong>Player:</strong> {user.username}</p>}
        {connectionStatus === 'connected' && gameState && (
          <p><strong>Position:</strong> {
            (() => {
              const pos =
                gameState?.position ||
                gameState?.player?.position ||
                (gameState?.entities?.[user.id]?.position) ||
                { x: 0, y: 0, z: 0 };
              return `(${pos.x.toFixed(1)}, ${pos.z.toFixed(1)})`;
            })()
          }</p>
        )}
        <p><strong>3D Mode:</strong> {isInitialized ? 'Active' : 'Loading...'}</p>
      </div>

      {/* Game Action Buttons - Only show when connected */}
      {isAuthenticated && connectionStatus === 'connected' && (
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          flexWrap: 'wrap', 
          justifyContent: 'center',
          maxWidth: '400px'
        }}>
          <button
            onClick={() => handleGameAction({ type: 'move', direction: 'up', distance: 1, speed: 1 })}
            style={{
              padding: '6px 12px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Move Up
          </button>
          <button
            onClick={() => handleGameAction({ type: 'move', direction: 'down', distance: 1, speed: 1 })}
            style={{
              padding: '6px 12px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Move Down
          </button>
          <button
            onClick={() => handleGameAction({ type: 'move', direction: 'left', distance: 1, speed: 1 })}
            style={{
              padding: '6px 12px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Move Left
          </button>
          <button
            onClick={() => handleGameAction({ type: 'move', direction: 'right', distance: 1, speed: 1 })}
            style={{
              padding: '6px 12px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Move Right
          </button>
          <button
            onClick={() => handleGameAction({ type: 'item_drop', item: 'Health Potion' })}
            style={{
              padding: '6px 12px',
              backgroundColor: '#f39c12',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Drop Item
          </button>
          <button
            onClick={() => handleGameAction({ type: 'combat', targetId: 'enemy-123' })}
            style={{
              padding: '6px 12px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Combat
          </button>
        </div>
      )}
    </div>
  );
}

// 2D Status component with grid and player position
function GameStatus2D({ gameState, connectionStatus, user, sendGameAction, isAuthenticated }: GameVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    const gridSize = 20;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.strokeStyle = connectionStatus === 'connected' ? '#34495e' : '#7f8c8d';
    ctx.lineWidth = 1;
    
    // Draw grid lines
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    if (connectionStatus === 'connected' && user) {
      // Player position from game state or default
      const playerPos =
        gameState?.position ||
        gameState?.entities?.[user.id]?.position ||
        { x: 0, y: 0, z: 0 };
      
      // Draw player
      const playerX = centerX + (playerPos.x * gridSize);
      const playerY = centerY + (playerPos.z * gridSize); // Using z for 2D y
      
      ctx.fillStyle = '#3498db';
      ctx.fillRect(playerX - 8, playerY - 8, 16, 16);
      
      // Player label
      ctx.fillStyle = '#2c3e50';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(user.username, playerX, playerY - 12);
      
      // Draw other entities if any
      if (gameState?.entities) {
        Object.entries(gameState.entities).forEach(([id, entity]: [string, any]) => {
          if (id !== user.id && entity.position) {
            const entityX = centerX + (entity.position.x * gridSize);
            const entityY = centerY + (entity.position.z * gridSize);
            
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(entityX, entityY, 6, 0, 2 * Math.PI);
            ctx.fill();
          }
        });
      }
    } else {
      // Default disconnected state
      ctx.fillStyle = '#95a5a6';
      ctx.fillRect(centerX - 10, centerY - 10, 20, 20);
      
      ctx.fillStyle = '#7f8c8d';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Disconnected', centerX, centerY + 30);
    }
  }, [connectionStatus, gameState, user]);

  const handleGameAction = (action: GameAction) => {
    if (isAuthenticated && connectionStatus === 'connected') {
      sendGameAction(action);
    }
  };

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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '8px',
      padding: '20px',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* 2D Grid Canvas */}
      <canvas 
        ref={canvasRef}
        width={300}
        height={200}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
          marginBottom: '15px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      />
      
      {/* Connection Status */}
      <div style={{ fontSize: '24px', marginBottom: '10px' }}>
        {connectionStatus === 'connected' ? '🟢' : connectionStatus === 'connecting' ? '🟡' : '🔴'}
      </div>
      
      <h3 style={{ margin: '0 0 10px 0' }}>Connection: {connectionStatus}</h3>
      
      {user && (
        <p style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
          Player: {user.username} ({user.role})
        </p>
      )}

      {/* Game State Info */}
      {connectionStatus === 'connected' && gameState && (
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>
            Position: {
            (() => {
              const pos =
                gameState?.position ||
                gameState?.player?.position ||
                (gameState?.entities?.[user.id]?.position) ||
                { x: 0, y: 0, z: 0 };
              return `(${pos.x.toFixed(1)}, ${pos.z.toFixed(1)})`;
            })()
            }
          </p>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>
            Entities: {entitiesCount} | Uptime: {gameState?.totalTime ? Math.floor(gameState.totalTime / 1000) : 0}s
          </p>
        </div>
      )}
      
      {/* Game Action Buttons - Only show when connected */}
      {isAuthenticated && connectionStatus === 'connected' && (
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          flexWrap: 'wrap', 
          justifyContent: 'center',
          maxWidth: '300px'
        }}>
          <button
            onClick={() => handleGameAction({ type: 'move', direction: 'up' })}
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(39, 174, 96, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            ↑ Up
          </button>
          <button
            onClick={() => handleGameAction({ type: 'move', direction: 'down' })}
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(39, 174, 96, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            ↓ Down
          </button>
          <button
            onClick={() => handleGameAction({ type: 'move', direction: 'left' })}
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(39, 174, 96, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            ← Left
          </button>
          <button
            onClick={() => handleGameAction({ type: 'move', direction: 'right' })}
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(39, 174, 96, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            → Right
          </button>
          <button
            onClick={() => handleGameAction({ type: 'item_drop', item: 'Health Potion' })}
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(243, 156, 18, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Drop Item
          </button>
          <button
            onClick={() => handleGameAction({ type: 'combat', targetId: 'enemy-123' })}
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(231, 76, 60, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Combat
          </button>
        </div>
      )}
    </div>
  );
}

export const GameVisualization: React.FC<GameVisualizationProps> = ({ 
  gameState, 
  connectionStatus, 
  user,
  sendGameAction,
  isAuthenticated
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
          sendGameAction={sendGameAction}
          isAuthenticated={isAuthenticated}
        />
      ) : (
        <GameStatus2D 
          gameState={gameState} 
          connectionStatus={connectionStatus} 
          user={user} 
          sendGameAction={sendGameAction}
          isAuthenticated={isAuthenticated}
        />
      )}
    </div>
  );
};