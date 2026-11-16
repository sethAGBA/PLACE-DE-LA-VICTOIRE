/**
 * Seed du vrai menu — Place de la Victoire, Kara, Togo
 * Usage : node scripts/seed-menu-reel.mjs
 *
 * Ce script REMPLACE toutes les catégories et produits existants
 * par le vrai menu du restaurant.
 *
 * Prérequis : scripts/serviceAccountKey.json doit exister
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEY_PATH = join(__dirname, 'serviceAccountKey.json');

if (!existsSync(KEY_PATH)) {
  console.error(`\n❌ Clé de service introuvable : ${KEY_PATH}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(KEY_PATH, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── Catégories ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'cat-petit-dej',      nom_fr: 'Petit Déjeuner',           nom_en: 'Breakfast',              ordre: 1,  icon: '☕' },
  { id: 'cat-entree-froide',  nom_fr: 'Entrée Froide',            nom_en: 'Cold Starters',          ordre: 2,  icon: '🥗' },
  { id: 'cat-entree-chaude',  nom_fr: 'Entrée Chaude',            nom_en: 'Hot Starters',           ordre: 3,  icon: '🍲' },
  { id: 'cat-oeufs',          nom_fr: 'Œufs au Choix',            nom_en: 'Egg Dishes',             ordre: 4,  icon: '🍳' },
  { id: 'cat-accompagnement', nom_fr: 'Accompagnements',          nom_en: 'Side Dishes',            ordre: 5,  icon: '🍚' },
  { id: 'cat-fast-food',      nom_fr: 'Fast Food',                nom_en: 'Fast Food',              ordre: 6,  icon: '🍔' },
  { id: 'cat-volaille',       nom_fr: 'Viande & Volaille',        nom_en: 'Meat & Poultry',         ordre: 7,  icon: '🍗' },
  { id: 'cat-boeuf',          nom_fr: 'Viande de Bœuf',           nom_en: 'Beef',                   ordre: 8,  icon: '🥩' },
  { id: 'cat-porc',           nom_fr: 'Viande de Porc',           nom_en: 'Pork',                   ordre: 9,  icon: '🐖' },
  { id: 'cat-poisson',        nom_fr: 'Poisson',                  nom_en: 'Fish',                   ordre: 10, icon: '🐟' },
  { id: 'cat-desserts',       nom_fr: 'Desserts',                 nom_en: 'Desserts',               ordre: 11, icon: '🍮' },
  { id: 'cat-glaces',         nom_fr: 'Glaces',                   nom_en: 'Ice Cream',              ordre: 12, icon: '🍦' },
  { id: 'cat-boissons-loc',   nom_fr: 'Boissons Locales',         nom_en: 'Local Drinks',           ordre: 13, icon: '🥤' },
  { id: 'cat-soft',           nom_fr: 'Soft & Jus',               nom_en: 'Sodas & Juices',         ordre: 14, icon: '🧃' },
  { id: 'cat-bieres',         nom_fr: 'Bières',                   nom_en: 'Beers',                  ordre: 15, icon: '🍺' },
];

// ── Produits ───────────────────────────────────────────────────────────────────
const PRODUCTS = [

  // ── Petit Déjeuner ──────────────────────────────────────────────────────────
  { id: 'p-cafe-simple',       nom_fr: 'Café simple',              nom_en: 'Simple Coffee',
    desc_fr: 'Café noir servi chaud',                              desc_en: 'Hot black coffee',
    prix: 800,   categorieId: 'cat-petit-dej', tags: [] },
  { id: 'p-cafe-lait',         nom_fr: 'Café au lait Peak',        nom_en: 'Café au Lait Peak',
    desc_fr: 'Café mélangé au lait Peak',                          desc_en: 'Coffee with Peak milk',
    prix: 1500,  categorieId: 'cat-petit-dej', tags: [] },
  { id: 'p-petit-dej-complet', nom_fr: 'Petit déjeuner complet',   nom_en: 'Full Breakfast',
    desc_fr: 'Café, pain, beurre, confiture et œuf',               desc_en: 'Coffee, bread, butter, jam and egg',
    prix: 3000,  categorieId: 'cat-petit-dej', tags: ['populaire'] },

  // ── Entrée Froide ────────────────────────────────────────────────────────────
  { id: 'p-salade-verte',      nom_fr: 'Salade verte',             nom_en: 'Green Salad',
    desc_fr: 'Salade fraîche assaisonnée',                         desc_en: 'Fresh seasoned salad',
    prix: 1500,  categorieId: 'cat-entree-froide', tags: ['végétarien'] },
  { id: 'p-salade-mixte',      nom_fr: 'Salade mixte',             nom_en: 'Mixed Salad',
    desc_fr: 'Salade composée de légumes variés',                  desc_en: 'Mixed vegetable salad',
    prix: 3000,  categorieId: 'cat-entree-froide', tags: ['végétarien'] },
  { id: 'p-salade-nicoise',    nom_fr: 'Salade niçoise',           nom_en: 'Niçoise Salad',
    desc_fr: 'Tomates, thon, olives, œufs durs',                   desc_en: 'Tomatoes, tuna, olives, hard-boiled eggs',
    prix: 2500,  categorieId: 'cat-entree-froide', tags: [] },
  { id: 'p-macedoine',         nom_fr: 'Macédoine',                nom_en: 'Macedoine',
    desc_fr: 'Mélange de légumes en dés avec mayonnaise',          desc_en: 'Diced vegetables with mayonnaise',
    prix: 4500,  categorieId: 'cat-entree-froide', tags: [] },
  { id: 'p-salade-pdv',        nom_fr: 'Salade Place de la Victoire', nom_en: 'Place de la Victoire Salad',
    desc_fr: 'Spécialité maison — recette secrète du chef',        desc_en: 'House specialty — chef\'s secret recipe',
    prix: 3000,  categorieId: 'cat-entree-froide', tags: ['recommandé', 'populaire'] },
  { id: 'p-salade-thon',       nom_fr: 'Salade tomate au thon',    nom_en: 'Tomato & Tuna Salad',
    desc_fr: 'Tomates fraîches et thon',                           desc_en: 'Fresh tomatoes and tuna',
    prix: 2500,  categorieId: 'cat-entree-froide', tags: [] },
  { id: 'p-salade-nere',       nom_fr: 'Salade de grain de néré',  nom_en: 'Néré Bean Salad',
    desc_fr: 'Salade traditionnelle aux grains de néré',           desc_en: 'Traditional salad with néré beans',
    prix: 3000,  categorieId: 'cat-entree-froide', tags: ['traditionnel'] },
  { id: 'p-salade-chef',       nom_fr: 'Salade du chef',           nom_en: 'Chef\'s Salad',
    desc_fr: 'Création du chef avec légumes frais du marché',      desc_en: 'Chef\'s creation with fresh market vegetables',
    prix: 3000,  categorieId: 'cat-entree-froide', tags: ['recommandé'] },
  { id: 'p-salade-pdterre',    nom_fr: 'Salade pomme de terre saucisse', nom_en: 'Potato & Sausage Salad',
    desc_fr: 'Salade de pommes de terre avec saucisses',           desc_en: 'Potato salad with sausages',
    prix: 2000,  categorieId: 'cat-entree-froide', tags: [] },
  { id: 'p-salade-complete',   nom_fr: 'Salade complète',          nom_en: 'Complete Salad',
    desc_fr: 'Salade complète garnissant tous les appétits',       desc_en: 'Complete salad to satisfy every appetite',
    prix: 3500,  categorieId: 'cat-entree-froide', tags: ['populaire'] },

  // ── Entrée Chaude ────────────────────────────────────────────────────────────
  { id: 'p-soupe-champignon',  nom_fr: 'Soupe aux champignons',    nom_en: 'Mushroom Soup',
    desc_fr: 'Soupe crémeuse aux champignons',                     desc_en: 'Creamy mushroom soup',
    prix: 2000,  categorieId: 'cat-entree-chaude', tags: ['végétarien'] },
  { id: 'p-potage-cult',       nom_fr: 'Potage cultivateur',       nom_en: 'Vegetable Soup',
    desc_fr: 'Soupe aux légumes du jardin',                        desc_en: 'Garden vegetable soup',
    prix: 2000,  categorieId: 'cat-entree-chaude', tags: ['végétarien'] },
  { id: 'p-soupe-legumes',     nom_fr: 'Soupe aux légumes',        nom_en: 'Vegetable Broth',
    desc_fr: 'Bouillon de légumes frais',                          desc_en: 'Fresh vegetable broth',
    prix: 2000,  categorieId: 'cat-entree-chaude', tags: ['végétarien'] },
  { id: 'p-soupe-poulet',      nom_fr: 'Soupe au poulet',          nom_en: 'Chicken Soup',
    desc_fr: 'Soupe nourrissante au poulet et légumes',            desc_en: 'Hearty chicken and vegetable soup',
    prix: 3000,  categorieId: 'cat-entree-chaude', tags: ['populaire'] },
  { id: 'p-soupe-poisson',     nom_fr: 'Soupe de poisson',         nom_en: 'Fish Soup',
    desc_fr: 'Soupe de poisson frais — prix selon taille',         desc_en: 'Fresh fish soup — price varies by size',
    prix: 3500,  categorieId: 'cat-entree-chaude', tags: [] },

  // ── Œufs ─────────────────────────────────────────────────────────────────────
  { id: 'p-oeuf-plat',         nom_fr: 'Œuf au plat',              nom_en: 'Fried Egg',
    desc_fr: 'Œuf sur le plat',                                    desc_en: 'Sunny-side up egg',
    prix: 1200,  categorieId: 'cat-oeufs', tags: [] },
  { id: 'p-oeuf-brouille',     nom_fr: 'Œuf brouillé',             nom_en: 'Scrambled Egg',
    desc_fr: 'Œufs brouillés moelleux',                            desc_en: 'Soft scrambled eggs',
    prix: 1000,  categorieId: 'cat-oeufs', tags: [] },
  { id: 'p-omelette-nature',   nom_fr: 'Omelette nature',          nom_en: 'Plain Omelette',
    desc_fr: 'Omelette simple bien dorée',                         desc_en: 'Simple golden omelette',
    prix: 1000,  categorieId: 'cat-oeufs', tags: [] },
  { id: 'p-omelette-esp',      nom_fr: 'Omelette espagnole',       nom_en: 'Spanish Omelette',
    desc_fr: 'Omelette à la tomate et à l\'oignon',                desc_en: 'Omelette with tomato and onion',
    prix: 1200,  categorieId: 'cat-oeufs', tags: ['populaire'] },
  { id: 'p-omelette-jambon',   nom_fr: 'Omelette jambon fromage',  nom_en: 'Ham & Cheese Omelette',
    desc_fr: 'Omelette garnie de jambon et fromage fondu',         desc_en: 'Omelette with ham and melted cheese',
    prix: 3000,  categorieId: 'cat-oeufs', tags: ['recommandé'] },
  { id: 'p-portion-fromage',   nom_fr: 'Portion fromage',          nom_en: 'Cheese Portion',
    desc_fr: 'Portion de fromage à table',                         desc_en: 'Table cheese portion',
    prix: 950,   categorieId: 'cat-oeufs', tags: [] },
  { id: 'p-portion-jambon',    nom_fr: 'Portion jambon',           nom_en: 'Ham Portion',
    desc_fr: 'Portion de jambon',                                  desc_en: 'Ham portion',
    prix: 800,   categorieId: 'cat-oeufs', tags: [] },

  // ── Accompagnements ──────────────────────────────────────────────────────────
  { id: 'p-pate-sorgho',       nom_fr: 'Pâte (sorgho/maïs/djénkoumé)', nom_en: 'Paste (sorghum/corn)',
    desc_fr: 'Pâte traditionnelle au choix',                       desc_en: 'Traditional paste of your choice',
    prix: 1000,  categorieId: 'cat-accompagnement', tags: ['traditionnel'] },
  { id: 'p-pomme-vapeur',      nom_fr: 'Pomme vapeur / sautée',    nom_en: 'Steamed / Sautéed Potatoes',
    desc_fr: 'Pommes de terre à la vapeur ou sautées',             desc_en: 'Steamed or sautéed potatoes',
    prix: 1500,  categorieId: 'cat-accompagnement', tags: [] },
  { id: 'p-riz-pilaf',         nom_fr: 'Riz pilaf',                nom_en: 'Pilaf Rice',
    desc_fr: 'Riz cuit avec légumes et épices',                    desc_en: 'Rice cooked with vegetables and spices',
    prix: 2000,  categorieId: 'cat-accompagnement', tags: ['populaire'] },
  { id: 'p-riz-grec',          nom_fr: 'Riz grec',                 nom_en: 'Greek Rice',
    desc_fr: 'Riz préparé à la façon grecque',                     desc_en: 'Rice prepared the Greek way',
    prix: 2000,  categorieId: 'cat-accompagnement', tags: [] },
  { id: 'p-riz-blanc',         nom_fr: 'Riz blanc',                nom_en: 'White Rice',
    desc_fr: 'Riz blanc nature',                                   desc_en: 'Plain white rice',
    prix: 1000,  categorieId: 'cat-accompagnement', tags: [] },
  { id: 'p-frites',            nom_fr: 'Frites',                   nom_en: 'French Fries',
    desc_fr: 'Frites croustillantes maison',                       desc_en: 'Homemade crispy fries',
    prix: 1300,  categorieId: 'cat-accompagnement', tags: ['populaire'] },
  { id: 'p-alloco',            nom_fr: 'Alloco',                   nom_en: 'Alloco (Fried Plantain)',
    desc_fr: 'Banane plantain frite dorée',                        desc_en: 'Golden fried plantain',
    prix: 1600,  categorieId: 'cat-accompagnement', tags: ['populaire', 'traditionnel'] },
  { id: 'p-foufou',            nom_fr: 'Foufou / Koliko',          nom_en: 'Fufu / Koliko',
    desc_fr: 'Foufou (1500 FCFA) ou Koliko (1000 FCFA)',           desc_en: 'Fufu (1500 CFA) or Koliko (1000 CFA)',
    prix: 1500,  categorieId: 'cat-accompagnement', tags: ['traditionnel'] },
  { id: 'p-attieke',           nom_fr: 'Attiéké',                  nom_en: 'Attiéké',
    desc_fr: 'Semoule de manioc fermentée',                        desc_en: 'Fermented cassava semolina',
    prix: 1000,  categorieId: 'cat-accompagnement', tags: ['traditionnel'] },
  { id: 'p-spaghetti',         nom_fr: 'Spaghetti',                nom_en: 'Spaghetti',
    desc_fr: 'Spaghetti nature ou à la sauce tomate',              desc_en: 'Plain spaghetti or with tomato sauce',
    prix: 1000,  categorieId: 'cat-accompagnement', tags: [] },
  { id: 'p-jardiniere',        nom_fr: 'Jardinière de légumes',    nom_en: 'Garden Vegetables',
    desc_fr: 'Mélange de légumes frais sautés',                    desc_en: 'Sautéed fresh vegetables mix',
    prix: 2300,  categorieId: 'cat-accompagnement', tags: ['végétarien'] },

  // ── Fast Food ────────────────────────────────────────────────────────────────
  { id: 'p-burger',            nom_fr: 'Burger',                   nom_en: 'Burger',
    desc_fr: 'Burger maison avec salade et sauce',                 desc_en: 'Homemade burger with salad and sauce',
    prix: 1500,  categorieId: 'cat-fast-food', tags: ['populaire'] },
  { id: 'p-chawarma',          nom_fr: 'Chawarma',                 nom_en: 'Shawarma',
    desc_fr: 'Chawarma au poulet avec sauce blanche',              desc_en: 'Chicken shawarma with white sauce',
    prix: 1500,  categorieId: 'cat-fast-food', tags: ['populaire'] },
  { id: 'p-sandwich-omelette', nom_fr: 'Sandwich omelette',        nom_en: 'Omelette Sandwich',
    desc_fr: 'Pain garni d\'une omelette',                         desc_en: 'Bread filled with omelette',
    prix: 1300,  categorieId: 'cat-fast-food', tags: [] },
  { id: 'p-sandwich-saucisse', nom_fr: 'Sandwich saucisses',       nom_en: 'Sausage Sandwich',
    desc_fr: 'Pain avec saucisses grillées',                       desc_en: 'Bread with grilled sausages',
    prix: 1500,  categorieId: 'cat-fast-food', tags: [] },
  { id: 'p-sandwich-jambon',   nom_fr: 'Sandwich jambon fromage',  nom_en: 'Ham & Cheese Sandwich',
    desc_fr: 'Pain avec jambon et fromage fondu',                  desc_en: 'Bread with ham and melted cheese',
    prix: 2000,  categorieId: 'cat-fast-food', tags: ['recommandé'] },
  { id: 'p-sandwich-vege',     nom_fr: 'Sandwich végétarien',      nom_en: 'Veggie Sandwich',
    desc_fr: 'Pain garni de légumes frais',                        desc_en: 'Bread with fresh vegetables',
    prix: 1500,  categorieId: 'cat-fast-food', tags: ['végétarien'] },
  { id: 'p-pizza-royal',       nom_fr: 'Pizza royale',             nom_en: 'Royal Pizza',
    desc_fr: 'Pizza garnie de viandes et fromage',                 desc_en: 'Pizza with meats and cheese',
    prix: 4500,  categorieId: 'cat-fast-food', tags: ['populaire', 'recommandé'] },
  { id: 'p-pizza-bolognaise',  nom_fr: 'Pizza bolognaise',         nom_en: 'Bolognese Pizza',
    desc_fr: 'Pizza à la sauce bolognaise',                        desc_en: 'Pizza with bolognese sauce',
    prix: 4500,  categorieId: 'cat-fast-food', tags: [] },
  { id: 'p-pizza-vege',        nom_fr: 'Pizza végétarienne',       nom_en: 'Vegetarian Pizza',
    desc_fr: 'Pizza aux légumes frais',                            desc_en: 'Pizza with fresh vegetables',
    prix: 3500,  categorieId: 'cat-fast-food', tags: ['végétarien'] },

  // ── Viande & Volaille ────────────────────────────────────────────────────────
  { id: 'p-pintade-entiere',   nom_fr: 'Pintade entière',          nom_en: 'Whole Guinea Fowl',
    desc_fr: 'Pintade entière rôtie',                              desc_en: 'Whole roasted guinea fowl',
    prix: 10400, categorieId: 'cat-volaille', tags: [] },
  { id: 'p-demi-pintade',      nom_fr: '½ Pintade',                nom_en: 'Half Guinea Fowl',
    desc_fr: 'Demi-pintade rôtie',                                 desc_en: 'Half roasted guinea fowl',
    prix: 5500,  categorieId: 'cat-volaille', tags: ['populaire'] },
  { id: 'p-quart-pintade',     nom_fr: '¼ Pintade',                nom_en: 'Quarter Guinea Fowl',
    desc_fr: 'Quart de pintade rôtie',                             desc_en: 'Quarter roasted guinea fowl',
    prix: 2700,  categorieId: 'cat-volaille', tags: [] },
  { id: 'p-pintade-naka',      nom_fr: 'Pintade NAKA (braisée tomate)', nom_en: 'NAKA Guinea Fowl (braised)',
    desc_fr: 'Pintade entière braisée à la tomate — spécialité maison', desc_en: 'Whole guinea fowl braised in tomato — house specialty',
    prix: 11000, categorieId: 'cat-volaille', tags: ['recommandé'] },
  { id: 'p-poulet-entier',     nom_fr: 'Poulet entier',            nom_en: 'Whole Chicken',
    desc_fr: 'Poulet entier rôti',                                 desc_en: 'Whole roasted chicken',
    prix: 8400,  categorieId: 'cat-volaille', tags: [] },
  { id: 'p-demi-poulet',       nom_fr: '½ Poulet',                 nom_en: 'Half Chicken',
    desc_fr: 'Demi-poulet rôti',                                   desc_en: 'Half roasted chicken',
    prix: 4500,  categorieId: 'cat-volaille', tags: ['populaire'] },
  { id: 'p-quart-poulet',      nom_fr: '¼ Poulet',                 nom_en: 'Quarter Chicken',
    desc_fr: 'Quart de poulet rôti',                               desc_en: 'Quarter roasted chicken',
    prix: 2300,  categorieId: 'cat-volaille', tags: ['populaire'] },
  { id: 'p-poulet-naka',       nom_fr: 'Poulet rôti NAKA',         nom_en: 'NAKA Roasted Chicken',
    desc_fr: 'Poulet entier braisé à la tomate — spécialité maison', desc_en: 'Whole chicken braised in tomato — house specialty',
    prix: 9000,  categorieId: 'cat-volaille', tags: ['recommandé'] },

  // ── Viande de Bœuf ───────────────────────────────────────────────────────────
  { id: 'p-boeuf',             nom_fr: 'Viande de bœuf',           nom_en: 'Beef',
    desc_fr: 'Portion de viande de bœuf grillée',                  desc_en: 'Grilled beef portion',
    prix: 1000,  categorieId: 'cat-boeuf', tags: [] },
  { id: 'p-brochette-boeuf',   nom_fr: 'Brochette de bœuf',        nom_en: 'Beef Skewer',
    desc_fr: 'Brochette de bœuf (300 ou 500 FCFA)',                desc_en: 'Beef skewer (300 or 500 CFA)',
    prix: 300,   categorieId: 'cat-boeuf', tags: ['populaire'] },

  // ── Viande de Porc ───────────────────────────────────────────────────────────
  { id: 'p-jarret-petit',      nom_fr: 'Jarret de porc (petit)',   nom_en: 'Small Pork Knuckle',
    desc_fr: 'Petit jarret de porc grillé',                        desc_en: 'Small grilled pork knuckle',
    prix: 5000,  categorieId: 'cat-porc', tags: [] },
  { id: 'p-jarret-grand',      nom_fr: 'Grand jarret de porc',     nom_en: 'Large Pork Knuckle',
    desc_fr: 'Grand jarret de porc grillé — pour 2 personnes',     desc_en: 'Large grilled pork knuckle — for 2',
    prix: 8000,  categorieId: 'cat-porc', tags: ['recommandé'] },
  { id: 'p-cote-porc',         nom_fr: 'Côte de porc grillée',     nom_en: 'Grilled Pork Chop',
    desc_fr: 'Côte de porc marinée et grillée',                    desc_en: 'Marinated grilled pork chop',
    prix: 3500,  categorieId: 'cat-porc', tags: ['populaire'] },
  { id: 'p-brochette-porc',    nom_fr: 'Brochette de porc',        nom_en: 'Pork Skewers',
    desc_fr: '4 tiges de brochette de porc grillée',               desc_en: '4 grilled pork skewers',
    prix: 3500,  categorieId: 'cat-porc', tags: ['populaire'] },

  // ── Poisson ──────────────────────────────────────────────────────────────────
  { id: 'p-akpala',            nom_fr: 'Akpala',                   nom_en: 'Akpala (Smoked Fish)',
    desc_fr: 'Poisson fumé traditionnel',                          desc_en: 'Traditional smoked fish',
    prix: 1000,  categorieId: 'cat-poisson', tags: ['traditionnel'] },
  { id: 'p-tilapia',           nom_fr: 'Tilapia',                  nom_en: 'Tilapia',
    desc_fr: 'Tilapia frais grillé — prix selon taille (3500 à 10000 FCFA)', desc_en: 'Fresh grilled tilapia — price by size',
    prix: 3500,  categorieId: 'cat-poisson', tags: ['populaire'] },
  { id: 'p-dorade',            nom_fr: 'Dorade',                   nom_en: 'Sea Bream',
    desc_fr: 'Dorade grillée — prix selon taille (3500 à 10000 FCFA)', desc_en: 'Grilled sea bream — price by size',
    prix: 3500,  categorieId: 'cat-poisson', tags: ['recommandé'] },
  { id: 'p-barre',             nom_fr: 'Barre',                    nom_en: 'Barre Fish',
    desc_fr: 'Poisson Barre grillé — prix selon taille (5000 à 10000 FCFA)', desc_en: 'Grilled Barre fish — price by size',
    prix: 5000,  categorieId: 'cat-poisson', tags: [] },

  // ── Desserts ─────────────────────────────────────────────────────────────────
  { id: 'p-crepe-confiture',   nom_fr: 'Crêpe aux confitures',     nom_en: 'Jam Crêpe',
    desc_fr: 'Crêpe fine servie avec confiture',                   desc_en: 'Thin crêpe served with jam',
    prix: 1500,  categorieId: 'cat-desserts', tags: [] },
  { id: 'p-crepe-miel',        nom_fr: 'Crêpe au miel',            nom_en: 'Honey Crêpe',
    desc_fr: 'Crêpe fine nappée de miel',                          desc_en: 'Thin crêpe drizzled with honey',
    prix: 1500,  categorieId: 'cat-desserts', tags: [] },
  { id: 'p-crepe-chocolat',    nom_fr: 'Crêpe au chocolat',        nom_en: 'Chocolate Crêpe',
    desc_fr: 'Crêpe fine au chocolat fondu',                       desc_en: 'Thin crêpe with melted chocolate',
    prix: 1500,  categorieId: 'cat-desserts', tags: ['populaire'] },
  { id: 'p-crepe-nature',      nom_fr: 'Crêpe nature',             nom_en: 'Plain Crêpe',
    desc_fr: 'Crêpe fine nature',                                  desc_en: 'Plain thin crêpe',
    prix: 1500,  categorieId: 'cat-desserts', tags: [] },
  { id: 'p-brochette-fruits',  nom_fr: 'Brochette de fruits',      nom_en: 'Fruit Skewer',
    desc_fr: 'Brochette de fruits frais de saison',                desc_en: 'Fresh seasonal fruit skewer',
    prix: 1000,  categorieId: 'cat-desserts', tags: ['végétarien'] },
  { id: 'p-salade-fruits',     nom_fr: 'Salade de fruits',         nom_en: 'Fruit Salad',
    desc_fr: 'Salade de fruits frais de saison',                   desc_en: 'Fresh seasonal fruit salad',
    prix: 1000,  categorieId: 'cat-desserts', tags: ['végétarien'] },
  { id: 'p-assiette-fruits',   nom_fr: 'Assiette de fruits',       nom_en: 'Fruit Plate',
    desc_fr: 'Assortiment de fruits frais',                        desc_en: 'Assorted fresh fruits',
    prix: 1500,  categorieId: 'cat-desserts', tags: ['végétarien'] },

  // ── Glaces ───────────────────────────────────────────────────────────────────
  { id: 'p-glace-vanille',     nom_fr: 'Glace vanille',            nom_en: 'Vanilla Ice Cream',
    desc_fr: 'Boule de glace à la vanille',                        desc_en: 'Vanilla ice cream scoop',
    prix: 450,   categorieId: 'cat-glaces', tags: [] },
  { id: 'p-glace-chocolat',    nom_fr: 'Glace chocolat',           nom_en: 'Chocolate Ice Cream',
    desc_fr: 'Boule de glace au chocolat',                         desc_en: 'Chocolate ice cream scoop',
    prix: 450,   categorieId: 'cat-glaces', tags: ['populaire'] },
  { id: 'p-glace-fraise',      nom_fr: 'Glace fraise',             nom_en: 'Strawberry Ice Cream',
    desc_fr: 'Boule de glace à la fraise',                         desc_en: 'Strawberry ice cream scoop',
    prix: 450,   categorieId: 'cat-glaces', tags: [] },
  { id: 'p-glace-panache',     nom_fr: 'Glace panachée',           nom_en: 'Mixed Ice Cream',
    desc_fr: 'Boule de glace aux saveurs mélangées',               desc_en: 'Mixed flavour ice cream scoop',
    prix: 450,   categorieId: 'cat-glaces', tags: [] },

  // ── Boissons Locales ─────────────────────────────────────────────────────────
  { id: 'p-tchoukoutou',       nom_fr: 'Tchoukoutou',              nom_en: 'Tchoukoutou (Sorghum Beer)',
    desc_fr: 'Bière de sorgho locale traditionnelle',              desc_en: 'Traditional local sorghum beer',
    prix: 500,   categorieId: 'cat-boissons-loc', tags: ['local', 'alcool', 'traditionnel'] },
  { id: 'p-sodabi',            nom_fr: 'Sodabi',                   nom_en: 'Sodabi (Palm Spirit)',
    desc_fr: 'Eau-de-vie de palme distillée artisanalement',       desc_en: 'Artisanally distilled palm spirit',
    prix: 500,   categorieId: 'cat-boissons-loc', tags: ['local', 'alcool'] },
  { id: 'p-jus-gingembre',     nom_fr: 'Jus de gingembre',         nom_en: 'Ginger Juice',
    desc_fr: 'Jus de gingembre frais préparé maison',              desc_en: 'Freshly made homemade ginger juice',
    prix: 500,   categorieId: 'cat-boissons-loc', tags: ['local', 'sans-alcool'] },
  { id: 'p-jus-bissap',        nom_fr: 'Jus de bissap',            nom_en: 'Hibiscus Juice',
    desc_fr: 'Jus d\'hibiscus rouge rafraîchissant',               desc_en: 'Refreshing red hibiscus juice',
    prix: 500,   categorieId: 'cat-boissons-loc', tags: ['local', 'sans-alcool'] },

  // ── Soft & Jus ───────────────────────────────────────────────────────────────
  { id: 'p-coca',              nom_fr: 'Coca-Cola',                nom_en: 'Coca-Cola',
    desc_fr: 'Coca-Cola 33cl bien frais',                          desc_en: 'Cold Coca-Cola 33cl',
    prix: 500,   categorieId: 'cat-soft', tags: [] },
  { id: 'p-fanta',             nom_fr: 'Fanta Orange',             nom_en: 'Fanta Orange',
    desc_fr: 'Fanta Orange 33cl',                                  desc_en: 'Fanta Orange 33cl',
    prix: 500,   categorieId: 'cat-soft', tags: [] },
  { id: 'p-sprite',            nom_fr: 'Sprite',                   nom_en: 'Sprite',
    desc_fr: 'Sprite citron 33cl',                                 desc_en: 'Sprite lemon 33cl',
    prix: 500,   categorieId: 'cat-soft', tags: [] },
  { id: 'p-eau',               nom_fr: 'Eau minérale',             nom_en: 'Mineral Water',
    desc_fr: 'Eau minérale en bouteille',                          desc_en: 'Bottled mineral water',
    prix: 300,   categorieId: 'cat-soft', tags: [] },

  // ── Bières ───────────────────────────────────────────────────────────────────
  { id: 'p-castel',            nom_fr: 'Castel Bière',             nom_en: 'Castel Beer',
    desc_fr: 'Castel bière locale 65cl',                           desc_en: 'Local Castel beer 65cl',
    prix: 1000,  categorieId: 'cat-bieres', tags: ['alcool'] },
  { id: 'p-flag',              nom_fr: 'Flag Bière',               nom_en: 'Flag Beer',
    desc_fr: 'Flag bière 65cl',                                    desc_en: 'Flag beer 65cl',
    prix: 1000,  categorieId: 'cat-bieres', tags: ['alcool'] },
  { id: 'p-guinness',          nom_fr: 'Guinness',                 nom_en: 'Guinness',
    desc_fr: 'Guinness stout 33cl',                                desc_en: 'Guinness stout 33cl',
    prix: 1200,  categorieId: 'cat-bieres', tags: ['alcool'] },
];

// ── Seed ───────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🚀 Seed du vrai menu — Place de la Victoire\n');

  // 1. Supprimer anciennes catégories et produits
  console.log('🗑️  Suppression des anciennes données...');
  const [oldCats, oldProds] = await Promise.all([
    db.collection('categories').get(),
    db.collection('products').get(),
  ]);

  const deleteBatch = db.batch();
  oldCats.docs.forEach(d => deleteBatch.delete(d.ref));
  oldProds.docs.forEach(d => deleteBatch.delete(d.ref));
  await deleteBatch.commit();
  console.log(`   ✅ ${oldCats.size} catégories et ${oldProds.size} produits supprimés`);

  // 2. Créer nouvelles catégories
  console.log('\n📁 Création des catégories...');
  const catBatch = db.batch();
  for (const { id, ...data } of CATEGORIES) {
    catBatch.set(db.collection('categories').doc(id), data);
    console.log(`   ✅ ${id} — ${data.nom_fr}`);
  }
  await catBatch.commit();

  // 3. Créer les produits par batch de 400
  console.log('\n🍽️  Création des produits...');
  const BATCH_SIZE = 400;
  for (let i = 0; i < PRODUCTS.length; i += BATCH_SIZE) {
    const chunk = PRODUCTS.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const { id, ...data } of chunk) {
      batch.set(db.collection('products').doc(id), {
        ...data,
        imageUrl: '',
        disponible: true,
        orderCount: 0,
      });
      console.log(`   ✅ ${id} — ${data.nom_fr} (${data.prix} FCFA)`);
    }
    await batch.commit();
  }

  console.log('\n✨ Seed terminé avec succès !');
  console.log(`   ${CATEGORIES.length} catégories`);
  console.log(`   ${PRODUCTS.length} produits\n`);
  console.log('💡 Les photos peuvent être ajoutées depuis Admin → Menu\n');
}

seed().catch(err => {
  console.error('\n❌ Erreur :', err.message);
  process.exit(1);
});
