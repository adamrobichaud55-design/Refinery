// Makes the preview copy of a site: the same page without the <html>/<head>/<body> wrapper, which the preview host adds itself.
//   node tools/build-artifact.mjs home-services "Home Services Scroll Site"    ->  home-services/preview.html
import { readFileSync, writeFileSync } from 'node:fs';
const dir = process.argv[2], name = process.argv[3], html = readFileSync(`${dir}/index.html`, 'utf8').replace(/<title>[^<]*<\/title>/, t => (name ? `<title>${name}</title>` : t));
const head = html.slice(html.indexOf('<head>') + 6, html.indexOf('</head>')), body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));
const keep = head.split('\n').filter(l => !/<meta charset|name="viewport"/.test(l)).join('\n');
writeFileSync(`${dir}/preview.html`, keep.trim() + '\n' + body.trim() + '\n');
console.log('wrote', `${dir}/preview.html`);
