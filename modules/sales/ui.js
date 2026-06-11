import { renderFormField } from '../../components/form.js';
import { renderTable } from '../../components/table.js';
import { escapeHtml } from '../../utils/helpers.js';
import { formatCurrency, formatDateTime } from '../../utils/formatters.js';
import { CATEGORY_FORM_FIELDS, DEFAULT_CUSTOMER_FIELDS } from '../../database/collections.js';
import { icons } from '../../components/icons.js';

export function renderSalesForm(category, customFields = []) {
  const isRestaurant = category === 'Restaurant';
  const customerFields = isRestaurant
    ? [
        { name: 'customerName', label: 'Customer Name', type: 'text', required: false },
        { name: 'tableNumber', label: 'Table Number', type: 'text', required: true },
        { name: 'customerAddress', label: 'Address', type: 'text', required: false }
      ]
    : DEFAULT_CUSTOMER_FIELDS;

  const baseProductFields = CATEGORY_FORM_FIELDS[category] || customFields;
  // Capture cost so profit can be computed (selling price - purchase price).
  // Inject a "Purchase Price" field next to the existing selling price and
  // clarify the selling-price label, without editing every category schema.
  const productFields = baseProductFields.flatMap((f) =>
    f.name === 'price'
      ? [
          { name: 'purchasePrice', label: 'Purchase Price (Cost)', type: 'number', required: false, min: 0, step: 0.01 },
          { ...f, label: 'Selling Price' }
        ]
      : [f]
  );

  const customerHtml = customerFields.map((f) => renderFormField(f)).join('');
  const productHtml = productFields.map((f) => renderFormField(f)).join('');

  return `
    <form id="sale-form">
      <h3 style="margin-bottom: var(--space-4)">Customer Details</h3>
      <div class="form-grid form-grid--2">${customerHtml}</div>
      <h3 style="margin: var(--space-6) 0 var(--space-4)">Product / Service Details</h3>
      <div class="form-grid form-grid--2" id="product-fields">${productHtml}</div>
      ${category === 'Other' ? `
        <div id="custom-fields-container" style="margin-top: var(--space-4)">
          <button type="button" class="btn btn--outline btn--sm" id="add-custom-field">${icons.plus} Add Custom Field</button>
          <div id="custom-fields-list" class="form-grid form-grid--2" style="margin-top: var(--space-3)"></div>
        </div>
      ` : ''}
      <div class="form-grid form-grid--2" style="margin-top: var(--space-4)">
        ${renderFormField({ name: 'taxRate', label: 'Tax Rate (%)', type: 'number', min: 0, max: 100, step: 0.01 }, '0')}
      </div>
      <div style="margin-top: var(--space-6)">
        <button type="submit" class="btn btn--primary btn--lg">Create Sale & Generate Invoice</button>
      </div>
    </form>
  `;
}

export function renderSalesList(sales) {
  return renderTable({
    columns: [
      { label: 'Date', render: (r) => formatDateTime(r.createdAt) },
      { label: 'Customer', render: (r) => escapeHtml(r.customer?.name || '—') },
      { label: 'Items', render: (r) => String(r.items?.length || 0) },
      { label: 'Total', render: (r) => formatCurrency(r.grandTotal) },
      { label: 'Actions', render: (r) => `<button class="btn btn--sm btn--outline view-sale" data-id="${r.id}">View</button>` }
    ],
    rows: sales,
    emptyMessage: 'No sales recorded yet'
  });
}

export function getItemDisplayName(item) {
  return item.productName || item.medicineName || item.itemName ||
    item.serviceName || item.bookTitle || item.name || 'Item';
}
