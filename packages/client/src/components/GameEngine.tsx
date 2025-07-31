import { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import { 
  GameEngine, 
  SystemManager, 
  SceneManager, 
  ActionSystem,
  IGameEngine,
  EngineConfig,
  GameEntity 
} from '@gameboilerplate/shared';

// React Hook for Game Engine
export function useGameEngine(config: Partial<EngineConfig> = {}) {
  const [engine] = useState(() => new GameEngine({
    tickRate: 60,
    enableDebug: true,
    autoStart: true,
    ...config
  }));
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Set up basic systems
        const systemManager = new SystemManager(engine);
        const sceneManager = new SceneManager(engine);
        const actionSystem = new ActionSystem(engine);

        // Add core systems
        engine.addSystem(actionSystem);
        systemManager.installGameSystems('rpg');

        // Initialize engine
        await engine.init();
        setIsInitialized(true);

        // Auto-start if configured
        if (config.autoStart !== false) {
          await engine.start();
          setIsRunning(true);
        }

        console.log('🎮 Client Game Engine initialized');
      } catch (error) {
        console.error('❌ Failed to initialize game engine:', error);
      }
    };

    init();

    return () => {
      if (engine.isRunning) {
        engine.stop();
      }
    };
  }, [engine, config.autoStart]);

  const start = useCallback(async () => {
    if (!isInitialized || isRunning) return;
    await engine.start();
    setIsRunning(true);
  }, [engine, isInitialized, isRunning]);

  const stop = useCallback(async () => {
    if (!isRunning) return;
    await engine.stop();
    setIsRunning(false);
  }, [engine, isRunning]);

  return {
    engine,
    isInitialized,
    isRunning,
    start,
    stop,
    stats: engine.getStats()
  };
}

// React Three Fiber Game Scene Component
interface GameSceneProps {
  engine: IGameEngine;
  children?: React.ReactNode;
}

export function GameScene({ engine, children }: GameSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 5, 10], fov: 60 }}
      shadows
      onCreated={({ gl }) => {
        gl.setClearColor('#87CEEB');
      }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <GameRenderer engine={engine} />
      
      {children}
      
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      <Stats />
    </Canvas>
  );
}

// Component that renders game entities using R3F
function GameRenderer({ engine }: { engine: IGameEngine }) {
  const entitiesRef = useRef<Map<string, any>>(new Map());

  useFrame((state, delta) => {
    // Sync R3F scene with game engine entities
    const entities = Array.from(engine.gameState.entities.values());
    
    entities.forEach(entity => {
      const ref = entitiesRef.current.get(entity.id);
      if (ref?.current) {
        // Update position
        ref.current.position.set(
          entity.position.x,
          entity.position.y,
          entity.position.z
        );
        
        // Update rotation
        ref.current.rotation.set(
          entity.rotation.x,
          entity.rotation.y,
          entity.rotation.z
        );
        
        // Update scale
        ref.current.scale.set(
          entity.scale.x,
          entity.scale.y,
          entity.scale.z
        );
      }
    });
  });

  useEffect(() => {
    const handleEntityAdded = (event: any) => {
      const entity = event.data;
      console.log('🎯 Entity added to scene:', entity.id);
    };

    const handleEntityRemoved = (event: any) => {
      const entity = event.data;
      entitiesRef.current.delete(entity.id);
      console.log('🗑️ Entity removed from scene:', entity.id);
    };

    engine.on('entity:added', handleEntityAdded);
    engine.on('entity:removed', handleEntityRemoved);

    return () => {
      engine.off('entity:added', handleEntityAdded);
      engine.off('entity:removed', handleEntityRemoved);
    };
  }, [engine]);

  return (
    <group>
      <EntityRenderer 
        engine={engine} 
        entitiesRef={entitiesRef}
      />
    </group>
  );
}

// Renders individual entities based on their type
function EntityRenderer({ 
  engine, 
  entitiesRef 
}: { 
  engine: IGameEngine;
  entitiesRef: React.MutableRefObject<Map<string, any>>;
}) {
  const entities = Array.from(engine.gameState.entities.values());

  return (
    <>
      {entities.map(entity => (
        <EntityMesh 
          key={entity.id} 
          entity={entity} 
          entitiesRef={entitiesRef}
        />
      ))}
    </>
  );
}

// Individual entity mesh component
function EntityMesh({ 
  entity, 
  entitiesRef 
}: { 
  entity: GameEntity;
  entitiesRef: React.MutableRefObject<Map<string, any>>;
}) {
  const meshRef = useRef<any>();

  useEffect(() => {
    if (meshRef.current) {
      entitiesRef.current.set(entity.id, meshRef);
    }
    return () => {
      entitiesRef.current.delete(entity.id);
    };
  }, [entity.id, entitiesRef]);

  const getEntityGeometry = () => {
    switch (entity.type) {
      case 'player':
        return <capsuleGeometry args={[0.5, 1]} />;
      case 'enemy':
        return <boxGeometry args={[1, 1, 1]} />;
      case 'item':
        return <sphereGeometry args={[0.3]} />;
      case 'platform':
        return <boxGeometry args={[2, 0.2, 2]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  const getEntityMaterial = () => {
    const baseColor = entity.properties.color || getDefaultColor(entity.type);
    const opacity = entity.properties.opacity || 1;
    
    return (
      <meshStandardMaterial 
        color={baseColor} 
        transparent={opacity < 1}
        opacity={opacity}
      />
    );
  };

  const getDefaultColor = (type: string): string => {
    switch (type) {
      case 'player': return '#4a90e2';
      case 'enemy': return '#e24a4a';
      case 'item': return '#f39c12';
      case 'platform': return '#95a5a6';
      default: return '#ffffff';
    }
  };

  return (
    <mesh
      ref={meshRef}
      position={[entity.position.x, entity.position.y, entity.position.z]}
      rotation={[entity.rotation.x, entity.rotation.y, entity.rotation.z]}
      scale={[entity.scale.x, entity.scale.y, entity.scale.z]}
      castShadow
      receiveShadow
    >
      {getEntityGeometry()}
      {getEntityMaterial()}
    </mesh>
  );
}

// Game Statistics Display Component
export function GameStats({ engine }: { engine: IGameEngine }) {
  const [stats, setStats] = useState(engine.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(engine.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [engine]);

  return (
    <div style={{
      position: 'absolute',
      top: 10,
      left: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 1000
    }}>
      <div>Status: {stats.isRunning ? '🟢 Running' : '🔴 Stopped'}</div>
      <div>FPS: {stats.fps.toFixed(1)}</div>
      <div>Entities: {stats.entityCount}</div>
      <div>Systems: {stats.systemCount}</div>
      <div>Time: {(stats.totalTime / 1000).toFixed(1)}s</div>
    </div>
  );
}

// Game Control Panel Component
export function GameControls({ engine }: { engine: IGameEngine }) {
  const [selectedEntityType, setSelectedEntityType] = useState('player');

  const createEntity = () => {
    const entity = engine.createEntity(
      selectedEntityType,
      { 
        x: (Math.random() - 0.5) * 10, 
        y: Math.random() * 3, 
        z: (Math.random() - 0.5) * 10 
      }
    );

    // Add entity-specific properties
    switch (selectedEntityType) {
      case 'player':
        entity.properties = {
          health: 100,
          maxHealth: 100,
          speed: 5,
          inventory: []
        };
        break;
      case 'enemy':
        entity.properties = {
          health: 50,
          maxHealth: 50,
          speed: 2,
          ai: 'aggressive'
        };
        break;
      case 'item':
        entity.properties = {
          itemType: 'health_potion',
          value: 25,
          pickupable: true
        };
        break;
    }

    engine.addEntity(entity);
  };

  const clearEntities = () => {
    const entities = Array.from(engine.gameState.entities.keys());
    entities.forEach(id => engine.removeEntity(id));
  };

  return (
    <div style={{
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: '15px',
      borderRadius: '5px',
      zIndex: 1000
    }}>
      <h3 style={{ margin: '0 0 10px 0' }}>Game Controls</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <label>
          Entity Type: 
          <select 
            value={selectedEntityType}
            onChange={(e) => setSelectedEntityType(e.target.value)}
            style={{ marginLeft: '5px' }}
          >
            <option value="player">Player</option>
            <option value="enemy">Enemy</option>
            <option value="item">Item</option>
            <option value="platform">Platform</option>
          </select>
        </label>
      </div>
      
      <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
        <button onClick={createEntity}>
          Create {selectedEntityType}
        </button>
        <button onClick={clearEntities}>
          Clear All
        </button>
      </div>
    </div>
  );
}
