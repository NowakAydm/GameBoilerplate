// Enhanced metrics tracking for admin dashboard
export interface UserSession {
  userId: string;
  socketId: string;
  username?: string;
  email?: string;
  role: string;
  isGuest: boolean;
  connectedAt: Date;
  lastActivity: Date;
  totalGameActions: number;
  gameStateRequests: number;
  userAgent?: string;
}

export interface GameMetrics {
  totalUsers: number;
  registeredUsers: number;
  guestUsers: number;
  activeConnections: number;
  totalGameSessions: number;
  totalGameActions: number;
  totalGameStateRequests: number;
  averageSessionLength: number; // in minutes
  totalPlaytime: number; // in minutes
  serverUptime: number;
  guestGameActions: number; // New metric
  registeredGameActions: number; // New metric
  guestSessions: number; // New metric
  registeredSessions: number; // New metric
  guestPlaytime: number; // New metric
  registeredPlaytime: number; // New metric
}

export interface UserPlaytime {
  userId: string;
  username?: string;
  email?: string;
  totalPlaytime: number; // in minutes
  sessionCount: number;
  lastSession?: Date;
  averageSessionLength: number;
}

export interface ChartDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

// Global metrics storage (in production, use Redis or database)
class MetricsTracker {
  private static instance: MetricsTracker;
  private userSessions = new Map<string, UserSession>();
  private gameActionHistory: ChartDataPoint[] = [];
  private gameStateRequestHistory: ChartDataPoint[] = [];
  private connectionHistory: ChartDataPoint[] = [];
  private userPlaytimes = new Map<string, UserPlaytime>();
  
  private constructor() {
    // Start metrics collection intervals
    this.startMetricsCollection();
  }

  public static getInstance(): MetricsTracker {
    if (!MetricsTracker.instance) {
      MetricsTracker.instance = new MetricsTracker();
    }
    return MetricsTracker.instance;
  }

  private startMetricsCollection() {
    // Collect metrics every minute
    setInterval(() => {
      this.recordConnectionMetrics();
    }, 60000);

    // Collect game state requests every 30 seconds
    setInterval(() => {
      this.recordGameStateMetrics();
    }, 30000);
  }

  private recordConnectionMetrics() {
    const now = new Date();
    this.connectionHistory.push({
      timestamp: now,
      value: this.userSessions.size,
    });

    // Keep only last 24 hours of data
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    this.connectionHistory = this.connectionHistory.filter(
      point => point.timestamp > oneDayAgo
    );
  }

  private recordGameStateMetrics() {
    const now = new Date();
    const totalRequests = Array.from(this.userSessions.values())
      .reduce((sum, session) => sum + session.gameStateRequests, 0);

    this.gameStateRequestHistory.push({
      timestamp: now,
      value: totalRequests,
    });

    // Keep only last 24 hours of data
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    this.gameStateRequestHistory = this.gameStateRequestHistory.filter(
      point => point.timestamp > oneDayAgo
    );
  }

  public trackUserConnection(
    userId: string,
    socketId: string,
    username?: string,
    email?: string,
    role: string = 'guest',
    isGuest: boolean = true,
    userAgent?: string
  ) {
    const now = new Date();
    const session: UserSession = {
      userId,
      socketId,
      username,
      email,
      role,
      isGuest,
      connectedAt: now,
      lastActivity: now,
      totalGameActions: 0,
      gameStateRequests: 0,
      userAgent,
    };

    this.userSessions.set(userId, session);

    // Initialize or update user playtime tracking
    if (!this.userPlaytimes.has(userId)) {
      this.userPlaytimes.set(userId, {
        userId,
        username,
        email,
        totalPlaytime: 0,
        sessionCount: 0,
        averageSessionLength: 0,
      });
    }

    const playtime = this.userPlaytimes.get(userId)!;
    playtime.sessionCount++;
    playtime.lastSession = now;
    
    console.log(`📊 User connected: ${username || userId} (${role})`);
  }

  public trackUserDisconnection(userId: string) {
    const session = this.userSessions.get(userId);
    if (session) {
      const sessionLength = Date.now() - session.connectedAt.getTime();
      const sessionMinutes = Math.floor(sessionLength / (1000 * 60));

      // Update user playtime
      const playtime = this.userPlaytimes.get(userId);
      if (playtime) {
        playtime.totalPlaytime += sessionMinutes;
        playtime.averageSessionLength = playtime.totalPlaytime / playtime.sessionCount;
      }

      this.userSessions.delete(userId);
      console.log(`📊 User disconnected: ${session.username || userId} (session: ${sessionMinutes}m)`);
    }
  }

  public trackGameAction(userId: string, actionType: string) {
    const session = this.userSessions.get(userId);
    if (session) {
      session.totalGameActions++;
      session.lastActivity = new Date();

      // Record in history
      this.gameActionHistory.push({
        timestamp: new Date(),
        value: 1,
        label: actionType,
      });

      // Keep only last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      this.gameActionHistory = this.gameActionHistory.filter(
        point => point.timestamp > oneDayAgo
      );
    }
  }

  public trackGameStateRequest(userId: string) {
    const session = this.userSessions.get(userId);
    if (session) {
      session.gameStateRequests++;
      session.lastActivity = new Date();
    }
  }

  public getUserSessions(): UserSession[] {
    return Array.from(this.userSessions.values());
  }

  public getGameMetrics(): GameMetrics {
    const sessions = Array.from(this.userSessions.values());
    const playtimes = Array.from(this.userPlaytimes.values());
    
    const totalGameActions = sessions.reduce((sum, s) => sum + s.totalGameActions, 0);
    const totalGameStateRequests = sessions.reduce((sum, s) => sum + s.gameStateRequests, 0);
    
    // Separate metrics for guests vs registered users
    const guestSessions = sessions.filter(s => s.isGuest);
    const registeredSessions = sessions.filter(s => !s.isGuest);
    const guestPlaytimes = playtimes.filter(p => this.isGuestPlaytime(p.userId));
    const registeredPlaytimes = playtimes.filter(p => !this.isGuestPlaytime(p.userId));
    
    const guestGameActions = guestSessions.reduce((sum, s) => sum + s.totalGameActions, 0);
    const registeredGameActions = registeredSessions.reduce((sum, s) => sum + s.totalGameActions, 0);
    
    const guestSessionCount = guestPlaytimes.reduce((sum, p) => sum + p.sessionCount, 0);
    const registeredSessionCount = registeredPlaytimes.reduce((sum, p) => sum + p.sessionCount, 0);
    
    const guestPlaytime = guestPlaytimes.reduce((sum, p) => sum + p.totalPlaytime, 0);
    const registeredPlaytime = registeredPlaytimes.reduce((sum, p) => sum + p.totalPlaytime, 0);
    
    // Calculate average session length from all playtime data
    const totalPlaytime = guestPlaytime + registeredPlaytime;
    const totalSessions = guestSessionCount + registeredSessionCount;
    const averageSessionLength = totalSessions > 0 ? totalPlaytime / totalSessions : 0;

    return {
      totalUsers: this.userPlaytimes.size,
      registeredUsers: registeredPlaytimes.length,
      guestUsers: guestPlaytimes.length,
      activeConnections: sessions.length,
      totalGameSessions: totalSessions,
      totalGameActions,
      totalGameStateRequests,
      averageSessionLength,
      totalPlaytime,
      serverUptime: process.uptime(),
      guestGameActions,
      registeredGameActions,
      guestSessions: guestSessionCount,
      registeredSessions: registeredSessionCount,
      guestPlaytime,
      registeredPlaytime,
    };
  }

  private isGuestPlaytime(userId: string): boolean {
    // Check if this user ID indicates a guest (starts with 'guest_' or is in current guest sessions)
    const session = this.userSessions.get(userId);
    if (session) {
      return session.isGuest;
    }
    // Fallback: check if userId looks like a guest ID
    return userId.startsWith('guest_');
  }

  public getUserPlaytimes(): UserPlaytime[] {
    return Array.from(this.userPlaytimes.values())
      .sort((a, b) => b.totalPlaytime - a.totalPlaytime);
  }

  public getConnectionHistory(): ChartDataPoint[] {
    return [...this.connectionHistory];
  }

  public getGameActionHistory(): ChartDataPoint[] {
    return [...this.gameActionHistory];
  }

  public getGameStateRequestHistory(): ChartDataPoint[] {
    return [...this.gameStateRequestHistory];
  }

  public getActionTypeDistribution(): { [key: string]: number } {
    const distribution: { [key: string]: number } = {};
    
    this.gameActionHistory.forEach(point => {
      if (point.label) {
        distribution[point.label] = (distribution[point.label] || 0) + 1;
      }
    });

    return distribution;
  }

  public getCurrentSessionLengths(): { userId: string; username?: string; sessionLength: number }[] {
    const now = Date.now();
    return Array.from(this.userSessions.values()).map(session => ({
      userId: session.userId,
      username: session.username,
      sessionLength: Math.floor((now - session.connectedAt.getTime()) / (1000 * 60)), // minutes
    }));
  }

  // Mock some historical data for demonstration
  public initializeMockData() {
    const now = new Date();
    
    // Add some mock historical connection data
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      const value = Math.floor(Math.random() * 10) + 1;
      this.connectionHistory.push({ timestamp, value });
    }

    // Add some mock game action data
    for (let i = 0; i < 100; i++) {
      const timestamp = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
      const actions = ['move', 'attack', 'use_item', 'chat', 'trade'];
      const label = actions[Math.floor(Math.random() * actions.length)];
      this.gameActionHistory.push({ timestamp, value: 1, label });
    }

    // Add some mock user playtime data
    const mockUsers = [
      { id: 'user1', username: 'player1', email: 'player1@example.com', playtime: 180, sessions: 5 },
      { id: 'user2', username: 'player2', email: 'player2@example.com', playtime: 120, sessions: 3 },
      { id: 'user3', username: 'player3', email: 'player3@example.com', playtime: 90, sessions: 2 },
    ];

    mockUsers.forEach(user => {
      this.userPlaytimes.set(user.id, {
        userId: user.id,
        username: user.username,
        email: user.email,
        totalPlaytime: user.playtime,
        sessionCount: user.sessions,
        lastSession: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        averageSessionLength: user.playtime / user.sessions,
      });
    });
  }
}

export const metricsTracker = MetricsTracker.getInstance();
