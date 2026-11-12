import {
  writeBatch,
  doc,
  collection,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TableZone } from '@/types';
import type { Category, Product, Table } from '@/types';

// ─── Categories ───────────────────────────────────────────────────────────────

const CATEGORIES: Omit<Category, 'id'>[] = [
  {
    nom_fr: 'Plats Africains',
    nom_en: 'African Dishes',
    ordre: 1,
    icon: '🍲',
  },
  {
    nom_fr: 'Grillades',
    nom_en: 'Grills',
    ordre: 2,
    icon: '🔥',
  },
  {
    nom_fr: 'Boissons Locales',
    nom_en: 'Local Drinks',
    ordre: 3,
    icon: '🥤',
  },
  {
    nom_fr: 'Soft & Jus',
    nom_en: 'Sodas & Juices',
    ordre: 4,
    icon: '🧃',
  },
  {
    nom_fr: 'Bières',
    nom_en: 'Beers',
    ordre: 5,
    icon: '🍺',
  },
];

const CATEGORY_IDS: Record<string, string> = {
  plats: 'cat-plats-africains',
  grillades: 'cat-grillades',
  boissons_locales: 'cat-boissons-locales',
  soft: 'cat-soft-jus',
  bieres: 'cat-bieres',
};

// ─── Products ─────────────────────────────────────────────────────────────────

const PRODUCTS: (Omit<Product, 'id'> & { _id: string })[] = [
  // Plats Africains
  {
    _id: 'prod-fufu-sauce-arachide',
    nom_fr: 'Fufu & Sauce Arachide',
    nom_en: 'Fufu & Groundnut Sauce',
    desc_fr: 'Fufu de manioc accompagné d\'une sauce arachide onctueuse',
    desc_en: 'Cassava fufu with creamy groundnut sauce',
    prix: 2000,
    categorieId: CATEGORY_IDS.plats,
    imageUrl: '',
    disponible: true,
    orderCount: 0,
    tags: ['populaire', 'sans-gluten'],
  },
  {
    _id: 'prod-riz-sauce-gombo',
    nom_fr: 'Riz & Sauce Gombo',
    nom_en: 'Rice & Okra Sauce',
    desc_fr: 'Riz blanc avec sauce gombo au poisson ou poulet',
    desc_en: 'White rice with okra sauce, fish or chicken',
    prix: 2000,
    categorieId: CATEGORY_IDS.plats,
    imageUrl: '',
    disponible: true,
    orderCount: 0,
    tags: ['populaire'],
  },
  {
    _id: 'prod-pate-sauce-tomate',
    nom_fr: 'Pâte & Sauce Tomate',
    nom_en: 'Corn Paste & Tomato Sauce',
    desc_fr: 'Pâte de maïs avec sauce tomate épicée',
    desc_en: 'Corn paste with spicy tomato sauce',
    prix: 1500,
    categorieId: CATEGORY_IDS.plats,
    imageUrl: '',
    disponible: true,
    orderCount: 0,
    tags: [],
  },
  {
    _id: 'prod-akoume-sauce-graine',
    nom_fr: 'Akoumé & Sauce Graine',
    nom_en: 'Akoumé & Palm Nut Sauce',
    desc_fr: 'Pâte de maïs fermentée avec sauce de graines de palme',
    desc_en: 'Fermented corn paste with palm nut sauce',
    prix: 2500,
    categorieId: CATEGORY_IDS.plats,
    imageUrl: '',
    disponible: true,
    orderCount: 0,
    tags: ['populaire', 'traditionnel'],
  },
  {
    _id: 'prod-gboma-dessi',
    nom_fr: 'Gboma Dessi',
    nom_en: 'Gboma Dessi',
    desc_fr: 'Plat traditionnel à base d\'épinards africains et de poisson',
    desc_en: 'Traditional dish with African spinach and fish',
    prix: 2500,
    categorieId: CATEGORY_IDS.plats,
    imageUrl: '',
    disponible: true,
    orderCount: 0,
    tags: ['traditionnel'],
  },
  {
    _id: 'prod-riz-gras-poulet',
    nom_fr: 'Riz Gras Poulet',
    nom_en: 'Rice with Chicken',
    desc_fr: 'Riz cuit dans la sauce avec morceaux de poulet',
    desc_en: 'Rice cooked in sauce with pieces of chicken',
    prix: 3000,
    categorieId: CATEGORY_IDS.plats,
    imageUrl: '',
    disponible: true,
    orderCount: 0,
    tags: ['populaire'],
  },
  {
    _id: 'prod-haricots-huile-palme',
    nom_fr: 'Haricots à l\'huile de palme',
    nom_en: 'Beans in Palm Oil',
    desc_fr: 'Haricots rouges cuits avec huile de palme et épices',
    desc_en: 'Red beans cooked with palm oil and spices',
    prix: 1500,
    categorieId: CATEGORY_IDS.plats,
    imageUrl: '',
    disponible: true,
    orderCount: 0,
    tags: ['vegan'],
  },
  // Grillades
  {
    _id: 'prod-poulet-braise',
    nom_fr: 'Poulet Braisé',
    nom_en: 'Grilled Chicken',
    desc_fr: 'Poulet entier braisé aux épices africaines, servi avec attieke',
    desc_en: 'Whole chicken grilled with African spices, served with attieke',
    prix: 5000,
    categorieId: CATEGORY_IDS.grillades,
    imageUrl: '',
    disponible: true,
    orderCount: 0,
    tags: ['populaire'],
  },
  {
    _id: 'prod-demi-poulet-braise',
    nom_fr: 'Demi Poulet Braisé',
    nom_en: 'Half Grilled Chicken',
    desc_fr: 'Demi poulet braisé, servi avec attieke ou frites',
    desc_en: 'Half grilled chicken, served with attieke or fries',
    prix: 2500,
    categorieId: CATEGORY_IDS.grillades,
    imageUrl: '',
    disponible: true,
    orderCount: 0,
    tags: ['populaire'],
  },
  {
    _id: 'prod-brochettes-boeuf',
    nom_fr: 'Brochettes de Bœuf',
    nom_en: 'Beef Skewers',
    desc_fr: 'Brochettes de bœuf marinées et grillées',
    desc_en: 'Marinated and grilled beef skewers',
    prix: 2000,
    categorieId: CATEGORY_IDS.grillades,
    imageUrl: '',
    disponible: true,
    orderCount: 0,
    tags: [],
  },
  {
    _id: 'prod-poisson-braise',
    nom_fr: 'Poisson Braisé',
    nom_en: 'Grilled Fish',
    desc_fr: 'Poisson entier braisé aux épices, servi avec légumes',
    desc_en: 'Whole fish grilled with spices, served with vegetables',
    prix: 3500,
    categorieId: CATEGORY_IDS.grillades,
    imageUrl: '',
    disponible: true,
    orderCount: 0,
    tags: [],
  },
  // Boissons Locales
  {
    _id: 'prod-tchoukoutou',
    nom_fr: 'Tchoukoutou',
    nom_en: 'Tchoukoutou (Sorghum Beer)',
    desc_fr: 'Bière de sorgho locale traditionnelle',
    desc_en: 'Traditional local sorghum beer',
    prix: 500,
    categorieId: CATEGORY_IDS.boissons_locales,
    imageUrl: '',
    disponible: true,
    orderCount: 0,
    tags: ['local', 'alcool'],
  },
  {
    _id: 'prod-sodabi',
    nom_fr: 'Sodabi',
    nom_en: 'Sodabi (Palm Spirit)',
    desc_fr: 'Eau-de-vie de palme distillée artisanalement',
    desc_en: 'Artisanally distilled palm spirit',
    prix: 500,
    categorieId: CATEGORY_IDS.boissons_locales,
    imageUrl: '',
    disponible: true,
    orderCount: 0,
    tags: ['local', 'alcool'],
  },
  {
    _id: 'prod-jus-gingembre',
    nom_fr: 'Jus de Gingembre',
    nom_en: 'Ginger Juice',
    desc_fr: 'Jus de gingembre frais préparé maison',
    desc_en: 'Freshly made homemade ginger juice',
    prix: 500,
    categorieId: CATEGORY_IDS.boissons_locales,
    imageUrl: '',
    disponible: true,
    orderCount: 0,
    tags: ['local', 'sans-alcool'],
  },
  {
    _id: 'prod-jus-bissap',
    nom_fr: 'Jus de Bissap',
    nom_en: 'Hibiscus Juice',
    desc_fr: 'Jus d\'hibiscus rouge rafraîchissant',
    desc_en: 'Refreshing red hibiscus juice',
    prix: 500,
    categorieId: CATEGORY_IDS.boissons_locales,
    imageUrl: '',
    disponible: true,
    orderCount: 0,
    tags: ['local', 'sans-alcool'],
  },
  // Soft & Jus
  {
    _id: 'prod-coca-cola',
    nom_fr: 'Coca-Cola',
    nom_en: 'Coca-Cola',
    desc_fr: 'Boisson gazeuse Coca-Cola 33cl',
    desc_en: 'Coca-Cola sparkling drink 33cl',
    prix: 500,
    categorieId: CATEGORY_IDS.soft,
    imageUrl: '',
    disponible: true,
    orderCount: 0,
    tags: [],
  },
  {
    _id: 'prod-fanta',
    nom_fr: 'Fanta Orange',
    nom_en: 'Fanta Orange',
    desc_fr: 'Fanta Orange 33cl',
    desc_en: 'Fanta Orange 33cl',
    prix: 500,
    categorieId: CATEGORY_IDS.soft,
    imageUrl: '',
    disponible: true,
    orderCount: 0,
    tags: [],
  },
  {
    _id: 'prod-sprite',
    nom_fr: 'Sprite',
    nom_en: 'Sprite',
    desc_fr: 'Sprite citron 33cl',
    desc_en: 'Sprite lemon 33cl',
    prix: 500,
    categorieId: CATEGORY_IDS.soft,
    imageUrl: '',
    disponible: true,
    orderCount: 0,
    tags: [],
  },
  {
    _id: 'prod-eau-minerale',
    nom_fr: 'Eau Minérale',
    nom_en: 'Mineral Water',
    desc_fr: 'Eau minérale en bouteille 50cl',
    desc_en: 'Mineral water bottle 50cl',
    prix: 300,
    categorieId: CATEGORY_IDS.soft,
    imageUrl: '',
    disponible: true,
    orderCount: 0,
    tags: [],
  },
  // Bières
  {
    _id: 'prod-castel-biere',
    nom_fr: 'Castel Bière',
    nom_en: 'Castel Beer',
    desc_fr: 'Castel bière locale 65cl',
    desc_en: 'Local Castel beer 65cl',
    prix: 1000,
    categorieId: CATEGORY_IDS.bieres,
    imageUrl: '',
    disponible: true,
    orderCount: 0,
    tags: ['alcool'],
  },
  {
    _id: 'prod-flag-biere',
    nom_fr: 'Flag Bière',
    nom_en: 'Flag Beer',
    desc_fr: 'Flag bière 65cl',
    desc_en: 'Flag beer 65cl',
    prix: 1000,
    categorieId: CATEGORY_IDS.bieres,
    imageUrl: '',
    disponible: true,
    orderCount: 0,
    tags: ['alcool'],
  },
  {
    _id: 'prod-guiness',
    nom_fr: 'Guinness',
    nom_en: 'Guinness',
    desc_fr: 'Guinness stout 33cl',
    desc_en: 'Guinness stout 33cl',
    prix: 1200,
    categorieId: CATEGORY_IDS.bieres,
    imageUrl: '',
    disponible: true,
    orderCount: 0,
    tags: ['alcool'],
  },
];

// ─── Tables ───────────────────────────────────────────────────────────────────

function buildTables(): (Omit<Table, 'id'> & { _id: string })[] {
  const tables: (Omit<Table, 'id'> & { _id: string })[] = [];

  const zones: { zone: TableZone; count: number }[] = [
    { zone: TableZone.salle, count: 8 },
    { zone: TableZone.paillote, count: 6 },
    { zone: TableZone.jardin, count: 6 },
  ];

  let numero = 1;
  for (const { zone, count } of zones) {
    for (let i = 0; i < count; i++) {
      tables.push({
        _id: `table-${numero}`,
        numero,
        zone,
        capacite: 4,
        statut: 'libre',
        qrCodeUrl: '',
      });
      numero++;
    }
  }
  return tables;
}

// ─── Seed function ────────────────────────────────────────────────────────────

export async function seedFirestore(): Promise<void> {
  const BATCH_LIMIT = 500;
  const allOps: (() => void)[] = [];

  let batch = writeBatch(db);
  let opsInBatch = 0;
  const batches: ReturnType<typeof writeBatch>[] = [batch];

  const addOp = (op: () => void) => {
    if (opsInBatch >= BATCH_LIMIT) {
      batch = writeBatch(db);
      batches.push(batch);
      opsInBatch = 0;
    }
    op();
    opsInBatch++;
  };

  // Seed categories
  const categoryEntries = Object.entries(CATEGORY_IDS);
  for (let i = 0; i < categoryEntries.length; i++) {
    const [key, id] = categoryEntries[i];
    const catIndex = i;
    const catData = CATEGORIES[catIndex];
    if (!catData) continue;

    // Silence unused var warning — key used to index but we iterate
    void key;

    const ref = doc(collection(db, 'categories'), id);
    addOp(() => batch.set(ref, catData));
  }

  // Seed products
  for (const { _id, ...productData } of PRODUCTS) {
    const ref = doc(collection(db, 'products'), _id);
    addOp(() => batch.set(ref, productData));
  }

  // Seed tables
  for (const { _id, ...tableData } of buildTables()) {
    const ref = doc(collection(db, 'tables'), _id);
    addOp(() => batch.set(ref, tableData));
  }

  // Suppress lint — allOps is for future incremental batch building
  void allOps;

  // Commit all batches
  for (const b of batches) {
    await b.commit();
  }

  console.log(
    `[seed] Done — ${PRODUCTS.length} products, ${CATEGORIES.length} categories, 20 tables seeded.`
  );
}

// Expose in dev mode for console access
if (import.meta.env.DEV) {
  (window as Window & { seedFirestore?: typeof seedFirestore }).seedFirestore =
    seedFirestore;
}
