import { shopService } from './services.js';
import { shopStore } from './store.js';
import { renderShopList, renderShopForm } from './ui.js';
import { createModal } from '../../components/modal.js';
import { getFormData } from '../../components/form.js';
import { showToast } from '../../components/toast.js';
import { managerService } from '../managers/services.js';
import { authStore } from '../auth/store.js';
import { isValidMobile, isValidEmail, isValidGST } from '../../utils/validators.js';
import { icons } from '../../components/icons.js';

export const shopsController = {
  async init(container) {
    const user = authStore.getUser();
    if (!user) return;

    container.innerHTML = `
      <div class="page-title" style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:var(--space-4)">
        <div><h1>Shop Management</h1><p>Create and manage your business locations</p></div>
        <button class="btn btn--primary" id="add-shop-btn">${icons.plus} Add Shop</button>
      </div>
      <div id="shops-list"></div>
    `;

    await this.loadShops(container);
    document.getElementById('add-shop-btn').addEventListener('click', () => this.openShopModal());
  },

  async loadShops(container) {
    const user = authStore.getUser();
    const shops = await shopService.getByOwner(user.uid);
    shopStore.setShops(shops);
    document.getElementById('shops-list').innerHTML = renderShopList(shops);

    container.querySelectorAll('.edit-shop').forEach((btn) => {
      btn.addEventListener('click', () => this.openShopModal(btn.dataset.id));
    });
    container.querySelectorAll('.delete-shop').forEach((btn) => {
      btn.addEventListener('click', () => this.deleteShop(btn.dataset.id));
    });
  },

  async openShopModal(shopId = null) {
    const isEdit = !!shopId;
    const shop = isEdit ? shopStore.getShops().find((s) => s.id === shopId) : null;

    const { overlay } = createModal({
      title: isEdit ? 'Edit Shop' : 'Create New Shop',
      content: renderShopForm(shop),
      footer: `
        <button class="btn btn--outline modal-cancel">Cancel</button>
        <button class="btn btn--primary" id="save-shop-btn">${isEdit ? 'Update' : 'Create'} Shop</button>
      `
    });

    const categorySelect = overlay.querySelector('[name="category"]');
    const customGroup = overlay.querySelector('#custom-category-group');
    categorySelect?.addEventListener('change', () => {
      customGroup.style.display = categorySelect.value === 'Other' ? '' : 'none';
    });

    // Edit mode: prefill the existing manager and wire the password-reset flow.
    if (isEdit) {
      const managers = await managerService.getByShop(shopId);
      const manager = managers[0] || null;
      if (manager) {
        const nameInput = overlay.querySelector('[name="managerName"]');
        const emailInput = overlay.querySelector('[name="managerUsername"]');
        if (nameInput) nameInput.value = manager.name || '';
        if (emailInput) emailInput.value = manager.email || '';
      }
      overlay.querySelector('#reset-manager-password')?.addEventListener('click', async (e) => {
        if (!manager) return showToast('No manager assigned to this shop yet', 'error');
        const btn = e.currentTarget;
        btn.disabled = true;
        try {
          const result = await managerService.updateManagerPassword(manager.id);
          showToast(`Password reset email sent to ${result.email}`, 'success');
        } catch (err) {
          showToast(err.message || 'Could not send reset email', 'error');
          btn.disabled = false;
        }
      });
    }

    overlay.querySelector('.modal-cancel').addEventListener('click', () => overlay.querySelector('.modal-close').click());

    overlay.querySelector('#save-shop-btn').addEventListener('click', async () => {
      const form = overlay.querySelector('#shop-form');
      const data = getFormData(form);
      const logoFile = form.querySelector('[name="logo"]').files[0];

      if (!isValidMobile(data.mobile)) return showToast('Invalid mobile number', 'error');
      if (data.email && !isValidEmail(data.email)) return showToast('Invalid email', 'error');
      if (data.gstNumber && !isValidGST(data.gstNumber)) return showToast('Invalid GST number', 'error');
      if (data.category === 'Other' && !data.customCategory?.trim()) return showToast('Enter custom category', 'error');

      const btn = overlay.querySelector('#save-shop-btn');
      btn.disabled = true;

      try {
        const user = authStore.getUser();

        if (isEdit) {
          await shopService.update(shopId, data, logoFile || null);
          // Manager name/email can be edited inline. Passwords are changed via
          // the dedicated "Send Password Reset Email" button, never here.
          if (data.managerName || data.managerUsername) {
            await managerService.updateForShop(shopId, user.uid, {
              name: data.managerName,
              email: data.managerUsername,
              password: data.managerPassword
            });
          }
          showToast('Shop updated', 'success');
        } else {
          if (!data.managerName || !data.managerUsername || !data.managerPassword) {
            showToast('Manager account details are required', 'error');
            btn.disabled = false;
            return;
          }
          const shop = await shopService.create(user.uid, data, logoFile || null);
          await managerService.create({
            shopId: shop.id,
            ownerId: user.uid,
            name: data.managerName,
            email: data.managerUsername,
            password: data.managerPassword
          });
          showToast(`Shop created! ID: ${shop.shopCode}`, 'success');
        }

        overlay.querySelector('.modal-close').click();
        const main = document.getElementById('app-content');
        await this.loadShops(main.closest('.app-content') ? main.parentElement : document.getElementById('app-content'));
        const listContainer = document.getElementById('app-content');
        if (listContainer) await this.loadShops(listContainer);
      } catch (err) {
        showToast(err.message || 'Failed to save shop', 'error');
        btn.disabled = false;
      }
    });
  },

  async deleteShop(shopId) {
    if (!confirm('Delete this shop? It will be archived (soft delete) and can be restored later.')) return;
    try {
      await shopService.delete(shopId);
      showToast('Shop deleted', 'success');
      const container = document.getElementById('app-content');
      await this.loadShops(container);
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  }
};
