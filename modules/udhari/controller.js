import { udhariService } from './services.js';
import { udhariStore } from './store.js';
import { renderUdhariList, renderUdhariForm, renderUdhariTabs } from './ui.js';
import { createModal } from '../../components/modal.js';
import { getFormData, renderFormField } from '../../components/form.js';
import { showToast } from '../../components/toast.js';
import { appState } from '../../core/state-manager.js';
import { isValidMobile } from '../../utils/validators.js';
import { icons } from '../../components/icons.js';

export const udhariController = {
  currentTab: 'pending',

  async init(container) {
    const shop = appState.get('shop');
    if (!shop) return;

    container.innerHTML = `
      <div class="page-title" style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:var(--space-4)">
        <div><h1>Udhari (Credit)</h1><p>Track pending and paid credit accounts</p></div>
        <button class="btn btn--primary" id="add-udhari-btn">${icons.plus} Add Record</button>
      </div>
      ${renderUdhariTabs()}
      <div class="search-bar" style="margin-bottom: var(--space-4)">
        ${icons.search}
        <input class="form-input" type="search" id="udhari-search" placeholder="Search..." />
      </div>
      <div id="udhari-list"></div>
    `;

    await this.loadRecords(shop.id);
    document.getElementById('add-udhari-btn').addEventListener('click', () => this.openAddModal(shop));

    document.querySelectorAll('#udhari-tabs .tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#udhari-tabs .tab').forEach((t) => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        this.currentTab = tab.dataset.tab;
        this.renderList();
      });
    });

    document.getElementById('udhari-search').addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.renderList();
    });
  },

  async loadRecords(shopId) {
    const records = await udhariService.getByShop(shopId);
    udhariStore.set(records);
    this.renderList();
  },

  renderList() {
    let records = udhariStore.get();
    if (this.currentTab === 'pending') {
      records = udhariStore.getPending();
    } else if (this.currentTab === 'paid') {
      records = udhariStore.getPaid();
    }

    if (this.searchQuery) {
      records = records.filter(
        (r) => r.customerName.toLowerCase().includes(this.searchQuery) || r.mobile.includes(this.searchQuery)
      );
    }

    const listEl = document.getElementById('udhari-list');
    listEl.innerHTML = renderUdhariList(records);

    listEl.querySelectorAll('.pay-udhari').forEach((btn) => {
      btn.addEventListener('click', () => this.openPaymentModal(btn.dataset.id, Number(btn.dataset.remaining)));
    });
  },

  openAddModal(shop) {
    const { overlay } = createModal({
      title: 'Add Udhari Record',
      content: renderUdhariForm(),
      footer: `<button class="btn btn--outline modal-cancel">Cancel</button><button class="btn btn--primary" id="save-udhari">Save</button>`
    });

    overlay.querySelector('.modal-cancel').addEventListener('click', () => overlay.querySelector('.modal-close').click());
    overlay.querySelector('#save-udhari').addEventListener('click', async () => {
      const data = getFormData(overlay.querySelector('#udhari-form'));
      if (!isValidMobile(data.mobile)) return showToast('Invalid mobile', 'error');
      try {
        await udhariService.create(shop.id, data);
        showToast('Record created', 'success');
        overlay.querySelector('.modal-close').click();
        await this.loadRecords(shop.id);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  },

  openPaymentModal(id, remaining) {
    const { overlay } = createModal({
      title: 'Record Payment',
      content: renderFormField({ name: 'amount', label: 'Payment Amount', type: 'number', required: true, min: 0.01, max: remaining, step: 0.01 }, String(remaining)),
      footer: `<button class="btn btn--outline modal-cancel">Cancel</button><button class="btn btn--primary" id="confirm-pay">Confirm</button>`
    });

    overlay.querySelector('.modal-cancel').addEventListener('click', () => overlay.querySelector('.modal-close').click());
    overlay.querySelector('#confirm-pay').addEventListener('click', async () => {
      const amount = Number(overlay.querySelector('[name="amount"]').value);
      if (!amount || amount > remaining) return showToast('Invalid amount', 'error');
      try {
        await udhariService.recordPayment(id, amount);
        showToast('Payment recorded', 'success');
        overlay.querySelector('.modal-close').click();
        await this.loadRecords(appState.get('shop').id);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
};
