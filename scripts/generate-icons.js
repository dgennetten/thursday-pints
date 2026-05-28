/**
 * Regenerate PWA / favicon PNGs from public/logo.svg.
 * Run: node scripts/generate-icons.js
 */
import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const logo = join(root, 'public', 'logo.svg');
const white = { r: 255, g: 255, b: 255, alpha: 1 };

function renderPng(size, insetRatio = 0) {
  const inset = Math.round(size * insetRatio);
  const inner = size - 2 * inset;
  let pipeline = sharp(logo).resize(inner, inner, {
    fit: 'contain',
    background: white,
  });
  if (inset > 0) {
    pipeline = pipeline.extend({
      top: inset,
      bottom: inset,
      left: inset,
      right: inset,
      background: white,
    });
  }
  return pipeline.png();
}

const outputs = [
  { file: 'favicon-32x32.png', size: 32, inset: 0.06 },
  { file: 'favicon-96x96.png', size: 96, inset: 0.06 },
  { file: 'apple-touch-icon.png', size: 180, inset: 0.06 },
  { file: 'web-app-manifest-192x192.png', size: 192, inset: 0.06 },
  { file: 'web-app-manifest-512x512.png', size: 512, inset: 0.06 },
];

for (const { file, size, inset } of outputs) {
  const out = join(root, 'public', file);
  await renderPng(size, inset).toFile(out);
  console.log('wrote', file);
}
