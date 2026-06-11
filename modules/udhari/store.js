export const udhariStore = {
  _records: [],

  set(records) {
    this._records = records;
  },

  get() {
    return this._records;
  },

  getPending() {
    return this._records.filter((r) => r.status === 'pending' || r.status === 'partial');
  },

  getPaid() {
    return this._records.filter((r) => r.status === 'paid');
  }
};
