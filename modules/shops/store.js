import { appState } from '../../core/state-manager.js';

export const shopStore = {
  getShops() {
    return appState.get('shops') || [];
  },

  setShops(shops) {
    appState.set({ shops });
  },

  getActiveShop() {
    return appState.get('shop');
  },

  setActiveShop(shop) {
    appState.set({ shop });
  }
};
