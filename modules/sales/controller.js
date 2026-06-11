import { salesService } from './services.js';
import { salesStore } from './store.js';
import { renderSalesForm, renderSalesList } from './ui.js';
import { getFormData } from '../../components/form.js';
import { showToast } from '../../components/toast.js';
import { appState } from '../../core/state-manager.js';
import { billingController } from '../billing/controller.js';
import { customersService } from '../customers/services.js';
import { analyticsService } from '../analytics/services.js';
import { isValidMobile } from '../../utils/validators.js';
import { CATEGORY_FORM_FIELDS } from '../../database/collections.js';

export const salesController = {
  async init(container) {
    const shop = appState.get('shop');
    if (!shop) {
      container.innerHTML = '<div class="empty-state"><p>Shop not found. Contact administrator.</p></div>';
      return;
    }

    const category = shop.category === 'Other' ? (shop.customCategory || 'Other') : shop.category;

    container.innerHTML = `
      <div class="page-title"><h1>New Sale</h1><p>Category: ${shop.category}${shop.customCategory ? ` (${shop.customCategory})` : ''}</p></div>
      <div class="card">${renderSalesForm(shop.category)}</div>
      <div style="margin-top: var(--space-8)">
        <h2 style="margin-bottom: var(--space-4)">Recent Sales</h2>
        <div id="sales-list"></div>
      </div>
    `;

    this.bindCustomFields(container, shop.category);
    await this.loadSales(shop.id);

    document.getElementById('sale-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.submitSale(shop, category);
    });
  },

  bindCustomFields(container, category) {
    if (category !== 'Other') return;

    let fieldCount = 0;
    document.getElementById('add-custom-field')?.addEventListener('click', () => {
      fieldCount++;
      const list = document.getElementById('custom-fields-list');
      const div = document.createElement('div');
      div.className = 'form-group';
      div.innerHTML = `
        <input class="form-input" name="customLabel_${fieldCount}" placeholder="Field Label" />
        <input class="form-input" name="customValue_${fieldCount}" placeholder="Field Value" style="margin-top: var(--space-2)" />
      `;
      list.appendChild(div);
    });
  },

  async loadSales(shopId) {
    const sales = await salesService.getByShop(shopId);
    salesStore.set(sales);
    document.getElementById('sales-list').innerHTML = renderSalesList(sales);
  },

  async submitSale(shop, categoryKey) {
    const form = document.getElementById('sale-form');
    const data = getFormData(form);
    const user = appState.get('user');

    if (data.customerMobile && !isValidMobile(data.customerMobile)) {
      return showToast('Invalid customer mobile', 'error');
    }

    const fieldDefs = CATEGORY_FORM_FIELDS[shop.category] || [];
    const item = {};
    fieldDefs.forEach((f) => { item[f.name] = data[f.name]; });

    if (shop.category === 'Other') {
      Object.keys(data).forEach((key) => {
        if (key.startsWith('customLabel_')) {
          const idx = key.split('_')[1];
          const label = data[key];
          const value = data[`customValue_${idx}`];
          if (label) item[label] = value;
        }
      });
      if (!Object.keys(item).length) return showToast('Add at least one custom field', 'error');
    }

    item.quantity = Number(item.quantity) || 1;
    item.price = Number(item.price) || 0;

    if (!item.price && shop.category !== 'Other') {
      return showToast('Price is required', 'error');
    }

    try {
      let customerId = null;
      if (data.customerName && data.customerMobile) {
        const customer = await customersService.findOrCreate(shop.id, shop.ownerId, {
          name: data.customerName,
          mobile: data.customerMobile
        });
        customerId = customer.id;
      }

      const sale = await salesService.create(shop.id, shop.ownerId, {
        customerId,
        customerName: data.customerName || (shop.category === 'Restaurant' ? `Table ${data.tableNumber}` : 'Walk-in'),
        customerMobile: data.customerMobile || '',
        tableNumber: data.tableNumber,
        category: categoryKey,
        items: [item],
        taxRate: data.taxRate
      }, user.uid);

      await billingController.createInvoiceFromSale(sale, shop, user);
      await analyticsService.recordSale(shop.id, shop.ownerId, sale);
      if (customerId) await customersService.recordPurchase(customerId, sale.grandTotal);

      showToast('Sale created and invoice generated', 'success');
      form.reset();
      await this.loadSales(shop.id);
    } catch (err) {
      showToast(err.message || 'Failed to create sale', 'error');
    }
  }
};
