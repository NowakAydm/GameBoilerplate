import { create } from 'zustand';
import { User } from '@gameboilerplate/shared';

interface AdminStats {
  totalUsers: number;
  activeConnections: number;
  guestUsers: number;
  registeredUsers: number;
  serverUptime: number;
  timestamp: string;
}

interface GameState {
  userId: string;
  position: { x: number; y: number; z: number };
  lastAction: string;
  lastSeen: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  type: 'socket' | 'game' | 'auth' | 'system';
  message: string;
  userId?: string;
  data?: any;
}

interface AdminState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Dashboard data
  stats: AdminStats | null;
  gameStates: GameState[];
  logs: LogEntry[];
  
  // Filters and pagination
  logFilter: string;
  logType: string;
  currentPage: number;
  logsPerPage: number;
}

interface AdminActions {
  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => boolean;
  
  // Data fetching actions
  fetchStats: () => Promise<void>;
  fetchGameStates: () => Promise<void>;
  fetchLogs: () => Promise<void>;
  
  // Admin actions
  cleanupGameStates: () => Promise<void>;
  kickUser: (userId: string) => Promise<void>;
  
  // UI actions
  setLogFilter: (filter: string) => void;
  setLogType: (type: string) => void;
  setCurrentPage: (page: number) => void;
  clearError: () => void;
}

const API_BASE_URL = 'http://localhost:3001';

export const useAdminStore = create<AdminState & AdminActions>((set, get) => ({
  // Initial state
  user: null,
  token: localStorage.getItem('admin_token'),
  isAuthenticated: false,
  isLoading: false,
  error: null,
  
  stats: null,
  gameStates: [],
  logs: [],
  
  logFilter: '',
  logType: 'all',
  currentPage: 1,
  logsPerPage: 50,

  // Auth actions
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Check if user is admin
      if (data.user.role !== 'admin') {
        throw new Error('Access denied. Admin privileges required.');
      }

      localStorage.setItem('admin_token', data.token);
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      stats: null,
      gameStates: [],
      logs: [],
    });
  },

  checkAuth: () => {
    const token = get().token;
    const user = get().user;
    return !!(token && user && user.role === 'admin');
  },

  // Data fetching actions
  fetchStats: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      set({ stats: data.stats });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch stats' });
    }
  },

  fetchGameStates: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/game-states`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch game states');
      }

      const data = await response.json();
      set({ gameStates: data.gameStates || [] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch game states' });
    }
  },

  fetchLogs: async () => {
    const { token, logType, currentPage, logsPerPage } = get();
    if (!token) return;

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: logsPerPage.toString(),
        ...(logType !== 'all' && { type: logType }),
      });

      const response = await fetch(`${API_BASE_URL}/admin/logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const data = await response.json();
      set({ logs: data.logs || [] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch logs' });
    }
  },

  // Admin actions
  cleanupGameStates: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/cleanup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to cleanup game states');
      }

      // Refresh game states after cleanup
      get().fetchGameStates();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to cleanup game states' });
    }
  },

  kickUser: async (userId: string) => {
    const { token } = get();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/kick/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to kick user');
      }

      // Refresh data after kicking user
      get().fetchGameStates();
      get().fetchStats();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to kick user' });
    }
  },

  // UI actions
  setLogFilter: (filter: string) => set({ logFilter: filter }),
  setLogType: (type: string) => set({ logType: type, currentPage: 1 }),
  setCurrentPage: (page: number) => set({ currentPage: page }),
  clearError: () => set({ error: null }),
}));
