import {
  doc, getDoc, setDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from '../../firebase/init.js';
import { COLLECTIONS } from '../../database/collections.js';
import { eventBus, EVENTS } from '../../core/event-bus.js';

const DEFAULT_SETTINGS = {
  showManagerOnInvoice: true,
  defaultTaxRate: 0,
  theme: 'light',
  currency: 'INR',
  invoicePrefix: 'INV',
  notificationsEnabled: false
};

class SettingsService {
  async get(ownerId) {
    const ref = doc(db, COLLECTIONS.SETTINGS, ownerId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { ...DEFAULT_SETTINGS, ownerId };
    return { ...DEFAULT_SETTINGS, ...snap.data() };
  }

  async save(ownerId, settings) {
    const ref = doc(db, COLLECTIONS.SETTINGS, ownerId);
    await setDoc(ref, {
      ownerId,
      ...settings,
      updatedAt: serverTimestamp()
    }, { merge: true });

    eventBus.emit(EVENTS.SETTINGS_UPDATED, settings);
    return this.get(ownerId);
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('kba-theme', theme);
  }

  loadTheme() {
    const saved = localStorage.getItem('kba-theme') || 'light';
    this.applyTheme(saved);
    return saved;
  }
}

export const settingsService = new SettingsService();
