import { authService } from './services.js';
import { authStore } from './store.js';
import { renderLoginForm, renderRegisterForm, renderProfileForm } from './ui.js';
import { getFormData } from '../../components/form.js';
import { showToast } from '../../components/toast.js';
import { isValidEmail, isValidMobile, isValidPassword } from '../../utils/validators.js';
import { redirectByRole, navigateTo } from '../../core/router.js';

export const authController = {
  async initLogin(container, isManager = false) {
    container.innerHTML = renderLoginForm(isManager);
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('login-btn');
      btn.disabled = true;
      btn.textContent = 'Signing in...';

      try {
        const data = getFormData(form);
        const profile = isManager
          ? await authService.loginManager(data.email, data.password)
          : await authService.login(data.email, data.password);

        authStore.setUser(profile);
        showToast('Welcome back!', 'success');
        redirectByRole();
      } catch (err) {
        showToast(err.message || 'Login failed', 'error');
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
    });
  },

  async initRegister(container) {
    container.innerHTML = renderRegisterForm();
    const form = document.getElementById('register-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = getFormData(form);

      if (!isValidEmail(data.email)) return showToast('Invalid email address', 'error');
      if (!isValidMobile(data.mobile)) return showToast('Invalid mobile number', 'error');
      if (!isValidPassword(data.password)) return showToast('Password must be at least 8 characters', 'error');
      if (data.password !== data.confirmPassword) return showToast('Passwords do not match', 'error');

      const btn = document.getElementById('register-btn');
      btn.disabled = true;
      btn.textContent = 'Creating account...';

      try {
        const profile = await authService.registerOwner({
          name: data.name,
          email: data.email,
          mobile: data.mobile,
          password: data.password
        });
        authStore.setUser(profile);
        showToast('Account created successfully!', 'success');
        redirectByRole();
      } catch (err) {
        showToast(err.message || 'Registration failed', 'error');
        btn.disabled = false;
        btn.textContent = 'Create Account';
      }
    });
  },

  async initProfile(container) {
    const user = await authService.waitForSession();
    if (!user) return;
    container.innerHTML = renderProfileForm(user);

    document.getElementById('profile-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = getFormData(e.target);
      try {
        const updated = await authService.updateProfile(user.uid, {
          name: data.name,
          mobile: data.mobile
        });
        authStore.setUser(updated);
        showToast('Profile updated', 'success');
      } catch (err) {
        showToast(err.message || 'Update failed', 'error');
      }
    });
  },

  async handleLogout() {
    await authService.logout();
    authStore.clear();
    navigateTo('pages/auth/login.html');
  }
};
