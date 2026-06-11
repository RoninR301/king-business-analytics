import { appState } from '../../core/state-manager.js';

export const authStore = {
  getUser() {
    return appState.get('user');
  },

  setUser(user) {
    appState.set({ user });
  },

  clear() {
    appState.set({ user: null, shop: null, shops: [] });
  }
};
