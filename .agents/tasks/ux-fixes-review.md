# Four UX fixes: indicatif préchargé, recherche sans filtre, carrousel hero, gate takeaway caissier

The commit `d60bc79` bundles four targeted UX improvements requested by the restaurant owner. The +228 indicatif is now pre-filled in the phone field so customers don't type the country code manually. The search bar in both client pages now shows results directly, bypassing the category filter. The TakeawayPage hero is replaced by a Framer Motion image carousel. The cashier dashboard now hides takeaway orders until at least one dine-in order exists. The build log path referenced in the instructions doesn't exist on disk, but the single commit in `git log` matches all four fix descriptions; evidence was gathered by reading the source files directly.

**Watch for:** (confirmed) The caissier gate excludes PICKUP-status orders from `tableOrders`, meaning a table order that has been picked up (`isTakeaway: true`) does not count as a dine-in order and cannot ungate takeaway orders — but PICKUP is semantically reserved for takeaway flows (see `OrderActions.tsx`), so this is consistent. (possible) `AnimatePresence mode="sync"` on the carousel means the enter and exit transitions run simultaneously; on slow devices both images are briefly visible during the cross-fade. `mode="wait"` would serialize them, but the difference is cosmetic. No blocking concerns.

**Verdict**: APPROVED

---

## High-level view

The +228 pre-load is a one-line `useState` initialization change in `TakeawayPage`, paired with an `onFocus` cursor-positioning handler so customers land at the right edit point. Phone validation and the error message are unchanged.

The search bypass applies an identical filter predicate to both `TakeawayPage` and `TablePage`: when the trimmed query is non-empty, the category filter is skipped and all matching products across categories are shown. The category tabs remain visible and interactive so users can still browse by category after clearing the search.

The carousel in `TakeawayPage` replaces the former static hero banner. It auto-advances every 4 seconds, uses Framer Motion `AnimatePresence` for a cross-fade, and renders clickable dot indicators. A "Commander maintenant" CTA smooth-scrolls to the form section. The image set is six hardcoded `/MENU/…` paths; availability depends on those files being present in the public directory.

The caissier gate is a single derived-state calculation: `tableOrders` and `takeawayOrders` are split by `tableId === 'takeaway'`, then `visibleOrders` is built as either `[...tableOrders, ...takeawayOrders]` or `tableOrders` alone. When no dine-in orders exist, takeaway orders are silently excluded and a `caissier.takeaway_waiting` hint is rendered. Both i18n keys (`takeaway_waiting` in French and English) are present and correctly scoped under `caissier`.

---

<details>
<summary>Issues (3)</summary>

1. **Carousel cross-fade overlap** — `AnimatePresence mode="sync"` runs enter and exit simultaneously; on slow connections or low-end devices, two images are briefly stacked and visible through each other. Change `mode="sync"` to `mode="wait"` to serialize the transition. Cosmetic only.
2. **Category tabs unresponsive during search** — (possible) clicking a tab while the search field is non-empty has no visible effect, which may read as broken to first-time users. Consider hiding the tabs or greying them out when a search is active.
3. **Takeaway order disappears on last table order close** — (possible) if the only dine-in order leaves PENDING state while a PENDING takeaway order exists, the takeaway order instantly vanishes from the cashier view with no notification. No test or guard covers this transition.

</details>

<details>
<summary>Details</summary>

### +228 indicatif pre-load

The cart-drawer validation at `CartDrawer.tsx:38` re-checks `^\+228\d{8}$` before submission, so the pre-filled prefix cannot produce a false pass for a half-entered number.

### Search bypass in TakeawayPage and TablePage

The category tabs remain rendered and interactive while a search is active; clicking a tab has no visible effect until the search field is cleared. Users who don't notice this may think the tabs are broken. This is an intentional priority (search over filter) but could confuse first-time users — worth noting for a future UX iteration.

### Hero carrousel

The carousel uses `AnimatePresence mode="sync"` with opacity-only transitions. `mode="sync"` causes the outgoing image's `exit` and the incoming image's `initial→animate` to run at the same time — both images at partial opacity overlap during the 0.8-second transition. On a solid background this reads as a cross-fade, which is acceptable. `mode="wait"` would prevent the overlap entirely at the cost of a brief blank between slides.

The six hardcoded image paths use `encodeURIComponent`-style percent-encoding inline in the array (e.g. `Petit%20d%C3%A9jeuner%20complet.jpg`). If any file is renamed or missing, the `<img>` renders a broken image silently — no fallback `onError` handler is present. This is a low-severity operational concern, not a code bug.

### Caissier takeaway gate

```ts
const tableOrders   = orders.filter((o) => o.tableId !== 'takeaway');
const takeawayOrders = orders.filter((o) => o.tableId === 'takeaway');

const visibleOrders = tableOrders.length > 0
  ? [...tableOrders, ...takeawayOrders]
  : tableOrders;
```

The `takeaway_waiting` hint message is shown when `tableOrders.length === 0 && takeawayOrders.length > 0`, which is exactly the hidden-orders scenario. The key is defined in both `fr.json` (`caissier.takeaway_waiting`) and `en.json` with correct copy. PICKUP-status orders land in `tableOrders` or `takeawayOrders` based on `tableId`, not `statut`, which aligns with how PICKUP is used in the codebase (only transitioning from READY on orders where `isTakeaway: true`, and those always have `tableId === 'takeaway'`).

### Not tested

No automated tests were added for any of the four fixes. The search bypass logic, the gate condition, and the +228 initialization are all untested. For the caissier gate specifically, the edge case — a PENDING takeaway order arrives while `tableOrders` transitions from non-empty to empty — is unexercised. In that scenario, the takeaway order would instantly disappear from the cashier view with no notification. Manual regression is the only current coverage.

</details>

---

<details>
<summary>File map</summary>

| File | Change |
|------|--------|
| `src/pages/client/TakeawayPage.tsx` | +228 pre-load, search bypass, hero carousel with Framer Motion |
| `src/pages/client/TablePage.tsx` | Search bypass (identical predicate) |
| `src/pages/caissier/CaissierDashboard.tsx` | Takeaway visibility gate by tableOrders count |
| `src/i18n/fr.json` | `caissier.takeaway_waiting` key added |
| `src/i18n/en.json` | `caissier.takeaway_waiting` key added |

Full diff: `git show d60bc79`

</details>
