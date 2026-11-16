# Implementation Plan — UI Redesign (Place de la Victoire PWA)

> **Scope:** visual only. Do NOT touch business logic (Firestore, stores, hooks), TypeScript types, i18n files, or Vite/Firebase config. All referenced libraries (framer-motion 11.11.9, recharts 2.13.3, lucide-react 0.460.0, tailwindcss 3.4.14) are already installed — no new dependencies.
>
> **Baseline commit (reviewer diff base):** `85b7525cc8d5ebb87f52fa229c0d3f0c2cde2483` (saved in `.agents/tasks/design-base.sha`). Baseline compiles clean: `npm run lint` exits 0.
>
> **Design tokens (brief):** primary `#D4580A`, secondary `#2D7D32`, background `#FFF8F0`, gold `#F59E0B`, text `#1A1A1A`, text-muted `#6B7280`, font Inter. Status colors: PENDING amber-500, VALIDATED blue-500, IN_PREPARATION orange-500, READY green-500, SERVED teal-500, PAID gray-400, REJECTED red-500.
>
> **Verification:** the project has NO test suite (`package.json` has no `test` script; no `*.test.*`/`*.spec.*` files exist). The real verification commands are `npm run lint` (`tsc --noEmit`) and `npm run build` (`tsc && vite build`). Each item below verifies with `npm run lint` (fast, catches type errors); the final item runs the full `npm run build`. A manual console-error check on the dev server is part of the final item.

## Decisions & discrepancies (resolved)

1. **Tailwind config is the right place for new tokens.** `tailwind.config.js` already defines `primary`/`secondary`/`background` and Inter. The brief's "do not touch config" refers to Vite/Firebase only; adding design tokens to Tailwind is in scope and reuses the existing named-token convention. Decision: extend `theme.extend.colors` with `gold`, `ink`, `muted` rather than sprinkling arbitrary `[#hex]` values everywhere. Status colors use the standard Tailwind palette (amber/blue/orange/green/teal/gray/red) — no config tokens needed.
2. **Card.tsx exists** (brief said "verify it exists / create if not"). It exists at `src/components/ui/Card.tsx`; modify, don't create.
3. **MenuCard.tsx is NOT in the brief's 15-file list but carries the TablePage "Cards produits" design** (photo, price, +/-, gold "Populaire" badge). Updating TablePage alone cannot achieve the product-card look. Decision: include `MenuCard.tsx` in the client-menu item — it is a required supporting file for the TablePage brief.
4. **TableCard.tsx is NOT in the 15-file list** but the ServeurDashboard brief ("Cards de table : indicateur de zone coloré…") maps to `src/components/serveur/TableCard.tsx`. Decision: include it as a supporting file in the serveur item.
5. **KanbanBoard.tsx is NOT in the 15-file list** but renders the cuisine Kanban columns described in the CuisineDashboard brief. Decision: include it in the cuisine item.
6. **Admin sidebar lives in `src/App.tsx` (`AdminLayout`), not in `AdminDashboard.tsx`.** The brief #10 ("Layout avec sidebar + contenu principal") requires a styled sidebar. Decision: restyle `AdminLayout` in `App.tsx` (add nav icons, active state, right shadow, gradient header) AND restyle `AdminDashboard.tsx` content — group both in the admin item. `App.tsx` is routing/layout, not Vite/Firebase config, so it is in scope.
7. **Cuisine Kanban stays 2 columns.** The brief says "colonnes (bleu/orange/vert)" but the kitchen subscribes to only VALIDATED + IN_PREPARATION (`KITCHEN_STATUSES` in CuisineDashboard). Adding a READY column would require changing `KITCHEN_STATUSES` = business logic, which is out of scope. Decision: keep 2 columns (blue=VALIDATED, orange=IN_PREPARATION), restyle headers; note the "vert" can't be added without a logic change.
8. **Serveur "sidebar gauche" = the existing tables aside.** The serveur view has no nav rail (only logout + language switcher in the top bar). The brief's "items de navigation" maps to the table cards in the left panel. Decision: keep structure, restyle the tables aside + top bar (gradient header, user, clock) per brief #8.
9. **Other admin pages** (MenuManagement, TableManagement, UserManagement, OrderHistory, Reports) are NOT in the brief's list and are out of explicit scope; they inherit the improved Button/Card/Badge primitives automatically. Not individually retravaillés.
10. **Spinner contrast fix.** `Spinner.tsx` hard-codes `text-primary`; on the new gradient primary/secondary/danger buttons a terracotta spinner is near-invisible. Decision: Button passes a variant-appropriate color to Spinner (white on colored variants, primary on ghost); keep Spinner's `text-primary` default for standalone loaders.
11. **`scrollbar-hide` utility** is used in `TablePage.tsx` but never defined. Decision: add it to `index.css` (currently a no-op).

---

## Plan

- [ ] 1. **Add design tokens + global CSS utilities (foundation).**
      Extend `tailwind.config.js` `theme.extend.colors` with `gold: '#F59E0B'`, `ink: '#1A1A1A'`, `muted: '#6B7280'` (keep existing `primary`/`secondary`/`background`/Inter). In `src/index.css` `@layer base`: add font smoothing (`-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale`) on `body`, `::selection` with primary color. Add custom scrollbar (`::-webkit-scrollbar` 8px, thumb `#D4580A` rounded-full, transparent track). In `@layer utilities` add: `.glass` (`backdrop-blur-md bg-white/80`), `.shimmer` (linear-gradient 90deg `#f1f1f1`→`#e6e6e6`→`#f1f1f1`, background-size 200%, `@keyframes shimmer` 1.5s infinite), `.scrollbar-hide` (`-ms-overflow-style: none; scrollbar-width: none; &::-webkit-scrollbar { display: none }`), and keep the existing `.animate-pulse-ring`.
      Files: `tailwind.config.js`, `src/index.css`
      Verify: `npm run lint` exits 0; confirm `bg-gold`, `text-ink`, `text-muted`, `.glass`, `.shimmer` are now valid by checking the built class list in a quick `npx tailwindcss -i src/index.css -o /tmp/tw.css` (optional) — primary check is `npm run lint`.

- [ ] 2. **Modernize Button + fix Spinner contrast (primitive).**
      `src/components/ui/Button.tsx`: replace `transition-colors` with `transition-all duration-200`, bump `rounded-lg` → `rounded-xl`. Variants — primary: `bg-gradient-to-r from-primary to-[#E8690F] text-white shadow-lg shadow-primary/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40`; secondary: `bg-gradient-to-r from-secondary to-[#3a9a3f] text-white shadow-lg shadow-secondary/30 hover:-translate-y-0.5`; danger: `bg-red-600 text-white shadow-lg shadow-red-500/30 hover:-translate-y-0.5`; ghost: `border border-primary/30 bg-white/60 text-primary hover:bg-primary/10`. Keep sizes/props unchanged. Pass a variant-appropriate Spinner color: add a `spinnerColor` map (`primary/secondary/danger` → `'text-white'`, `ghost` → `'text-primary'`) and pass it to `<Spinner size="sm" className={spinnerColor[variant]} />`. `src/components/ui/Spinner.tsx`: keep `text-primary` default but ensure the passed `className` overrides it (place `${className}` last in the class string so it wins).
      Files: `src/components/ui/Button.tsx`, `src/components/ui/Spinner.tsx`
      Verify: `npm run lint` exits 0.

- [ ] 3. **Restyle Card (primitive).**
      `src/components/ui/Card.tsx`: change base `rounded-xl` → `rounded-2xl`, `shadow-sm` → `shadow-md`, hover `shadow-md` → `shadow-lg`, add `transition-all duration-200`. Keep the `onClick` accessibility (role/tabIndex/keydown) and `ring-primary` focus unchanged.
      Files: `src/components/ui/Card.tsx`
      Verify: `npm run lint` exits 0.

- [ ] 4. **Restyle Badge with animated dot + sizes (primitive).**
      `src/components/ui/Badge.tsx`: add a `size?: 'sm'|'md'|'lg'` prop (sm: `text-xs px-2 py-0.5`, md: `text-xs px-2.5 py-1`, lg: `text-sm px-3 py-1`). Replace the `statusColorClasses` map with the brief's status palette as `{bg, text, dot}` triples: PENDING `bg-amber-100 text-amber-700 dot-bg-amber-500`; VALIDATED `bg-blue-100 text-blue-700 dot-bg-blue-500`; IN_PREPARATION `bg-orange-100 text-orange-700 dot-bg-orange-500`; READY `bg-green-100 text-green-700 dot-bg-green-500`; SERVED `bg-teal-100 text-teal-700 dot-bg-teal-500`; PAID `bg-gray-100 text-gray-600 dot-bg-gray-400`; REJECTED `bg-red-100 text-red-700 dot-bg-red-500`. For "active" statuses (PENDING/VALIDATED/IN_PREPARATION/READY/SERVED) render an animated dot (`<span className="mr-1 inline-block h-1.5 w-1.5 rounded-full {dot} animate-pulse" />`) before the label; PAID/REJECTED get a static dot. Keep the `useTranslation` label logic and `className` merge.
      Files: `src/components/ui/Badge.tsx`
      Verify: `npm run lint` exits 0.

- [ ] 5. **Restyle LoginPage.**
      `src/pages/LoginPage.tsx`: outer wrapper → `bg-gradient-to-br from-[#FFF8F0] via-white to-[#FFF3E0]`. Card → `rounded-3xl shadow-xl p-8` (was `rounded-2xl shadow-sm`). Branding block: `text-primary` name `text-2xl font-black`, keep tagline `text-muted`, add a subtle top accent (a thin `h-1.5 w-12 rounded-full bg-gradient-to-r from-primary to-gold` divider above the title). Inputs: `rounded-xl border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/30` (keep labels, ids, autocomplete, required). Submit Button already uses the primary gradient variant from item 2 (`w-full`); keep `loading`. Keep all auth logic (`signInWithEmailAndPassword`, role redirects, `useAuthStore`) untouched.
      Files: `src/pages/LoginPage.tsx`
      Verify: `npm run lint` exits 0.

- [ ] 6. **Restyle client menu: MenuCard + TablePage shell.**
      `src/components/client/MenuCard.tsx`: card → `rounded-2xl shadow-md hover:shadow-lg transition-all duration-200`; popular badge → gold: `bg-gold text-white` with a `⭐ ` prefix (replace current red badge), keep `orderCount > 50` check; image placeholder while loading → use the new `.shimmer` class (replace `animate-pulse bg-primary/10`); name `font-bold text-ink`; price `text-primary font-bold text-base`; keep the add/quantity controls but restyle the add button to `bg-gradient-to-r from-primary to-[#E8690F] text-white rounded-xl` and the round ± buttons to `rounded-full` with primary tint; keep all cart-store logic (`addItem`/`updateQuantity`/`removeItem`) and `imgLoaded`/`imgError` state unchanged. `src/pages/client/TablePage.tsx`: header → gradient `bg-gradient-to-r from-primary to-[#E8690F] text-white shadow-md`, center the app name, table number + zone as a white badge `bg-white/20 text-white rounded-full`; search input → `rounded-full` with terracotta focus ring `focus:ring-primary/30`; category pills → keep the scrollable row, active state `bg-gradient-to-r from-primary to-[#E8690F] text-white shadow-md`, inactive `bg-white text-muted hover:bg-primary/10 hover:text-primary`; FAB → keep `motion.button`, change to gradient `bg-gradient-to-r from-primary to-[#E8690F] shadow-xl shadow-primary/40`, add a subtle `whileHover={{ scale: 1.05 }}` and keep the animated count badge (`AnimatePresence` already present). Keep all hooks/state/filters/`OrderStatusComp`/`CountdownTimer` usage and render guards unchanged.
      Files: `src/components/client/MenuCard.tsx`, `src/pages/client/TablePage.tsx`
      Verify: `npm run lint` exits 0.

- [ ] 7. **Enhance CountdownTimer.**
      `src/components/client/CountdownTimer.tsx`: keep RADIUS=48 / 120px viewBox. Add an SVG `<linearGradient id="countdown-grad">` (green `#2D7D32` → amber `#F59E0B` → red `#D4580A`) and pick the stroke by progress: `>50%` green, `20–50%` amber, `<20%` red (replace the binary `strokeColor`). Change the "almost done" threshold to `< 120s` (2 min) per brief; add a framer-motion pulse on the SVG container when `remaining < 120` (`animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}`). Center text: keep `MM:SS` `text-2xl font-bold tabular-nums` colored by the same threshold; below it show the status message (the existing "arriving" line) in `text-sm text-muted`; keep the "ready" branch. Keep `computeRemaining`/`useEffect` interval logic unchanged.
      Files: `src/components/client/CountdownTimer.tsx`
      Verify: `npm run lint` exits 0.

- [ ] 8. **Restyle CartDrawer.**
      `src/components/client/CartDrawer.tsx`: backdrop → add `backdrop-blur-sm` to the `bg-black/40` overlay. Drawer header → gradient `bg-gradient-to-r from-primary to-[#E8690F] text-white` with the close button `text-white/80 hover:bg-white/20`. Item rows → `rounded-xl border border-gray-100` with a left accent; quantity ± buttons `rounded-full` (minus `bg-primary/10 text-primary`, plus `bg-primary text-white`); keep `updateQuantity`/`removeItem`. Footer total → `text-xl font-bold` with `text-primary` amount; order button uses the primary gradient variant (item 2) full-width. Confirmation modal → `rounded-3xl shadow-2xl`, name input `rounded-xl focus:ring-primary/30`. Keep all order-creation logic (`createOrder`, `serverTimestamp`, `navigate`, session handling) untouched.
      Files: `src/components/client/CartDrawer.tsx`
      Verify: `npm run lint` exits 0.

- [ ] 9. **Restyle OrderTracking.**
      `src/pages/client/OrderTracking.tsx`: header → gradient `bg-gradient-to-r from-primary to-[#E8690F] text-white shadow-md` (name + table/client in white). Stepper card → `rounded-2xl bg-white p-6 shadow-md`; replace the `border-l border-gray-200` connector with a colored line: completed segments `border-secondary`, current `border-primary`, future `border-gray-200`; node circles keep `bg-secondary` (completed) / `bg-primary` (current) / white (future). Status cards (READY/SERVED/REJECTED) already use colored tints — bump to `rounded-3xl shadow-md` and keep the framer-motion emojis. Countdown wrapper → `rounded-3xl bg-gradient-to-br from-white to-[#FFF8F0] p-6 shadow-md`. Receipt modal already styled as a dashed-border ticket (Receipt.tsx) — leave Receipt logic untouched, optionally bump its outer card to `rounded-2xl shadow-md`. Keep the PAID thank-you page, `handleBackToMenu`/`clearCart`, the redirect effect, and `AnimatePresence` celebration particles unchanged.
      Files: `src/pages/client/OrderTracking.tsx` (optionally light touch on `src/components/shared/Receipt.tsx` card wrapper only — no logic)
      Verify: `npm run lint` exits 0.

- [ ] 10. **Restyle serveur OrderCard.**
      `src/components/serveur/OrderCard.tsx`: card → `rounded-2xl border border-gray-100 bg-white shadow-md`; add a colored top header strip by status using the brief palette (a thin `h-1.5 rounded-t-2xl` bar: PENDING amber-500, VALIDATED blue-500, IN_PREPARATION orange-500, READY green-500, SERVED teal-500, PAID gray-400, REJECTED red-500) above the content; client name `font-semibold text-ink`, table `text-muted`, items list compact, footer total `text-primary font-semibold`. Keep `motion.div layout`, `formatDistanceToNow`, locale logic, and the `Badge` usage (Badge now styled by item 4) unchanged.
      Files: `src/components/serveur/OrderCard.tsx`
      Verify: `npm run lint` exits 0.

- [ ] 11. **Restyle serveur TableCard (supporting).**
      `src/components/serveur/TableCard.tsx`: keep `zoneColors` map but align zones to the charte (salle blue, paillote amber/gold, jardin green) with `rounded-full` badges; card → `rounded-2xl` with a left colored border by zone (`border-l-4`), selected state `border-primary bg-primary/5 shadow-md`; order-count badge → `bg-primary text-white rounded-full`. Keep `aria-pressed`, the `onClick`, and all `t(...)` keys unchanged.
      Files: `src/components/serveur/TableCard.tsx`
      Verify: `npm run lint` exits 0.

- [ ] 12. **Restyle ServeurDashboard.**
      `src/pages/serveur/ServeurDashboard.tsx`: top bar → subtle gradient `bg-gradient-to-r from-white to-[#FFF8F0]` with a `shadow-sm` border, keep user name `text-ink`, clock `font-mono text-muted`, language switcher, logout (red-600). Tables aside → `bg-white border-r shadow-sm w-44 sm:w-56`, section title `text-muted`; keep `TableCard` grid and the "all" reset button (restyle to `rounded-xl`). Orders main → keep status grouping; each group header → colored dot + label + count pill using the brief status palette; order cards via `OrderCard` (item 10) + `OrderActions`. Keep `PendingAwareOrderRow` (PENDING slide-in + `animate-pulse-ring` ring) and ALL logic (audio notification, `useOrders`, table subscription, clock, `knownPendingIds`) untouched.
      Files: `src/pages/serveur/ServeurDashboard.tsx`
      Verify: `npm run lint` exits 0.

- [ ] 13. **Restyle cuisine TicketCard.**
      `src/components/cuisine/TicketCard.tsx`: ticket → white `rounded-2xl shadow-md` with a thick left border by status (`border-l-4 border-blue-500` for VALIDATED, `border-orange-500` for IN_PREPARATION) replacing the current full dashed border; table number → `text-3xl font-black text-ink` centered; client/row `text-muted`; items → larger readable text (`text-base`); IN_PREPARATION countdown → colored badge (`bg-orange-100 text-orange-700 rounded-full`) instead of the current orange box; action buttons keep using Button variants (primary "Démarrer", secondary "Prêt") — make them full-width/large for tablet tapping. Keep ALL logic (`updateOrderStatus`, `Timestamp.now()`, `prepStartedAt` countdown interval, `TimerSelector` modal, `setLoading`) unchanged.
      Files: `src/components/cuisine/TicketCard.tsx`
      Verify: `npm run lint` exits 0.

- [ ] 14. **Restyle cuisine Kanban + dashboard.**
      `src/components/cuisine/KanbanBoard.tsx`: column headers → colored gradient pills (VALIDATED `from-blue-500 to-blue-600 text-white`, IN_PREPARATION `from-orange-500 to-primary text-white`) `rounded-2xl px-4 py-2 shadow-md` with count badge `bg-white/25`; empty-state border `border-gray-200`. `src/pages/cuisine/CuisineDashboard.tsx`: header → dark terracotta gradient `bg-gradient-to-r from-[#8a3a06] to-primary text-white shadow-md`, title white; keep the white content area `bg-background`. Keep ALL logic (`KITCHEN_STATUSES`, audio notification, `useOrders`, `hasInteracted`) unchanged. (2-column layout retained per decision #7.)
      Files: `src/components/cuisine/KanbanBoard.tsx`, `src/pages/cuisine/CuisineDashboard.tsx`
      Verify: `npm run lint` exits 0.

- [ ] 15. **Restyle admin StatsCard.**
      `src/components/admin/StatsCard.tsx`: icon container → gradient circle `rounded-full bg-gradient-to-br from-primary/15 to-gold/15 p-2.5 text-primary` (replace `bg-orange-50`); value `text-3xl font-bold text-ink` with `unit` `text-sm text-muted`; title `text-sm text-muted`; add a left colored border `border-l-4 border-primary/60 rounded-2xl` to the card and `shadow-md`. Keep the optional `trend` (TrendingUp/Down) and `accentColor` prop behavior.
      Files: `src/components/admin/StatsCard.tsx`
      Verify: `npm run lint` exits 0.

- [ ] 16. **Restyle AdminDashboard + AdminLayout sidebar.**
      `src/pages/admin/AdminDashboard.tsx`: chart cards → `rounded-2xl bg-white shadow-md p-6`; BarChart bar fill keep `#D4580A` with `radius={[6,6,0,0]}`; PieChart cells already use `STATUS_COLORS` (charte-aligned) — keep; add a `CartesianGrid` light color `stroke="#f1f1f1"`; seed zone → `rounded-2xl border border-dashed border-primary/30 bg-primary/5`. `src/App.tsx` (`AdminLayout` only — do not touch routing/`ProtectedRoute`/`RootRedirect`): desktop sidebar → `bg-white shadow-md w-60` with a gradient header strip `bg-gradient-to-r from-primary to-[#E8690F]` containing the white app name; add a lucide icon to each `navItems` entry (LayoutGrid dashboard, UtensilsCrossed menu, Table2 tables, Users users, ClipboardList orders, BarChart3 reports); active NavLink → `bg-primary/10 text-primary font-semibold` with a left accent `border-l-2 border-primary`; inactive → `text-muted hover:bg-primary/5 hover:text-primary`; logout button keep red. Mobile header/drawer keep working, restyle to match. Keep all lazy imports, routes, `useAuthStore`, and `ProtectedRoute` logic unchanged.
      Files: `src/pages/admin/AdminDashboard.tsx`, `src/App.tsx` (AdminLayout section only)
      Verify: `npm run lint` exits 0.

- [ ] 17. **Final build verification + commit.**
      Run `npm run build` (`tsc && vite build`) and fix any TypeScript/Vite errors until exit 0 (the brief's final gate). Then run the dev server (`npm run dev`) and manually open each route — `/login`, a `/table/:id` QR link, `/table/:id/tracking`, `/serveur`, `/cuisine`, `/admin` — confirming no console errors and visual coherence across pages (cards `rounded-2xl`, consistent primary/secondary/gold, status colors, Inter type). When clean, stage the changed files and commit with message exactly: `design: modern & elegant UI redesign`. Do not push. Do not commit `.agents/tasks/*` (planner artifacts) unless the workflow explicitly asks — leave them untracked.
      Files: (no source edits — verification + commit only)
      Verify: `npm run build` exits 0; `git log -1 --pretty=%s` prints `design: modern & elegant UI redesign`.
