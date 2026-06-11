export const salesStore = {
  _sales: [],

  set(sales) {
    this._sales = sales;
  },

  get() {
    return this._sales;
  }
};
