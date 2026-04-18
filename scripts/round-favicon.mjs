/**
 * Favicon circulaire : lit TOUJOURS `public/favicon-source.png` (logo carré brut),
 * écrit `public/icon.png` (+ copie `src/app/icon.png`). Ne pas régénérer depuis
 * `icon.png` : le trim sur une image déjà circulaire rétrécit le logo à chaque fois.
 *
 * Mettre à jour le favicon : remplacer `public/favicon-source.png`, puis
 *   node scripts/round-favicon.mjs
 */
import sharp from 'sharp';
import { existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const OUTPUT_SIZE = 1024;
/**
 * Zoom dans le disque : 1 = taille max théorique dans le cercle.
 * > 1 agrandit (léger dépassement possible sur les coins, souvent blanc).
 */
const CIRCLE_INSET = 1.06;
/** Centrage optique (px sur 1024) : x négatif = gauche, y négatif = haut. */
const OPTICAL_SHIFT_X = -5;
const OPTICAL_SHIFT_Y = -5;

/**
 * @param {string} sourcePath
 * @returns {Promise<Buffer>}
 */
async function buildRoundIconBuffer(sourcePath) {
  let pipeline = sharp(sourcePath).ensureAlpha();

  try {
    const trimmed = await pipeline.clone().trim({ threshold: 22 }).toBuffer();
    pipeline = sharp(trimmed).ensureAlpha();
  } catch {
    /* garder l’original */
  }

  const meta = await pipeline.metadata();
  const W = meta.width || OUTPUT_SIZE;
  const H = meta.height || OUTPUT_SIZE;

  const R = OUTPUT_SIZE / 2;
  const halfDiag = Math.hypot(W / 2, H / 2);
  const scale = (R * CIRCLE_INSET) / Math.max(halfDiag, 1);

  const newW = Math.max(1, Math.round(W * scale));
  const newH = Math.max(1, Math.round(H * scale));

  const resized = await pipeline
    .resize(newW, newH, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
    .ensureAlpha()
    .png()
    .toBuffer();

  const centerLeft = Math.floor((OUTPUT_SIZE - newW) / 2);
  const centerTop = Math.floor((OUTPUT_SIZE - newH) / 2);
  const left = Math.max(0, Math.min(OUTPUT_SIZE - newW, centerLeft + OPTICAL_SHIFT_X));
  const top = Math.max(0, Math.min(OUTPUT_SIZE - newH, centerTop + OPTICAL_SHIFT_Y));

  const onSquare = await sharp({
    create: {
      width: OUTPUT_SIZE,
      height: OUTPUT_SIZE,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: resized, left, top }])
    .ensureAlpha()
    .png()
    .toBuffer();

  const img = sharp(onSquare);
  const w = OUTPUT_SIZE;
  const h = OUTPUT_SIZE;
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2;

  const mask = Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="white"/>
    </svg>`
  );

  return img.composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}

const sourcePath = join(root, 'public', 'favicon-source.png');
const iconPath = join(root, 'public', 'icon.png');
const appIconPath = join(root, 'src', 'app', 'icon.png');

if (!existsSync(sourcePath)) {
  console.error('Fichier manquant:', sourcePath);
  console.error('Place ton logo carré (fond blanc ou transparent) dans public/favicon-source.png puis relance.');
  process.exit(1);
}

const out = await buildRoundIconBuffer(sourcePath);
writeFileSync(iconPath, out);
console.log('Source:', sourcePath);
console.log('Favicon circulaire écrit:', iconPath);

if (existsSync(join(root, 'src', 'app'))) {
  writeFileSync(appIconPath, out);
  console.log('Copie alignée:', appIconPath);
}
