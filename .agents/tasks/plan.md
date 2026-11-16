# Implementation Plan — Rôle Caissier (Place de la Victoire)

## Context

The business problem: waitresses who validate orders get harassed by clients. The fix: a fixed "caissier" (cashier) tablet at the till validates/rejects all PENDING orders so waitresses never see them.

New order flow:
> Client orders (PENDING) → **Caissier** validates or rejects → Kitchen sees VALIDATED → prepares → READY → Serveur marks SERVI → marks PAYÉ

---

- [ ] 1. Add `caissier` to `UserRole` enum in `src/types/index.ts`.
      Add `caissier = 'caissier'` after the `cuisine` entry. No other changes in this file.
      Files: `src/types/index.ts`
      Verify: `npm run lint` — no TypeScript errors.

- [ ] 2. Add caissier translation keys to both i18n files.
      In `src/i18n/fr.json`: add top-level `"caissier"` block with keys `dashboard`, `title`, `pending_orders`, `no_pending`; add `"caissier": "Caissier"` to the `"roles"` block.
      In `src/i18n/en.json`: same structure in English.
      Files: `src/i18n/fr.json`, `src/i18n/en.json`
      Verify: `npm run lint` — passes (JSON syntax check via tsc import resolution).

- [ ] 3. Update `ROLE_STYLES` in `UserManagement.tsx` and add caissier option to `UserForm.tsx`.
      In `UserManagement.tsx`: add `[UserRole.caissier]: 'bg-teal-100 text-teal-700'` to the `ROLE_STYLES` record.
      In `UserForm.tsx`: add `<option value={UserRole.caissier}>{t('roles.caissier')}</option>` in the role `<select>`, after the cuisine option.
      Files: `src/pages/admin/UserManagement.tsx`, `src/components/admin/UserForm.tsx`
      Verify: `npm run lint` — no errors.

- [ ] 4. Refactor `OrderActions.tsx` to accept an optional `role` prop.
      Add `role?: 'serveur' | 'caissier'` (default `'serveur'`) to `OrderActionsProps`.
      Caissier mode: show VALIDER + REJETER only for `PENDING` orders (same logic as the current PENDING block).
      Serveur mode: show SERVI for `READY`, PAYÉ for `SERVED`, receipt view for `PAID` — same as today, but NOT PENDING (remove the PENDING block from the serveur path, since caissier now owns that transition).
      Files: `src/components/serveur/OrderActions.tsx`
      Verify: `npm run lint` — no errors.

- [ ] 5. Update `ServeurDashboard.tsx` to remove PENDING from its status list.
      Remove `OrderStatus.PENDING` from `WAITER_STATUSES` (new list: VALIDATED, IN_PREPARATION, READY, SERVED).
      Remove `OrderStatus.PENDING` from `GROUP_ORDER`.
      Pass `role="serveur"` to every `<OrderActions>` instance (the `PendingAwareOrderRow` sub-component).
      Remove the `knownPendingIds` sound-notification logic that fires on PENDING — the caissier dashboard will own that notification.
      Files: `src/pages/serveur/ServeurDashboard.tsx`
      Verify: `npm run lint` — no errors.

- [ ] 6. Create `src/pages/caissier/CaissierDashboard.tsx`.
      Mirror the structure of `ServeurDashboard.tsx`:
      - Same header gradient (`bg-gradient-to-r from-white to-[#FFF8F0]`), clock, user name, language switcher, logout button.
      - `useOrders` called with `role: UserRole.caissier` and `statuses: [OrderStatus.PENDING]`.
      - Orders grouped by `tableId` (not by status — there is only one status).
      - Play `notification.mp3` when a new PENDING order arrives (same `knownPendingIds` + `hasInteracted` pattern from ServeurDashboard).
      - Each order card: `<OrderCard order={order} />` + `<OrderActions order={order} role="caissier" />`.
      - Empty state: `t('caissier.no_pending')`.
      - `useOrders` accepts `role: UserRole.caissier` — in `useOrders.ts` the condition `role === 'cuisine' || role === 'serveur'` becomes `role === 'cuisine' || role === 'serveur' || role === 'caissier'` so it uses the status-based path.
      Files: `src/pages/caissier/CaissierDashboard.tsx`, `src/hooks/useOrders.ts`
      Verify: `npm run lint` — no errors.

- [ ] 7. Add `/caissier` route and caissier to redirects in `App.tsx` and `LoginPage.tsx`.
      In `App.tsx`:
      - Lazy-import `CaissierDashboard`.
      - Add `caissier: '/caissier'` to the `roleRedirects` map in `RootRedirect`.
      - Add a `<Route element={<ProtectedRoute role={'caissier' as UserRole} />}>` wrapping `<Route path="/caissier" element={<CaissierDashboard />} />`, immediately after the serveur route.
      In `LoginPage.tsx`:
      - Add `caissier: '/caissier'` to the `roleRedirects` object.
      Files: `src/App.tsx`, `src/pages/LoginPage.tsx`
      Verify: `npm run lint` — no errors.

- [ ] 8. Update Firestore security rules to grant caissier write access to orders.
      The current `orders` rule already allows `update` to any authenticated user, so the security boundary holds. However the `users` document read must also work for caissier. Both are satisfied by existing rules — **no change needed to `firestore.rules`** unless tighter role-based rules are added later. Add a comment block above the orders rule noting the roles that may update: `// Roles: caissier (validate/reject PENDING), cuisine (start/ready), serveur (serve/pay), admin (all)`.
      Files: `firestore.rules`
      Verify: rules file remains valid — `firebase emulators:start --only firestore` (if available) or visual inspection confirms no syntax error.

- [ ] 9. Add `caissier` demo account to `src/seed/seedAccounts.ts`.
      Read `VITE_SEED_CAISSIER_PASSWORD` from `import.meta.env`.
      Add it to the guard check alongside the existing three passwords.
      Add a fourth `DemoAccount` entry: `{ email: 'caissier@placelavictoire.com', password: caissierPwd, nom: 'Caissier Demo', role: UserRole.caissier }`.
      Files: `src/seed/seedAccounts.ts`
      Verify: `npm run lint` — no errors.

- [ ] 10. Update `.env.example` and `COMPTES.md`.
       In `.env.example`: add `VITE_SEED_CAISSIER_PASSWORD=` after the cuisine line.
       In `COMPTES.md`: add a caissier row to the Staff table (`| Caissier | caissier@placelavictoire.com | Caissier2024! | /caissier — validation commandes |`) and add the Firestore JSON block for the caissier document.
       Files: `.env.example`, `COMPTES.md`
       Verify: `npm run lint` — no errors (these are non-TS files; check passes trivially).

- [ ] 11. Final build verification.
       Run the full build to confirm all TypeScript is clean and Vite bundles without errors.
       Files: none (verification only)
       Verify: `npm run build` — exits 0, no type errors, no missing imports.
