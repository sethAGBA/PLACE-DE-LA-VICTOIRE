/**
 * Script de seed Firestore — Place de la Victoire
 * Usage : node scripts/seed.mjs <UID_ADMIN>
 *
 * Crée :
 *   - 1 document users/{UID_ADMIN} avec rôle admin
 *   - 5 catégories
 *   - 22 produits togolais
 *   - 20 tables (Salle / Paillote / Jardin)
 *
 * Prérequis :
 *   - Télécharger la clé de service depuis Firebase Console :
 *     Paramètres du projet → Comptes de service → Générer une nouvelle clé privée
 *     → Sauvegarder sous scripts/serviceAccountKey.json
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEY_PATH = join(__dirname, 'serviceAccountKey.json');

// ── Vérifications ──────────────────────────────────────────────────────────────

if (!existsSync(KEY_PATH)) {
  console.error(`\n❌ Clé de service introuvable : ${KEY_PATH}`);
  console.error('   Télécharge-la depuis Firebase Console :');
  console.error('   Paramètres du projet → Comptes de service → Générer une nouvelle clé privée');
  process.exit(1);
}

const adminUid = process.argv[2];
if (!adminUid) {
  console.error('\n❌ UID admin manquant.');
  console.error('   Usage : node scripts/seed.mjs <UID_ADMIN>');
  console.error('   L\'UID se trouve dans Firebase Console → Authentication → ton compte → Copier l\'UID');
  process.exit(1);
}

// ── Init Firebase Admin ────────────────────────────────────────────────────────

const serviceAccount = JSON.parse(readFileSync(KEY_PATH, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── Données ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'cat-plats-africains', nom_fr: 'Plats Africains', nom_en: 'African Dishes', ordre: 1, icon: '🍲' },
  { id: 'cat-grillades',       nom_fr: 'Grillades',       nom_en: 'Grills',          ordre: 2, icon: '🔥' },
  { id: 'cat-boissons-locales',nom_fr: 'Boissons Locales',nom_en: 'Local Drinks',    ordre: 3, icon: '🥤' },
  { id: 'cat-soft-jus',        nom_fr: 'Soft & Jus',      nom_en: 'Sodas & Juices',  ordre: 4, icon: '🧃' },
  { id: 'cat-bieres',          nom_fr: 'Bières',           nom_en: 'Beers',           ordre: 5, icon: '🍺' },
];

const PRODUCTS = [
  // ── Plats Africains ─────────────────────────────────────────────────────────
  { id: 'prod-fufu-sauce-arachide', nom_fr: 'Fufu & Sauce Arachide', nom_en: 'Fufu & Groundnut Sauce',
    desc_fr: 'Fufu de manioc avec sauce arachide onctueuse', desc_en: 'Cassava fufu with creamy groundnut sauce',
    prix: 2000, categorieId: 'cat-plats-africains', imageUrl: '', disponible: true, orderCount: 0, tags: ['populaire','sans-gluten'] },
  { id: 'prod-riz-sauce-gombo', nom_fr: 'Riz & Sauce Gombo', nom_en: 'Rice & Okra Sauce',
    desc_fr: 'Riz blanc avec sauce gombo au poisson ou poulet', desc_en: 'White rice with okra sauce, fish or chicken',
    prix: 2000, categorieId: 'cat-plats-africains', imageUrl: '', disponible: true, orderCount: 0, tags: ['populaire'] },
  { id: 'prod-pate-sauce-tomate', nom_fr: 'Pâte & Sauce Tomate', nom_en: 'Corn Paste & Tomato Sauce',
    desc_fr: 'Pâte de maïs avec sauce tomate épicée', desc_en: 'Corn paste with spicy tomato sauce',
    prix: 1500, categorieId: 'cat-plats-africains', imageUrl: '', disponible: true, orderCount: 0, tags: [] },
  { id: 'prod-akoume-sauce-graine', nom_fr: 'Akoumé & Sauce Graine', nom_en: 'Akoumé & Palm Nut Sauce',
    desc_fr: 'Pâte de maïs fermentée avec sauce de graines de palme', desc_en: 'Fermented corn paste with palm nut sauce',
    prix: 2500, categorieId: 'cat-plats-africains', imageUrl: '', disponible: true, orderCount: 0, tags: ['populaire','traditionnel'] },
  { id: 'prod-gboma-dessi', nom_fr: 'Gboma Dessi', nom_en: 'Gboma Dessi',
    desc_fr: "Plat traditionnel à base d'épinards africains et de poisson", desc_en: 'Traditional dish with African spinach and fish',
    prix: 2500, categorieId: 'cat-plats-africains', imageUrl: '', disponible: true, orderCount: 0, tags: ['traditionnel'] },
  { id: 'prod-riz-gras-poulet', nom_fr: 'Riz Gras Poulet', nom_en: 'Rice with Chicken',
    desc_fr: 'Riz cuit dans la sauce avec morceaux de poulet', desc_en: 'Rice cooked in sauce with pieces of chicken',
    prix: 3000, categorieId: 'cat-plats-africains', imageUrl: '', disponible: true, orderCount: 0, tags: ['populaire'] },
  { id: 'prod-haricots-huile-palme', nom_fr: "Haricots à l'huile de palme", nom_en: 'Beans in Palm Oil',
    desc_fr: "Haricots rouges cuits avec huile de palme et épices", desc_en: 'Red beans cooked with palm oil and spices',
    prix: 1500, categorieId: 'cat-plats-africains', imageUrl: '', disponible: true, orderCount: 0, tags: ['vegan'] },

  // ── Grillades ───────────────────────────────────────────────────────────────
  { id: 'prod-poulet-braise', nom_fr: 'Poulet Braisé (entier)', nom_en: 'Whole Grilled Chicken',
    desc_fr: 'Poulet entier braisé aux épices africaines, servi avec attiéké', desc_en: 'Whole chicken grilled with African spices, served with attiéké',
    prix: 5000, categorieId: 'cat-grillades', imageUrl: '', disponible: true, orderCount: 0, tags: ['populaire'] },
  { id: 'prod-demi-poulet-braise', nom_fr: 'Demi Poulet Braisé', nom_en: 'Half Grilled Chicken',
    desc_fr: 'Demi poulet braisé, servi avec attiéké ou frites', desc_en: 'Half grilled chicken, served with attiéké or fries',
    prix: 2500, categorieId: 'cat-grillades', imageUrl: '', disponible: true, orderCount: 0, tags: ['populaire'] },
  { id: 'prod-brochettes-boeuf', nom_fr: 'Brochettes de Bœuf', nom_en: 'Beef Skewers',
    desc_fr: 'Brochettes de bœuf marinées et grillées', desc_en: 'Marinated and grilled beef skewers',
    prix: 2000, categorieId: 'cat-grillades', imageUrl: '', disponible: true, orderCount: 0, tags: [] },
  { id: 'prod-poisson-braise', nom_fr: 'Poisson Braisé', nom_en: 'Grilled Fish',
    desc_fr: 'Poisson entier braisé aux épices, servi avec légumes', desc_en: 'Whole fish grilled with spices, served with vegetables',
    prix: 3500, categorieId: 'cat-grillades', imageUrl: '', disponible: true, orderCount: 0, tags: [] },

  // ── Boissons Locales ────────────────────────────────────────────────────────
  { id: 'prod-tchoukoutou', nom_fr: 'Tchoukoutou', nom_en: 'Tchoukoutou (Sorghum Beer)',
    desc_fr: 'Bière de sorgho locale traditionnelle', desc_en: 'Traditional local sorghum beer',
    prix: 500, categorieId: 'cat-boissons-locales', imageUrl: '', disponible: true, orderCount: 0, tags: ['local','alcool'] },
  { id: 'prod-sodabi', nom_fr: 'Sodabi', nom_en: 'Sodabi (Palm Spirit)',
    desc_fr: "Eau-de-vie de palme distillée artisanalement", desc_en: 'Artisanally distilled palm spirit',
    prix: 500, categorieId: 'cat-boissons-locales', imageUrl: '', disponible: true, orderCount: 0, tags: ['local','alcool'] },
  { id: 'prod-jus-gingembre', nom_fr: 'Jus de Gingembre', nom_en: 'Ginger Juice',
    desc_fr: 'Jus de gingembre frais préparé maison', desc_en: 'Freshly made homemade ginger juice',
    prix: 500, categorieId: 'cat-boissons-locales', imageUrl: '', disponible: true, orderCount: 0, tags: ['local','sans-alcool'] },
  { id: 'prod-jus-bissap', nom_fr: 'Jus de Bissap', nom_en: 'Hibiscus Juice',
    desc_fr: "Jus d'hibiscus rouge rafraîchissant", desc_en: 'Refreshing red hibiscus juice',
    prix: 500, categorieId: 'cat-boissons-locales', imageUrl: '', disponible: true, orderCount: 0, tags: ['local','sans-alcool'] },

  // ── Soft & Jus ──────────────────────────────────────────────────────────────
  { id: 'prod-coca-cola', nom_fr: 'Coca-Cola', nom_en: 'Coca-Cola',
    desc_fr: 'Boisson gazeuse Coca-Cola 33cl', desc_en: 'Coca-Cola sparkling drink 33cl',
    prix: 500, categorieId: 'cat-soft-jus', imageUrl: '', disponible: true, orderCount: 0, tags: [] },
  { id: 'prod-fanta', nom_fr: 'Fanta Orange', nom_en: 'Fanta Orange',
    desc_fr: 'Fanta Orange 33cl', desc_en: 'Fanta Orange 33cl',
    prix: 500, categorieId: 'cat-soft-jus', imageUrl: '', disponible: true, orderCount: 0, tags: [] },
  { id: 'prod-sprite', nom_fr: 'Sprite', nom_en: 'Sprite',
    desc_fr: 'Sprite citron 33cl', desc_en: 'Sprite lemon 33cl',
    prix: 500, categorieId: 'cat-soft-jus', imageUrl: '', disponible: true, orderCount: 0, tags: [] },
  { id: 'prod-eau-minerale', nom_fr: 'Eau Minérale', nom_en: 'Mineral Water',
    desc_fr: 'Eau minérale en bouteille 50cl', desc_en: 'Mineral water bottle 50cl',
    prix: 300, categorieId: 'cat-soft-jus', imageUrl: '', disponible: true, orderCount: 0, tags: [] },

  // ── Bières ──────────────────────────────────────────────────────────────────
  { id: 'prod-castel-biere', nom_fr: 'Castel Bière', nom_en: 'Castel Beer',
    desc_fr: 'Castel bière locale 65cl', desc_en: 'Local Castel beer 65cl',
    prix: 1000, categorieId: 'cat-bieres', imageUrl: '', disponible: true, orderCount: 0, tags: ['alcool'] },
  { id: 'prod-flag-biere', nom_fr: 'Flag Bière', nom_en: 'Flag Beer',
    desc_fr: 'Flag bière 65cl', desc_en: 'Flag beer 65cl',
    prix: 1000, categorieId: 'cat-bieres', imageUrl: '', disponible: true, orderCount: 0, tags: ['alcool'] },
  { id: 'prod-guiness', nom_fr: 'Guinness', nom_en: 'Guinness',
    desc_fr: 'Guinness stout 33cl', desc_en: 'Guinness stout 33cl',
    prix: 1200, categorieId: 'cat-bieres', imageUrl: '', disponible: true, orderCount: 0, tags: ['alcool'] },
];

// 20 tables : 8 Salle, 6 Paillote, 6 Jardin
const ZONES = [
  { zone: 'salle',    count: 8 },
  { zone: 'paillote', count: 6 },
  { zone: 'jardin',   count: 6 },
];

function buildTables() {
  const tables = [];
  let numero = 1;
  for (const { zone, count } of ZONES) {
    for (let i = 0; i < count; i++) {
      tables.push({
        id: `table-${String(numero).padStart(2, '0')}`,
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

// ── Seed ───────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🚀 Démarrage du seed — Place de la Victoire\n');

  // 1. Compte admin
  console.log(`👤 Création du compte admin (UID: ${adminUid})...`);
  await db.collection('users').doc(adminUid).set({
    nom: 'Administrateur',
    email: 'sethagbaa@gmail.com',
    role: 'admin',
    actif: true,
    createdAt: new Date(),
  });
  console.log('   ✅ users/' + adminUid);

  // 2. Catégories
  console.log('\n📁 Création des catégories...');
  const catBatch = db.batch();
  for (const { id, ...data } of CATEGORIES) {
    catBatch.set(db.collection('categories').doc(id), data);
    console.log(`   ✅ categories/${id}`);
  }
  await catBatch.commit();

  // 3. Produits
  console.log('\n🍽️  Création des produits...');
  const prodBatch = db.batch();
  for (const { id, ...data } of PRODUCTS) {
    prodBatch.set(db.collection('products').doc(id), data);
    console.log(`   ✅ products/${id}`);
  }
  await prodBatch.commit();

  // 4. Tables
  console.log('\n🪑 Création des tables...');
  const tables = buildTables();
  const tableBatch = db.batch();
  for (const { id, ...data } of tables) {
    tableBatch.set(db.collection('tables').doc(id), data);
    console.log(`   ✅ tables/${id} — Zone: ${data.zone}`);
  }
  await tableBatch.commit();

  console.log('\n✨ Seed terminé avec succès !');
  console.log(`   ${CATEGORIES.length} catégories`);
  console.log(`   ${PRODUCTS.length} produits`);
  console.log(`   ${tables.length} tables`);
  console.log(`   1 compte admin\n`);
  console.log('🔗 Connecte-toi sur : https://placedelavictoire-37a00.web.app/login');
  console.log('   Email    : sethagbaa@gmail.com');
  console.log('   Mot de passe : (celui que tu as défini dans Firebase Auth)\n');
}

seed().catch(err => {
  console.error('\n❌ Erreur pendant le seed :', err.message);
  process.exit(1);
});
