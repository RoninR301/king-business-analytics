import { renderFormField } from '../../components/form.js';
import { renderTable } from '../../components/table.js';
import { escapeHtml } from '../../utils/helpers.js';
import { formatDate } from '../../utils/formatters.js';
import { icons } from '../../components/icons.js';
import { SHOP_CATEGORIES } from '../../database/collections.js';

export function renderShopList(shops) {
  if (!shops.length) {
    return `<div class="empty-state">${icons.empty}<p>No shops yet. Create your first shop to get started.</p></div>`;
  }

  return renderTable({
    columns: [
      { label: 'Shop ID', key: 'shopCode' },
      { label: 'Name', key: 'name' },
      { label: 'Category', render: (r) => escapeHtml(r.category === 'Other' ? r.customCategory : r.category) },
      { label: 'Mobile', key: 'mobile' },
      { label: 'Status', render: (r) => `<span class="badge badge--${r.active ? 'success' : 'danger'}">${r.active ? 'Active' : 'Inactive'}</span>` },
      { label: 'Created', render: (r) => formatDate(r.createdAt) },
      { label: 'Actions', render: (r) => `
        <button class="btn btn--sm btn--outline edit-shop" data-id="${r.id}">Edit</button>
        <button class="btn btn--sm btn--danger delete-shop" data-id="${r.id}">Delete</button>
      ` }
    ],
    rows: shops
  });
}

export function renderShopForm(shop = null) {
  const categoryOptions = SHOP_CATEGORIES.map((c) => ({ value: c, label: c }));
  const isOther = shop?.category === 'Other';

  return `
    <form id="shop-form" class="form-grid form-grid--2">
      ${renderFormField({ name: 'name', label: 'Shop Name', type: 'text', required: true }, shop?.name || '')}
      ${renderFormField({ name: 'category', label: 'Category', type: 'select', required: true, options: categoryOptions }, shop?.category || '')}
      <div id="custom-category-group" class="form-group" style="${isOther ? '' : 'display:none'}">
        ${renderFormField({ name: 'customCategory', label: 'Custom Category', type: 'text' }, shop?.customCategory || '')}
      </div>
      ${renderFormField({ name: 'address', label: 'Address', type: 'textarea', required: true }, shop?.address || '')}
      ${renderFormField({ name: 'mobile', label: 'Mobile Number', type: 'tel', required: true }, shop?.mobile || '')}
      ${renderFormField({ name: 'altMobile', label: 'Alternate Mobile', type: 'tel' }, shop?.altMobile || '')}
      ${renderFormField({ name: 'email', label: 'Email', type: 'email' }, shop?.email || '')}
      ${renderFormField({ name: 'altEmail', label: 'Alternate Email', type: 'email' }, shop?.altEmail || '')}
      ${renderFormField({ name: 'gstNumber', label: 'GST Number', type: 'text' }, shop?.gstNumber || '')}
      ${renderFormField({ name: 'upiId', label: 'UPI ID', type: 'text' }, shop?.upiId || '')}
      <div class="form-group">
        <label class="form-label">Shop Logo</label>
        <input class="form-input" type="file" name="logo" accept="image/*" />
        ${shop?.logoUrl ? `<img src="${shop.logoUrl}" alt="Logo" style="max-height: 60px; margin-top: var(--space-2); border-radius: var(--radius-sm)" />` : ''}
      </div>
      <fieldset style="grid-column: 1 / -1; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4)">
        <legend style="font-weight: 600; padding: 0 var(--space-2)">Manager Account</legend>
        ${renderFormField({ name: 'managerName', label: 'Manager Name', type: 'text', required: !shop }, '')}
        ${renderFormField({ name: 'managerUsername', label: 'Manager Email (Login)', type: 'email', required: !shop }, '')}
        ${shop ? `
          <div class="form-group" style="grid-column: 1 / -1">
            <label class="form-label">Manager Password</label>
            <p class="form-hint" style="margin: 0 0 var(--space-2)">For security, a password can't be set directly. Email the manager a secure reset link instead.</p>
            <button type="button" class="btn btn--outline btn--sm" id="reset-manager-password">Send Password Reset Email</button>
          </div>
        ` : renderFormField({ name: 'managerPassword', label: 'Manager Password', type: 'password', required: true, hint: 'Minimum 8 characters' }, '')}
      </fieldset>
    </form>
  `;
}
