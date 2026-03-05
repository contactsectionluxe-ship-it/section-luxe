/**
 * Script one-shot : ajoute des bords arrondis au favicon (icon.png).
 * Usage: node scripts/round-favicon.mjs
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const radius = 80; // rayon des coins (sur une image ~512px)

async function roundImage(inputPath, outputPath) {
  const img = sharp(inputPath);
  const meta = await img.metadata();
  const w = meta.width || 512;
  const h = meta.height || 512;
  const r = Math.min(radius, w / 4, h / 4);

  const mask = Buffer.from(
    `<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" ry="${r}" fill="white"/></svg>`
  );

  const rounded = await img
    .resize(w, h)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  writeFileSync(outputPath, rounded);
  console.log('Favicon avec bords arrondis écrit:', outputPath);
}

const iconPath = join(root, 'public', 'icon.png');
const appIconPath = join(root, 'src', 'app', 'icon.png');

await roundImage(iconPath, iconPath);
await roundImage(appIconPath, appIconPath);
