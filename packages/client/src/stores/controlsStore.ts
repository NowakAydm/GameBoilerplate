import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ControlSettings } from '@gameboilerplate/shared';
import { DEFAULT_CONTROL_SETTINGS, mergeControlSettings } from '../components/shared/gameUtils';

interface ControlsState {
  controlSettings: ControlSettings;
  isLoading: boolean;
  error: string | null;
  isServerSync: boolean; // Whether settings are synced with server
}

interface ControlsActions {
  updateControlSettings: (settings: Partial<ControlSettings>) => void;
  resetControlSettings: () => void;
  getKeyboardControls: () => ControlSettings['keyboard'];
  getTouchControls: () => ControlSettings['touch'];
  setSettings: (settings: ControlSettings, syncToServer?: boolean) => Promise<void>;
  loadSettingsFromServer: (gameData: any) => void;
  syncSettingsToServer: () => Promise<void>;
  clearError: () => void;
}

// Generate settings array for server storage
function generateSettingsArray(controlSettings: ControlSettings): Array<{ tab: string; settings: any }> {
  return [
    {
      tab: 'Controls',
      settings: {
        keyboard: controlSettings.keyboard,
        touch: controlSettings.touch,
      }
    }
  ];
}

const API_BASE_URL = 'http://localhost:3000';

export const useControlsStore = create<ControlsState & ControlsActions>()(
  persist(
    (set, get) => ({
      // State
      controlSettings: DEFAULT_CONTROL_SETTINGS,
      isLoading: false,
      error: null,
      isServerSync: false,

      // Actions
      updateControlSettings: (settings: Partial<ControlSettings>) => {
        set(state => ({
          controlSettings: mergeControlSettings({
            ...state.controlSettings,
            ...settings,
          })
        }));
      },

      resetControlSettings: () => {
        set({ 
          controlSettings: DEFAULT_CONTROL_SETTINGS,
          isServerSync: false 
        });
      },

      getKeyboardControls: () => {
        return get().controlSettings.keyboard;
      },

      getTouchControls: () => {
        return get().controlSettings.touch;
      },

      setSettings: async (settings: ControlSettings, syncToServer = true) => {
        set({ 
          controlSettings: mergeControlSettings(settings),
          isLoading: syncToServer,
          error: null 
        });

        if (syncToServer) {
          try {
            await get().syncSettingsToServer();
            set({ isServerSync: true, isLoading: false });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to sync settings',
              isLoading: false,
              isServerSync: false 
            });
          }
        }
      },

      loadSettingsFromServer: (gameData: any) => {
        // Look for controls settings in the settings array
        const controlsSettings = gameData?.settings?.find((setting: any) => setting.tab === 'Controls');
        if (controlsSettings?.settings) {
          set({ 
            controlSettings: mergeControlSettings(controlsSettings.settings),
            isServerSync: true,
            error: null 
          });
        }
      },

      syncSettingsToServer: async () => {
        const token = localStorage.getItem('auth-storage');
        const authData = token ? JSON.parse(token) : null;
        
        if (!authData?.state?.token) {
          throw new Error('No authentication token found');
        }

        const { controlSettings } = get();
        const settingsArray = generateSettingsArray(controlSettings);

        const response = await fetch(`${API_BASE_URL}/api/user/game-data`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.state.token}`,
          },
          body: JSON.stringify({
            gameData: {
              settings: settingsArray
            }
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to sync settings to server');
        }

        return response.json();
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'controls-storage',
      partialize: (state) => ({
        controlSettings: state.controlSettings,
        isServerSync: state.isServerSync,
      }),
    },
  ),
);