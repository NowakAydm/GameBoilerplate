import { UserService } from '@gameboilerplate/server/services/UserService';

// Mock the UserModel
jest.mock('@gameboilerplate/server/models/User', () => {
  const mockUserDoc = {
    _id: 'mock_id',
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    role: 'registered',
    isGuest: false,
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
      prototype: {
        save: jest.fn().mockResolvedValue(undefined)
      },
    }
  };
});

// Mock auth utils
jest.mock('@gameboilerplate/server/utils/auth', () => {
  return {
    AuthUtils: {
      hashPassword: jest.fn().mockResolvedValue('hashed_password'),
      verifyPassword: jest.fn().mockResolvedValue(true),
    }
  };
});

describe('UserService', () => {
  let userService: UserService;
  let UserModel: any;

  beforeEach(() => {
    // Clear all mock implementations
    jest.clearAllMocks();
    
    // Get the mocked UserModel
    UserModel = require('@gameboilerplate/server/models/User').UserModel;
    
    // Reset mock implementations
    UserModel.findOne.mockResolvedValue(null);
    UserModel.findById.mockResolvedValue(null);
    UserModel.findByIdAndUpdate.mockResolvedValue(null);
    
    userService = new UserService();
  });

  it('registers a new user', async () => {
    const username = 'testuser_' + Date.now();
    const email = `test_${Date.now()}@example.com`;
    const password = 'password123';
    
    // Setup mock implementation for this test
    UserModel.findOne.mockResolvedValue(null);
    
    // Mock for UserModel.create
    const mockCreatedUser = {
      _id: 'created_user_id',
      username,
      email,
      passwordHash: 'hashed_password',
      role: 'registered',
      isGuest: false,
      lastLogin: new Date(),
      toObject: jest.fn().mockReturnValue({
        _id: 'created_user_id',
        username,
        email,
        role: 'registered',
        isGuest: false,
        createdAt: new Date()
      })
    };
    
    UserModel.create.mockResolvedValue(mockCreatedUser);
    
    const user = await userService.registerUser(username, email, password);
    expect(user).toHaveProperty('_id');
    expect(user.username).toBe(username);
    expect(user.email).toBe(email);
    expect(user.role).toBe('registered');
    expect(user.isGuest).toBe(false);
    expect(UserModel.create).toHaveBeenCalledWith(expect.objectContaining({
      username,
      email,
      passwordHash: expect.any(String),
      role: 'registered',
      isGuest: false
    }));
  });

  it('authenticates a registered user', async () => {
    const email = `auth_${Date.now()}@example.com`;
    const password = 'securepass';
    
    // Setup mock for findOne to return a user
    const mockUser = {
      _id: 'user_id',
      email,
      passwordHash: 'hashedPassword',
      isGuest: false,
      lastLogin: new Date(),
      save: jest.fn().mockResolvedValue(undefined),
      toObject: jest.fn().mockReturnValue({
        _id: 'user_id',
        email,
        role: 'registered',
        isGuest: false
      })
    };
    
    UserModel.findOne.mockResolvedValue(mockUser);
    
    const user = await userService.authenticateUser(email, password);
    expect(user).not.toBeNull();
    expect(user!.email).toBe(email);
    expect(mockUser.save).toHaveBeenCalled();
  });

  it('prevents duplicate registration', async () => {
    const username = 'dupuser_' + Date.now();
    const email = `dup_${Date.now()}@example.com`;
    
    // Setup mock to simulate existing user
    UserModel.findOne.mockResolvedValue({ 
      email, 
      username,
      isGuest: false 
    });
    
    await expect(userService.registerUser(username, email, 'password')).rejects.toThrow();
  });

  it('gets user by id', async () => {
    const userId = 'test_user_id';
    const email = `id_${Date.now()}@example.com`;
    
    // Setup mock for findById
    const mockUser = {
      _id: userId,
      email,
      toObject: jest.fn().mockReturnValue({
        _id: userId,
        email,
        role: 'registered'
      })
    };
    
    UserModel.findById.mockResolvedValue(mockUser);
    
    const found = await userService.getUserById(userId);
    expect(found).not.toBeNull();
    expect(found!.email).toBe(email);
  });

  it('updates user profile', async () => {
    const userId = 'test_user_id';
    const newUsername = 'updated_username';
    const updates = { username: newUsername };
    
    // Setup mock for findByIdAndUpdate
    const mockUpdatedUser = {
      _id: userId,
      username: newUsername,
      toObject: jest.fn().mockReturnValue({
        _id: userId,
        username: newUsername
      })
    };
    
    UserModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);
    
    const updated = await userService.updateUserProfile(userId, updates);
    expect(updated).not.toBeNull();
    expect(updated!.username).toBe(newUsername);
  });

  it('upgrades guest to registered user', async () => {
    const userId = 'guest_user_id';
    const username = 'upgraded_user';
    const email = `upgraded_${Date.now()}@example.com`;
    
    // Setup mock for findById to return a guest user
    const mockGuestUser = {
      _id: userId,
      isGuest: true,
      username: null,
      email: null,
      passwordHash: null,
      role: 'guest',
      lastLogin: null,
      save: jest.fn().mockResolvedValue(undefined),
      toObject: jest.fn().mockReturnValue({
        _id: userId,
        username,
        email,
        role: 'registered',
        isGuest: false
      })
    };
    
    UserModel.findById.mockResolvedValue(mockGuestUser);
    
    const upgraded = await userService.upgradeGuestToRegistered(userId, username, email, 'password');
    expect(upgraded).not.toBeNull();
    expect(upgraded.username).toBe(username);
    expect(upgraded.email).toBe(email);
    expect(upgraded.role).toBe('registered');
    expect(upgraded.isGuest).toBe(false);
    expect(mockGuestUser.save).toHaveBeenCalled();
  });
});
