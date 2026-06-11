# KING BUSINESS ANALYTICS — E2E Test Plan (PR #2)

Environment: app served at `http://localhost:3001/king-business-analytics/` (mimics GitHub Pages project subpath). Live Firebase project `king-business-analytics`. Rules published.

Test data (timestamp suffix `TS` to keep unique):
- Owner: name `Acme Owner`, mobile `9000000001`, email `ownerTS@kbatest.com`, pw `Test1234`
- Shop: name `Acme Store`, address `12 MG Road`, mobile `9000000010`; Manager name `Mgr One`, manager email `mgrTS@kbatest.com`, manager pw `Manager123`
- Customer/sale: customer `Ravi Kumar`, mobile `9000000020`, address `5 Park St`; item purchase price `100`, selling price `150`, qty `2`, tax `0` → subtotal `300`, cost `200`, **profit `100`**, grandTotal `300`.

## T1 — Routing fix (Priority 1) [the core PR change]
Start at directory URL `http://localhost:3001/king-business-analytics/`. Click hero **Login**.
- PASS: URL becomes `.../pages/auth/login.html` and the Admin Login card renders.
- FAIL (old behavior): browser shows 404 / wrong path.

## T2 — Signup → Firestore profile → Owner Dashboard (Priority 2,3)
From login, click **Sign Up**. Fill owner fields, submit.
- PASS: redirects to `.../pages/admin/dashboard.html`; header reads **Owner Dashboard**; 5 stat cards shown: Total Shops, Total Customers, Total Sales, Total Revenue, Total Profit — all `0`. No error toast.
- FAIL: stays on register with error, or lands on blank screen, or redirects to login (would mean profile write failed).

## T3 — Create Shop + Manager (Priority 3,4)
Dashboard → **Manage Shops** → **Create New Shop**. Fill shop + manager account, save.
- PASS: shop card/row `Acme Store` appears with a generated shop code; no error. (Creates `shops` doc with ownerId + `managers` doc.)
- FAIL: error toast, or shop not listed after save.

## T4 — Owner sees own shop only after refresh (Priority 6,8)
Reload the Shops page.
- PASS: `Acme Store` still listed (persisted in Firestore).

## T5 — Manager login → Manager Dashboard (Priority 1,2,5)
Logout. On login page click **Manager Login**, sign in with manager creds.
- PASS: redirects to `.../pages/manager/dashboard.html`; shows assigned shop `Acme Store` and manager stat cards (Sales/Customers/Invoices).
- FAIL: 404, login error, or owner dashboard shown instead.

## T6 — Create Sale with cost+profit → auto Invoice (Priority 4 #5, 4 #3/#4)
Manager → **Sales** → New Sale. Enter customer (with address), Purchase Price `100`, Selling Price `150`, qty `2`, submit.
- PASS: success toast; sale recorded. Form shows distinct **Purchase Price (Cost)** and **Selling Price** fields (the PR change). Invoice auto-generated.
- FAIL: no Purchase Price field present (change missing), or error.

## T7 — Invoice persisted with unique number + ownerId (Priority 4)
Manager → **Invoices**.
- PASS: one invoice listed with number matching `INV-YYYYMMDD-XXXX`. (Doc carries `ownerId`.)

## T8 — Customer with address persisted (Priority 4 #5, 6)
Manager → **Customers**.
- PASS: `Ravi Kumar` listed; opening Details shows Address `5 Park St`.

## T9 — Analytics aggregates incl. profit (Priority 5)
Logout, login as owner, view Dashboard then Analytics.
- PASS: Owner Dashboard cards: Total Shops `1`, Total Customers `1`, Total Sales `1`, Total Revenue `₹300.00`, **Total Profit `₹100.00`**. Analytics page renders the same totals (profit non-zero proves the analytics profit aggregation change).
- FAIL: Profit `0` (would mean profit aggregation broken), or counts wrong.

## T10 — Refresh persistence + Logout (Priority 2,6)
Reload owner dashboard; then click Logout.
- PASS: after reload the totals persist; after logout lands on login page; navigating directly to `.../pages/admin/dashboard.html` redirects back to login (session cleared; auth-guard does not hang on blank — the PR resilience fix).

## Regression — page/route audit
Visit each admin page (Dashboard, Shops, Analytics, Backup, Settings) and manager page (Dashboard, Sales, Customers, Udhari, Invoices) via the sidebar.
- PASS: each loads its content (no 404, no blank screen, no uncaught console error).
