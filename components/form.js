import { escapeHtml } from '../utils/helpers.js';

export function renderFormField(field, value = '', error = '') {
  const id = `field-${field.name}`;
  const errorHtml = error ? `<span class="form-error">${escapeHtml(error)}</span>` : '';
  const required = field.required ? 'required' : '';
  const errorClass = error ? 'form-input--error' : '';

  if (field.type === 'select') {
    const options = (field.options || []).map((opt) => {
      const val = typeof opt === 'string' ? opt : opt.value;
      const label = typeof opt === 'string' ? opt : opt.label;
      const selected = val === value ? 'selected' : '';
      return `<option value="${escapeHtml(val)}" ${selected}>${escapeHtml(label)}</option>`;
    }).join('');

    return `
      <div class="form-group">
        <label class="form-label" for="${id}">${escapeHtml(field.label)}${field.required ? ' *' : ''}</label>
        <select class="form-select ${errorClass}" id="${id}" name="${field.name}" ${required}>${options}</select>
        ${errorHtml}
      </div>
    `;
  }

  if (field.type === 'textarea') {
    return `
      <div class="form-group">
        <label class="form-label" for="${id}">${escapeHtml(field.label)}${field.required ? ' *' : ''}</label>
        <textarea class="form-textarea ${errorClass}" id="${id}" name="${field.name}" rows="${field.rows || 3}" ${required}>${escapeHtml(value)}</textarea>
        ${errorHtml}
      </div>
    `;
  }

  const attrs = [
    field.min !== undefined ? `min="${field.min}"` : '',
    field.max !== undefined ? `max="${field.max}"` : '',
    field.step !== undefined ? `step="${field.step}"` : '',
    field.placeholder ? `placeholder="${escapeHtml(field.placeholder)}"` : ''
  ].filter(Boolean).join(' ');

  return `
    <div class="form-group">
      <label class="form-label" for="${id}">${escapeHtml(field.label)}${field.required ? ' *' : ''}</label>
      <input class="form-input ${errorClass}" type="${field.type || 'text'}" id="${id}" name="${field.name}" value="${escapeHtml(value)}" ${required} ${attrs} />
      ${field.hint ? `<span class="form-hint">${escapeHtml(field.hint)}</span>` : ''}
      ${errorHtml}
    </div>
  `;
}

export function getFormData(form) {
  const data = {};
  const formData = new FormData(form);
  formData.forEach((value, key) => {
    data[key] = value;
  });
  return data;
}
