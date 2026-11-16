# Takeaway bug-fix batch: six-spec verification

This pass verifies six targeted bug-fix specifications against the current source: `isTakeaway` logic in `OrderTracking`, the `prenom` store seed in `CartDrawer`, phone validation gating in `TakeawayPage`, the PWA manifest split, the caissier sound filter, and the PICKUP countdown translation. Five of the six are correctly implemented. One fix is broken at the source level.

**Watch for:** The `setClientPrenom` sync `useEffect` in `TakeawayPage.tsx` has been accidentally commented out — the `useEffect(...)` call sits on the same line as a `//` comment, making it dead code. The store's `clientPrenom` never receives the value the user types, so `CartDrawer` initialises `prenom` from a store field that is always empty for takeaway customers.

**Verdict**: CHANGES_REQUESTED

---

## High-level view

The `isTakeaway` derivation is clean: `order?.isTakeaway === true` with no `|| tableId` fallback, confirmed at line 95 of `OrderTracking.tsx`. The PICKUP stepper track and the `order.countdown.pickup` translation key are both present and wired correctly.

`CartDrawer` correctly seeds its `prenom` state via `useState(storePrenom ?? '')`, where `storePrenom` comes from `useCartStore((s) => s.clientPrenom)`. The initialiser is correct — but the upstream writer is broken (see below).

`TakeawayPage` has the phone `onBlur` validation, the inline error message, the FAB `disabled` condition, and the `takeaway.phone_error` keys in both locale files — all present and correct. However, the `useEffect` that pushes the local `prenom` state into the store is dead code: the entire call has been placed after a `//` comment on the same physical line, so the TypeScript compiler and runtime both ignore it. `setClientNom` and `setClientTelephone` have their own lines and sync correctly; only `clientPrenom` is affected.

`vite.config.ts` has no `manifest:` block inside `VitePWA` — the manifest is handled exclusively by `public/manifest.json`, which correctly declares `"start_url": "/commander"`.

The caissier sound filter covers both `OrderStatus.PENDING` and `OrderStatus.PICKUP` in both the `useOrders` call and the detection `useEffect`, satisfying spec 5.

---

<details>
<summary>Issues (1)</summary>

1. **`setClientPrenom` sync commented out** — In `TakeawayPage.tsx`, the `useEffect` that calls `setClientPrenom(prenom)` is placed on the same line as a `//` comment (line 49), making it dead code. `clientPrenom` in the cart store never receives the value the user types. Fix: move `useEffect(() => { setClientPrenom(prenom); }, [prenom, setClientPrenom]);` to its own line, below the comment.

</details>

---

<details>
<summary>Details</summary>

### Dead `setClientPrenom` sync in TakeawayPage

The comment/code collision is confirmed at line 49 of `TakeawayPage.tsx`:

```ts
// ── Sync form → store ──────────────────────────────────────────────────────  useEffect(() => { setClientPrenom(prenom); }, [prenom, setClientPrenom]);
```

Everything after `//` on that line is a comment. The sibling effects for `nom` and `telephone` are on separate lines and work correctly. The result is that when a takeaway customer types their first name in the form, `cartStore.clientPrenom` stays `''`. `CartDrawer` then initialises its `prenom` state to `''` (spec 2 is correctly written, but the data it reads from the store is always empty), the order is submitted with an empty `clientPrenom`, and the tracking header shows no name.

The fix is one line: pull the `useEffect` onto its own line.

### Spec verification summary

| # | File | Spec | Result |
|---|------|------|--------|
| 1 | `OrderTracking.tsx` | `isTakeaway` = `order?.isTakeaway === true`, no `\|\| tableId` | ✅ Confirmed |
| 2 | `CartDrawer.tsx` | `prenom` useState from `useCartStore((s) => s.clientPrenom) ?? ''` | ✅ Confirmed |
| 3 | `TakeawayPage.tsx` | onBlur validation, inline error, FAB disabled, locale keys | ✅ Confirmed (but upstream broken — see above) |
| 4 | `vite.config.ts` / `manifest.json` | No `manifest:` in VitePWA; `start_url: /commander` | ✅ Confirmed |
| 5 | `CaissierDashboard.tsx` | Sound filter includes `OrderStatus.PICKUP` | ✅ Confirmed |
| 6 | `OrderTracking.tsx` | PICKUP card uses `t('order.countdown.pickup')`; both locale files have key | ✅ Confirmed |

</details>

---

<details>
<summary>Files checked</summary>

- `src/pages/client/OrderTracking.tsx` — isTakeaway derivation, PICKUP card, countdown key
- `src/components/client/CartDrawer.tsx` — prenom useState initialiser
- `src/pages/client/TakeawayPage.tsx` — phone validation, FAB gate, prenom sync effect
- `vite.config.ts` — VitePWA configuration
- `public/manifest.json` — start_url value
- `src/pages/caissier/CaissierDashboard.tsx` — sound filter statuses
- `src/i18n/fr.json` — takeaway.phone_error, order.countdown.pickup
- `src/i18n/en.json` — takeaway.phone_error, order.countdown.pickup

</details>
