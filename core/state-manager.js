/**
 * Lightweight client-side state manager.
 * Firebase remains the source of truth; this caches session context.
 */
class StateManager {
  constructor() {
    this.state = {
      user: null,
      shop: null,
      shops: [],
      settings: null,
      theme: 'light',
      loading: false
    };
    this.subscribers = new Set();
  }

  get(key) {
    return key ? this.state[key] : { ...this.state };
  }

  set(partial) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    this.subscribers.forEach((cb) => cb(this.state));
  }

  clear() {
    this.state = {
      user: null,
      shop: null,
      shops: [],
      settings: null,
      theme: this.state.theme,
      loading: false
    };
    this.notify();
  }
}

export const appState = new StateManager();
