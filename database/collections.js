/**
 * Firestore Collection Names & Schema Definitions
 * Single source of truth for database structure.
 */

export const COLLECTIONS = {
  USERS: 'users',
  SHOPS: 'shops',
  MANAGERS: 'managers',
  SALES: 'sales',
  CUSTOMERS: 'customers',
  INVOICES: 'invoices',
  UDHARI: 'udhari',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
  BACKUP: 'backup'
};

export const SHOP_CATEGORIES = [
  'Clothing',
  'Mobile',
  'Medical',
  'Grocery',
  'Restaurant',
  'Electronics',
  'Hardware',
  'Furniture',
  'Jewellery',
  'Automobile',
  'Salon',
  'Book Store',
  'Other'
];

/**
 * @typedef {Object} UserDocument
 * @property {string} uid
 * @property {'owner'|'manager'} role
 * @property {string} name
 * @property {string} email
 * @property {string} mobile
 * @property {string|null} shopId - Manager only
 * @property {string|null} ownerId - Manager only
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} updatedAt
 */

/**
 * @typedef {Object} ShopDocument
 * @property {string} id
 * @property {string} ownerId
 * @property {string} shopCode - Unique human-readable ID
 * @property {string} name
 * @property {string} category
 * @property {string|null} customCategory
 * @property {string|null} logoUrl
 * @property {string} address
 * @property {string} mobile
 * @property {string|null} altMobile
 * @property {string|null} email
 * @property {string|null} altEmail
 * @property {string|null} gstNumber
 * @property {string|null} upiId
 * @property {string|null} managerId
 * @property {boolean} active
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} updatedAt
 */

/**
 * @typedef {Object} SaleDocument
 * @property {string} id
 * @property {string} shopId
 * @property {string} ownerId
 * @property {string|null} customerId
 * @property {string} category
 * @property {Object} customer - Snapshot at sale time
 * @property {Array<Object>} items
 * @property {number} subtotal
 * @property {number} taxAmount
 * @property {number} taxRate
 * @property {number} grandTotal
 * @property {string} createdBy
 * @property {import('firebase/firestore').Timestamp} createdAt
 */

/**
 * @typedef {Object} CustomerDocument
 * @property {string} id
 * @property {string} shopId
 * @property {string} name
 * @property {string} mobile
 * @property {string|null} address
 * @property {number} totalPurchases
 * @property {number} totalSpent
 * @property {import('firebase/firestore').Timestamp} lastPurchaseAt
 * @property {import('firebase/firestore').Timestamp} createdAt
 */

/**
 * @typedef {Object} InvoiceDocument
 * @property {string} id
 * @property {string} shopId
 * @property {string} saleId
 * @property {string} invoiceNumber
 * @property {Object} shop - Snapshot
 * @property {Object} customer
 * @property {Array<Object>} items
 * @property {number} subtotal
 * @property {number} taxAmount
 * @property {number} taxRate
 * @property {number} grandTotal
 * @property {Object|null} manager
 * @property {import('firebase/firestore').Timestamp} createdAt
 */

/**
 * @typedef {Object} UdhariDocument
 * @property {string} id
 * @property {string} shopId
 * @property {string} customerName
 * @property {string} mobile
 * @property {number} amount
 * @property {number} paidAmount
 * @property {number} remainingAmount
 * @property {string} dueDate - ISO date string
 * @property {'pending'|'partial'|'paid'} status
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} updatedAt
 */

/**
 * @typedef {Object} AnalyticsDocument
 * @property {string} id - shopId_YYYY-MM-DD
 * @property {string} shopId
 * @property {string} ownerId
 * @property {string} date - YYYY-MM-DD
 * @property {number} salesCount
 * @property {number} revenue
 * @property {number} customerCount
 * @property {number} invoiceCount
 * @property {Object} topProducts - product name -> count
 */

export const CATEGORY_FORM_FIELDS = {
  Clothing: [
    { name: 'productName', label: 'Product Name', type: 'text', required: true },
    { name: 'size', label: 'Size', type: 'text', required: true },
    { name: 'color', label: 'Color', type: 'text', required: false },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'price', label: 'Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  Mobile: [
    { name: 'productName', label: 'Product Name', type: 'text', required: true },
    { name: 'model', label: 'Model', type: 'text', required: true },
    { name: 'imei', label: 'IMEI', type: 'text', required: false },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'price', label: 'Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  Medical: [
    { name: 'medicineName', label: 'Medicine Name', type: 'text', required: true },
    { name: 'batchNumber', label: 'Batch Number', type: 'text', required: true },
    { name: 'expiryDate', label: 'Expiry Date', type: 'date', required: true },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'price', label: 'Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  Restaurant: [
    { name: 'itemName', label: 'Item Name', type: 'text', required: true },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'price', label: 'Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  Grocery: [
    { name: 'productName', label: 'Product Name', type: 'text', required: true },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'price', label: 'Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  Electronics: [
    { name: 'productName', label: 'Product Name', type: 'text', required: true },
    { name: 'model', label: 'Model', type: 'text', required: false },
    { name: 'serialNumber', label: 'Serial Number', type: 'text', required: false },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'price', label: 'Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  Hardware: [
    { name: 'productName', label: 'Product Name', type: 'text', required: true },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'price', label: 'Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  Furniture: [
    { name: 'productName', label: 'Product Name', type: 'text', required: true },
    { name: 'material', label: 'Material', type: 'text', required: false },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'price', label: 'Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  Jewellery: [
    { name: 'productName', label: 'Product Name', type: 'text', required: true },
    { name: 'weight', label: 'Weight (g)', type: 'number', required: false, step: 0.01 },
    { name: 'purity', label: 'Purity', type: 'text', required: false },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'price', label: 'Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  Automobile: [
    { name: 'productName', label: 'Product/Service Name', type: 'text', required: true },
    { name: 'vehicleNumber', label: 'Vehicle Number', type: 'text', required: false },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'price', label: 'Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  Salon: [
    { name: 'serviceName', label: 'Service Name', type: 'text', required: true },
    { name: 'duration', label: 'Duration (mins)', type: 'number', required: false },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'price', label: 'Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  'Book Store': [
    { name: 'bookTitle', label: 'Book Title', type: 'text', required: true },
    { name: 'author', label: 'Author', type: 'text', required: false },
    { name: 'isbn', label: 'ISBN', type: 'text', required: false },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 1 },
    { name: 'price', label: 'Price', type: 'number', required: true, min: 0, step: 0.01 }
  ],
  Other: []
};

export const DEFAULT_CUSTOMER_FIELDS = [
  { name: 'customerName', label: 'Customer Name', type: 'text', required: true },
  { name: 'customerMobile', label: 'Mobile', type: 'tel', required: true },
  { name: 'customerAddress', label: 'Address', type: 'text', required: false }
];
