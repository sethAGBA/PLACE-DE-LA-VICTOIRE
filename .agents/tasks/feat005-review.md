# Admin dashboard, menu, table, user management and reporting

FEAT-005 delivers the full admin backoffice for Place de la Victoire: a live dashboard with Recharts charts, CRUD pages for menu products, tables, and users, an order history with CSV export, and a reports page. The Firebase secondary-app pattern is used to create user accounts without signing out the current admin session. The build result shows zero errors.

**Watch for:** Two hardcoded French strings inside chart section headings in `AdminDashboard` and `Reports` are not routed through `useTranslation` (confirmed). The password-reset button text in `UserForm` is also hardcoded (confirmed). A secondary-app instance leak is possible in `UserForm` on concurrent rapid submissions (likely). The `seedAccounts` function embeds plaintext demo passwords in client-side bundle code that ships to the browser (confirmed).

**Verdict**: NEEDS_CHANGES

---

## High-level view

The secondary-app pattern for user creation works in `seedAccounts` — it always deletes any stale instance before `initializeApp` and cleans up in a `finally` block. `UserForm` uses a slightly different variant that reuses an existing app if found; under concurrent submissions this races and can throw, as detailed below.

The CSV import is hand-rolled with a quote-aware parser — no papaparse. The format expected (nom_fr, nom_en, prix, categorieId) is shown in the preview modal but is not documented anywhere an admin preparing the file can find it.

The `AdminLayout` in `App.tsx` uses `NavLink` with active-state styling. i18n coverage is nearly complete across both language files, but three visible chart headings and two password-reset strings were left as hardcoded French.

The `Reports` page loads all orders in the selected date range into the browser and aggregates locally. The `where('createdAt', '>=', since)` + `orderBy('createdAt')` combination requires a composite Firestore index that hasn't been created; without it the query will fail in production. Read cost also grows linearly with order volume.

---

<details>
<summary>Issues (5)</summary>

1. **Hardcoded chart headings** — "Commandes par heure (aujourd'hui)", "Commandes par statut (7 derniers jours)", and "Commandes par heure de la journée ({range}j)" in `AdminDashboard` and `Reports` are not translated. Add i18n keys and replace with `t(...)` calls.

2. **Hardcoded password-reset label** — `UserForm`'s reset button renders "Envoyer un e-mail de réinitialisation du mot de passe" and "E-mail envoyé !" as bare string literals. Add keys under `user.form.resetPassword` and `user.form.resetSent`.

3. **Demo passwords in client bundle** — `seedAccounts.ts` ships `Admin2024!`, `Serveur2024!`, `Cuisine2024!` in the browser bundle. Anyone who opens DevTools can read them. Move this file server-side (a Firebase Admin SDK Cloud Function or a local Node script) and remove it from the Vite build, or at minimum gate it behind an environment variable and strip it in production builds.

4. **Secondary-app leak under concurrent submission** — In `UserForm.handleCreate`, if the admin double-clicks Submit, two calls run simultaneously. Both call `getApps().find(...)` for `SECONDARY_APP_NAME`; the first one wins and the second gets the already-existing app, creates a second user under the same app, then `deleteApp` races with the first call's cleanup. The fix is to delete any existing instance before `initializeApp`, matching the pattern used in `seedAccounts`.

5. **Missing Firestore composite index for Reports/Dashboard queries** — `where('createdAt', '>=', …)` combined with `orderBy('createdAt')` requires a composite index. Without it the query throws at runtime. Create the index in the Firebase console or add it to `firestore.indexes.json`.

</details>

---

<details>
<summary>Details</summary>

## i18n gaps in chart headings

Three `<h2>` strings in `AdminDashboard` and `Reports` are hardcoded French:

- `AdminDashboard`: `"Commandes par heure (aujourd'hui)"` and `"Commandes par statut (7 derniers jours)"` — these are inside the charts grid, always visible.
- `Reports`: `"Commandes par heure de la journée ({range}j)"` — also always visible and interpolates `range` via a template literal rather than `t(...)` with interpolation.

Both language files are otherwise comprehensive for this feature; these three strings just slipped through.

The password-reset button in `UserForm` has the same issue — two bare French strings that have no corresponding i18n keys.

## Secondary-app lifecycle in UserForm

`seedAccounts` correctly deletes any existing instance of `SEED_APP_NAME` before calling `initializeApp`, in a loop, so there is no stale-instance risk there. `UserForm.handleCreate` uses a subtly different pattern:

```ts
const existing = getApps().find((a) => a.name === SECONDARY_APP_NAME);
const secondaryApp = existing ?? initializeApp(firebaseConfig, SECONDARY_APP_NAME);
```

If `existing` is found, it reuses it without deleting it first. Under normal use (one form submission at a time) this is fine — the previous call deleted the app before returning. But if two submissions race, both reads of `getApps()` might see no existing app (the first call hasn't finished yet), both call `initializeApp`, and Firebase throws "Firebase: Firebase App named 'secondary-user-creation' already exists." The resulting exception surfaces as a save error to the admin, and the second `deleteApp` may clean up an app the first call is still using.

The fix mirrors `seedAccounts`: always `deleteApp` any found instance before creating a fresh one.

## Demo credentials in the client bundle

`seedAccounts.ts` is imported by `AdminDashboard.tsx` and compiled into the browser bundle. The three plaintext passwords (`Admin2024!`, `Serveur2024!`, `Cuisine2024!`) are visible in the production bundle to anyone with DevTools. For a restaurant admin tool these are low-risk credentials, but once the seed button is used and those accounts exist, the credentials are both public and permanently valid — there's no rotation mechanism. The right fix is a local Node script or a Cloud Function that runs with the Firebase Admin SDK and never ships to the browser.

## Client-side aggregation and missing Firestore index

`Reports` and `AdminDashboard` both use `where('createdAt', '>=', since)` + `orderBy('createdAt', 'asc')`. Firestore requires a composite index for this combination; a single-field index on `createdAt` is not enough. Without the index, the query fails at runtime with a "requires an index" error and a link to create it. This needs to be added to `firestore.indexes.json` or created manually in the console before the feature is used in production.

Both pages download full `Order` documents and aggregate in the browser. For the current scale this will work, but it means every chart re-render costs one Firestore read per order in the window.

## Missing aria-labels on uncategorised product rows

The edit and delete buttons in the uncategorised products section of `MenuManagement` have no `aria-label`, unlike the same buttons in the categorised section above them. This is inconsistent and leaves screen-reader users without a button description for those rows.

</details>

---

<details>
<summary>File map</summary>

| File | What changed |
|---|---|
| `src/components/admin/StatsCard.tsx` | New: stat tile with optional trend indicator |
| `src/components/admin/ProductForm.tsx` | New: bilingual product create/edit form with Firebase Storage upload |
| `src/components/admin/TableForm.tsx` | New: table create form (numero, zone, capacite) |
| `src/components/admin/UserForm.tsx` | New: user create/edit form using secondary Firebase app pattern |
| `src/components/admin/QRCodeDisplay.tsx` | New: QRCodeCanvas renderer with PNG download and clipboard copy |
| `src/pages/admin/AdminDashboard.tsx` | New: live stats + Recharts bar/pie charts + seed buttons |
| `src/pages/admin/MenuManagement.tsx` | New: product list grouped by category, CSV import, seed trigger |
| `src/pages/admin/TableManagement.tsx` | New: table grid by zone with QR modal and table reset |
| `src/pages/admin/UserManagement.tsx` | New: user table with role badges and active toggle |
| `src/pages/admin/OrderHistory.tsx` | New: paginated order list with date/status filters and CSV export |
| `src/pages/admin/Reports.tsx` | New: 7/30-day revenue, top-products and orders-by-hour charts |
| `src/seed/seedAccounts.ts` | New: browser-side demo account seeder using secondary app pattern |
| `src/i18n/fr.json` | Added keys for all new admin, product, user, table form strings |
| `src/i18n/en.json` | Matching English translations for all new keys |
| `src/App.tsx` | AdminLayout updated to use NavLink; admin sub-routes wired |

Full diff: `git diff main -- src/components/admin src/pages/admin src/seed/seedAccounts.ts src/i18n src/App.tsx`

</details>
