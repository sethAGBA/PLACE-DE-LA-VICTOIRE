# Takeaway orders, product images, and PWA home page

This change adds a full takeaway ordering flow to the restaurant app. Clients visiting `/commander` see a branded landing page with a form for their name, phone, and dine-in/takeaway mode; from there they browse the menu, add items to a cart, and submit. The order enters the existing PENDING → VALIDATED → IN_PREPARATION → READY pipeline and then diverges: takeaway orders get a new PICKUP status (server marks "retrieved") before the caissier records payment. The same commit updates the PWA `start_url` to `/commander`, adds product images, and switches the service worker to `immediate: true`.

Watch for: **(confirmed)** the `isTakeaway` detection in `OrderTracking` falls back to `tableId === ''` which will incorrectly flag normal table orders where `useParams` returns an empty string — this can flip the stepper to the takeaway track for dine-in clients. **(confirmed)** The CartDrawer's confirmation modal asks for a first name even though `TakeawayPage` already wrote it into the store; on the takeaway track the user is asked to retype their name, creating friction and a data inconsistency if they retype it differently. **(confirmed)** Phone validation only runs at order-submission time (inside `CartDrawer`), not on the form itself in `TakeawayPage`, so a client with an invalid number reaches the cart and encounters the error only when they try to confirm.

**Verdict**: NEEDS_CHANGES

---

## High-level view

`/commander` is registered as a bare `<Route>` with no `ProtectedRoute` wrapper and `RootRedirect` sends unauthenticated visitors there, so the route is correctly public. The `ProtectedRoute` component continues to guard all staff paths unchanged.

The PICKUP status is threaded through every layer that needed it: `OrderStatus` enum, `Badge`, `OrderCard`, `TicketCard`, `ServeurDashboard`'s watched-statuses list, `OrderActions`, `CaissierDashboard`'s subscribed statuses, `OrderTracking`'s takeaway stepper, and both i18n files. The Firestore composite index on `(sessionId, createdAt)` is declared in `firestore.indexes.json`.

Takeaway tracking uses a dedicated `getOrdersBySessionId` query instead of the table-based path, which is correct because takeaway orders have `tableId === 'takeaway'` and the existing `getOrdersByTable` branch would still catch them — but `useOrders` checks `!tableId` before falling through to the session query. On the `/commander/tracking` route `useParams` returns `tableId = undefined`, which coerces to the empty string `''` via the default parameter, triggering the session-id path rather than the table path. The logic is therefore correct for the tracking route, but the `isTakeaway` derivation reuses the same `tableId === ''` condition and that is fragile.

The CartDrawer phone gate (`!/^\+228\d{8}$/`) is applied only at the moment the confirmation modal's submit button is pressed. `TakeawayPage` renders the phone field with a `pattern` attribute, but HTML5 pattern validation on a bare `<input>` without a wrapping `<form>` does not fire natively, and the drawer does not read this validation state. Clients get no inline feedback until they hit confirm.

The confirmation modal in `CartDrawer` prompts for a first name via its own local `prenom` state and passes `clientPrenom: prenom.trim()` to `createOrder`, while `TakeawayPage` has already synced the user's typed first name into the store. These two values are independent; the store's `clientPrenom` is never read by `CartDrawer`. On the takeaway track the client types their name twice, and if they retype it differently the receipt shows the confirmation-modal version.

The duplicate `start_url` definition — once in `vite.config.ts`'s `VitePWA` manifest block and once in `public/manifest.json` — is harmless at runtime (Vite serves the generated one and ignores the public file during dev, while Firebase Hosting serves `public/manifest.json` in production). The two files are now in sync on `/commander`, but the divergence is a maintenance hazard: a future edit to one will silently diverge from the other.

`registerSW({ immediate: true })` combined with `registerType: 'autoUpdate'` in `vite.config.ts` means the service worker activates and takes control immediately on first install. For a PWA that needs to work offline on first visit this is correct, but it also means users already on the app will get the new service worker without a page reload prompt, which is the intended behavior given `autoUpdate`.

---

<details>
<summary>Issues (6)</summary>

1. **`isTakeaway` false-positive on empty tableId** — `OrderTracking` sets `isTakeaway = true` when `tableId === ''`. The route `/commander/tracking` has no `:tableId` param so `useParams` returns `undefined`, defaulted to `''`. That is correct for the takeaway path. However, any future route that renders `OrderTracking` without a tableId param will also incorrectly display the takeaway stepper. Rename the fallback condition to only check `order?.isTakeaway === true` (the field is already written to Firestore), drop the `|| tableId === ''` guard.

2. **Double name entry on takeaway** — `CartDrawer` manages its own `prenom` local state and writes it to `createOrder` as `clientPrenom`, ignoring the store's `clientPrenom` set by `TakeawayPage`. On the takeaway track the client types their first name on the form and then again in the confirmation modal. Pre-fill the modal's `prenom` state from the store's `clientPrenom` (use `useCartStore((s) => s.clientPrenom)` as the initial value of `useState`).

3. **Phone validation not surfaced inline** — The `pattern` attribute on the phone `<input>` in `TakeawayPage` has no effect without a `<form>` submit trigger. Clients receive no feedback about an invalid number until they open the cart and press confirm. Add a controlled validation check on blur or on the "open cart" action in `TakeawayPage`, or at minimum surface the regex error in `TakeawayPage`'s UI before the drawer is opened.

4. **Duplicate manifest definition** — `start_url` and other manifest fields are defined in both `vite.config.ts` (processed by vite-plugin-pwa, served at `/manifest.webmanifest` in dev/prod build) and `public/manifest.json` (served as a static file by Firebase Hosting). In production Firebase Hosting serves `public/manifest.json`, not the Vite-generated one, so the two must stay in sync manually. Remove the manifest block from `vite.config.ts` and rely solely on `public/manifest.json`, or vice versa, to have a single source of truth.

5. **PICKUP not visible to caissier for in-progress payment** — `CaissierDashboard` subscribes to `[PENDING, PICKUP]`, which is correct. However the notification-sound logic only counts `PENDING` orders: `const currentPending = orders.filter((o) => o.statut === OrderStatus.PENDING)`. A PICKUP order arriving (customer walking in to collect) produces no audio alert. Consider including PICKUP in the alert filter if audio notification is desired for that event.

6. **`order.status.PICKUP` label is hardcoded in PICKUP card** — The `isPickup` card in `OrderTracking` renders `'Votre commande est prête ! Venez la récupérer 🛍️'` as a hardcoded French string rather than an i18n key. Both `fr.json` and `en.json` include `order.status.PICKUP` and `takeaway.*` keys but no key for this specific message. Add an i18n key (e.g. `order.countdown.pickup`) in both locale files and use `t()`.

</details>

<details>
<summary>Details</summary>

## PICKUP status flow end-to-end

The status machine for takeaway is: PENDING → VALIDATED → IN_PREPARATION → READY → PICKUP → PAID, and every layer that needed updating received the new status.

One behavioral gap: both `OrderActions` branches (serveur and caissier) show a PICKUP → PAID button, so either role can mark it paid. `updateOrderStatus` is a plain `updateDoc` with no transaction; a simultaneous double-tap by two staff members writes the same PAID patch twice, which is idempotent and not a data-corruption risk, but the payment may be recorded without the caissier's awareness if the server triggers it first.

## `isTakeaway` detection in OrderTracking — fragile fallback

```ts
const isTakeaway = order?.isTakeaway === true || tableId === 'takeaway' || tableId === '';
```

The first condition (`order?.isTakeaway === true`) is authoritative because `isTakeaway` is written to Firestore at order creation. The two fallbacks are defensive, but `tableId === ''` is the coerced default of `useParams`'s `undefined` and will match any route that renders `OrderTracking` without a `:tableId` segment, not just the takeaway route. If a dine-in order is opened via a path that lacks the segment (e.g. a future deep link), the stepper silently switches to the takeaway track. Dropping the `|| tableId === ''` condition and relying on `order.isTakeaway` is safer.

## Form validation gap — phone number

`TakeawayPage` applies `pattern="^\+228\d{8}$"` on the phone input, but the input is standalone — there is no surrounding `<form>` element to trigger HTML5 constraint validation. The browser will not display validation errors on the field until a form submit event fires. The only gate is in `CartDrawer.handlePlaceOrder`, which runs after the user opens the drawer, reviews their cart, and presses the confirm button. A client with a malformed phone number gets no feedback for several interaction steps. A simple `onBlur` regex check in `TakeawayPage` or disabling the floating cart button when the phone is invalid would catch this earlier.

## Double name entry

`CartDrawer` holds its own `prenom` local state initialized to `''`:

```ts
const [prenom, setPrenom] = useState('');
```

It passes this to `createOrder` as `clientPrenom`. The store's `clientPrenom` — written by `TakeawayPage` via `setClientPrenom` on every keystroke — is never read here. The confirmation modal therefore shows an empty name field on the takeaway flow even though the client already typed their name. The fix is one line: initialize from the store.

## Firestore index deployment requirement

The new `(sessionId ASC, createdAt DESC)` composite index in `firestore.indexes.json` must be deployed before the feature goes live. Without it, Firestore rejects the `getOrdersBySessionId` query in production with a "requires an index" error, leaving takeaway clients on a spinner forever. Run `firebase deploy --only firestore:indexes` before shipping.

## i18n coverage gap

Both locale files received matching keys for `takeaway.*`, `order.status.PICKUP`, and `order.action.mark_retrieved`. The PICKUP celebration card in `OrderTracking` renders a hardcoded French string (`'Votre commande est prête ! Venez la récupérer 🛍️'`) with no corresponding i18n key, so English-language clients see French text.

</details>

---

<details>
<summary>File map</summary>

| File | What changed |
|---|---|
| `src/types/index.ts` | Added `PICKUP` to `OrderStatus`; added `clientNom`, `clientTelephone`, `isTakeaway` to `Order` |
| `src/store/cartStore.ts` | Added `clientNom`, `clientTelephone`, `isTakeaway` fields and their setters; `resetSession` and `partialize` updated |
| `src/lib/firestore.ts` | Added `getOrdersBySessionId` query |
| `firestore.indexes.json` | Added composite index on `(sessionId, createdAt)` |
| `src/hooks/useOrders.ts` | Added sessionId-based query branch for takeaway tracking; added `sessionId` to effect deps |
| `src/pages/client/TakeawayPage.tsx` | New page — public landing + form + menu + floating cart |
| `src/pages/client/OrderTracking.tsx` | Added takeaway stepper, PICKUP card, `isTakeaway` detection, back-to-menu routing for `/commander` |
| `src/components/client/CartDrawer.tsx` | Phone validation gate; passes `clientNom`, `clientTelephone`, `isTakeaway` to `createOrder`; takeaway routing post-order |
| `src/components/serveur/OrderActions.tsx` | PICKUP button for server (takeaway READY); PICKUP → PAID button; isTakeaway badge |
| `src/components/shared/Receipt.tsx` | Takeaway label; conditional `clientNom` and `clientTelephone` rows |
| `src/pages/caissier/CaissierDashboard.tsx` | Subscribes to PICKUP; takeaway group header and badge |
| `src/pages/serveur/ServeurDashboard.tsx` | PICKUP added to watched statuses and status dot map |
| `src/components/cuisine/TicketCard.tsx` | PICKUP border color |
| `src/components/serveur/OrderCard.tsx` | PICKUP status bar color |
| `src/components/ui/Badge.tsx` | PICKUP color theme |
| `src/App.tsx` | Added `/commander` and `/commander/tracking` routes; `RootRedirect` sends unauthenticated to `/commander` |
| `src/main.tsx` | `registerSW` switched to `immediate: true` |
| `public/manifest.json` | `start_url` → `/commander`; added Commander shortcut |
| `vite.config.ts` | `start_url` → `/commander` in VitePWA manifest block |
| `src/i18n/fr.json` | Added `takeaway.*`, `order.status.PICKUP`, `order.action.mark_retrieved` |
| `src/i18n/en.json` | Same additions as fr.json |
| `scripts/update-product-images.mjs` | Script to bulk-update Firestore products with image URLs |
| `public/MENU/*.{jpg,webp}` | Product images added |

Full diff: `git diff HEAD~2 HEAD`

</details>
