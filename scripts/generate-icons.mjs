/**
 * Génère les icônes PWA 192x192 et 512x512 en PNG depuis un SVG
 * Usage: node scripts/generate-icons.mjs
 */

import sharp from 'sharp';
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function buildSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#E8690F"/>
      <stop offset="100%" stop-color="#B84500"/>
    </radialGradient>
    <radialGradient id="plate" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#FFF8F0"/>
      <stop offset="100%" stop-color="#F5E6D0"/>
    </radialGradient>
  </defs>
  <circle cx="256" cy="256" r="256" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="220" fill="none" stroke="#F5A860" stroke-width="4" opacity="0.4"/>
  <circle cx="256" cy="256" r="200" fill="none" stroke="#F5A860" stroke-width="2" opacity="0.25"/>
  <ellipse cx="256" cy="272" rx="150" ry="150" fill="url(#plate)" opacity="0.95"/>
  <ellipse cx="256" cy="272" rx="150" ry="150" fill="none" stroke="#D4580A" stroke-width="5" opacity="0.5"/>
  <ellipse cx="256" cy="272" rx="118" ry="118" fill="none" stroke="#D4580A" stroke-width="2.5" opacity="0.25"/>
  <g fill="#C04A08">
    <rect x="168" y="148" width="12" height="95" rx="6"/>
    <rect x="162" y="118" width="6" height="58" rx="3"/>
    <rect x="171" y="118" width="6" height="58" rx="3"/>
    <rect x="180" y="118" width="6" height="58" rx="3"/>
    <rect x="162" y="174" width="26" height="10" rx="3"/>
  </g>
  <g fill="#C04A08">
    <rect x="332" y="148" width="12" height="95" rx="6"/>
    <path d="M326,118 L338,118 L342,176 L322,176 Z" rx="3"/>
  </g>
  <text x="256" y="318"
    font-family="Georgia, serif"
    font-size="58"
    font-weight="bold"
    fill="#C04A08"
    text-anchor="middle"
    opacity="0.9">PdV</text>
  <g fill="#F5A860" opacity="0.65">
    <polygon points="0,-14 12,7 -12,7" transform="translate(216,460)"/>
    <polygon points="0,-14 12,7 -12,7" transform="translate(256,460)"/>
    <polygon points="0,-14 12,7 -12,7" transform="translate(296,460)"/>
  </g>
</svg>`;
}

async function run() {
  const sizes = [192, 512];
  for (const size of sizes) {
    const svg = buildSVG(size);
    const svgBuf = Buffer.from(svg);
    const outPath = join(__dirname, `../public/icons/pwa-${size}x${size}.png`);
    await sharp(svgBuf).resize(size, size).png().toFile(outPath);
    console.log(`✅ ${outPath}`);
  }

  // Générer aussi favicon 32x32 et apple-touch-icon 180x180
  const favicon = buildSVG(32);
  await sharp(Buffer.from(favicon)).resize(32, 32).png()
    .toFile(join(__dirname, '../public/favicon.png'));
  console.log('✅ public/favicon.png');

  const apple = buildSVG(180);
  await sharp(Buffer.from(apple)).resize(180, 180).png()
    .toFile(join(__dirname, '../public/icons/apple-touch-icon.png'));
  console.log('✅ public/icons/apple-touch-icon.png');

  console.log('\n🎉 Toutes les icônes PWA sont générées !');
}

run().catch((err) => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
