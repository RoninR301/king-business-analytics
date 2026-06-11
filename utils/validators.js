export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidMobile(mobile) {
  return /^[6-9]\d{9}$/.test(String(mobile).replace(/\D/g, '').slice(-10));
}

export function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

export function isValidGST(gst) {
  if (!gst) return true;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst.toUpperCase());
}

export function validateRequired(fields, data) {
  const errors = {};
  fields.forEach(({ name, label, required }) => {
    if (required && !String(data[name] ?? '').trim()) {
      errors[name] = `${label} is required`;
    }
  });
  return errors;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
