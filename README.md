# Place de la Victoire — Restaurant PWA

PWA bilingue (FR/EN) de gestion du restaurant Place de la Victoire, Kara, Togo.

## Stack
- React 18 + TypeScript 5 + Vite 5
- Tailwind CSS 3 + Framer Motion
- Firebase 10 (Auth, Firestore, Storage, Hosting)
- Zustand 5 (state management)
- react-i18next (i18n FR/EN)
- Recharts (graphiques admin)
- qrcode.react (QR codes tables)
- vite-plugin-pwa (PWA + Workbox)

## Rôles
- **admin** : gestion complète (menu, tables, utilisateurs, rapports)
- **serveur** : validation des commandes, gestion service
- **cuisine** : tableau kanban des tickets en préparation
- **client** : scan QR → menu → commande → suivi temps réel

## Setup Firebase

1. Créer un projet Firebase sur https://console.firebase.google.com
2. Activer Authentication (Email/Password)
3. Activer Firestore Database (mode production)
4. Activer Storage
5. Activer Hosting
6. Copier la config Firebase dans `.env` (voir `.env.example`)
7. Déployer les règles Firestore : `firebase deploy --only firestore:rules`
8. Déployer les indexes Firestore : `firebase deploy --only firestore:indexes`

## Comptes de démo

| Email | Rôle |
|-------|------|
| admin@placelavictoire.com | Admin |
| serveur@placelavictoire.com | Serveur |
| cuisine@placelavictoire.com | Cuisine |

Les mots de passe sont définis par l'opérateur avant le déploiement dans `.env.local` :

```
VITE_SEED_ADMIN_PASSWORD=<votre_mot_de_passe_admin>
VITE_SEED_SERVEUR_PASSWORD=<votre_mot_de_passe_serveur>
VITE_SEED_CUISINE_PASSWORD=<votre_mot_de_passe_cuisine>
```

Voir `.env.example` pour la liste complète des variables. Ces valeurs ne doivent **jamais** être commitées dans le dépôt.

Créer ces comptes via le bouton **"Créer comptes démo"** dans le dashboard Admin.

## Commandes

```bash
npm install          # Installer les dépendances
npm run dev          # Serveur de développement (http://localhost:5173)
npm run build        # Build de production
npm run preview      # Prévisualiser le build
firebase deploy      # Déployer sur Firebase Hosting
```

## Structure des dossiers

```
src/
├── components/
│   ├── admin/      # Composants dashboard admin
│   ├── client/     # Composants interface client
│   ├── cuisine/    # Composants dashboard cuisine
│   ├── serveur/    # Composants dashboard serveur
│   └── ui/         # Composants UI réutilisables
├── hooks/          # Hooks React (useOrders, useProducts, useRealtime)
├── i18n/           # Traductions FR/EN
├── lib/            # Firebase init + helpers Firestore
├── pages/          # Pages par rôle
├── seed/           # Scripts seed (menu togolais + comptes démo)
├── store/          # Stores Zustand
└── types/          # Types TypeScript
```

## Flux de commande

1. Client scanne QR code sur la table → accède au menu
2. Client compose sa commande + saisit son prénom
3. Commande créée en Firestore (statut PENDING)
4. Serveur reçoit notification → valide ou rejette
5. Commande VALIDATED → cuisine reçoit ticket kanban
6. Cuisine démarre préparation → saisit temps estimé (chrono animé côté client)
7. Cuisine marque PRÊT → serveur reçoit notification verte
8. Serveur sert le plat → marque SERVI
9. Serveur encaisse → marque PAYÉ
