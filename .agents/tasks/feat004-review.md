# Waiter and Kitchen dashboards for Place de la Victoire

FEAT-004 delivers the full operator-facing layer of the PWA: `LoginPage`, the waiter's `ServeurDashboard` with its three sub-components (`TableCard`, `OrderCard`, `OrderActions`), and the kitchen's `CuisineDashboard` with `KanbanBoard`, `TicketCard`, and `TimerSelector`. It also ships the final i18n trees for both `fr.json` and `en.json`. The build reports zero errors.

The implementation is well-structured overall: enum values match the type definitions, Firestore helpers are used consistently, and i18n coverage is nearly complete. Two issues need fixing before shipping: an undefined CSS animation class that makes the pending-order highlight non-functional, and a semantic field reuse in `TicketCard` that causes the countdown timer to tick from the wrong origin. A handful of smaller gaps — a hardcoded string, a catch-all error message, a missing `aria-label` on the logout button — round out the required changes.

**Watch for:**
- `animate-pulse-ring` class applied in `ServeurDashboard` has no definition in Tailwind config or CSS — the pending ring animation is silently dropped. (**confirmed**)
- `TicketCard.handleStart` overwrites `validatedAt` with `Timestamp.now()` to anchor the prep countdown, but the Order type uses `validatedAt` to mean "waiter validation time". This creates a semantic conflict with any code that reads `validatedAt` for audit or analytics purposes. (**confirmed**)

**Verdict**: NEEDS_CHANGES

---

## High-level view

The waiter dashboard subscribes to five order statuses via `useOrders`, groups them into a status-ordered grid, and plays an audio notification for new PENDING arrivals — gated on user interaction to respect browser autoplay policy. Table filtering is client-side; the Firestore listener does not change when a table is selected.

The kitchen Kanban drives a live countdown in `TicketCard` using `validatedAt + estimatedMinutes`, but `handleStart` overwrites `validatedAt` with the prep-start timestamp rather than a dedicated `prepStartedAt` field. The countdown works at runtime in the same session, but it corrupts `validatedAt` for any admin report or analytics query that reads it as "when the waiter approved the order".

The pending-order ring animation in `ServeurDashboard` references `animate-pulse-ring`, which is defined nowhere — not in `index.css`, not in `tailwind.config.js`. The class is silently discarded; the pulsing highlight never renders.

The login `catch` block maps all failures — network errors, missing Firestore user document, wrong credentials — to `auth.error_invalid`, which is misleading for outages. The `no_user_doc` error is already thrown explicitly and can be caught separately.

i18n coverage across both locale files is symmetric, with one gap: the `"Tables"` heading in `ServeurDashboard`'s sidebar is a hardcoded JSX string.

`OrderActions.handleValidate` does not call `incrementProductOrderCount`, so the `orderCount` field that drives "most ordered = most visible" in the menu never increments through the waiter flow.

---

<details>
<summary>Issues (6)</summary>

1. **Missing `animate-pulse-ring` class** — The CSS class `animate-pulse-ring` applied to pending orders in `ServeurDashboard` is defined nowhere (not in `index.css`, not in `tailwind.config.js`). Add a `@keyframes` + `animation` rule in `index.css` or define it under `theme.extend.animation` / `theme.extend.keyframes` in `tailwind.config.js`. Without this, the pulsing ring for new PENDING orders never fires.

2. **`validatedAt` overwritten at prep start** — `TicketCard.handleStart` writes `validatedAt: Timestamp.now()` to anchor the countdown. This clobbers the timestamp set by the waiter during validation, conflicting with any downstream code (admin reports, audit log) that reads `validatedAt` as "when the waiter approved the order". Add a dedicated `prepStartedAt?: Timestamp` field to the `Order` type and use that field for both the write and the countdown calculation.

3. **`orderCount` never incremented** — `OrderActions.handleValidate` does not call `incrementProductOrderCount`. The `orderCount` field that drives most-popular ranking in the menu never updates through the waiter flow. Call `incrementProductOrderCount` for each `item` in `order.items` after successfully setting the status to VALIDATED.

4. **Hardcoded "Tables" heading** — `ServeurDashboard` line 151 renders the string `Tables` directly in JSX without a translation key. Add `table.section_title` (or reuse `admin.tables.title`) to both locale files and replace the literal.

5. **Catch-all maps every failure to wrong-credentials message** — `LoginPage.handleSubmit` catches all errors with `t('auth.error_invalid')`. A missing Firestore user document (`no_user_doc`) or a network failure should surface `t('auth.error_generic')` instead. The thrown `Error('no_user_doc')` message is already there; check for it in the catch block and branch accordingly.

6. **Logout buttons missing `aria-label`** — The logout `<button>` in both `ServeurDashboard` and `CuisineDashboard` renders text via `t('nav.logout')`, but has no explicit `aria-label`. Add `aria-label={t('nav.logout')}` to both for explicit screen-reader association. (**possible** — not a blocker but worth fixing before launch)

</details>

---

<details>
<summary>Details</summary>

## Pending-order ring animation is undefined

`ServeurDashboard` applies `animate-pulse-ring` to the wrapper `<motion.div>` for PENDING orders:

```tsx
className={
  isPending
    ? 'rounded-xl ring-2 ring-yellow-400 ring-offset-1 animate-pulse-ring'
    : ''
}
```

Neither `index.css` nor `tailwind.config.js` defines this class. Tailwind's JIT scanner will see the class string but find no matching definition, so it emits nothing. The ring renders statically (no animation) on the first paint and disappears on the next Tailwind rebuild. The fix is a keyframe in `index.css`:

```css
@layer utilities {
  .animate-pulse-ring {
    animation: pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  @keyframes pulse-ring {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
  }
}
```

or equivalently via `tailwind.config.js` `theme.extend.keyframes` / `theme.extend.animation`.

## `validatedAt` semantic collision in TicketCard

`handleStart` in `TicketCard` writes:

```ts
await updateOrderStatus(order.id, {
  statut: OrderStatus.IN_PREPARATION,
  estimatedMinutes: minutes,
  validatedAt: Timestamp.now(),   // ← clobbers waiter validation timestamp
});
```

The countdown then reads `order.validatedAt` as the prep start anchor. At runtime this works because the same timestamp drives both the write and the display within the same client session. But `validatedAt` is semantically "when the waiter validated the order" — `OrderActions.handleValidate` sets it at that point. Any admin report, analytics query, or future workflow step that reads `validatedAt` will see the prep-start time instead.

The correct fix is to add `prepStartedAt?: Timestamp` to the `Order` interface in `src/types/index.ts`, write `prepStartedAt: Timestamp.now()` in `handleStart`, and update the countdown `useEffect` to read `order.prepStartedAt ?? order.validatedAt`.

## Login error handling

`handleSubmit` catches everything — Firebase auth errors, Firestore read errors, missing user document — and shows `auth.error_invalid` ("Email ou mot de passe incorrect"). A user hitting a network outage or an admin who deleted their Firestore document will see a misleading message. The thrown `new Error('no_user_doc')` is already distinguishable:

```ts
} catch (err) {
  if (err instanceof Error && err.message === 'no_user_doc') {
    setError(t('auth.error_generic'));
  } else {
    setError(t('auth.error_invalid'));
  }
}
```

## TimerSelector custom input — edge case with the disable guard

The `disabled` prop on the confirm button evaluates `parseInt(custom, 10) < 1` but does not check `> 120`. A user typing 999 can click the button while the input is technically outside the displayed range. `handleCustomConfirm` already guards with `val <= 120`, so the worst outcome is a no-op click — but the button appears enabled when it should not. Add `|| parseInt(custom, 10) > 120` to the disabled expression for consistency.

## AnimatePresence mode in KanbanBoard

Both columns use `<AnimatePresence>` without a `mode` prop. The default `"sync"` animates exit and enter simultaneously. For tickets moving between columns, `mode="popLayout"` is more appropriate — the exiting card shrinks in place while the entering card expands in the new column. Not a bug, but worth updating before launch.

## `incrementProductOrderCount` not called on validation

`updateOrderStatus.ts` exports `incrementProductOrderCount` specifically to bump a product's popularity counter when an order is validated. `OrderActions.handleValidate` does not call it. The `orderCount` field — which drives "most ordered = most visible" in the menu — will never increment through the waiter flow. This is likely an oversight from the FEAT-003/FEAT-004 boundary.

</details>

---

<details>
<summary>File map</summary>

| File | What changed |
|---|---|
| `src/pages/LoginPage.tsx` | New: Firebase auth login, role-based redirect, bilingual form |
| `src/components/serveur/OrderCard.tsx` | New: order detail card with date-fns relative time, Framer layout animation |
| `src/components/serveur/OrderActions.tsx` | New: status-conditional action buttons (validate, reject, serve, pay) |
| `src/components/serveur/TableCard.tsx` | New: table summary card with zone badge and active order count |
| `src/pages/serveur/ServeurDashboard.tsx` | New: full waiter view with table filter, grouped orders, audio notification |
| `src/components/cuisine/TimerSelector.tsx` | New: quick-time grid + custom numeric input for prep timer |
| `src/components/cuisine/TicketCard.tsx` | New: kitchen receipt card with live countdown and status actions |
| `src/components/cuisine/KanbanBoard.tsx` | New: two-column Kanban (VALIDATED / IN_PREPARATION) with AnimatePresence |
| `src/pages/cuisine/CuisineDashboard.tsx` | New: kitchen view with audio notification for new validated orders |
| `src/i18n/fr.json` | Added keys: `serveur.*`, `cuisine.*`, `timer.*`, `login.*` |
| `src/i18n/en.json` | Same additions, English translations |

Full diff: `git diff main -- src/`
</details>
