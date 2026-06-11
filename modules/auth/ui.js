import { renderFormField } from '../../components/form.js';
import { icons } from '../../components/icons.js';

export function renderLoginForm(isManager = false) {
  return `
    <div class="auth-card__logo" style="color: var(--color-primary)">${icons.logo}</div>
    <h1>${isManager ? 'Manager Login' : 'Admin Login'}</h1>
    <p class="subtitle">Sign in to KING BUSINESS ANALYTICS</p>
    <form id="login-form" novalidate>
      ${renderFormField({ name: 'email', label: 'Email', type: 'email', required: true })}
      ${renderFormField({ name: 'password', label: 'Password', type: 'password', required: true })}
      <button type="submit" class="btn btn--primary btn--block btn--lg" id="login-btn">Sign In</button>
    </form>
    ${!isManager ? `<p style="text-align:center; margin-top: var(--space-4); font-size: 0.875rem">Don't have an account? <a href="register.html">Sign Up</a></p>` : ''}
    ${!isManager ? `<p style="text-align:center; margin-top: var(--space-2); font-size: 0.875rem"><a href="login.html?role=manager">Manager Login</a></p>` : `<p style="text-align:center; margin-top: var(--space-4); font-size: 0.875rem"><a href="login.html">Admin Login</a></p>`}
  `;
}

export function renderRegisterForm() {
  return `
    <div class="auth-card__logo" style="color: var(--color-primary)">${icons.logo}</div>
    <h1>Create Account</h1>
    <p class="subtitle">Register as business owner</p>
    <form id="register-form" novalidate>
      ${renderFormField({ name: 'name', label: 'Full Name', type: 'text', required: true })}
      ${renderFormField({ name: 'mobile', label: 'Mobile Number', type: 'tel', required: true, placeholder: '10-digit mobile' })}
      ${renderFormField({ name: 'email', label: 'Email', type: 'email', required: true })}
      ${renderFormField({ name: 'password', label: 'Password', type: 'password', required: true, hint: 'Minimum 8 characters' })}
      ${renderFormField({ name: 'confirmPassword', label: 'Confirm Password', type: 'password', required: true })}
      <button type="submit" class="btn btn--primary btn--block btn--lg" id="register-btn">Create Account</button>
    </form>
    <p style="text-align:center; margin-top: var(--space-4); font-size: 0.875rem">Already have an account? <a href="login.html">Sign In</a></p>
  `;
}

export function renderProfileForm(user) {
  return `
    <form id="profile-form" class="form-grid form-grid--2">
      ${renderFormField({ name: 'name', label: 'Full Name', type: 'text', required: true }, user?.name || '')}
      ${renderFormField({ name: 'mobile', label: 'Mobile', type: 'tel', required: true }, user?.mobile || '')}
      ${renderFormField({ name: 'email', label: 'Email', type: 'email', required: true }, user?.email || '')}
      <div class="form-group" style="grid-column: 1 / -1">
        <button type="submit" class="btn btn--primary">Save Profile</button>
      </div>
    </form>
  `;
}
