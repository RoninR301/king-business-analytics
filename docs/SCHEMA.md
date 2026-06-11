# Firestore Schema

## Collections

### users
| Field | Type | Description |
|-------|------|-------------|
| uid | string | Document ID = Firebase Auth UID |
| role | string | `owner` or `manager` |
| name | string | Full name |
| email | string | Login email |
| mobile | string | Phone number |
| shopId | string? | Manager's assigned shop |
| ownerId | string? | Manager's owner reference |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### shops
| Field | Type | Description |
|-------|------|-------------|
| id | string | Auto-generated |
| ownerId | string | Owner UID |
| shopCode | string | Unique ID (e.g. KBA-ABC12345) |
| name | string | Shop name |
| category | string | From SHOP_CATEGORIES |
| customCategory | string? | When category = Other |
| logoUrl | string? | Firebase Storage URL |
| address | string | |
| mobile | string | |
| altMobile | string? | |
| email | string? | |
| altEmail | string? | |
| gstNumber | string? | |
| upiId | string? | |
| managerId | string? | Linked manager doc ID |
| active | boolean | |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### managers
| Field | Type | Description |
|-------|------|-------------|
| id | string | Auto-generated |
| shopId | string | |
| ownerId | string | |
| authUid | string | Firebase Auth UID |
| name | string | |
| email | string | Login email |
| createdAt | timestamp | |

### sales
| Field | Type | Description |
|-------|------|-------------|
| id | string | |
| shopId | string | |
| ownerId | string | For owner-wide queries |
| customerId | string? | |
| category | string | Shop category at sale time |
| customer | object | Snapshot { name, mobile } |
| items | array | Category-specific fields |
| subtotal | number | |
| taxRate | number | |
| taxAmount | number | |
| grandTotal | number | |
| createdBy | string | UID |
| createdAt | timestamp | |

### customers
| Field | Type | Description |
|-------|------|-------------|
| id | string | |
| shopId | string | |
| ownerId | string | |
| name | string | |
| mobile | string | Unique per shop |
| address | string? | |
| totalPurchases | number | |
| totalSpent | number | |
| lastPurchaseAt | timestamp? | |
| createdAt | timestamp | |

### invoices
| Field | Type | Description |
|-------|------|-------------|
| id | string | |
| shopId | string | |
| saleId | string | |
| invoiceNumber | string | Auto-generated |
| shop | object | Snapshot at invoice time |
| customer | object | |
| items | array | |
| subtotal | number | |
| taxRate | number | |
| taxAmount | number | |
| grandTotal | number | |
| manager | object? | { name, mobile } |
| createdAt | timestamp | |

### udhari
| Field | Type | Description |
|-------|------|-------------|
| id | string | |
| shopId | string | |
| customerName | string | |
| mobile | string | |
| amount | number | Total credit |
| paidAmount | number | |
| remainingAmount | number | |
| dueDate | string | ISO date |
| status | string | pending, partial, paid |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### analytics
| Field | Type | Description |
|-------|------|-------------|
| id | string | `{shopId}_{YYYY-MM-DD}` |
| shopId | string | |
| ownerId | string | |
| date | string | YYYY-MM-DD |
| salesCount | number | |
| revenue | number | |
| customerCount | number | |
| invoiceCount | number | |
| topProducts | object | { productName: count } |

### settings
| Field | Type | Description |
|-------|------|-------------|
| Document ID | string | ownerId |
| showManagerOnInvoice | boolean | |
| defaultTaxRate | number | |
| theme | string | light/dark |
| currency | string | |
| invoicePrefix | string | |

### backup
| Field | Type | Description |
|-------|------|-------------|
| ownerId | string | |
| type | string | export |
| recordCount | number | |
| createdAt | timestamp | |

## Storage Paths

```
/logos/{ownerId}/{shopId}/logo.{ext}
/documents/{ownerId}/{shopId}/{fileName}
/attachments/{ownerId}/{shopId}/{fileName}
```
