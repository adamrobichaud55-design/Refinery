// The studio renders the scroll films. It borrows three.js and vite from ../../smartweld/node_modules.
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url)), nm = resolve(here, '../../smartweld/node_modules');
export default { root: here, cacheDir: resolve(here, '.vite'), resolve: { alias: { three: resolve(nm, 'three') } }, server: { port: 5198, strictPort: true, host: '127.0.0.1', hmr: false, watch: null, fs: { allow: [resolve(here, '../..')] } } };
