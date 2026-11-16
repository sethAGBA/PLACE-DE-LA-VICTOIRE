# Implementation Plan — UX Fixes (4 items)

## Codebase snapshot

### TakeawayPage.tsx — current state
- **File**: `src/pages/client/TakeawayPage.tsx`
- **Imports already present**: `useEffect`, `useRef`, `useState` from React; `motion`, `AnimatePresence` from `framer-motion`; `ShoppingCart`, `Search`, `ChevronDown` from `lucide-react`; `useTranslation` from `react-i18next`.
- **Framer Motion**: already imported and used (floating emoji, cart button, table-select AnimatePresence). `framer-motion@11.11.9` is in `package.json`. `motion.img` is valid in this version.
- **Phone state**: `const [telephone, setTelephone] = useState('')` — **Fix 1 target**.
- **Search/filter logic** (lines ~96-102): `filteredProducts` applies both `inCategory` and `matchesSearch` ANDed together — **Fix 2 target**.
- **Hero section** (lines ~116-141): a static `<section>` with gradient background, decorative circles, bouncing emoji, `h1`, `p`, and a "see menu" button that calls `scrollToMenu()`. `menuRef` already exists and is attached to the menu wrapper div — **Fix 3 target**. `formRef` does **not** yet exist; it must be added and attached to the coordonnées `<section>`.
- **`menuRef`** is `useRef<HTMLDivElement>(null)` and attached to the menu div. No `formRef` exists yet.

### TablePage.tsx — current state
- **File**: `src/pages/client/TablePage.tsx`
- Imports: `motion`, `AnimatePresence` from `framer-motion`; no `formRef` needed here.
- **Search/filter logic** (lines ~96-101): identical pattern to TakeawayPage — `filteredProducts` ANDs `inCategory` with `matchesSearch` — **Fix 2 target**.
- No hero section, no telephone field.

### CaissierDashboard.tsx — current state
- **File**: `src/pages/caissier/CaissierDashboard.tsx`
- `useOrders` returns all orders with statuses `[OrderStatus.PENDING, OrderStatus.PICKUP]`.
- `groupedByTable` reduces all `orders` into a `Map<string, Order[]>` keyed by `tableId`.
- Orders with `tableId === 'takeaway'` get a special purple badge in the render loop.
- There is **no separation** between table orders and takeaway orders today — all appear together — **Fix 4 target**.
- i18n key `caissier.takeaway_waiting` does **not** yet exist in either locale file.

### i18n files
- **`src/i18n/fr.json`** — `caissier` block currently has: `dashboard`, `title`, `pending_orders`, `no_pending`.
- **`src/i18n/en.json`** — same four keys.
- Both files need a new `takeaway_waiting` key added under `caissier` — **Fix 4 target**.

### Build / verify commands
- Build: `npm run build` (runs `tsc && vite build`)
- Type-check only: `npm run lint` (runs `tsc --noEmit`)
- Dev server: `npm run dev`
- No unit-test framework present in `package.json` — verification is TypeScript compilation + visual inspection in the browser.

---

## Plan

- [ ] 1. **Fix 1 — Précharger +228 dans le champ téléphone (TakeawayPage)**

      Changer l'initialisation du state `telephone` de `useState('')` à `useState('+228')`.  
      Ajouter un handler `onFocus` sur l'input `tw-tel` : si la valeur courante est exactement `'+228'`,
      positionner le curseur à la fin via `e.currentTarget.setSelectionRange(4, 4)`.  
      Le `maxLength` passe de `12` à `12` (inchangé : +228 = 4 chars + 8 digits = 12).  
      Le `placeholder` et la regex de validation `^\+228\d{8}$` restent identiques.

      **Fichier** : `src/pages/client/TakeawayPage.tsx`

      **Changements précis** :
      ```
      // Avant
      const [telephone, setTelephone] = useState('');

      // Après
      const [telephone, setTelephone] = useState('+228');
      ```
      Ajouter sur l'input `id="tw-tel"` :
      ```tsx
      onFocus={(e) => {
        if (e.currentTarget.value === '+228') {
          e.currentTarget.setSelectionRange(4, 4);
        }
      }}
      ```

      **Verify** : `npm run lint` — aucune erreur TypeScript. Ouvrir `/takeaway` dans le navigateur et constater que le champ affiche `+228` dès l'arrivée sur la page, et que le curseur se place après le `8` au focus.

---

- [ ] 2. **Fix 2 — Recherche sans filtre catégorie dans TakeawayPage et TablePage**

      Dans les deux fichiers, remplacer la logique `filteredProducts` pour que, lorsqu'une recherche est active (`search.trim() !== ''`), le filtre `inCategory` soit ignoré. Lorsque la recherche est vide, la logique par catégorie reprend normalement.

      **Fichiers** : `src/pages/client/TakeawayPage.tsx`, `src/pages/client/TablePage.tsx`

      **Remplacement dans les deux fichiers** (pattern identique) :
      ```ts
      // Avant
      const filteredProducts = products.filter((p) => {
        const inCategory = activeCategory === null || p.categorieId === activeCategory;
        const matchesSearch =
          search.trim() === '' ||
          (lang === 'en' ? p.nom_en : p.nom_fr)
            .toLowerCase()
            .includes(search.toLowerCase());
        return inCategory && matchesSearch && p.disponible;
      });

      // Après
      const filteredProducts = products.filter((p) => {
        if (!p.disponible) return false;
        const query = search.trim();
        if (query !== '') {
          // Recherche active → ignorer le filtre catégorie
          return (lang === 'en' ? p.nom_en : p.nom_fr)
            .toLowerCase()
            .includes(query.toLowerCase());
        }
        // Pas de recherche → filtre catégorie normal
        return activeCategory === null || p.categorieId === activeCategory;
      });
      ```

      **Verify** : `npm run lint` — aucune erreur TypeScript. Dans le navigateur, taper un terme dans la barre de recherche et vérifier que les résultats s'affichent de toutes les catégories, sans avoir à cliquer sur un onglet. Effacer la recherche et vérifier le retour à l'affichage par catégorie.

---

- [ ] 3. **Fix 3 — Carrousel hero dans TakeawayPage**

      Remplacer le `<section>` hero statique par un carrousel Framer Motion. Le bouton CTA scrolle vers le formulaire (pas le menu), donc un `formRef` doit être créé et attaché à la section `<section>` des coordonnées.

      **Fichier** : `src/pages/client/TakeawayPage.tsx`

      **Étapes** :

      **3a. Ajouter `formRef` et les constantes du carrousel** après la déclaration de `menuRef` :
      ```tsx
      const formRef = useRef<HTMLElement>(null);

      const HERO_IMAGES = [
        '/MENU/Soupe%20au%20poulet.jpg',
        '/MENU/Petit%20d%C3%A9jeuner%20complet.jpg',
        '/MENU/Soupe%20de%20poisson.webp',
        '/MENU/Atti%C3%A9k%C3%A9.webp',
        '/MENU/Foufou.jpg',
        '/MENU/Salade%20verte.webp',
      ];

      const [heroIndex, setHeroIndex] = useState(0);
      ```

      **3b. Ajouter l'effet d'auto-avance** (après les autres `useEffect`) :
      ```tsx
      useEffect(() => {
        const id = setInterval(() => {
          setHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
        }, 4000);
        return () => clearInterval(id);
      }, []);
      ```

      **3c. Ajouter la fonction `scrollToForm`** à côté de `scrollToMenu` :
      ```tsx
      const scrollToForm = () => {
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
      };
      ```

      **3d. Attacher `formRef` à la section coordonnées** :
      ```tsx
      // Avant
      <section className="mx-auto w-full max-w-lg px-4 py-6">

      // Après
      <section ref={formRef} className="mx-auto w-full max-w-lg px-4 py-6">
      ```
      Note : `useRef<HTMLElement>` est compatible avec `<section>` via `ref` de type `React.RefObject<HTMLElement>`.

      **3e. Remplacer le bloc hero statique** (de `{/* ── Hero banner ─── */}` jusqu'à la fermeture de `</section>`) par :
      ```tsx
      {/* ── Hero carrousel ──────────────────────────────────────────────── */}
      <section className="relative h-56 md:h-72 w-full overflow-hidden">
        <AnimatePresence mode="sync">
          <motion.img
            key={heroIndex}
            src={HERO_IMAGES[heroIndex]}
            alt=""
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>

        {/* Overlay gradient bas → haut */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"
          aria-hidden="true"
        />

        {/* Texte centré */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-white">
          <p className="text-2xl font-black tracking-tight drop-shadow">
            🍽️ Place de la Victoire
          </p>
          <p className="text-sm text-white/80">Restaurant – Kara, Togo</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={scrollToForm}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-primary shadow-lg transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            Commander maintenant →
          </motion.button>
        </div>

        {/* Dots de navigation */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5" role="tablist" aria-label="Carrousel navigation">
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === heroIndex}
              aria-label={`Image ${i + 1}`}
              onClick={() => setHeroIndex(i)}
              className={[
                'h-1.5 rounded-full transition-all duration-300',
                i === heroIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50',
              ].join(' ')}
            />
          ))}
        </div>
      </section>
      ```

      **3f. Supprimer `ChevronDown`** des imports lucide-react si `scrollToMenu` n'est plus utilisé. Garder `scrollToMenu` et son bouton dans la version finale n'est pas requis — le CTA du carrousel remplace le bouton "voir le menu". Supprimer le bouton `{t('menu.title')} <ChevronDown/>` de l'ancien hero (il disparaît avec le remplacement). Vérifier que `ChevronDown` n'est utilisé nulle part ailleurs dans le fichier avant de le retirer de l'import.

      **Verify** : `npm run lint` — aucune erreur. Ouvrir `/takeaway` dans le navigateur et vérifier : (a) les images défilent toutes les 4 s, (b) les dots sont cliquables, (c) le bouton "Commander maintenant →" scrolle jusqu'au formulaire de coordonnées.

---

- [ ] 4. **Fix 4 — Caissier : les takeaway n'apparaissent que s'il y a des commandes sur table**

      **4a. Ajouter les clés i18n** dans les deux fichiers de traduction :

      Dans `src/i18n/fr.json`, ajouter dans le bloc `"caissier"` :
      ```json
      "takeaway_waiting": "Des commandes à emporter sont en attente — elles s'afficheront dès qu'une commande sur table sera active."
      ```

      Dans `src/i18n/en.json`, ajouter dans le bloc `"caissier"` :
      ```json
      "takeaway_waiting": "Take-away orders are waiting — they will appear once a dine-in order is active."
      ```

      **4b. Modifier `CaissierDashboard.tsx`** pour séparer et conditionner l'affichage :

      Remplacer le bloc `groupedByTable` et le JSX principal par la logique suivante :

      ```tsx
      // Séparer table orders et takeaway orders
      const tableOrders = orders.filter((o) => o.tableId !== 'takeaway');
      const takeawayOrders = orders.filter((o) => o.tableId === 'takeaway');

      // Les takeaway ne sont visibles que si des commandes sur table existent
      const visibleOrders = tableOrders.length > 0
        ? [...tableOrders, ...takeawayOrders]
        : tableOrders;

      // Grouper uniquement les visibleOrders
      const groupedByTable = visibleOrders.reduce<Map<string, Order[]>>((map, order) => {
        const list = map.get(order.tableId) ?? [];
        list.push(order);
        map.set(order.tableId, list);
        return map;
      }, new Map());
      ```

      Dans la section JSX `{loading ? … : groupedByTable.size === 0 ? … : …}`, ajouter un message discret sous le bloc principal (après `</div>` qui ferme la liste des groupes) :

      ```tsx
      {/* Message discret si takeaway en attente mais pas de commandes sur table */}
      {tableOrders.length === 0 && takeawayOrders.length > 0 && (
        <p className="mt-6 text-center text-xs text-muted">
          {t('caissier.takeaway_waiting')}
        </p>
      )}
      ```

      Ce message s'affiche dans la zone `main`, visible même quand `groupedByTable.size === 0` (aucune commande sur table). Placer ce bloc **après** le ternaire `groupedByTable.size === 0` existant : restructurer légèrement le rendu pour que les deux conditions soient évaluées indépendamment :

      ```tsx
      <main className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {groupedByTable.size === 0 ? (
              <p className="mt-10 text-center text-sm text-muted">
                {t('caissier.no_pending')}
              </p>
            ) : (
              <div className="space-y-8">
                {Array.from(groupedByTable.entries()).map(([tableId, tableOrds]) => (
                  // … unchanged render of each section …
                ))}
              </div>
            )}

            {tableOrders.length === 0 && takeawayOrders.length > 0 && (
              <p className="mt-6 text-center text-xs text-muted">
                {t('caissier.takeaway_waiting')}
              </p>
            )}
          </>
        )}
      </main>
      ```

      Note : dans la map callback `groupedByTable.entries()`, renommer la variable interne `tableOrders` en `tableOrds` (ou `ordersForTable`) pour éviter le conflit de nom avec la variable externe `tableOrders`.

      **Fichiers** : `src/pages/caissier/CaissierDashboard.tsx`, `src/i18n/fr.json`, `src/i18n/en.json`

      **Verify** : `npm run lint` — aucune erreur TypeScript. Vérifier en base : (a) quand il n'y a que des commandes takeaway, le caissier voit le message discret et aucune carte de commande ; (b) quand au moins une commande sur table existe, les takeaway apparaissent également.
