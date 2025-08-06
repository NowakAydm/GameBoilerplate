import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ControlSettings } from '@gameboilerplate/shared';
import { DEFAULT_CONTROL_SETTINGS, mergeControlSettings } from '../components/shared/gameUtils';

interface ControlsState {
  controlSettings: ControlSettings;
}

interface ControlsActions {
  updateControlSettings: (settings: Partial<ControlSettings>) => void;
  resetControlSettings: () => void;
  getKeyboardControls: () => ControlSettings['keyboard'];
  getTouchControls: () => ControlSettings['touch'];
}

export const useControlsStore = create<ControlsState & ControlsActions>()(
  persist(
    (set, get) => ({
      // State
      controlSettings: DEFAULT_CONTROL_SETTINGS,

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
        set({ controlSettings: DEFAULT_CONTROL_SETTINGS });
      },

      getKeyboardControls: () => {
        return get().controlSettings.keyboard;
      },

      getTouchControls: () => {
        return get().controlSettings.touch;
      },
    }),
    {
      name: 'controls-storage',
      partialize: (state) => ({
        controlSettings: state.controlSettings,
      }),
    },
  ),
);