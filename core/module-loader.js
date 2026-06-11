/**
 * Dynamic module loader for lazy initialization.
 */
const loadedModules = new Map();

export async function loadModule(modulePath) {
  if (loadedModules.has(modulePath)) {
    return loadedModules.get(modulePath);
  }
  const module = await import(modulePath);
  loadedModules.set(modulePath, module);
  return module;
}

export async function initPageModule(config) {
  const { controller, containerId = 'app-content' } = config;
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`[ModuleLoader] Container #${containerId} not found`);
    return;
  }
  if (typeof controller.init === 'function') {
    await controller.init(container);
  }
  if (typeof controller.destroy === 'function') {
    window.addEventListener('beforeunload', () => controller.destroy());
  }
}

/**
 * Future-ready module registry.
 * Placeholder modules register here without implementation.
 */
export const FUTURE_MODULES = {
  inventory: { path: '../modules/inventory/controller.js', enabled: false },
  barcode: { path: '../modules/barcode/controller.js', enabled: false },
  expenses: { path: '../modules/expenses/controller.js', enabled: false },
  profit: { path: '../modules/profit/controller.js', enabled: false },
  whatsapp: { path: '../modules/whatsapp/controller.js', enabled: false },
  notifications: { path: '../modules/notifications/controller.js', enabled: false },
  subscription: { path: '../modules/subscription/controller.js', enabled: false },
  ads: { path: '../modules/ads/controller.js', enabled: false },
  ai: { path: '../modules/ai/controller.js', enabled: false }
};

export async function loadFutureModule(name) {
  const mod = FUTURE_MODULES[name];
  if (!mod || !mod.enabled) {
    console.info(`[ModuleLoader] Future module "${name}" is not enabled yet.`);
    return null;
  }
  return loadModule(mod.path);
}
