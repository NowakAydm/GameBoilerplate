import { 
  GamePlugin, 
  IGameEngine, 
  System, 
  GameState, 
  ActionDefinition,
  ActionContext,
  ActionResult
} from '../types';
import { z } from 'zod';

// Example Custom Plugin: Farming System
export class FarmingPlugin implements GamePlugin {
  name = 'FarmingPlugin';
  version = '1.0.0';
  dependencies = ['InventorySystem']; // Requires inventory system

  async install(engine: IGameEngine): Promise<void> {
    console.log('🌱 Installing Farming Plugin...');

    // Add farming system
    const farmingSystem = new FarmingSystem();
    engine.addSystem(farmingSystem);

    // Register farming actions
    this.registerFarmingActions(engine);

    console.log('🌾 Farming Plugin installed successfully!');
  }

  async uninstall(engine: IGameEngine): Promise<void> {
    engine.removeSystem('FarmingSystem');
    // Note: Engine doesn't have removeAction method - actions are part of ActionSystem
    console.log('🌱 Farming Plugin uninstalled');
  }

  private registerFarmingActions(engine: IGameEngine): void {
    const actionSystem = engine.getSystem('ActionSystem') as any;
    if (!actionSystem) return;

    // Plant Seed Action
    actionSystem.registerAction({
      type: 'plantSeed',
      schema: z.object({
        seedType: z.enum(['wheat', 'corn', 'tomato', 'carrot']),
        position: z.object({
          x: z.number(),
          y: z.number(),
          z: z.number()
        })
      }),
      cooldown: 1000, // 1 second between plantings
      handler: this.handlePlantSeed.bind(this)
    });

    // Harvest Crop Action
    actionSystem.registerAction({
      type: 'harvestCrop',
      schema: z.object({
        cropId: z.string()
      }),
      cooldown: 500, // 0.5 second between harvests
      handler: this.handleHarvestCrop.bind(this)
    });

    // Water Plant Action
    actionSystem.registerAction({
      type: 'waterPlant',
      schema: z.object({
        plantId: z.string()
      }),
      cooldown: 2000, // 2 seconds between watering
      handler: this.handleWaterPlant.bind(this)
    });
  }

  private async handlePlantSeed(data: any, context: ActionContext): Promise<ActionResult> {
    const player = context.engine.getEntity(context.userId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    // Check if player has seeds
    const inventory = player.properties.inventory || [];
    const seedItem = inventory.find((item: any) => item.type === data.seedType + '_seed');
    
    if (!seedItem) {
      return { 
        success: false, 
        message: `No ${data.seedType} seeds in inventory` 
      };
    }

    // Check if position is valid for farming
    const farmingSystem = context.engine.getSystem<FarmingSystem>('FarmingSystem');
    if (!farmingSystem?.isValidFarmingSpot(data.position)) {
      return { 
        success: false, 
        message: 'Cannot plant here - invalid farming spot' 
      };
    }

    // Remove seed from inventory
    seedItem.quantity = (seedItem.quantity || 1) - 1;
    if (seedItem.quantity <= 0) {
      const index = inventory.indexOf(seedItem);
      inventory.splice(index, 1);
    }

    // Create crop entity
    const crop = context.engine.createEntity('crop', data.position);
    crop.properties = {
      seedType: data.seedType,
      plantedBy: context.userId,
      plantedAt: Date.now(),
      growthStage: 0, // 0-4 growth stages
      waterLevel: 50, // 0-100 water level
      isHarvestable: false,
      cropYield: Math.floor(Math.random() * 3) + 1 // 1-3 crops
    };
    
    context.engine.addEntity(crop);

    return {
      success: true,
      data: { cropId: crop.id, seedType: data.seedType },
      events: [{
        type: 'crop:planted',
        data: { 
          userId: context.userId, 
          cropId: crop.id, 
          seedType: data.seedType,
          position: data.position 
        },
        timestamp: Date.now()
      }]
    };
  }

  private async handleHarvestCrop(data: any, context: ActionContext): Promise<ActionResult> {
    const crop = context.engine.getEntity(data.cropId);
    if (!crop || crop.type !== 'crop') {
      return { success: false, message: 'Crop not found' };
    }

    if (!crop.properties.isHarvestable) {
      return { 
        success: false, 
        message: 'Crop is not ready for harvest' 
      };
    }

    // Check if player is close enough
    const player = context.engine.getEntity(context.userId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    const distance = this.calculateDistance(player.position, crop.position);
    if (distance > 3) {
      return { 
        success: false, 
        message: 'Too far from crop to harvest' 
      };
    }

    // Add harvested items to inventory
    const inventory = player.properties.inventory || [];
    const harvestedItem = {
      id: `${crop.properties.seedType}_${Date.now()}`,
      type: crop.properties.seedType,
      quantity: crop.properties.cropYield,
      harvestedAt: Date.now()
    };

    inventory.push(harvestedItem);

    // Remove crop from world
    context.engine.removeEntity(data.cropId);

    return {
      success: true,
      data: { 
        harvested: harvestedItem,
        experience: crop.properties.cropYield * 10 
      },
      events: [{
        type: 'crop:harvested',
        data: { 
          userId: context.userId, 
          cropId: data.cropId,
          yield: harvestedItem,
          position: crop.position 
        },
        timestamp: Date.now()
      }]
    };
  }

  private async handleWaterPlant(data: any, context: ActionContext): Promise<ActionResult> {
    const plant = context.engine.getEntity(data.plantId);
    if (!plant || plant.type !== 'crop') {
      return { success: false, message: 'Plant not found' };
    }

    // Check if player is close enough
    const player = context.engine.getEntity(context.userId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    const distance = this.calculateDistance(player.position, plant.position);
    if (distance > 3) {
      return { 
        success: false, 
        message: 'Too far from plant to water' 
      };
    }

    // Increase water level
    plant.properties.waterLevel = Math.min(100, plant.properties.waterLevel + 30);

    return {
      success: true,
      data: { 
        plantId: data.plantId,
        newWaterLevel: plant.properties.waterLevel 
      },
      events: [{
        type: 'plant:watered',
        data: { 
          userId: context.userId, 
          plantId: data.plantId,
          waterLevel: plant.properties.waterLevel 
        },
        timestamp: Date.now()
      }]
    };
  }

  private calculateDistance(pos1: any, pos2: any): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}

// Farming System
class FarmingSystem implements System {
  name = 'FarmingSystem';
  priority = 30;
  enabled = true;

  private farmingSpots: Set<string> = new Set();
  private growthInterval = 30000; // 30 seconds per growth stage

  async init(engine: IGameEngine): Promise<void> {
    // Define farming spots (for demo purposes)
    this.farmingSpots.add('0,0,0');
    this.farmingSpots.add('2,0,0');
    this.farmingSpots.add('4,0,0');
    this.farmingSpots.add('0,0,2');
    this.farmingSpots.add('2,0,2');
    this.farmingSpots.add('4,0,2');
    
    console.log('🌱 Farming system initialized with', this.farmingSpots.size, 'farming spots');
  }

  async update(deltaTime: number, gameState: GameState): Promise<void> {
    const currentTime = Date.now();

    // Update all crops
    for (const entity of gameState.entities.values()) {
      if (entity.type === 'crop') {
        this.updateCrop(entity, currentTime, deltaTime);
      }
    }
  }

  private updateCrop(crop: any, currentTime: number, deltaTime: number): void {
    const timeSincePlanted = currentTime - crop.properties.plantedAt;
    const expectedGrowthStage = Math.min(4, Math.floor(timeSincePlanted / this.growthInterval));

    // Update growth stage
    if (expectedGrowthStage > crop.properties.growthStage) {
      crop.properties.growthStage = expectedGrowthStage;
      
      // Crop is harvestable at stage 4
      if (crop.properties.growthStage >= 4) {
        crop.properties.isHarvestable = true;
      }
    }

    // Decrease water level over time
    const waterDecreaseRate = 5; // 5 units per second
    crop.properties.waterLevel = Math.max(0, 
      crop.properties.waterLevel - (waterDecreaseRate * deltaTime)
    );

    // Plants grow slower when water is low
    if (crop.properties.waterLevel < 20) {
      crop.properties.growthModifier = 0.5; // 50% slower growth
    } else {
      crop.properties.growthModifier = 1.0; // Normal growth
    }

    // Visual indicator for crop stage
    switch (crop.properties.growthStage) {
      case 0: crop.properties.color = '#8B4513'; break; // Brown (seedling)
      case 1: crop.properties.color = '#9ACD32'; break; // Yellow-green (sprout)
      case 2: crop.properties.color = '#32CD32'; break; // Lime-green (growing)
      case 3: crop.properties.color = '#228B22'; break; // Forest-green (mature)
      case 4: crop.properties.color = '#FFD700'; break; // Gold (harvestable)
    }

    // Scale based on growth stage
    const scale = 0.2 + (crop.properties.growthStage * 0.2); // 0.2 to 1.0
    crop.scale = { x: scale, y: scale, z: scale };
  }

  isValidFarmingSpot(position: any): boolean {
    const key = `${Math.round(position.x)},${Math.round(position.y)},${Math.round(position.z)}`;
    return this.farmingSpots.has(key);
  }

  addFarmingSpot(position: any): void {
    const key = `${Math.round(position.x)},${Math.round(position.y)},${Math.round(position.z)}`;
    this.farmingSpots.add(key);
  }

  removeFarmingSpot(position: any): void {
    const key = `${Math.round(position.x)},${Math.round(position.y)},${Math.round(position.z)}`;
    this.farmingSpots.delete(key);
  }

  getFarmingSpots(): string[] {
    return Array.from(this.farmingSpots);
  }
}

// Export for use in other files
export { FarmingSystem };
