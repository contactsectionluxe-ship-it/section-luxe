/**
 * Favicon : lit `public/favicon-source.png`
 * - `public/icon.png` (+ `src/app/icon.png`) : **carré à coins arrondis** (favoris / barre de favoris, onglets).
 * - `public/apple-touch-icon.png` : **180×180**, même style (Écran d’accueil iOS, etc.).
 *
 * Décalage horizontal : ~0,5 mm à gauche sur le canevas 1024 px (voir OPTICAL_SHIFT_MM_X).
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
const APPLE_TOUCH_SIZE = 180;
/** ~iOS : rayon de coin sur le côté (proportion du carré). */
const APPLE_CORNER_RATIO = 0.224;

const CIRCLE_INSET = 1.06;
/** Décalage optique vertical (px sur 1024). */
const OPTICAL_SHIFT_Y = -5;
/** Décalage horizontal de base (px sur 1024, négatif = gauche). */
const OPTICAL_SHIFT_X = -5;
/**
 * Décalage horizontal supplémentaire demandé (mm vers la gauche), converti en px sur 1024
 * (référence 96 px / inch : 0,5 mm ≈ 2 px à cette échelle).
 */
const OPTICAL_SHIFT_MM_X = 0.5;

function extraShiftLeftFromMm() {
  const pxPerMm = 96 / 25.4;
  return Math.round(OPTICAL_SHIFT_MM_X * pxPerMm * (OUTPUT_SIZE / 1024));
}

/**
 * Carré blanc + logo centré (avant masque coins arrondis ou export Apple).
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

/** Favicon principal : carré aux coins arrondis, fond blanc aux coins (favoris / onglets). */
async function buildMainFaviconBuffer(sourcePath) {
  const onSquare = await buildCompositedSquare(sourcePath);
  const w = OUTPUT_SIZE;
  const h = OUTPUT_SIZE;
  const rx = Math.round(w * APPLE_CORNER_RATIO);

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

  return sharp({
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
}

/**
 * Apple Touch Icon : carré 180 px, coins arrondis dans l’image (fond blanc hors forme).
 * Recommandé pour l’écran d’accueil iOS ; le masque des **onglets** Safari macOS reste imposé par le navigateur.
 */
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
const appIconPath = join(root, 'src', 'app', 'icon.png');

if (!existsSync(sourcePath)) {
  console.error('Fichier manquant:', sourcePath);
  console.error('Place ton logo carré dans public/favicon-source.png puis relance.');
  process.exit(1);
}

const mainOut = await buildMainFaviconBuffer(sourcePath);
writeFileSync(iconPath, mainOut);
console.log('Source:', sourcePath);
console.log('Favicon (carré coins arrondis):', iconPath);

const appleOut = await buildAppleTouchIconBuffer(sourcePath);
writeFileSync(appleTouchPath, appleOut);
console.log('Apple Touch (coins arrondis):', appleTouchPath);

if (existsSync(join(root, 'src', 'app'))) {
  writeFileSync(appIconPath, mainOut);
  console.log('Copie alignée:', appIconPath);
}
