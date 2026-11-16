# Implementation Plan — Take Away + Product Images

Build commands: `npm run build` (tsc + vite build)  
Lint check: `npm run lint` (tsc --noEmit)  
Dev server: `npm run dev`  
Script runner: `node scripts/<file>.mjs`

---

- [ ] 1. **Extend `OrderStatus` enum and `Order` type**

  Add `PICKUP = 'PICKUP'` to the `OrderStatus` enum after `REJECTED`. Add three optional fields to the `Order` interface: `clientNom?: string`, `clientTelephone?: string`, `isTakeaway?: boolean`.

  Also add `PICKUP` to the `statusDot` map in `ServeurDashboard.tsx` to prevent a TypeScript key-exhaustiveness error (value: `'bg-purple-500'`).

  Files:
  - `src/types/index.ts`
  - `src/pages/serveur/ServeurDashboard.tsx`

  Verify: `npm run lint` — zero TypeScript errors.

---

- [ ] 2. **Add i18n keys for takeaway and PICKUP to both locale files**

  In `src/i18n/fr.json`, add under `order.status`: `"PICKUP": "Récupérée"`. Add under `order.action`: `"mark_pickup": "Prêt à récupérer"` and `"mark_retrieved": "Récupéré ✅"`. Add a top-level `takeaway` object with keys: `title`, `subtitle`, `hero_text`, `form_title`, `firstname`, `lastname`, `phone`, `mode`, `on_site`, `to_go`, `choose_table`, `order_button`, `phone_placeholder`.

  Mirror all keys in `src/i18n/en.json` with English values.

  French values:
  ```
  takeaway.title          = "Commander en ligne"
  takeaway.subtitle       = "Commandez en ligne"
  takeaway.hero_text      = "Bon appétit commence ici 🍽️"
  takeaway.form_title     = "Vos coordonnées"
  takeaway.firstname      = "Prénom"
  takeaway.lastname       = "Nom"
  takeaway.phone          = "Téléphone"
  takeaway.phone_placeholder = "+228XXXXXXXX"
  takeaway.mode           = "Mode de commande"
  takeaway.on_site        = "🪑 Sur place"
  takeaway.to_go          = "🛍️ À emporter"
  takeaway.choose_table   = "Choisir une table"
  takeaway.order_button   = "Passer la commande"
  ```

  Files:
  - `src/i18n/fr.json`
  - `src/i18n/en.json`

  Verify: `npm run lint` — zero errors.

---

- [ ] 3. **Extend `cartStore` to hold takeaway fields**

  Add to the `CartState` interface: `clientNom: string`, `clientTelephone: string`, `isTakeaway: boolean`. Add setters `setClientNom`, `setClientTelephone`, `setIsTakeaway`. Initialize all three to their zero values (`''`, `''`, `false`). Include them in the `partialize` list so they persist in `sessionStorage`.

  Files:
  - `src/store/cartStore.ts`

  Verify: `npm run lint` — zero errors.

---

- [ ] 4. **Create `src/pages/client/TakeawayPage.tsx`**

  New public page at route `/commander`. It composes the full takeaway ordering experience in one component, keeping it self-contained rather than splitting into sub-files (same pattern as `TablePage.tsx`).

  Sections:
  1. **Header** — logo "Place de la Victoire", subtitle from `t('takeaway.subtitle')`, `<LanguageSwitcher />` on the right. Same `bg-gradient-to-r from-primary to-[#E8690F]` style.
  2. **Hero banner** — terracotta gradient card, animated emoji 🍽️, `t('takeaway.hero_text')`, CTA button "Voir le menu" (smooth-scrolls to the menu grid using `useRef`).
  3. **Coordonnées form** — `<section>` shown before the user opens the cart. Fields: Prénom (maps to `cartStore.clientPrenom` via `setClientPrenom`), Nom (maps to `cartStore.clientNom` via `setClientNom`), Téléphone (maps to `cartStore.clientTelephone` via `setClientTelephone`, pattern `^\+228\d{8}$`). Mode radio: "🪑 Sur place" / "🛍️ À emporter". If "Sur place" is selected, fetch tables from Firestore using `getTables` (already in `src/lib/firestore.ts`) and render a `<select>` listing tables as "Table n°{numero} — {zone}"; the selected table id is stored via `cartStore.setTableId`. If "À emporter", call `cartStore.setTableId('takeaway')` and `cartStore.setIsTakeaway(true)`.
  4. **Full menu** — identical structure to `TablePage.tsx`: `useProducts()` hook, search input, horizontal category tabs (scrollable), `<MenuCard />` grid. The page ref from the hero CTA scrolls here.
  5. **Floating cart button** — same as `TablePage.tsx`, opens `<CartDrawer />`.
  6. **`<CartDrawer />`** — reuse as-is; note that in step 5 the drawer already reads `tableId` from the store. The user must have filled Prénom (minimum) before the cart order button is active; validation is handled inside `CartDrawer` which already requires `prenom.trim()`. Because Nom and Téléphone are stored in the cart store, the confirmation modal in `CartDrawer` only needs Prénom — the other fields are picked up when `createOrder` is called (step 5 extends `createOrder`).

  On order submission path: `isTakeaway` orders must redirect to `/commander/tracking?tracking={sessionId}` instead of `/table/takeaway/tracking`. Handle this by passing the route via a prop or by detecting `tableId === 'takeaway'` in `CartDrawer`. The simplest approach: add an optional `trackingBasePath?: string` prop to `CartDrawer` (default `'/table/${tableId}'`), and pass `'/commander'` from `TakeawayPage`. This avoids duplicating the drawer logic.

  > **Decision**: rather than passing a prop into `CartDrawer`, detect `tableId === 'takeaway'` inside `CartDrawer.handlePlaceOrder` and redirect to `/commander/tracking?tracking={sessionId}`. This keeps `CartDrawer` self-contained.

  Files:
  - `src/pages/client/TakeawayPage.tsx` *(new)*

  Verify: `npm run lint` — zero errors.

---

- [ ] 5. **Extend `createOrder` to persist takeaway fields, and update `CartDrawer`**

  In `CartDrawer.handlePlaceOrder`, read `clientNom`, `clientTelephone`, `isTakeaway` from the cart store and pass them to `createOrder`. After order is placed, if `tableId === 'takeaway'` navigate to `/commander/tracking?tracking=${sessionId}`, otherwise navigate to `/table/${tableId}/tracking?tracking=${sessionId}` (existing path).

  In `src/lib/firestore.ts` there is no change needed — `createOrder` accepts `Omit<Order, 'id'>` so the new optional fields flow through without code changes there. The `Order` type already has them after step 1.

  Files:
  - `src/components/client/CartDrawer.tsx`

  Verify: `npm run lint` — zero errors.

---

- [ ] 6. **Add `/commander/tracking` route and handle `tableId === 'takeaway'` in `OrderTracking`**

  In `App.tsx`, add `<Route path="/commander/tracking" element={<OrderTracking />} />` as a public route (no `ProtectedRoute`). This route works because `OrderTracking` already reads `tableId` from `useParams` and falls back to empty string when absent — the tracking session comes entirely from the `?tracking=` query param.

  In `OrderTracking.tsx`:
  - When `tableId` is empty or `'takeaway'`, the "back to menu" button should navigate to `/commander` instead of `/table/${tableId}`.
  - Add PICKUP status handling: show a card "Votre commande est prête ! Venez la récupérer 🛍️" with a bouncing 🛍️ animation (same pattern as the READY card). Add `PICKUP` to the `STEPS` array after `READY` with a `Package` icon from lucide-react and `labelKey: 'order.status.PICKUP'`. Add `PICKUP` to `STATUS_ORDER` after `SERVED`.
  - The `handleBackToMenu` function: `if (!tableId || tableId === 'takeaway') navigate('/commander', { replace: true })` else existing behavior.
  - The redirect effect (no order found, navigate back to menu) similarly targets `/commander` when `tableId` is absent/`takeaway`.

  Files:
  - `src/App.tsx`
  - `src/pages/client/OrderTracking.tsx`

  Verify: `npm run lint` — zero errors.

---

- [ ] 7. **Add takeaway badge and RÉCUPÉRÉ button to `OrderActions` and `CaissierDashboard`**

  **`OrderActions.tsx`**:
  - For the serveur role (which now also handles READY→SERVED for dine-in): when `order.isTakeaway` and `order.statut === OrderStatus.READY`, show button label `t('order.action.mark_retrieved')` (🛍️) and transition to `OrderStatus.PICKUP` instead of `SERVED`.
  - For non-takeaway READY orders, behavior is unchanged (`SERVED`).
  - For the caissier role, add a takeaway badge above the action buttons when `order.isTakeaway`.

  **`CaissierDashboard.tsx`**:
  - In the table group header, when all orders in the group have `isTakeaway: true`, show "🛍️ À emporter" badge instead of a table number. When `tableId === 'takeaway'`, display "Commandes à emporter" as section heading.

  Files:
  - `src/components/serveur/OrderActions.tsx`
  - `src/pages/caissier/CaissierDashboard.tsx`

  Verify: `npm run lint` — zero errors.

---

- [ ] 8. **Update `Receipt.tsx` to handle takeaway orders**

  In the Meta section, add a conditional: if `order.isTakeaway`, show `"📦 Commande à emporter"` instead of the table number row. Add two rows showing `order.clientNom` and `order.clientTelephone` when present. Update the plain-text `handleDownload` similarly.

  Files:
  - `src/components/shared/Receipt.tsx`

  Verify: `npm run lint` — zero errors.

---

- [ ] 9. **Update `RootRedirect` in `App.tsx` and register `/commander` route**

  Change `RootRedirect` so that when `!user` (no authenticated staff user), redirect to `/commander` instead of `/login`. Staff roles (`admin`, `serveur`, `cuisine`, `caissier`) continue to redirect to their dashboards. The existing `client` role in `roleRedirects` should also go to `/commander`.

  Add lazy import for `TakeawayPage` and add `<Route path="/commander" element={<TakeawayPage />} />` as a public route (no `ProtectedRoute`). The `/commander/tracking` route was added in step 6.

  Files:
  - `src/App.tsx`

  Verify: `npm run lint` — zero errors.

---

- [ ] 10. **Update `public/manifest.json` and `vite.config.ts` for PWA start_url**

  In `public/manifest.json`, set `"start_url": "/commander"` and update the `shortcuts` array to point `url` to `/commander`.

  In `vite.config.ts`, update the `manifest` block inside `VitePWA({ ... })` to also set `start_url: '/commander'`. Both manifest sources must agree or the build-time manifest (from vite.config) will overwrite the public one.

  In `src/main.tsx`, change `registerSW({ immediate: false })` to `registerSW({ immediate: true })` for prompt-free offline support as specified.

  Files:
  - `public/manifest.json`
  - `vite.config.ts`
  - `src/main.tsx`

  Verify: `npm run build` — build completes without errors; inspect `dist/manifest.webmanifest` and confirm `start_url` is `/commander`.

---

- [ ] 11. **Create `scripts/update-product-images.mjs`**

  New ESM script using `firebase-admin` (already in `devDependencies`). Pattern follows `scripts/seed.mjs`: read `scripts/serviceAccountKey.json` with `readFileSync`, call `initializeApp({ credential: cert(key) })`, then `getFirestore()`.

  Mappings to apply (iterate over an array of `{ id, filename }` objects):

  | productId | filename |
  |---|---|
  | `p-attieke` | `Attiéké.webp` |
  | `p-foufou` | `Foufou.jpg` |
  | `p-pate-sorgho` | `Pâte de sorgho, maïs, djénkoumé.webp` |
  | `p-salade-verte` | `Salade verte.webp` |
  | `p-soupe-poulet` | `Soupe au poulet.jpg` |
  | `p-soupe-champignon` | `Soupe aux champignons.jpg` |
  | `p-soupe-legumes` | `Soupe aux légumes.jpg` |
  | `p-soupe-poisson` | `Soupe de poisson.webp` |
  | `p-oeuf-plat` | `Œuf au plat.webp` |
  | `p-oeuf-brouille` | `Œuf brouillé.jpg` |

  For each entry, build the public URL as:
  `https://placedelavictoire-37a00.web.app/MENU/${encodeURIComponent(filename)}`

  Call `db.collection('products').doc(id).update({ imageUrl: url })` and `console.log('✅ Updated', id, '→', url)`.

  After writing the file, run it: `node scripts/update-product-images.mjs`

  Files:
  - `scripts/update-product-images.mjs` *(new)*

  Verify: Running `node scripts/update-product-images.mjs` logs 10 "✅ Updated …" lines and exits with code 0.

---

## Dependency order summary

Steps 1 → 2 → 3 must complete in order (types first, then i18n, then store). Steps 4 and 5 depend on 1–3. Step 6 depends on 4–5. Steps 7 and 8 depend only on step 1. Step 9 depends on 4. Step 10 is independent. Step 11 is fully independent (Node script, no TypeScript dependency).

Safe parallel batches for a coder:
- Batch A (types+i18n+store): steps 1, 2, 3
- Batch B (new page + cart): steps 4, 5 — after A
- Batch C (tracking + routes): step 6 — after B
- Batch D (staff UI): steps 7, 8 — after A (only need types)
- Batch E (PWA + manifest): step 10 — independent
- Batch F (image script): step 11 — independent
- Final: step 9 (App.tsx route wiring) — after B and C

Final build check after all steps: `npm run build` must complete without TypeScript errors.
