export const analyticsStore = {
  _stats: null,
  _dateRange: { preset: '30days' },

  setStats(stats) {
    this._stats = stats;
  },

  getStats() {
    return this._stats;
  },

  setDateRange(range) {
    this._dateRange = range;
  },

  getDateRange() {
    return this._dateRange;
  }
};
