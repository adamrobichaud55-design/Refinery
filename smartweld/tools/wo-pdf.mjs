// Prints each work-order HTML pack (public/workorders/WO-*.html) to PDF with the session's pre-installed Playwright.
import { createRequire } from 'node:module';
import { readdirSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const { chromium } = createRequire(import.meta.url)('/opt/node-tools/node_modules/playwright');
const dir = resolve('public/workorders'); mkdirSync(`${dir}/pdf`, { recursive: true });
const browser = await chromium.launch(), page = await browser.newPage();
for (const f of readdirSync(dir).filter(x => /^WO-.*\.html$/.test(x)).sort()) {
  await page.goto(`file://${dir}/${f}`, { waitUntil: 'load' });
  await page.pdf({ path: `${dir}/pdf/${f.replace('.html', '.pdf')}`, width: '17in', height: '11in', printBackground: true, margin: { top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in' } });
  console.log('pdf', f);
}
await browser.close();
