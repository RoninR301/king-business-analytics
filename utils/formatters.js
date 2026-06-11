export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(Number(amount) || 0);
}

export function formatNumber(num) {
  return new Intl.NumberFormat('en-IN').format(Number(num) || 0);
}

export function formatDate(date, options = {}) {
  const d = date?.toDate ? date.toDate() : new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options
  });
}

export function formatDateTime(date) {
  const d = date?.toDate ? date.toDate() : new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function toISODate(date = new Date()) {
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toISOString().split('T')[0];
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
