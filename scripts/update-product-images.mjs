import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const keyPath = join(__dirname, 'serviceAccountKey.json');
const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf-8'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const BASE_URL = 'https://placedelavictoire-37a00.web.app/MENU/';

const mappings = [
  { id: 'p-attieke',          filename: 'Attiéké.webp' },
  { id: 'p-foufou',           filename: 'Foufou.jpg' },
  { id: 'p-pate-sorgho',      filename: 'Pâte de sorgho, maïs, djénkoumé.webp' },
  { id: 'p-salade-verte',     filename: 'Salade verte.webp' },
  { id: 'p-soupe-poulet',     filename: 'Soupe au poulet.jpg' },
  { id: 'p-soupe-champignon', filename: 'Soupe aux champignons.jpg' },
  { id: 'p-soupe-legumes',    filename: 'Soupe aux légumes.jpg' },
  { id: 'p-soupe-poisson',    filename: 'Soupe de poisson.webp' },
  { id: 'p-oeuf-plat',        filename: 'Œuf au plat.webp' },
  { id: 'p-oeuf-brouille',    filename: 'Œuf brouillé.jpg' },
];

async function run() {
  for (const { id, filename } of mappings) {
    const url = BASE_URL + encodeURIComponent(filename);
    await db.collection('products').doc(id).update({ imageUrl: url });
    console.log(`✅ Updated ${id} → ${url}`);
  }
  console.log('\nDone — 10 products updated.');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
