# Integration Architecture Document

## Technical Specifications for MaoeW Integration

This document provides detailed technical specifications for integrating MaoeW frontend code and generation logic into the GameBoilerplate monorepo architecture.

## 1. Shared Package Generation API

### 1.1 Core Generation Engine

```typescript
// packages/shared/src/generation/core/GenerationEngine.ts
import { EventEmitter } from 'events';
import { TerrainGenerator } from '../terrain/TerrainGenerator';
import { ResourceCalculator } from '../resources/ResourceCalculator';
import { ChunkManager } from './ChunkManager';

export interface GenerationConfig {
  seed: number;
  chunkSize: number;
  viewDistance: number;
  terrainSettings: TerrainSettings;
  resourceSettings: ResourceSettings;
}

export class GenerationEngine extends EventEmitter {
  private terrainGenerator: TerrainGenerator;
  private resourceCalculator: ResourceCalculator;
  private chunkManager: ChunkManager;
  private config: GenerationConfig;

  constructor(config: GenerationConfig) {
    super();
    this.config = config;
    this.terrainGenerator = new TerrainGenerator(config.terrainSettings);
    this.resourceCalculator = new ResourceCalculator(config.resourceSettings);
    this.chunkManager = new ChunkManager(config.chunkSize, config.viewDistance);
  }

  async generateChunk(chunkId: string, position: Vector3): Promise<TerrainChunk> {
    this.emit('generation:started', { chunkId, position });
    
    try {
      // Generate base terrain
      const heightmap = await this.terrainGenerator.generateHeightmap(position, this.config.chunkSize);
      const biomes = await this.terrainGenerator.generateBiomes(position, heightmap);
      
      // Calculate resources
      const resources = await this.resourceCalculator.calculateForTerrain(heightmap, biomes);
      
      const chunk: TerrainChunk = {
        chunkId,
        position,
        size: this.config.chunkSize,
        heightmap,
        biomes,
        resources,
        generated: true,
        timestamp: new Date()
      };

      this.emit('generation:completed', { chunk });
      return chunk;

    } catch (error) {
      this.emit('generation:error', { chunkId, error });
      throw error;
    }
  }

  async getChunkAtPosition(position: Vector3): Promise<TerrainChunk | null> {
    return this.chunkManager.getChunk(position);
  }

  async preloadArea(centerPosition: Vector3, radius: number): Promise<TerrainChunk[]> {
    const chunks: TerrainChunk[] = [];
    const chunkPositions = this.chunkManager.getChunkPositionsInRadius(centerPosition, radius);
    
    for (const pos of chunkPositions) {
      const chunkId = this.chunkManager.getChunkId(pos);
      const chunk = await this.generateChunk(chunkId, pos);
      chunks.push(chunk);
    }
    
    return chunks;
  }
}
```

### 1.2 Terrain Generation System

```typescript
// packages/shared/src/generation/terrain/TerrainGenerator.ts
import { NoiseGenerator } from './NoiseGenerator';
import { BiomeGenerator } from './BiomeGenerator';

export interface TerrainSettings {
  baseHeight: number;
  heightVariation: number;
  noiseScale: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
}

export class TerrainGenerator {
  private noiseGenerator: NoiseGenerator;
  private biomeGenerator: BiomeGenerator;
  private settings: TerrainSettings;

  constructor(settings: TerrainSettings) {
    this.settings = settings;
    this.noiseGenerator = new NoiseGenerator();
    this.biomeGenerator = new BiomeGenerator();
  }

  async generateHeightmap(position: Vector3, size: number): Promise<number[][]> {
    const heightmap: number[][] = [];
    
    for (let x = 0; x < size; x++) {
      heightmap[x] = [];
      for (let z = 0; z < size; z++) {
        const worldX = position.x + x;
        const worldZ = position.z + z;
        
        // Multi-octave noise for realistic terrain
        let height = 0;
        let amplitude = 1;
        let frequency = this.settings.noiseScale;
        
        for (let i = 0; i < this.settings.octaves; i++) {
          height += this.noiseGenerator.noise2D(
            worldX * frequency, 
            worldZ * frequency
          ) * amplitude;
          
          amplitude *= this.settings.persistence;
          frequency *= this.settings.lacunarity;
        }
        
        // Apply base height and variation
        height = this.settings.baseHeight + (height * this.settings.heightVariation);
        heightmap[x][z] = Math.max(0, height);
      }
    }
    
    return heightmap;
  }

  async generateBiomes(position: Vector3, heightmap: number[][]): Promise<string[][]> {
    return this.biomeGenerator.generateBiomes(position, heightmap);
  }
}
```

### 1.3 Resource Calculation System

```typescript
// packages/shared/src/generation/resources/ResourceCalculator.ts
export interface ResourceSettings {
  deposits: ResourceDepositConfig[];
  distributionMethods: DistributionMethod[];
  rarityFactors: RarityConfig;
}

export interface ResourceDepositConfig {
  type: string;
  preferredBiomes: string[];
  heightRange: [number, number];
  abundance: number;
  clusterSize: number;
  quality: QualityRange;
}

export class ResourceCalculator {
  private settings: ResourceSettings;
  private depositGenerators: Map<string, DepositGenerator>;

  constructor(settings: ResourceSettings) {
    this.settings = settings;
    this.depositGenerators = new Map();
    this.initializeDepositGenerators();
  }

  async calculateForTerrain(heightmap: number[][], biomes: string[][]): Promise<ResourceDeposit[]> {
    const deposits: ResourceDeposit[] = [];
    
    for (const depositConfig of this.settings.deposits) {
      const generator = this.depositGenerators.get(depositConfig.type);
      if (generator) {
        const typeDeposits = await generator.generateDeposits(heightmap, biomes, depositConfig);
        deposits.push(...typeDeposits);
      }
    }
    
    return this.applyRarityFactors(deposits);
  }

  async calculateResourceValue(position: Vector3, resourceType: string): Promise<number> {
    // Calculate dynamic resource value based on scarcity, location, etc.
    const baseValue = this.getBaseResourceValue(resourceType);
    const scarcityMultiplier = await this.calculateScarcity(position, resourceType);
    const locationMultiplier = this.getLocationMultiplier(position);
    
    return baseValue * scarcityMultiplier * locationMultiplier;
  }

  private initializeDepositGenerators(): void {
    // Initialize generators for different resource types
    this.depositGenerators.set('iron', new IronDepositGenerator());
    this.depositGenerators.set('gold', new GoldDepositGenerator());
    this.depositGenerators.set('coal', new CoalDepositGenerator());
    this.depositGenerators.set('gems', new GemDepositGenerator());
  }

  private applyRarityFactors(deposits: ResourceDeposit[]): ResourceDeposit[] {
    return deposits.map(deposit => ({
      ...deposit,
      quality: deposit.quality * this.settings.rarityFactors[deposit.type] || 1.0,
      extractionDifficulty: this.calculateExtractionDifficulty(deposit)
    }));
  }
}
```

## 2. Plugin Integration Patterns

### 2.1 Terrain Generation Plugin

```typescript
// packages/shared/src/generation/plugins/TerrainPlugin.ts
export class TerrainGenerationPlugin implements GamePlugin {
  name = 'TerrainGenerationPlugin';
  version = '1.0.0';
  dependencies = [];

  private generationEngine: GenerationEngine;
  private terrainSystem: TerrainGenerationSystem;

  async install(engine: IGameEngine): Promise<void> {
    console.log('🌍 Installing Terrain Generation Plugin...');

    // Initialize generation engine
    const config: GenerationConfig = {
      seed: Date.now(),
      chunkSize: 32,
      viewDistance: 3,
      terrainSettings: {
        baseHeight: 50,
        heightVariation: 30,
        noiseScale: 0.01,
        octaves: 4,
        persistence: 0.5,
        lacunarity: 2.0
      },
      resourceSettings: {
        deposits: [
          {
            type: 'iron',
            preferredBiomes: ['mountain', 'hill'],
            heightRange: [40, 80],
            abundance: 0.3,
            clusterSize: 5,
            quality: { min: 0.2, max: 0.8 }
          }
        ],
        distributionMethods: ['cluster', 'vein', 'deposit'],
        rarityFactors: {
          iron: 1.0,
          gold: 0.1,
          gems: 0.05
        }
      }
    };

    this.generationEngine = new GenerationEngine(config);
    this.terrainSystem = new TerrainGenerationSystem(this.generationEngine);

    // Add system to engine
    engine.addSystem(this.terrainSystem);

    // Register terrain-related actions
    this.registerTerrainActions(engine);

    console.log('🌍 Terrain Generation Plugin installed successfully!');
  }

  private registerTerrainActions(engine: IGameEngine): void {
    const actionSystem = engine.getSystem('ActionSystem') as any;
    if (!actionSystem) return;

    // Generate Terrain Chunk Action
    actionSystem.registerAction({
      type: 'generateTerrain',
      schema: z.object({
        position: PositionSchema,
        size: z.number().default(32),
        priority: z.number().default(1)
      }),
      cooldown: 100, // Prevent spam generation
      handler: this.handleTerrainGeneration.bind(this)
    });

    // Request Resource Data Action
    actionSystem.registerAction({
      type: 'requestResources',
      schema: z.object({
        chunkId: z.string(),
        resourceTypes: z.array(z.string()).optional()
      }),
      cooldown: 50,
      handler: this.handleResourceRequest.bind(this)
    });

    // Preload Area Action
    actionSystem.registerAction({
      type: 'preloadTerrain',
      schema: z.object({
        centerPosition: PositionSchema,
        radius: z.number().min(1).max(10)
      }),
      cooldown: 1000,
      handler: this.handlePreloadArea.bind(this)
    });
  }

  private async handleTerrainGeneration(data: any, context: ActionContext): Promise<ActionResult> {
    try {
      const chunkId = `chunk_${data.position.x}_${data.position.z}`;
      const chunk = await this.generationEngine.generateChunk(chunkId, data.position);

      // Create terrain entity in game world
      const terrainEntity = context.engine.createEntity('terrain', data.position);
      terrainEntity.properties = {
        chunkId,
        heightmap: chunk.heightmap,
        biomes: chunk.biomes,
        resources: chunk.resources,
        generated: true,
        size: data.size
      };

      context.engine.addEntity(terrainEntity);

      return {
        success: true,
        data: { 
          chunkId, 
          entityId: terrainEntity.id,
          resourceCount: chunk.resources.length 
        },
        events: [{
          type: 'terrain:generated',
          data: { 
            chunkId, 
            position: data.position, 
            size: data.size,
            resources: chunk.resources.length
          },
          timestamp: Date.now()
        }]
      };

    } catch (error) {
      return {
        success: false,
        message: `Terrain generation failed: ${error.message}`
      };
    }
  }

  private async handleResourceRequest(data: any, context: ActionContext): Promise<ActionResult> {
    try {
      const terrainEntity = Array.from(context.gameState.entities.values())
        .find(e => e.type === 'terrain' && e.properties.chunkId === data.chunkId);

      if (!terrainEntity) {
        return { success: false, message: 'Terrain chunk not found' };
      }

      let resources = terrainEntity.properties.resources;
      
      // Filter by resource types if specified
      if (data.resourceTypes) {
        resources = resources.filter(r => data.resourceTypes.includes(r.type));
      }

      return {
        success: true,
        data: { 
          chunkId: data.chunkId, 
          resources,
          totalValue: resources.reduce((sum, r) => sum + (r.abundance * r.quality), 0)
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Resource request failed: ${error.message}`
      };
    }
  }

  private async handlePreloadArea(data: any, context: ActionContext): Promise<ActionResult> {
    try {
      const chunks = await this.generationEngine.preloadArea(data.centerPosition, data.radius);
      
      // Create terrain entities for all chunks
      const entityIds: string[] = [];
      for (const chunk of chunks) {
        const terrainEntity = context.engine.createEntity('terrain', chunk.position);
        terrainEntity.properties = {
          chunkId: chunk.chunkId,
          heightmap: chunk.heightmap,
          biomes: chunk.biomes,
          resources: chunk.resources,
          generated: true,
          size: chunk.size
        };
        
        context.engine.addEntity(terrainEntity);
        entityIds.push(terrainEntity.id);
      }

      return {
        success: true,
        data: { 
          chunksGenerated: chunks.length,
          entityIds,
          totalResources: chunks.reduce((sum, c) => sum + c.resources.length, 0)
        },
        events: [{
          type: 'terrain:preloaded',
          data: { 
            centerPosition: data.centerPosition, 
            radius: data.radius,
            chunksGenerated: chunks.length
          },
          timestamp: Date.now()
        }]
      };

    } catch (error) {
      return {
        success: false,
        message: `Preload failed: ${error.message}`
      };
    }
  }
}
```

### 2.2 Terrain System for Game Engine

```typescript
// packages/shared/src/generation/core/TerrainGenerationSystem.ts
export class TerrainGenerationSystem implements System {
  name = 'TerrainGenerationSystem';
  priority = 25;
  enabled = true;

  private generationEngine: GenerationEngine;
  private activeChunks: Map<string, TerrainChunk> = new Map();
  private loadQueue: TerrainLoadRequest[] = [];

  constructor(generationEngine: GenerationEngine) {
    this.generationEngine = generationEngine;
  }

  async init(engine: IGameEngine): Promise<void> {
    console.log('🌍 Terrain Generation System initialized');
    
    // Listen for generation events
    this.generationEngine.on('generation:completed', (data) => {
      this.activeChunks.set(data.chunk.chunkId, data.chunk);
    });

    this.generationEngine.on('generation:error', (data) => {
      console.error(`Terrain generation error for chunk ${data.chunkId}:`, data.error);
    });
  }

  async update(deltaTime: number, gameState: GameState): Promise<void> {
    // Process terrain loading queue
    if (this.loadQueue.length > 0) {
      const request = this.loadQueue.shift();
      if (request) {
        await this.processLoadRequest(request, gameState);
      }
    }

    // Update terrain entities
    for (const entity of gameState.entities.values()) {
      if (entity.type === 'terrain') {
        this.updateTerrainEntity(entity, deltaTime);
      }
    }

    // Cleanup distant chunks to manage memory
    this.cleanupDistantChunks(gameState);
  }

  queueChunkLoad(position: Vector3, priority: number = 1): void {
    const chunkId = `chunk_${position.x}_${position.z}`;
    if (!this.activeChunks.has(chunkId)) {
      this.loadQueue.push({ position, priority, chunkId });
      this.loadQueue.sort((a, b) => b.priority - a.priority);
    }
  }

  private async processLoadRequest(request: TerrainLoadRequest, gameState: GameState): Promise<void> {
    try {
      const chunk = await this.generationEngine.generateChunk(request.chunkId, request.position);
      
      // Update corresponding terrain entity if it exists
      const terrainEntity = Array.from(gameState.entities.values())
        .find(e => e.type === 'terrain' && e.properties.chunkId === request.chunkId);
      
      if (terrainEntity) {
        terrainEntity.properties.heightmap = chunk.heightmap;
        terrainEntity.properties.biomes = chunk.biomes;
        terrainEntity.properties.resources = chunk.resources;
        terrainEntity.properties.generated = true;
      }

    } catch (error) {
      console.error(`Failed to process terrain load request:`, error);
    }
  }

  private updateTerrainEntity(entity: any, deltaTime: number): void {
    // Update terrain entity properties over time
    if (entity.properties.generated) {
      // Update resource regeneration
      this.updateResourceRegeneration(entity, deltaTime);
      
      // Update visual properties based on time of day, weather, etc.
      this.updateVisualProperties(entity, deltaTime);
    }
  }

  private updateResourceRegeneration(entity: any, deltaTime: number): void {
    if (!entity.properties.resources) return;

    // Slowly regenerate renewable resources
    entity.properties.resources.forEach(resource => {
      if (resource.renewable && resource.abundance < resource.maxAbundance) {
        const regenRate = resource.regenerationRate || 0.001; // per second
        resource.abundance = Math.min(
          resource.maxAbundance,
          resource.abundance + (regenRate * deltaTime / 1000)
        );
      }
    });
  }

  private updateVisualProperties(entity: any, deltaTime: number): void {
    // Update terrain visual properties for rendering
    // This could include seasonal changes, weathering, etc.
    const timeOfDay = (Date.now() % (24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000);
    entity.properties.lightLevel = Math.sin(timeOfDay * Math.PI * 2) * 0.5 + 0.5;
  }

  private cleanupDistantChunks(gameState: GameState): void {
    // Find player positions to determine what chunks to keep
    const playerPositions: Vector3[] = [];
    for (const entity of gameState.entities.values()) {
      if (entity.type === 'player') {
        playerPositions.push(entity.position);
      }
    }

    // Remove chunks that are too far from all players
    const viewDistance = 5; // chunks
    const chunksToRemove: string[] = [];

    this.activeChunks.forEach((chunk, chunkId) => {
      const isTooFar = playerPositions.every(playerPos => {
        const distance = Math.sqrt(
          Math.pow(chunk.position.x - playerPos.x, 2) + 
          Math.pow(chunk.position.z - playerPos.z, 2)
        );
        return distance > viewDistance * chunk.size;
      });

      if (isTooFar) {
        chunksToRemove.push(chunkId);
      }
    });

    // Remove distant chunks
    chunksToRemove.forEach(chunkId => {
      this.activeChunks.delete(chunkId);
      // Also remove corresponding terrain entity
      const terrainEntity = Array.from(gameState.entities.values())
        .find(e => e.type === 'terrain' && e.properties.chunkId === chunkId);
      if (terrainEntity) {
        gameState.entities.delete(terrainEntity.id);
      }
    });
  }

  getActiveChunks(): TerrainChunk[] {
    return Array.from(this.activeChunks.values());
  }

  getChunkAt(position: Vector3): TerrainChunk | null {
    const chunkId = `chunk_${Math.floor(position.x / 32)}_${Math.floor(position.z / 32)}`;
    return this.activeChunks.get(chunkId) || null;
  }
}

interface TerrainLoadRequest {
  position: Vector3;
  priority: number;
  chunkId: string;
}
```

## 3. Frontend Integration Specifications

### 3.1 Enhanced Entity Renderer for Terrain

```typescript
// packages/client/src/components/shared/TerrainRenderer.tsx
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TerrainEntity {
  id: string;
  position: { x: number; y: number; z: number };
  type: 'terrain';
  properties: {
    chunkId: string;
    heightmap: number[][];
    biomes: string[][];
    resources: any[];
    size: number;
    generated: boolean;
    lightLevel?: number;
  };
}

export function TerrainRenderer({ entity }: { entity: TerrainEntity }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Generate terrain geometry from heightmap
  const geometry = useMemo(() => {
    if (!entity.properties.generated || !entity.properties.heightmap) {
      return new THREE.PlaneGeometry(entity.properties.size, entity.properties.size);
    }

    const size = entity.properties.size;
    const heightmap = entity.properties.heightmap;
    const geometry = new THREE.PlaneGeometry(size, size, heightmap.length - 1, heightmap[0].length - 1);
    
    // Apply heightmap to vertices
    const vertices = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < heightmap.length; i++) {
      for (let j = 0; j < heightmap[i].length; j++) {
        const index = (i * heightmap[i].length + j) * 3;
        vertices[index + 2] = heightmap[i][j]; // Z coordinate (height)
      }
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    return geometry;
  }, [entity.properties.heightmap, entity.properties.generated, entity.properties.size]);

  // Generate terrain material with biome textures
  const material = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: 0x7cb342, // Default grass green
      wireframe: false,
      vertexColors: false
    });

    // Apply biome-based coloring if available
    if (entity.properties.biomes) {
      // This would be enhanced with actual texture mapping
      const biomes = entity.properties.biomes;
      // For now, use simple color mapping
      material.color.setHex(getBiomeColor(biomes[0][0]));
    }

    return material;
  }, [entity.properties.biomes]);

  // Update material properties based on time of day
  useFrame(() => {
    if (materialRef.current && entity.properties.lightLevel !== undefined) {
      materialRef.current.emissive.setScalar(entity.properties.lightLevel * 0.1);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[entity.position.x, entity.position.y, entity.position.z]}
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]} // Rotate to lay flat
    >
      {/* Add resource indicators */}
      {entity.properties.resources?.map((resource, index) => (
        <ResourceIndicator
          key={`${entity.id}-resource-${index}`}
          resource={resource}
          position={[resource.position.x, resource.position.y + 0.5, resource.position.z]}
        />
      ))}
    </mesh>
  );
}

function ResourceIndicator({ resource, position }: { resource: any; position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.2, 8, 8]} />
      <meshStandardMaterial color={getResourceColor(resource.type)} />
    </mesh>
  );
}

function getBiomeColor(biome: string): number {
  const biomeColors: { [key: string]: number } = {
    grass: 0x7cb342,
    forest: 0x2e7d32,
    mountain: 0x5d4037,
    desert: 0xf9a825,
    water: 0x1976d2,
    snow: 0xf5f5f5
  };
  return biomeColors[biome] || 0x7cb342;
}

function getResourceColor(resourceType: string): number {
  const resourceColors: { [key: string]: number } = {
    iron: 0x757575,
    gold: 0xffc107,
    coal: 0x424242,
    gems: 0x9c27b0,
    oil: 0x1a1a1a
  };
  return resourceColors[resourceType] || 0x9e9e9e;
}
```

### 3.2 Enhanced Game State Management

```typescript
// packages/client/src/stores/terrainStore.ts
import { create } from 'zustand';

interface TerrainState {
  activeChunks: Map<string, any>;
  loadingChunks: Set<string>;
  generationSettings: any;
  
  // Actions
  addChunk: (chunk: any) => void;
  removeChunk: (chunkId: string) => void;
  setLoading: (chunkId: string, loading: boolean) => void;
  updateGenerationSettings: (settings: any) => void;
  requestChunkGeneration: (position: { x: number; z: number }) => void;
}

export const useTerrainStore = create<TerrainState>((set, get) => ({
  activeChunks: new Map(),
  loadingChunks: new Set(),
  generationSettings: {
    seed: 12345,
    chunkSize: 32,
    viewDistance: 3
  },

  addChunk: (chunk) => set((state) => {
    const newChunks = new Map(state.activeChunks);
    newChunks.set(chunk.chunkId, chunk);
    return { activeChunks: newChunks };
  }),

  removeChunk: (chunkId) => set((state) => {
    const newChunks = new Map(state.activeChunks);
    newChunks.delete(chunkId);
    return { activeChunks: newChunks };
  }),

  setLoading: (chunkId, loading) => set((state) => {
    const newLoading = new Set(state.loadingChunks);
    if (loading) {
      newLoading.add(chunkId);
    } else {
      newLoading.delete(chunkId);
    }
    return { loadingChunks: newLoading };
  }),

  updateGenerationSettings: (settings) => set((state) => ({
    generationSettings: { ...state.generationSettings, ...settings }
  })),

  requestChunkGeneration: async (position) => {
    const chunkId = `chunk_${position.x}_${position.z}`;
    const { setLoading } = get();
    
    setLoading(chunkId, true);
    
    try {
      // Send generation request via WebSocket or API
      // This would integrate with the existing socket system
      console.log(`Requesting generation for chunk at ${position.x}, ${position.z}`);
    } catch (error) {
      console.error('Failed to request chunk generation:', error);
    } finally {
      setLoading(chunkId, false);
    }
  }
}));
```

## 4. Server Integration Specifications

### 4.1 Generation API Routes

```typescript
// packages/server/src/routes/generation.ts
import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { GenerationEngine } from '@gameboilerplate/shared/generation';

const router = express.Router();

// Initialize generation engine (this would be done at startup)
const generationEngine = new GenerationEngine({
  seed: parseInt(process.env.WORLD_SEED || '12345'),
  chunkSize: 32,
  viewDistance: 5,
  terrainSettings: {
    baseHeight: 50,
    heightVariation: 30,
    noiseScale: 0.01,
    octaves: 4,
    persistence: 0.5,
    lacunarity: 2.0
  },
  resourceSettings: {
    deposits: [], // Load from configuration
    distributionMethods: ['cluster', 'vein'],
    rarityFactors: {}
  }
});

// Generate terrain chunk
router.post('/terrain/generate', authMiddleware, async (req, res) => {
  try {
    const { position, size = 32, priority = 1 } = req.body;
    
    if (!position || typeof position.x !== 'number' || typeof position.z !== 'number') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid position data' 
      });
    }

    const chunkId = `chunk_${position.x}_${position.z}`;
    const chunk = await generationEngine.generateChunk(chunkId, position);
    
    // Store chunk data in database for persistence
    // await ChunkModel.findOneAndUpdate(
    //   { chunkId },
    //   { ...chunk },
    //   { upsert: true }
    // );

    res.json({
      success: true,
      data: {
        chunkId,
        chunk,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Terrain generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate terrain chunk',
      error: error.message
    });
  }
});

// Get existing chunk data
router.get('/terrain/chunk/:chunkId', authMiddleware, async (req, res) => {
  try {
    const { chunkId } = req.params;
    
    // Try to get from cache/database first
    // const existingChunk = await ChunkModel.findOne({ chunkId });
    // if (existingChunk) {
    //   return res.json({ success: true, data: existingChunk });
    // }

    res.status(404).json({
      success: false,
      message: 'Chunk not found'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chunk',
      error: error.message
    });
  }
});

// Calculate resources for a chunk
router.post('/resources/calculate', authMiddleware, async (req, res) => {
  try {
    const { chunkId, heightmap, biomes, resourceTypes } = req.body;
    
    if (!heightmap || !biomes) {
      return res.status(400).json({
        success: false,
        message: 'Heightmap and biome data required'
      });
    }

    const resources = await generationEngine.resourceCalculator.calculateForTerrain(
      heightmap, 
      biomes
    );

    // Filter by resource types if specified
    const filteredResources = resourceTypes 
      ? resources.filter(r => resourceTypes.includes(r.type))
      : resources;

    res.json({
      success: true,
      data: {
        chunkId,
        resources: filteredResources,
        totalValue: filteredResources.reduce((sum, r) => sum + (r.abundance * r.quality), 0)
      }
    });

  } catch (error) {
    console.error('Resource calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate resources',
      error: error.message
    });
  }
});

// Preload area around position
router.post('/terrain/preload', authMiddleware, async (req, res) => {
  try {
    const { centerPosition, radius = 2 } = req.body;
    
    if (!centerPosition || radius < 1 || radius > 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid preload parameters'
      });
    }

    const chunks = await generationEngine.preloadArea(centerPosition, radius);
    
    res.json({
      success: true,
      data: {
        centerPosition,
        radius,
        chunksGenerated: chunks.length,
        chunks: chunks.map(c => ({
          chunkId: c.chunkId,
          position: c.position,
          resourceCount: c.resources.length
        }))
      }
    });

  } catch (error) {
    console.error('Preload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preload area',
      error: error.message
    });
  }
});

export default router;
```

### 4.2 WebSocket Integration for Real-time Generation

```typescript
// packages/server/src/services/TerrainSocketService.ts
import { Socket } from 'socket.io';
import { GenerationEngine } from '@gameboilerplate/shared/generation';

export class TerrainSocketService {
  private generationEngine: GenerationEngine;
  private activeGenerations: Map<string, boolean> = new Map();

  constructor(generationEngine: GenerationEngine) {
    this.generationEngine = generationEngine;
  }

  handleConnection(socket: Socket): void {
    // Handle terrain generation requests
    socket.on('terrain:request', async (data) => {
      await this.handleTerrainRequest(socket, data);
    });

    // Handle resource calculation requests
    socket.on('resources:request', async (data) => {
      await this.handleResourceRequest(socket, data);
    });

    // Handle preload requests
    socket.on('terrain:preload', async (data) => {
      await this.handlePreloadRequest(socket, data);
    });

    // Handle client disconnect
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  private async handleTerrainRequest(socket: Socket, data: any): Promise<void> {
    try {
      const { position, size = 32, requestId } = data;
      const chunkId = `chunk_${position.x}_${position.z}`;

      // Check if generation is already in progress
      if (this.activeGenerations.has(chunkId)) {
        socket.emit('terrain:error', {
          requestId,
          message: 'Generation already in progress for this chunk'
        });
        return;
      }

      this.activeGenerations.set(chunkId, true);

      // Emit generation started event
      socket.emit('terrain:generation-started', {
        requestId,
        chunkId,
        position
      });

      // Generate terrain chunk
      const chunk = await this.generationEngine.generateChunk(chunkId, position);

      // Emit completed event with data
      socket.emit('terrain:generated', {
        requestId,
        chunkId,
        chunk: {
          chunkId: chunk.chunkId,
          position: chunk.position,
          heightmap: chunk.heightmap,
          biomes: chunk.biomes,
          resources: chunk.resources,
          size: chunk.size
        },
        timestamp: Date.now()
      });

    } catch (error) {
      socket.emit('terrain:error', {
        requestId: data.requestId,
        message: error.message
      });
    } finally {
      const chunkId = `chunk_${data.position.x}_${data.position.z}`;
      this.activeGenerations.delete(chunkId);
    }
  }

  private async handleResourceRequest(socket: Socket, data: any): Promise<void> {
    try {
      const { chunkId, heightmap, biomes, resourceTypes, requestId } = data;

      const resources = await this.generationEngine.resourceCalculator.calculateForTerrain(
        heightmap,
        biomes
      );

      const filteredResources = resourceTypes
        ? resources.filter(r => resourceTypes.includes(r.type))
        : resources;

      socket.emit('resources:calculated', {
        requestId,
        chunkId,
        resources: filteredResources,
        totalValue: filteredResources.reduce((sum, r) => sum + (r.abundance * r.quality), 0)
      });

    } catch (error) {
      socket.emit('resources:error', {
        requestId: data.requestId,
        message: error.message
      });
    }
  }

  private async handlePreloadRequest(socket: Socket, data: any): Promise<void> {
    try {
      const { centerPosition, radius, requestId } = data;

      socket.emit('terrain:preload-started', {
        requestId,
        centerPosition,
        radius
      });

      const chunks = await this.generationEngine.preloadArea(centerPosition, radius);

      // Send chunks in batches to avoid overwhelming the client
      const batchSize = 5;
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        
        socket.emit('terrain:preload-batch', {
          requestId,
          batch: batch.map(chunk => ({
            chunkId: chunk.chunkId,
            position: chunk.position,
            heightmap: chunk.heightmap,
            biomes: chunk.biomes,
            resources: chunk.resources
          })),
          batchIndex: Math.floor(i / batchSize),
          totalBatches: Math.ceil(chunks.length / batchSize)
        });

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      socket.emit('terrain:preload-completed', {
        requestId,
        chunksGenerated: chunks.length
      });

    } catch (error) {
      socket.emit('terrain:preload-error', {
        requestId: data.requestId,
        message: error.message
      });
    }
  }

  private handleDisconnect(socket: Socket): void {
    // Clean up any resources or ongoing generations for this socket
    console.log(`Terrain socket disconnected: ${socket.id}`);
  }

  // Method to broadcast terrain updates to all connected clients
  broadcastTerrainUpdate(chunkId: string, updateData: any): void {
    // This would be called from the game engine when terrain changes
    // io.emit('terrain:updated', { chunkId, updateData });
  }
}
```

This integration architecture provides a comprehensive foundation for incorporating MaoeW's terrain generation and resource calculation logic into the GameBoilerplate ecosystem while maintaining the existing architecture's strengths and extensibility.