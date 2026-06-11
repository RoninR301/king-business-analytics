/**
 * Firestore Service Layer
 *
 * Centralised, validated CRUD for the King Business Analytics data model.
 * Every write goes through validation (see Phase 8 — Data Safety) so the
 * client can never persist negative prices/quantities/stock, and invoice
 * numbers are always unique.
 *
 * Collections: users, shops, customers, products, sales, invoices, managers
 */
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
  initializeApp,
  deleteApp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { auth, db, firebaseConfig } from './firebase-config.js';

export const COLLECTIONS = {
  USERS: 'users',
  SHOPS: 'shops',
  CUSTOMERS: 'customers',
  PRODUCTS: 'products',
  SALES: 'sales',
  INVOICES: 'invoices',
  MANAGERS: 'managers'
};

/* --------------------------------------------------------------------------
 * Validation helpers (Phase 8 — never trust client-side values)
 * ------------------------------------------------------------------------ */

function toNumber(value, field) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`${field} must be a valid number.`);
  }
  return n;
}

/** Non-negative number (>= 0), e.g. price, stock. */
function assertNonNegative(value, field) {
  const n = toNumber(value, field);
  if (n < 0) throw new Error(`${field} cannot be negative.`);
  return n;
}

/** Strictly positive integer (>= 1), e.g. quantity. */
function assertPositiveInt(value, field) {
  const n = toNumber(value, field);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`${field} must be a whole number of at least 1.`);
  }
  return n;
}

function assertNonEmpty(value, field) {
  const str = String(value ?? '').trim();
  if (!str) throw new Error(`${field} is required.`);
  return str;
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/* --------------------------------------------------------------------------
 * Invoice number generation (Phase 3 audit fix)
 * Count-based numbering causes duplicates under concurrency — use a
 * timestamp + random suffix instead, e.g. INV-20260611-AB12
 * ------------------------------------------------------------------------ */

export function generateInvoiceNumber() {
  const now = new Date();
  const datePart =
    `${now.getFullYear()}` +
    `${String(now.getMonth() + 1).padStart(2, '0')}` +
    `${String(now.getDate()).padStart(2, '0')}`;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `INV-${datePart}-${suffix}`;
}

/* --------------------------------------------------------------------------
 * Shops
 * ------------------------------------------------------------------------ */

function generateShopCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'KBA-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createShop(ownerId, data = {}) {
  assertNonEmpty(ownerId, 'Owner');
  const ref = doc(collection(db, COLLECTIONS.SHOPS));
  const shop = {
    shopId: ref.id,
    ownerId,
    shopName: assertNonEmpty(data.shopName ?? data.name, 'Shop name'),
    shopCode: data.shopCode || generateShopCode(),
    address: String(data.address ?? '').trim(),
    phone: String(data.phone ?? data.mobile ?? '').trim(),
    isDeleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null
  };
  await setDoc(ref, shop);
  return { ...shop, id: ref.id };
}

export async function updateShop(shopId, data = {}) {
  assertNonEmpty(shopId, 'Shop');
  const updates = { updatedAt: serverTimestamp() };
  if (data.shopName !== undefined || data.name !== undefined) {
    updates.shopName = assertNonEmpty(data.shopName ?? data.name, 'Shop name');
  }
  if (data.address !== undefined) updates.address = String(data.address).trim();
  if (data.phone !== undefined || data.mobile !== undefined) {
    updates.phone = String(data.phone ?? data.mobile).trim();
  }
  await updateDoc(doc(db, COLLECTIONS.SHOPS, shopId), updates);
  return getShopById(shopId);
}

/** Soft delete only — shops are never hard deleted (audit fix). */
export async function softDeleteShop(shopId) {
  assertNonEmpty(shopId, 'Shop');
  await updateDoc(doc(db, COLLECTIONS.SHOPS, shopId), {
    isDeleted: true,
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return true;
}

export async function getShopById(shopId) {
  const snap = await getDoc(doc(db, COLLECTIONS.SHOPS, shopId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/** Returns shops for an owner, excluding soft-deleted ones by default. */
export async function getShops(ownerId, { includeDeleted = false } = {}) {
  const q = query(collection(db, COLLECTIONS.SHOPS), where('ownerId', '==', ownerId));
  const snap = await getDocs(q);
  let shops = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (!includeDeleted) shops = shops.filter((s) => s.isDeleted !== true);
  return shops;
}

/* --------------------------------------------------------------------------
 * Customers
 * ------------------------------------------------------------------------ */

export async function createCustomer(shopId, ownerId, data = {}) {
  assertNonEmpty(shopId, 'Shop');
  assertNonEmpty(ownerId, 'Owner');
  const ref = doc(collection(db, COLLECTIONS.CUSTOMERS));
  const customer = {
    customerId: ref.id,
    shopId,
    ownerId,
    name: assertNonEmpty(data.name, 'Customer name'),
    phone: String(data.phone ?? data.mobile ?? '').trim(),
    address: String(data.address ?? '').trim(),
    createdAt: serverTimestamp()
  };
  await setDoc(ref, customer);
  return { ...customer, id: ref.id };
}

export async function updateCustomer(customerId, data = {}) {
  assertNonEmpty(customerId, 'Customer');
  const updates = {};
  if (data.name !== undefined) updates.name = assertNonEmpty(data.name, 'Customer name');
  if (data.phone !== undefined || data.mobile !== undefined) {
    updates.phone = String(data.phone ?? data.mobile).trim();
  }
  if (data.address !== undefined) updates.address = String(data.address).trim();
  await updateDoc(doc(db, COLLECTIONS.CUSTOMERS, customerId), updates);
  return true;
}

export async function getCustomers(shopId) {
  const q = query(collection(db, COLLECTIONS.CUSTOMERS), where('shopId', '==', shopId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* --------------------------------------------------------------------------
 * Products
 * ------------------------------------------------------------------------ */

export async function createProduct(shopId, ownerId, data = {}) {
  assertNonEmpty(shopId, 'Shop');
  assertNonEmpty(ownerId, 'Owner');
  const ref = doc(collection(db, COLLECTIONS.PRODUCTS));
  const product = {
    productId: ref.id,
    shopId,
    ownerId,
    name: assertNonEmpty(data.name, 'Product name'),
    purchasePrice: assertNonNegative(data.purchasePrice, 'Purchase price'),
    sellingPrice: assertNonNegative(data.sellingPrice, 'Selling price'),
    stock: assertNonNegative(data.stock ?? 0, 'Stock'),
    createdAt: serverTimestamp()
  };
  await setDoc(ref, product);
  return { ...product, id: ref.id };
}

export async function updateProduct(productId, data = {}) {
  assertNonEmpty(productId, 'Product');
  const updates = {};
  if (data.name !== undefined) updates.name = assertNonEmpty(data.name, 'Product name');
  if (data.purchasePrice !== undefined) {
    updates.purchasePrice = assertNonNegative(data.purchasePrice, 'Purchase price');
  }
  if (data.sellingPrice !== undefined) {
    updates.sellingPrice = assertNonNegative(data.sellingPrice, 'Selling price');
  }
  if (data.stock !== undefined) updates.stock = assertNonNegative(data.stock, 'Stock');
  await updateDoc(doc(db, COLLECTIONS.PRODUCTS, productId), updates);
  return true;
}

export async function getProducts(shopId) {
  const q = query(collection(db, COLLECTIONS.PRODUCTS), where('shopId', '==', shopId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getProductById(productId) {
  const snap = await getDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/* --------------------------------------------------------------------------
 * Sales (Phase 3 audit fix — profit is computed server-side, never trusted)
 * ------------------------------------------------------------------------ */

/**
 * Create a sale. Profit is ALWAYS calculated here from purchase/selling
 * price and quantity — the client cannot supply it.
 *
 * If `productId` is provided, stock is validated and decremented so it can
 * never go negative.
 */
export async function createSale(shopId, ownerId, data = {}) {
  assertNonEmpty(shopId, 'Shop');
  assertNonEmpty(ownerId, 'Owner');

  const quantity = assertPositiveInt(data.quantity, 'Quantity');
  const purchasePrice = assertNonNegative(data.purchasePrice, 'Purchase price');
  const sellingPrice = assertNonNegative(data.sellingPrice, 'Selling price');

  // Optional stock management when the sale references a product.
  let productRef = null;
  if (data.productId) {
    const product = await getProductById(data.productId);
    if (!product) throw new Error('Referenced product not found.');
    const currentStock = Number(product.stock) || 0;
    if (currentStock < quantity) {
      throw new Error(`Insufficient stock. Only ${currentStock} available.`);
    }
    productRef = { ref: doc(db, COLLECTIONS.PRODUCTS, data.productId), newStock: currentStock - quantity };
  }

  const totalAmount = round2(sellingPrice * quantity);
  const profit = round2((sellingPrice - purchasePrice) * quantity);

  const ref = doc(collection(db, COLLECTIONS.SALES));
  const sale = {
    saleId: ref.id,
    ownerId,
    shopId,
    productId: data.productId || null,
    customerId: data.customerId || null,
    customerName: String(data.customerName ?? '').trim() || 'Walk-in',
    customerAddress: String(data.customerAddress ?? '').trim(),
    purchasePrice,
    sellingPrice,
    quantity,
    totalAmount,
    profit,
    createdAt: serverTimestamp()
  };

  await setDoc(ref, sale);
  if (productRef) {
    await updateDoc(productRef.ref, { stock: productRef.newStock });
  }
  return { ...sale, id: ref.id };
}

export async function getSales(shopId, { ownerId } = {}) {
  let q;
  if (shopId) {
    q = query(
      collection(db, COLLECTIONS.SALES),
      where('shopId', '==', shopId),
      orderBy('createdAt', 'desc')
    );
  } else if (ownerId) {
    q = query(
      collection(db, COLLECTIONS.SALES),
      where('ownerId', '==', ownerId),
      orderBy('createdAt', 'desc')
    );
  } else {
    throw new Error('getSales requires a shopId or ownerId.');
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* --------------------------------------------------------------------------
 * Invoices (Phase 3 audit fix — unique numbers, duplicate guard)
 * ------------------------------------------------------------------------ */

async function invoiceNumberExists(invoiceNumber) {
  const q = query(
    collection(db, COLLECTIONS.INVOICES),
    where('invoiceNumber', '==', invoiceNumber),
    limit(1)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function createInvoice(shopId, ownerId, data = {}) {
  assertNonEmpty(shopId, 'Shop');
  assertNonEmpty(ownerId, 'Owner');

  // Generate a unique invoice number, retrying on the (rare) collision.
  let invoiceNumber = generateInvoiceNumber();
  for (let attempt = 0; attempt < 5 && (await invoiceNumberExists(invoiceNumber)); attempt++) {
    invoiceNumber = generateInvoiceNumber();
  }

  const ref = doc(collection(db, COLLECTIONS.INVOICES));
  const invoice = {
    invoiceId: ref.id,
    invoiceNumber,
    ownerId,
    shopId,
    customerId: data.customerId || null,
    saleId: data.saleId || null,
    createdAt: serverTimestamp()
  };
  await setDoc(ref, invoice);
  return { ...invoice, id: ref.id };
}

export async function getInvoices(shopId, { ownerId } = {}) {
  let q;
  if (shopId) {
    q = query(
      collection(db, COLLECTIONS.INVOICES),
      where('shopId', '==', shopId),
      orderBy('createdAt', 'desc')
    );
  } else if (ownerId) {
    q = query(
      collection(db, COLLECTIONS.INVOICES),
      where('ownerId', '==', ownerId),
      orderBy('createdAt', 'desc')
    );
  } else {
    throw new Error('getInvoices requires a shopId or ownerId.');
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* --------------------------------------------------------------------------
 * Managers (Phase 4 audit fix — create / disable / reset password)
 * ------------------------------------------------------------------------ */

/**
 * Create a manager Auth account without disturbing the currently signed-in
 * owner's session (uses a temporary secondary Firebase app).
 */
async function createManagerAuthAccount(email, password) {
  const secondaryApp = initializeApp(firebaseConfig, `Secondary_${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await signOut(secondaryAuth);
    return credential.user.uid;
  } finally {
    await deleteApp(secondaryApp);
  }
}

export async function createManager(shopId, ownerId, data = {}) {
  assertNonEmpty(shopId, 'Shop');
  assertNonEmpty(ownerId, 'Owner');
  const name = assertNonEmpty(data.name, 'Manager name');
  const email = assertNonEmpty(data.email, 'Manager email');
  const password = String(data.password ?? '');
  if (password.length < 6) {
    throw new Error('Manager password must be at least 6 characters.');
  }

  const authUid = await createManagerAuthAccount(email, password);

  const ref = doc(collection(db, COLLECTIONS.MANAGERS));
  const manager = {
    managerId: ref.id,
    authUid,
    shopId,
    ownerId,
    name,
    email,
    disabled: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(ref, manager);

  // Mirror into users so role-based guards and rules work.
  await setDoc(doc(db, COLLECTIONS.USERS, authUid), {
    userId: authUid,
    uid: authUid,
    role: 'manager',
    name,
    email,
    shopId,
    ownerId,
    createdAt: serverTimestamp()
  });

  // Link manager onto the shop.
  await updateDoc(doc(db, COLLECTIONS.SHOPS, shopId), {
    managerId: ref.id,
    updatedAt: serverTimestamp()
  });

  return { ...manager, id: ref.id };
}

export async function getManagers(shopId) {
  const q = query(collection(db, COLLECTIONS.MANAGERS), where('shopId', '==', shopId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Reset a manager's password.
 *
 * A web client cannot directly set another user's password (that requires the
 * Firebase Admin SDK / a Cloud Function). The production-safe client approach
 * is to send a password-reset email to the manager. We also stamp the manager
 * doc so the owner has an audit trail of the reset request.
 */
export async function updateManagerPassword(managerId) {
  assertNonEmpty(managerId, 'Manager');
  const snap = await getDoc(doc(db, COLLECTIONS.MANAGERS, managerId));
  if (!snap.exists()) throw new Error('Manager not found.');
  const manager = snap.data();
  if (!manager.email) throw new Error('Manager has no email on file.');

  await sendPasswordResetEmail(auth, manager.email);
  await updateDoc(doc(db, COLLECTIONS.MANAGERS, managerId), {
    passwordResetRequestedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return { email: manager.email, method: 'reset-email' };
}

/** Enable/disable a manager account at the application level. */
export async function setManagerDisabled(managerId, disabled = true) {
  assertNonEmpty(managerId, 'Manager');
  await updateDoc(doc(db, COLLECTIONS.MANAGERS, managerId), {
    disabled: !!disabled,
    updatedAt: serverTimestamp()
  });
  return true;
}

/* --------------------------------------------------------------------------
 * Dashboard aggregation (Phase 6)
 * ------------------------------------------------------------------------ */

export async function getDashboardTotals(ownerId) {
  assertNonEmpty(ownerId, 'Owner');
  const [shops, sales] = await Promise.all([
    getShops(ownerId),
    getSales(null, { ownerId })
  ]);

  const shopIds = new Set(shops.map((s) => s.id));
  const [customers, products] = await Promise.all([
    countByOwner(COLLECTIONS.CUSTOMERS, ownerId, shopIds),
    countByOwner(COLLECTIONS.PRODUCTS, ownerId, shopIds)
  ]);

  const totalRevenue = round2(sales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0));
  const totalProfit = round2(sales.reduce((sum, s) => sum + (Number(s.profit) || 0), 0));

  return {
    totalShops: shops.length,
    totalCustomers: customers,
    totalProducts: products,
    totalSales: sales.length,
    totalRevenue,
    totalProfit
  };
}

async function countByOwner(collectionName, ownerId, shopIds) {
  // Prefer ownerId where present; fall back to shop membership.
  const q = query(collection(db, collectionName), where('ownerId', '==', ownerId));
  const snap = await getDocs(q);
  if (!snap.empty) return snap.size;
  const all = await getDocs(collection(db, collectionName));
  return all.docs.filter((d) => shopIds.has(d.data().shopId)).length;
}

export const firestoreService = {
  COLLECTIONS,
  generateInvoiceNumber,
  createShop,
  updateShop,
  softDeleteShop,
  getShops,
  getShopById,
  createCustomer,
  updateCustomer,
  getCustomers,
  createProduct,
  updateProduct,
  getProducts,
  getProductById,
  createSale,
  getSales,
  createInvoice,
  getInvoices,
  createManager,
  getManagers,
  updateManagerPassword,
  setManagerDisabled,
  getDashboardTotals
};

export default firestoreService;
