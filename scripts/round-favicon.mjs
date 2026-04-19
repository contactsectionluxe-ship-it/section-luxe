/**
 * Favicon : lit `public/favicon-source.png`
 *
 * - **Carré coins arrondis** (favicon site : `metadata.icons` → `public/icon.png`) + variantes 32–128 px.
 * - **Circulaire 192×192** (Google recherche, recommandation ≥48 px) : favicon-google-192.png
 * - **Apple Touch** 180×180 : apple-touch-icon.png
 *
 * Les navigateurs choisissent une taille proche de l’affichage ; Google indexe souvent le 192 px.
 * Décalage horizontal : voir OPTICAL_SHIFT_MM_X.
 *
 *   node scripts/round-favicon.mjs
 */
import sharp from 'sharp';
import { existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const OUTPUT_SIZE = 1024;
const GOOGLE_ICON_SIZE = 192;
const APPLE_TOUCH_SIZE = 180;
/** Rayon des coins (proportion du côté) — un peu moins qu’avant pour des angles plus discrets. */
const APPLE_CORNER_RATIO = 0.2;

const CIRCLE_INSET = 1.06;
const OPTICAL_SHIFT_Y = -5;
const OPTICAL_SHIFT_X = -5;
const OPTICAL_SHIFT_MM_X = 0.5;

function extraShiftLeftFromMm() {
  const pxPerMm = 96 / 25.4;
  return Math.round(OPTICAL_SHIFT_MM_X * pxPerMm * (OUTPUT_SIZE / 1024));
}

/**
 * @param {string} sourcePath
 */
async function buildCompositedSquare(sourcePath) {
  const shiftX = OPTICAL_SHIFT_X - extraShiftLeftFromMm();

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
  const left = Math.max(0, Math.min(OUTPUT_SIZE - newW, centerLeft + shiftX));
  const top = Math.max(0, Math.min(OUTPUT_SIZE - newH, centerTop + OPTICAL_SHIFT_Y));

  return sharp({
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
}

/**
 * Carré aux coins arrondis pour favicon : hors du squircle = **transparent**
 * (sinon un calque blanc 1024×1024 masque l’arrondi : on ne voit qu’un carré blanc).
 */
async function buildRoundedSquarePng(sourcePath, pixelSize) {
  const onSquare = await buildCompositedSquare(sourcePath);
  const w = OUTPUT_SIZE;
  const h = OUTPUT_SIZE;
  const rxMax = Math.floor(Math.min(w, h) / 2);
  const rx = Math.min(Math.round(w * APPLE_CORNER_RATIO), rxMax);

  const mask = Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${w}" height="${h}" rx="${rx}" ry="${rx}" fill="white"/>
    </svg>`
  );

  const clipped = await sharp(onSquare)
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  if (pixelSize === OUTPUT_SIZE) return clipped;
  return sharp(clipped)
    .resize(pixelSize, pixelSize, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
}

/** Disque + fond blanc hors cercle (aperçu Google en pastille ronde). */
async function buildGoogleCirclePng(sourcePath) {
  const onSquare = await buildCompositedSquare(sourcePath);
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

  const clipped = await sharp(onSquare)
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const full = await sharp({
    create: {
      width: OUTPUT_SIZE,
      height: OUTPUT_SIZE,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: clipped, left: 0, top: 0 }])
    .png()
    .toBuffer();

  return sharp(full)
    .resize(GOOGLE_ICON_SIZE, GOOGLE_ICON_SIZE, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
}

async function buildAppleTouchIconBuffer(sourcePath) {
  const onSquare = await buildCompositedSquare(sourcePath);
  const rx = Math.round(APPLE_TOUCH_SIZE * APPLE_CORNER_RATIO);

  const resized = await sharp(onSquare)
    .resize(APPLE_TOUCH_SIZE, APPLE_TOUCH_SIZE, { kernel: sharp.kernel.lanczos3 })
    .ensureAlpha()
    .png()
    .toBuffer();

  const mask = Buffer.from(
    `<svg width="${APPLE_TOUCH_SIZE}" height="${APPLE_TOUCH_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${APPLE_TOUCH_SIZE}" height="${APPLE_TOUCH_SIZE}" rx="${rx}" ry="${rx}" fill="white"/>
    </svg>`
  );

  const clipped = await sharp(resized)
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: APPLE_TOUCH_SIZE,
      height: APPLE_TOUCH_SIZE,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: clipped, left: 0, top: 0 }])
    .png()
    .toBuffer();
}

const sourcePath = join(root, 'public', 'favicon-source.png');
const iconPath = join(root, 'public', 'icon.png');
const appleTouchPath = join(root, 'public', 'apple-touch-icon.png');
const googleCirclePath = join(root, 'public', 'favicon-google-192.png');
const fav32 = join(root, 'public', 'favicon-32-rounded.png');
const fav48 = join(root, 'public', 'favicon-48-rounded.png');
const fav96 = join(root, 'public', 'favicon-96-rounded.png');
const fav128 = join(root, 'public', 'favicon-128-rounded.png');
if (!existsSync(sourcePath)) {
  console.error('Fichier manquant:', sourcePath);
  console.error('Place ton logo carré dans public/favicon-source.png puis relance.');
  process.exit(1);
}

const main1024 = await buildRoundedSquarePng(sourcePath, OUTPUT_SIZE);
writeFileSync(iconPath, main1024);
console.log('Source:', sourcePath);
console.log('icon.png (1024, coins arrondis):', iconPath);

writeFileSync(fav32, await sharp(main1024).resize(32, 32, { kernel: sharp.kernel.lanczos3 }).png().toBuffer());
console.log('favicon-32-rounded.png');
writeFileSync(fav48, await sharp(main1024).resize(48, 48, { kernel: sharp.kernel.lanczos3 }).png().toBuffer());
console.log('favicon-48-rounded.png');
writeFileSync(fav96, await sharp(main1024).resize(96, 96, { kernel: sharp.kernel.lanczos3 }).png().toBuffer());
console.log('favicon-96-rounded.png');
writeFileSync(fav128, await sharp(main1024).resize(128, 128, { kernel: sharp.kernel.lanczos3 }).png().toBuffer());
console.log('favicon-128-rounded.png');

writeFileSync(googleCirclePath, await buildGoogleCirclePng(sourcePath));
console.log('favicon-google-192.png (cercle, Google)');

const appleOut = await buildAppleTouchIconBuffer(sourcePath);
writeFileSync(appleTouchPath, appleOut);
console.log('apple-touch-icon.png');
