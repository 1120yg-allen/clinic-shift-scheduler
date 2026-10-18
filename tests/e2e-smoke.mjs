// 選用：用 Playwright 開瀏覽器跑一次本機模式的冒煙測試。
// 執行：npx playwright install chromium && node tests/e2e-smoke.mjs
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = createServer((req, res) => {
  const p = join(root, req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
  if (!existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': types[extname(p)] || 'text/plain' });
  res.end(readFileSync(p));
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
await page.goto(`http://localhost:${port}/`);
await page.click('[data-act="initdemo"]');
await page.waitForSelector('table.grid');
const rows0 = await page.locator('table.grid tbody tr').count();
await page.click('[data-act="auto"]');
await page.waitForTimeout(300);
for (const t of ['asst', 'hours', 'swap', 'rules', 'settings', 'pt']) {
  await page.click(`[data-tab="${t}"]`);
  await page.waitForTimeout(100);
}
console.log('rows', rows0, 'errors', errors);
await browser.close(); server.close();
process.exit(errors.length ? 1 : 0);
