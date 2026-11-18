// Builds the 3D walkthrough (holiday-rental/tour-src/tour3d.js + three.js) into one file the site loads:
//   node ../smartweld/node_modules/vite/bin/vite.js build --config tools/tour.vite.config.mjs
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url)), site = resolve(here, '../holiday-rental');
export default {
  root: resolve(site, 'tour-src'), logLevel: 'warn',
  resolve: { alias: { three: resolve(here, '../../smartweld/node_modules/three') } },
  build: { outDir: site, emptyOutDir: false, minify: 'esbuild', target: 'es2019', lib: { entry: resolve(site, 'tour-src/tour3d.js'), name: 'Tour3DBundle', formats: ['iife'], fileName: () => 'tour3d.bundle.js' } },
};
