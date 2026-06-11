import { renderFormField } from '../../components/form.js';
import { renderTable } from '../../components/table.js';
import { escapeHtml } from '../../utils/helpers.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { icons } from '../../components/icons.js';

export function renderCustomerList(customers) {
  return renderTable({
    columns: [
      { label: 'Name', key: 'name' },
      { label: 'Mobile', key: 'mobile' },
      { label: 'Purchases', key: 'totalPurchases' },
      { label: 'Total Spent', render: (r) => formatCurrency(r.totalSpent) },
      { label: 'Last Purchase', render: (r) => formatDate(r.lastPurchaseAt) },
      { label: 'Actions', render: (r) => `<button class="btn btn--sm btn--outline view-customer" data-id="${r.id}">Details</button>` }
    ],
    rows: customers,
    emptyMessage: 'No customers yet'
  });
}

export function renderCustomerForm() {
  return `
    <form id="customer-form" class="form-grid form-grid--2">
      ${renderFormField({ name: 'name', label: 'Customer Name', type: 'text', required: true })}
      ${renderFormField({ name: 'mobile', label: 'Mobile', type: 'tel', required: true })}
      ${renderFormField({ name: 'address', label: 'Address', type: 'textarea' })}
    </form>
  `;
}

export function renderCustomerDetail(customer, history = []) {
  const historyRows = history.map((s) => `
    <tr>
      <td>${formatDate(s.createdAt)}</td>
      <td>${formatCurrency(s.grandTotal)}</td>
      <td>${s.items?.length || 0} item(s)</td>
    </tr>
  `).join('');

  return `
    <div>
      <h3>${escapeHtml(customer.name)}</h3>
      <p>Mobile: ${escapeHtml(customer.mobile)}</p>
      ${customer.address ? `<p>Address: ${escapeHtml(customer.address)}</p>` : ''}
      <p>Total Purchases: ${customer.totalPurchases || 0}</p>
      <p>Total Spent: ${formatCurrency(customer.totalSpent)}</p>
      <h4 style="margin-top: var(--space-4)">Purchase History</h4>
      ${history.length ? `
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>Date</th><th>Amount</th><th>Items</th></tr></thead>
            <tbody>${historyRows}</tbody>
          </table>
        </div>
      ` : `<p style="color: var(--color-text-muted)">No purchase history</p>`}
    </div>
  `;
}

export function renderSearchBar() {
  return `
    <div class="search-bar" style="margin-bottom: var(--space-4)">
      ${icons.search}
      <input class="form-input" type="search" id="customer-search" placeholder="Search by name or mobile..." />
    </div>
  `;
}
