/**
 * Regenerate PWA / favicon PNGs from public/icon.svg
 * (orange beer mug, lucide 'beer').
 *
 * icon.svg already carries lucide's native ~8% internal margin, so the glyph
 * is rendered edge-to-edge (inset 0) to fill the tile — matching the big look
 * of the favicons in the sundial-generator / directory projects. Only the
 * apple-touch icon gets a small margin and an opaque white background, since
 * iOS rounds the corners and composites any transparency onto black.
 *
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

function renderPng(src, size, { inset = 0, background = transparent, flatten = false } = {}) {
  const insetPx = Math.round(size * inset);
  const inner = size - 2 * insetPx;
  let pipeline = sharp(src).resize(inner, inner, { fit: 'contain', background });
  if (insetPx > 0) {
    pipeline = pipeline.extend({
      top: insetPx,
      bottom: insetPx,
      left: insetPx,
      right: insetPx,
      background,
    });
  }
  // flatten fills the glyph's transparent interior (not just letterbox padding),
  // producing a fully opaque icon for iOS.
  if (flatten) {
    pipeline = pipeline.flatten({ background: white });
  }
  return pipeline.png();
}

const outputs = [
  { file: 'favicon-32x32.png', size: 32 },
  { file: 'favicon-96x96.png', size: 96 },
  { file: 'apple-touch-icon.png', size: 180, opts: { inset: 0.08, background: white, flatten: true } },
  { file: 'web-app-manifest-192x192.png', size: 192 },
  { file: 'web-app-manifest-512x512.png', size: 512 },
];

for (const { file, size, opts } of outputs) {
  const out = join(root, 'public', file);
  await renderPng(icon, size, opts).toFile(out);
  console.log('wrote', file);
}
