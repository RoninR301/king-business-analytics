import { renderFormField } from '../../components/form.js';

export function renderSettingsForm(settings) {
  return `
    <form id="settings-form">
      <div class="card" style="margin-bottom: var(--space-4)">
        <div class="card__header"><h3 class="card__title">Invoice Settings</h3></div>
        <div class="form-grid form-grid--2">
          ${renderFormField({ name: 'defaultTaxRate', label: 'Default Tax Rate (%)', type: 'number', min: 0, max: 100, step: 0.01 }, settings.defaultTaxRate)}
          ${renderFormField({ name: 'invoicePrefix', label: 'Invoice Prefix', type: 'text' }, settings.invoicePrefix)}
          <div class="form-group">
            <label class="form-label">
              <input type="checkbox" name="showManagerOnInvoice" ${settings.showManagerOnInvoice ? 'checked' : ''} />
              Show manager name on invoice
            </label>
          </div>
        </div>
      </div>
      <div class="card" style="margin-bottom: var(--space-4)">
        <div class="card__header"><h3 class="card__title">Appearance</h3></div>
        <div class="form-grid form-grid--2">
          ${renderFormField({
            name: 'theme',
            label: 'Theme',
            type: 'select',
            options: [{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]
          }, settings.theme)}
          ${renderFormField({ name: 'currency', label: 'Currency', type: 'text' }, settings.currency)}
        </div>
      </div>
      <button type="submit" class="btn btn--primary">Save Settings</button>
    </form>
  `;
}
