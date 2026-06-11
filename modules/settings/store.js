import { appState } from '../../core/state-manager.js';

export const settingsStore = {
  get() {
    return appState.get('settings');
  },

  set(settings) {
    appState.set({ settings });
  }
};
