/**
 * Favicon circulaire : masque en disque plein (coins transparents) pour les onglets
 * qui affichent l’icône dans un cercle.
 * Usage: node scripts/round-favicon.mjs
 */
import sharp from 'sharp';
import { existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

async function roundImage(inputPath, outputPath) {
  const img = sharp(inputPath);
  const meta = await img.metadata();
  const w = meta.width || 512;
  const h = meta.height || 512;
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2;

  const mask = Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="white"/>
    </svg>`
  );

  const rounded = await img
    .resize(w, h)
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  writeFileSync(outputPath, rounded);
  console.log('Favicon circulaire écrit:', outputPath);
}

const iconPath = join(root, 'public', 'icon.png');
const appIconPath = join(root, 'src', 'app', 'icon.png');

if (!existsSync(iconPath)) {
  console.error('Manquant:', iconPath);
  process.exit(1);
}

await roundImage(iconPath, iconPath);

if (existsSync(appIconPath)) {
  await roundImage(appIconPath, appIconPath);
} else {
  console.log('(Absent, ignoré)', appIconPath);
}
