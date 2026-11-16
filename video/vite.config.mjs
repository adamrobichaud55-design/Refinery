// Dev server for the film page only. It reads the SmartWeld sources and published plant data; it writes nothing there.
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url)), sw = resolve(here, '../smartweld');
export default {
  root: here,
  publicDir: resolve(sw, 'public'),
  cacheDir: resolve(here, '.vite'),
  resolve: { alias: [{ find: /^three$/, replacement: resolve(sw, 'node_modules/three') }, { find: /^three\//, replacement: resolve(sw, 'node_modules/three') + '/' }, { find: '@sw', replacement: resolve(sw, 'src') }] },
  server: { port: 5199, host: '127.0.0.1', strictPort: true, fs: { allow: [resolve(here, '..')] } },
};
