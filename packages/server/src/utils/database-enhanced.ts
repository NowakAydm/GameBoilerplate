import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gameboilerplate';
const MOCK_MODE = process.env.MOCK_MODE === 'true';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected = false;
  private mockMode = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('Already connected to database');
      return;
    }

    // Check if we should run in mock mode
    if (MOCK_MODE) {
      console.log('🚀 Running in MOCK MODE - No MongoDB required');
      this.mockMode = true;
      this.isConnected = true;
      return;
    }

    try {
      await mongoose.connect(MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      this.isConnected = true;
      console.log('✅ Connected to MongoDB successfully');

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
        this.isConnected = true;
      });

    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      
      // Fallback to mock mode if MongoDB connection fails
      console.log('🔄 Falling back to MOCK MODE for development');
      this.mockMode = true;
      this.isConnected = true;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    if (this.mockMode) {
      console.log('🚀 Disconnecting from MOCK MODE');
      this.isConnected = false;
      this.mockMode = false;
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('✅ Disconnected from MongoDB');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
    }
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public isMockMode(): boolean {
    return this.mockMode;
  }

  public getConnectionInfo(): { connected: boolean; mockMode: boolean; uri?: string } {
    return {
      connected: this.isConnected,
      mockMode: this.mockMode,
      uri: this.mockMode ? 'MOCK_DATABASE' : MONGODB_URI,
    };
  }
}
