import { UserService } from '@gameboilerplate/server/services/UserService';

// Mock the UserModel with gameData
jest.mock('@gameboilerplate/server/models/User', () => {
  const mockUserDoc = {
    _id: 'mock_id',
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    role: 'registered',
    isGuest: false,
    gameData: {
      level: 5,
      experience: 2500,
      inventory: [
        { id: 'item-1', name: 'Sword', type: 'weapon', power: 25 },
        { id: 'item-2', name: 'Shield', type: 'armor', defense: 15 }
      ],
      position: { x: 10, y: 0, z: 15 },
      lastUpdated: new Date()
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: new Date(),
    save: jest.fn().mockResolvedValue(undefined),
    toObject: jest.fn().mockReturnValue({
      _id: 'mock_id',
      username: 'testuser',
      email: 'test@example.com',
      role: 'registered',
      isGuest: false,
      gameData: {
        level: 5,
        experience: 2500,
        inventory: [
          { id: 'item-1', name: 'Sword', type: 'weapon', power: 25 },
          { id: 'item-2', name: 'Shield', type: 'armor', defense: 15 }
        ],
        position: { x: 10, y: 0, z: 15 },
        lastUpdated: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date()
    })
  };
  
  return {
    UserModel: {
      findOne: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue(mockUserDoc),
      findByIdAndUpdate: jest.fn().mockResolvedValue(mockUserDoc),
      create: jest.fn().mockResolvedValue(mockUserDoc),
      find: jest.fn().mockResolvedValue([mockUserDoc]),
      prototype: {
        save: jest.fn().mockResolvedValue(undefined)
      },
    }
  };
});

// Mock auth utils
jest.mock('@gameboilerplate/server/utils/auth', () => ({
  AuthUtils: {
    hashPassword: jest.fn().mockResolvedValue('hashed_password'),
    verifyPassword: jest.fn().mockResolvedValue(true),
  }
}));

describe('UserService Game Data', () => {
  let userService: UserService;
  const mockUserId = 'mock_id';
  
  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });
  
  describe('getUserGameData', () => {
    it('should get user game data', async () => {
      const gameData = await userService.getUserGameData(mockUserId);
      expect(gameData).toBeDefined();
      expect(gameData?.level).toBe(5);
      expect(gameData?.inventory).toHaveLength(2);
    });
  });
  
  describe('updateUserGameData', () => {
    it('should update user game data', async () => {
      const updatedUser = await userService.updateUserGameData(mockUserId, {
        level: 6,
        experience: 3000
      });
      
      const userModel = require('@gameboilerplate/server/models/User').UserModel;
      expect(userModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.gameData?.level).toBe(5); // Mock will still return the original value
    });
  });
  
  describe('updatePlayerPosition', () => {
    it('should update player position', async () => {
      const result = await userService.updatePlayerPosition(mockUserId, {
        x: 15,
        y: 0,
        z: 20
      });
      
      const userModel = require('@gameboilerplate/server/models/User').UserModel;
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          $set: expect.objectContaining({
            'gameData.position': { x: 15, y: 0, z: 20 }
          })
        }),
        { new: true }
      );
      expect(result).toBe(true);
    });
  });
  
  describe('addToInventory', () => {
    it('should add item to inventory', async () => {
      const newItem = { 
        name: 'Health Potion', 
        type: 'consumable', 
        health: 50 
      };
      
      const result = await userService.addToInventory(mockUserId, newItem);
      
      const userModel = require('@gameboilerplate/server/models/User').UserModel;
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          $push: expect.objectContaining({
            'gameData.inventory': expect.objectContaining({ name: 'Health Potion' })
          })
        }),
        { new: true }
      );
      expect(result).toBe(true);
    });
  });
  
  describe('removeFromInventory', () => {
    it('should remove item from inventory', async () => {
      const result = await userService.removeFromInventory(mockUserId, 'item-1');
      
      const userModel = require('@gameboilerplate/server/models/User').UserModel;
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          $pull: expect.objectContaining({
            'gameData.inventory': { id: 'item-1' }
          })
        }),
        { new: true }
      );
      expect(result).toBe(true);
    });
  });
  
  describe('createGuestUser', () => {
    it('should create a guest user with default game data', async () => {
      const user = await userService.createGuestUser();
      
      const userModel = require('@gameboilerplate/server/models/User').UserModel;
      expect(userModel.create).toHaveBeenCalledWith(expect.objectContaining({
        role: 'guest',
        isGuest: true,
        gameData: expect.objectContaining({
          level: 1,
          experience: 0,
          inventory: [],
          position: { x: 0, y: 0, z: 0 }
        })
      }));
      expect(user).toBeDefined();
    });
  });
});
