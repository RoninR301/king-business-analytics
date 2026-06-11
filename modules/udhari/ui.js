import { renderFormField } from '../../components/form.js';
import { renderTable } from '../../components/table.js';
import { escapeHtml } from '../../utils/helpers.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { isOverdue } from '../../utils/date-utils.js';

export function renderUdhariForm(record = null) {
  return `
    <form id="udhari-form" class="form-grid form-grid--2">
      ${renderFormField({ name: 'customerName', label: 'Customer Name', type: 'text', required: true }, record?.customerName || '')}
      ${renderFormField({ name: 'mobile', label: 'Mobile', type: 'tel', required: true }, record?.mobile || '')}
      ${renderFormField({ name: 'amount', label: 'Total Amount', type: 'number', required: true, min: 0, step: 0.01 }, record?.amount || '')}
      ${renderFormField({ name: 'paidAmount', label: 'Paid Amount', type: 'number', min: 0, step: 0.01 }, record?.paidAmount || '0')}
      ${renderFormField({ name: 'dueDate', label: 'Due Date', type: 'date', required: true }, record?.dueDate || '')}
    </form>
  `;
}

export function renderUdhariList(records) {
  return renderTable({
    columns: [
      { label: 'Customer', key: 'customerName' },
      { label: 'Mobile', key: 'mobile' },
      { label: 'Amount', render: (r) => formatCurrency(r.amount) },
      { label: 'Paid', render: (r) => formatCurrency(r.paidAmount) },
      { label: 'Remaining', render: (r) => formatCurrency(r.remainingAmount) },
      { label: 'Due Date', render: (r) => {
        const overdue = r.status !== 'paid' && isOverdue(r.dueDate);
        return `<span class="${overdue ? 'badge badge--danger' : ''}">${formatDate(r.dueDate)}</span>`;
      }},
      { label: 'Status', render: (r) => {
        const map = { pending: 'warning', partial: 'info', paid: 'success' };
        return `<span class="badge badge--${map[r.status] || 'info'}">${escapeHtml(r.status)}</span>`;
      }},
      { label: 'Actions', render: (r) => r.status !== 'paid' ? `
        <button class="btn btn--sm btn--primary pay-udhari" data-id="${r.id}" data-remaining="${r.remainingAmount}">Pay</button>
      ` : '—' }
    ],
    rows: records,
    emptyMessage: 'No udhari records'
  });
}

export function renderUdhariTabs() {
  return `
    <div class="tabs" id="udhari-tabs">
      <button class="tab is-active" data-tab="pending">Pending</button>
      <button class="tab" data-tab="paid">Paid</button>
      <button class="tab" data-tab="all">All</button>
    </div>
  `;
}
