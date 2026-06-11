import { customersService } from './services.js';
import { customersStore } from './store.js';
import { renderCustomerList, renderCustomerForm, renderCustomerDetail, renderSearchBar } from './ui.js';
import { createModal } from '../../components/modal.js';
import { getFormData } from '../../components/form.js';
import { showToast } from '../../components/toast.js';
import { appState } from '../../core/state-manager.js';
import { isValidMobile } from '../../utils/validators.js';
import { debounce } from '../../utils/helpers.js';
import { icons } from '../../components/icons.js';

export const customersController = {
  async init(container) {
    const shop = appState.get('shop');
    if (!shop) return;

    container.innerHTML = `
      <div class="page-title" style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:var(--space-4)">
        <div><h1>Customers</h1><p>Manage customer records and purchase history</p></div>
        <button class="btn btn--primary" id="add-customer-btn">${icons.plus} Add Customer</button>
      </div>
      ${renderSearchBar()}
      <div id="customers-list"></div>
    `;

    await this.loadCustomers(shop.id);
    document.getElementById('add-customer-btn').addEventListener('click', () => this.openAddModal(shop));
    document.getElementById('customer-search').addEventListener('input', debounce((e) => {
      const filtered = customersStore.search(e.target.value);
      document.getElementById('customers-list').innerHTML = renderCustomerList(filtered);
      this.bindViewButtons(container, shop);
    }));
  },

  async loadCustomers(shopId) {
    const customers = await customersService.getByShop(shopId);
    customersStore.set(customers);
    document.getElementById('customers-list').innerHTML = renderCustomerList(customers);
    this.bindViewButtons(document.getElementById('app-content'), appState.get('shop'));
  },

  bindViewButtons(container, shop) {
    document.querySelectorAll('.view-customer').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const customer = customersStore.get().find((c) => c.id === btn.dataset.id);
        if (!customer) return;
        const history = await customersService.getPurchaseHistory(shop.id, customer.mobile);
        createModal({
          title: 'Customer Details',
          content: renderCustomerDetail(customer, history)
        });
      });
    });
  },

  openAddModal(shop) {
    const { overlay } = createModal({
      title: 'Add Customer',
      content: renderCustomerForm(),
      footer: `
        <button class="btn btn--outline modal-cancel">Cancel</button>
        <button class="btn btn--primary" id="save-customer-btn">Save</button>
      `
    });

    overlay.querySelector('.modal-cancel').addEventListener('click', () => overlay.querySelector('.modal-close').click());

    overlay.querySelector('#save-customer-btn').addEventListener('click', async () => {
      const data = getFormData(overlay.querySelector('#customer-form'));
      if (!isValidMobile(data.mobile)) return showToast('Invalid mobile', 'error');

      try {
        await customersService.findOrCreate(shop.id, shop.ownerId, data);
        showToast('Customer saved', 'success');
        overlay.querySelector('.modal-close').click();
        await this.loadCustomers(shop.id);
      } catch (err) {
        showToast(err.message || 'Failed to save', 'error');
      }
    });
  }
};
