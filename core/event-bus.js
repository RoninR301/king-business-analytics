/**
 * Global Event Bus for decoupled module communication.
 * Billing updates do not directly call analytics — they emit events.
 */
class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    const set = this.listeners.get(event);
    if (set) set.delete(callback);
  }

  emit(event, payload) {
    const set = this.listeners.get(event);
    if (!set) return;
    set.forEach((cb) => {
      try {
        cb(payload);
      } catch (err) {
        console.error(`[EventBus] Error in handler for "${event}":`, err);
      }
    });
  }

  once(event, callback) {
    const unsubscribe = this.on(event, (payload) => {
      unsubscribe();
      callback(payload);
    });
    return unsubscribe;
  }
}

export const eventBus = new EventBus();

export const EVENTS = {
  AUTH_STATE_CHANGED: 'auth:state-changed',
  AUTH_LOGOUT: 'auth:logout',
  SHOP_CREATED: 'shop:created',
  SHOP_UPDATED: 'shop:updated',
  SHOP_DELETED: 'shop:deleted',
  SALE_CREATED: 'sale:created',
  CUSTOMER_CREATED: 'customer:created',
  CUSTOMER_UPDATED: 'customer:updated',
  INVOICE_CREATED: 'invoice:created',
  UDHARI_CREATED: 'udhari:created',
  UDHARI_UPDATED: 'udhari:updated',
  ANALYTICS_UPDATED: 'analytics:updated',
  SETTINGS_UPDATED: 'settings:updated',
  THEME_CHANGED: 'theme:changed',
  TOAST: 'ui:toast'
};
