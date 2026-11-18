// Builds the photo walk-through (property-listing/tour-src/photo3d.js + three.js) into one file the site loads:
//   node ../smartweld/node_modules/vite/bin/vite.js build --config tools/photo3d.vite.config.mjs
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url)), site = resolve(here, '../property-listing');
export default {
  root: resolve(site, 'tour-src'), logLevel: 'warn',
  resolve: { alias: { three: resolve(here, '../../smartweld/node_modules/three') } },
  build: { outDir: site, emptyOutDir: false, minify: 'esbuild', target: 'es2019', lib: { entry: resolve(site, 'tour-src/photo3d.js'), name: 'Photo3DBundle', formats: ['iife'], fileName: () => 'photo3d.bundle.js' } },
};
