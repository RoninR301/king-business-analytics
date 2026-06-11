import { renderTable } from '../../components/table.js';
import { escapeHtml } from '../../utils/helpers.js';
import { formatCurrency, formatDateTime } from '../../utils/formatters.js';
import { getItemDisplayName } from '../sales/ui.js';

export function renderInvoiceList(invoices) {
  return renderTable({
    columns: [
      { label: 'Invoice #', key: 'invoiceNumber' },
      { label: 'Date', render: (r) => formatDateTime(r.createdAt) },
      { label: 'Customer', render: (r) => escapeHtml(r.customer?.name || '—') },
      { label: 'Total', render: (r) => formatCurrency(r.grandTotal) },
      { label: 'Actions', render: (r) => `
        <button class="btn btn--sm btn--outline download-invoice" data-id="${r.id}">PDF</button>
        <button class="btn btn--sm btn--ghost print-invoice" data-id="${r.id}">Print</button>
      ` }
    ],
    rows: invoices,
    emptyMessage: 'No invoices generated yet'
  });
}

export function renderInvoicePreview(invoice) {
  const items = (invoice.items || []).map((item) => `
    <tr>
      <td>${escapeHtml(getItemDisplayName(item))}</td>
      <td>${item.quantity || 1}</td>
      <td>${formatCurrency(item.price)}</td>
      <td>${formatCurrency((item.quantity || 1) * (item.price || 0))}</td>
    </tr>
  `).join('');

  return `
    <div class="card" id="invoice-preview" style="max-width: 800px; margin: 0 auto">
      <div style="display:flex; justify-content:space-between; margin-bottom: var(--space-6)">
        <div>
          ${invoice.shop?.logoUrl ? `<img src="${invoice.shop.logoUrl}" alt="Logo" style="max-height: 50px; margin-bottom: var(--space-2)" />` : ''}
          <h2>${escapeHtml(invoice.shop?.name || '')}</h2>
          <p style="font-size: 0.875rem; color: var(--color-text-muted)">${escapeHtml(invoice.shop?.address || '')}</p>
          <p style="font-size: 0.875rem">${escapeHtml(invoice.shop?.mobile || '')}</p>
          ${invoice.shop?.gstNumber ? `<p style="font-size: 0.875rem">GST: ${escapeHtml(invoice.shop.gstNumber)}</p>` : ''}
        </div>
        <div style="text-align: right">
          <h3>INVOICE</h3>
          <p><strong>#${escapeHtml(invoice.invoiceNumber)}</strong></p>
          <p style="font-size: 0.875rem">${formatDateTime(invoice.createdAt)}</p>
        </div>
      </div>
      <div style="margin-bottom: var(--space-4)">
        <strong>Bill To:</strong>
        <p>${escapeHtml(invoice.customer?.name || 'Walk-in')}</p>
        ${invoice.customer?.mobile ? `<p>${escapeHtml(invoice.customer.mobile)}</p>` : ''}
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
          <tbody>${items}</tbody>
        </table>
      </div>
      <div style="text-align: right; margin-top: var(--space-4)">
        <p>Subtotal: ${formatCurrency(invoice.subtotal)}</p>
        ${invoice.taxAmount ? `<p>Tax (${invoice.taxRate}%): ${formatCurrency(invoice.taxAmount)}</p>` : ''}
        <p style="font-size: 1.25rem; font-weight: 700">Grand Total: ${formatCurrency(invoice.grandTotal)}</p>
      </div>
      ${invoice.manager ? `<p style="margin-top: var(--space-4); font-size: 0.875rem">Manager: ${escapeHtml(invoice.manager.name)}</p>` : ''}
    </div>
  `;
}
