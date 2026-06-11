export const managerStore = {
  _managers: [],

  set(managers) {
    this._managers = managers;
  },

  getByShop(shopId) {
    return this._managers.filter((m) => m.shopId === shopId);
  }
};
