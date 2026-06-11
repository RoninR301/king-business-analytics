export const backupStore = {
  _lastExport: null,

  setLastExport(data) {
    this._lastExport = data;
  },

  getLastExport() {
    return this._lastExport;
  }
};
