/**
 * Regenerate PWA / favicon PNGs from public/icon.svg
 * (orange beer mug, lucide 'beer').
 * Run: node scripts/generate-icons.js
 */
import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const icon = join(root, 'public', 'icon.svg');
const white = { r: 255, g: 255, b: 255, alpha: 1 };
const transparent = { r: 255, g: 255, b: 255, alpha: 0 };

function renderPng(src, size, insetRatio = 0, background = transparent) {
  const inset = Math.round(size * insetRatio);
  const inner = size - 2 * inset;
  let pipeline = sharp(src).resize(inner, inner, {
    fit: 'contain',
    background,
  });
  if (inset > 0) {
    pipeline = pipeline.extend({
      top: inset,
      bottom: inset,
      left: inset,
      right: inset,
      background,
    });
  }
  return pipeline.png();
}

// apple-touch-icon must be opaque: iOS composites transparent PNGs onto black.
const outputs = [
  { file: 'favicon-32x32.png', size: 32, inset: 0.06, src: icon },
  { file: 'favicon-96x96.png', size: 96, inset: 0.06, src: icon },
  { file: 'apple-touch-icon.png', size: 180, inset: 0.06, src: icon, background: white },
  { file: 'web-app-manifest-192x192.png', size: 192, inset: 0.06, src: icon },
  { file: 'web-app-manifest-512x512.png', size: 512, inset: 0.06, src: icon },
];

for (const { file, size, inset, src, background } of outputs) {
  const out = join(root, 'public', file);
  await renderPng(src, size, inset, background).toFile(out);
  console.log('wrote', file);
}
