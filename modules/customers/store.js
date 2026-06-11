export const customersStore = {
  _customers: [],

  set(customers) {
    this._customers = customers;
  },

  get() {
    return this._customers;
  },

  search(query) {
    const q = query.toLowerCase();
    return this._customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.mobile.includes(q)
    );
  }
};
