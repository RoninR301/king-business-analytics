import { billingService } from './services.js';
import { billingStore } from './store.js';
import { renderInvoiceList } from './ui.js';
import { downloadInvoicePDF, printInvoicePDF } from '../../utils/pdf-generator.js';
import { showToast } from '../../components/toast.js';
import { appState } from '../../core/state-manager.js';
import { settingsService } from '../settings/services.js';

export const billingController = {
  async createInvoiceFromSale(sale, shop, user) {
    const settings = await settingsService.get(shop.ownerId);
    const manager = user.role === 'manager' ? user : null;
    return billingService.create(shop.id, sale, shop, manager, settings);
  },

  async init(container) {
    const shop = appState.get('shop');
    if (!shop) return;

    container.innerHTML = `
      <div class="page-title"><h1>Invoices</h1><p>View, download and print invoices</p></div>
      <div id="invoices-list"></div>
    `;

    await this.loadInvoices(shop.id, container);
  },

  async loadInvoices(shopId, container) {
    const invoices = await billingService.getByShop(shopId);
    billingStore.set(invoices);
    const listEl = document.getElementById('invoices-list');
    listEl.innerHTML = renderInvoiceList(invoices);

    listEl.querySelectorAll('.download-invoice').forEach((btn) => {
      btn.addEventListener('click', () => this.download(btn.dataset.id));
    });
    listEl.querySelectorAll('.print-invoice').forEach((btn) => {
      btn.addEventListener('click', () => this.print(btn.dataset.id));
    });
  },

  async download(invoiceId) {
    const invoice = billingStore.getById(invoiceId);
    if (!invoice) return showToast('Invoice not found', 'error');
    try {
      await downloadInvoicePDF(invoice, `invoice-${invoice.invoiceNumber}.pdf`);
      showToast('PDF downloaded', 'success');
    } catch (err) {
      showToast(err.message || 'PDF generation failed', 'error');
    }
  },

  async print(invoiceId) {
    const invoice = billingStore.getById(invoiceId);
    if (!invoice) return showToast('Invoice not found', 'error');
    try {
      await printInvoicePDF(invoice);
    } catch (err) {
      showToast(err.message || 'Print failed', 'error');
    }
  }
};
