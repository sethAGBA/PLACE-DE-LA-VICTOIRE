# Implementation Plan — Place de la Victoire PWA

**Projet** : PWA bilingue (FR/EN) de gestion du restaurant "Place de la Victoire", Kara, Togo  
**Stack** : React 18 + TypeScript 5 + Vite 5 + Tailwind CSS 3 + Framer Motion + Zustand 5 + Firebase 10 + vite-plugin-pwa 0.21  
**Workspace** : `c:\Users\LEGION\Desktop\Project\PLACE-DE-LA-VICTOIRE`

---

## Risques & décisions d'architecture

| Risque | Décision prise |
|---|---|
| `vite-plugin-pwa` ≥ v0.17 requiert Vite 5 — OK | Vite 5.4.10 + vite-plugin-pwa 0.21.1 |
| Firebase SDK v10 → modular API uniquement | Tous imports tree-shakeable (`firebase/firestore`, etc.) |
| Zustand v5 requiert React 18 — OK | zustand@5.0.0 + react@18.3.1 |
| Création de users Firebase côté client (pas d'Admin SDK) | Secondary `initializeApp` instance pour créer des comptes sans déconnecter l'admin |
| Plusieurs clients sur la même table | `sessionId` = `crypto.randomUUID()` stocké en `sessionStorage` — isolation par session |
| Offline partiel (réseau 3G Kara) | Workbox pré-cache assets statiques ; données Firestore via onSnapshot avec cache offline activé (`enableMultiTabIndexedDbPersistence`) |
| FCM non utilisé | Toutes les notifs via `onSnapshot` temps réel — pas de service worker push |
| Images lourdes sur 3G | `loading="lazy"` sur toutes les images + placeholder couleur CSS avant chargement |

---

## Versions npm exactes

```json
{
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-router-dom": "6.26.2",
    "firebase": "10.14.1",
    "zustand": "5.0.0",
    "react-i18next": "15.1.0",
    "i18next": "23.16.4",
    "framer-motion": "11.11.9",
    "lucide-react": "0.460.0",
    "recharts": "2.13.3",
    "qrcode.react": "4.1.0"
  },
  "devDependencies": {
    "typescript": "5.6.3",
    "vite": "5.4.10",
    "@vitejs/plugin-react": "4.3.3",
    "vite-plugin-pwa": "0.21.1",
    "workbox-window": "7.3.0",
    "tailwindcss": "3.4.14",
    "postcss": "8.4.47",
    "autoprefixer": "10.4.20",
    "@types/react": "18.3.12",
    "@types/react-dom": "18.3.1"
  }
}
```

---

## Plan d'implémentation

- [ ] 1. **Scaffolding & configuration** (FEAT-001)  
      Créer `package.json` (versions ci-dessus), `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `public/manifest.json`, `.env.example`, `index.html`. Lancer `npm install`. Créer des stubs minimaux `src/main.tsx` et `src/App.tsx` pour valider la compilation.  
      **Fichiers** : `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `public/manifest.json`, `.env.example`, `index.html`, `src/main.tsx`, `src/App.tsx`  
      **Vérification** : `npm install && npm run build` → exit 0, `dist/sw.js` généré.

- [ ] 2. **Infrastructure core** (FEAT-002)  
      Créer tous les types TypeScript (`src/types/index.ts`), l'initialisation Firebase (`src/lib/firebase.ts`), les helpers Firestore (`src/lib/firestore.ts`), les 3 stores Zustand, les 3 hooks custom, les fichiers i18n (fr.json + en.json + index.ts), les 6 composants UI primitifs, l'`App.tsx` complet avec React Router + ProtectedRoute, le `src/main.tsx` final, et le script seed (`src/seed/seedData.ts`).  
      **Fichiers** : `src/types/index.ts`, `src/lib/firebase.ts`, `src/lib/firestore.ts`, `src/store/authStore.ts`, `src/store/cartStore.ts`, `src/store/orderStore.ts`, `src/hooks/useOrders.ts`, `src/hooks/useProducts.ts`, `src/hooks/useRealtime.ts`, `src/i18n/index.ts`, `src/i18n/fr.json`, `src/i18n/en.json`, `src/components/ui/{Button,Badge,Modal,Card,Spinner,LanguageSwitcher}.tsx`, `src/App.tsx`, `src/main.tsx`, `src/index.css`, `src/seed/seedData.ts`  
      **Vérification** : `npm run build` → exit 0, zéro erreur TypeScript.

- [ ] 3. **Interface client** (FEAT-003)  
      Créer les 4 composants client (`MenuCard`, `CartDrawer`, `OrderStatus`, `CountdownTimer`) et les 2 pages client (`TablePage`, `OrderTracking`). Implémenter : navigation par catégorie, recherche, panier persistant en sessionStorage, soumission commande, tracking temps réel avec chrono animé SVG.  
      **Fichiers** : `src/components/client/{MenuCard,CartDrawer,OrderStatus,CountdownTimer}.tsx`, `src/pages/client/TablePage.tsx`, `src/pages/client/OrderTracking.tsx`  
      **Vérification** : `npm run build` → exit 0.

- [ ] 4. **Dashboards staff** (FEAT-004)  
      Créer `LoginPage`, les composants serveur (`TableCard`, `OrderCard`, `OrderActions`) et cuisine (`TimerSelector`, `TicketCard`, `KanbanBoard`), plus les pages `ServeurDashboard` et `CuisineDashboard`. Flux complet : validation, rejet motivé, démarrage préparation avec timer, marquage PRÊT → SERVI → PAYÉ.  
      **Fichiers** : `src/pages/LoginPage.tsx`, `src/components/serveur/{TableCard,OrderCard,OrderActions}.tsx`, `src/components/cuisine/{TimerSelector,TicketCard,KanbanBoard}.tsx`, `src/pages/serveur/ServeurDashboard.tsx`, `src/pages/cuisine/CuisineDashboard.tsx`  
      **Vérification** : `npm run build` → exit 0.

- [ ] 5. **Dashboard admin** (FEAT-005)  
      Créer les 5 composants admin (`StatsCard`, `ProductForm`, `TableForm`, `UserForm`, `QRCodeDisplay`) et les 6 pages admin (`AdminDashboard`, `MenuManagement`, `TableManagement`, `UserManagement`, `OrderHistory`, `Reports`) plus le layout sidebar `AdminLayout`.  
      **Fichiers** : `src/components/admin/{StatsCard,ProductForm,TableForm,UserForm,QRCodeDisplay}.tsx`, `src/pages/admin/{AdminDashboard,MenuManagement,TableManagement,UserManagement,OrderHistory,Reports,AdminLayout}.tsx`  
      **Vérification** : `npm run build` → exit 0.

---

## Points d'attention TypeScript / Vite / PWA

1. **Alias `@/*`** : configuré dans `vite.config.ts` (resolve.alias) ET dans `tsconfig.json` (paths) — les deux doivent correspondre exactement.
2. **virtual:pwa-register** : import dans `main.tsx` via `import { registerSW } from 'virtual:pwa-register'` — ce module virtuel est fourni par `vite-plugin-pwa` uniquement au build Vite ; en tests unitaires il faut le mocker.
3. **Firebase Timestamp** : toujours utiliser `Timestamp.fromDate()` / `.toDate()` explicitement. Ne pas passer un `Date` JS directement à Firestore — utiliser `serverTimestamp()` de `firebase/firestore`.
4. **Offline Firestore** : appeler `enableMultiTabIndexedDbPersistence(db)` dans `firebase.ts` (wrappé dans try/catch car la seconde instance admin peut lancer `FAILED_PRECONDITION`).
5. **Recharts + SSR** : pas de SSR ici (Vite SPA) donc pas de problème ; mais importer Recharts uniquement dans les composants (pas dans les stores) pour le tree-shaking.
6. **qrcode.react** : utiliser `<QRCodeCanvas>` (pas `<QRCodeSVG>`) pour le téléchargement PNG via `canvas.toDataURL()`.
7. **Secondary Firebase app** (création de users admin) : `initializeApp(firebaseConfig, 'secondary')` → `getAuth(secondaryApp)` → `createUserWithEmailAndPassword` → `signOut` immédiat de la secondary instance.
8. **CSP / Firebase Hosting** : les headers dans `firebase.json` doivent inclure `Content-Security-Policy` permettant `*.firebaseapp.com` et `*.googleapis.com`.

---

## Stratégie offline

- **Workbox precache** : tous les assets statiques (JS, CSS, HTML, images PWA icons).
- **Runtime cache** : Firebase Storage images → CacheFirst (max 50, TTL 30 jours).
- **Firestore offline** : `enableMultiTabIndexedDbPersistence` → le menu est lisible offline après première visite.
- **Pas de cache pour les commandes** : les mutations Firestore (createOrder, updateOrder) nécessitent une connexion ; afficher un toast d'erreur si offline et mutation échoue.

---

## Structure Firestore (rappel)

```
/tables/{tableId}       { numero, zone, capacite, statut, qrCodeUrl }
/categories/{id}        { nom_fr, nom_en, ordre, icon }
/products/{id}          { nom_fr, nom_en, desc_fr, desc_en, prix, categorieId, imageUrl, disponible, orderCount, tags[] }
/orders/{id}            { tableId, sessionId, clientPrenom, statut, createdAt, validatedAt?, estimatedMinutes?, items[], servedAt?, paidAt?, rejectedReason? }
/users/{id}             { nom, email, role, actif }
```

**Indexes Firestore composites requis** :
- `orders` : `tableId ASC` + `createdAt DESC`
- `orders` : `statut ASC` + `createdAt ASC`

---

## Données seed (20 tables + 5 catégories + 25 produits)

Voir `src/seed/seedData.ts` — fonction `seedFirestore()` exposée sur `window` en dev uniquement.

**Catégories** (ordre) :
1. Plats africains (🍲)
2. Grillades (🔥)
3. Boissons locales (🌿)
4. Soft & Jus (🥤)
5. Bières (🍺)

**Tables** : 8 salle + 6 paillote + 6 jardin (numéros 1–20).

---

*Ce plan est implémenté via 5 FEATs séquentiels définis dans `.agents/tasks/task-restaurant-pwa/features/FEAT-00{1-5}.json`. Lire `context.json` dans le même dossier avant d'implémenter.*
