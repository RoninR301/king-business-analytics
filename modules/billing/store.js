export const billingStore = {
  _invoices: [],

  set(invoices) {
    this._invoices = invoices;
  },

  get() {
    return this._invoices;
  },

  getById(id) {
    return this._invoices.find((i) => i.id === id);
  }
};
