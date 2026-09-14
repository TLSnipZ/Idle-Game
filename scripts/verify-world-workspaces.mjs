import { readFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium } = await import(pathToFileURL(process.env.SOLARA_PLAYWRIGHT_MODULE).href);
const fixtures = JSON.parse(readFileSync(process.env.SOLARA_AUDIT_FIXTURES, 'utf8'));
const baseUrl = process.env.SOLARA_BASE_URL ?? 'http://127.0.0.1:4181';
const server = process.env.SOLARA_BASE_URL ? null : spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4181'], { stdio: 'inherit' });
const views = [['city-heading', 'crew-heading', 'city-events-heading'], ['rebirth-heading', 'skill-tree-heading', 'achievements-heading', 'statistics-heading', 'save-transfer-heading']];
const open = (page, id) => page.locator(`[data-workspace-view="${id}"]`).click();
async function geometry(page) {
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No horizontal overflow');
  assert.equal(await page.locator('[data-workspace-panel]:visible').count(), 1);
  const bad = await page.locator('.workspace-navigation button').evaluateAll(es => es.some(e => e.scrollWidth > e.clientWidth + 1));
  assert.equal(bad, false, 'Navigation labels fit');
}
let browser, cases = 0;
try {
  for (let i = 0; i < 100; i++) { try { if ((await fetch(baseUrl)).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
  browser = await chromium.launch({ headless: true }); mkdirSync('browser-evidence', { recursive: true });
  for (const locale of ['en', 'de', 'villager']) for (const width of [320, 390, 740, 1024, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } }), page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(({ fixture, locale }) => {
      if (sessionStorage.getItem('world-initialized')) return;
      fixture.savedAt = Date.now(); localStorage.setItem('crime-empire:save', JSON.stringify(fixture));
      localStorage.setItem('solara-city:settings', JSON.stringify({ locale, reducedMotion: true })); sessionStorage.setItem('world-initialized', '1');
    }, { fixture: fixtures[2], locale });
    await page.goto(baseUrl);
    if (await page.locator('.offline-continue').count()) await page.locator('.offline-continue').click();
    await page.locator('.overview-economy .business-artwork img').waitFor({ state: 'visible' });
    assert.ok(await page.locator('.overview-economy .business-artwork img').evaluate(img => img.naturalWidth > 0));
    for (const [index, section] of [2, 4].entries()) {
      await page.locator('.primary-navigation button').nth(section).click();
      for (const id of views[index]) {
        await open(page, id); assert.equal(await page.evaluate(() => document.activeElement?.id), id);
        await geometry(page); await page.evaluate(() => { document.documentElement.style.fontSize = '20px'; });
        await geometry(page); await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
      }
    }
    // Validated import remains explicit and intact while visiting other tabs.
    await page.locator('.export-tools button').first().click(); const code = await page.locator('#export-code').inputValue();
    await page.locator('#import-code').fill(code); await page.locator('.import-tools > button').click();
    assert.ok(await page.locator('.import-tools .save-confirm').isVisible());
    await open(page, 'statistics-heading'); assert.equal(await page.locator('#import-code').isVisible(), false);
    await open(page, 'save-transfer-heading'); assert.equal(await page.locator('#import-code').inputValue(), code);
    assert.ok(await page.locator('.import-tools .save-confirm').isVisible());
    await page.locator('.import-tools .save-confirm button[aria-label]').click();
    await page.locator('.reset-panel > button').click(); await page.locator('#reset-confirmation-text').fill('RESET');
    await open(page, 'achievements-heading'); await open(page, 'save-transfer-heading');
    assert.equal(await page.locator('#reset-confirmation-text').inputValue(), 'RESET');
    await page.locator('#reset-confirmation .confirmation-actions button').first().click();
    await open(page, 'rebirth-heading'); await page.locator('.rebirth-panel > .rebirth-button').click();
    await open(page, 'skill-tree-heading'); assert.equal(await page.locator('#rebirth-warning').isVisible(), false);
    await page.locator('.rebirth-notice button').click(); assert.ok(await page.locator('#rebirth-warning').isVisible());
    await page.locator('.rebirth-panel .confirmation-actions button').first().click();
    // Repeated global shortcuts must reveal the correct City panel.
    for (let i = 0; i < 2; i++) { await page.locator('.activity-event').click(); assert.ok(await page.locator('.city-events').isVisible()); await open(page, 'crew-heading'); }
    if (locale === 'de' && [390, 1440].includes(width)) {
      for (const id of views[0]) { await open(page, id); await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: `browser-evidence/world-${id}-${width}.png`, fullPage: true }); }
      await page.locator('.primary-navigation button').nth(0).click(); await page.screenshot({ path: `browser-evidence/world-overview-${width}.png`, fullPage: true });
      await page.locator('.primary-navigation button').nth(4).click(); await open(page, 'skill-tree-heading'); await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: `browser-evidence/world-skills-${width}.png`, fullPage: true });
    }
    assert.deepEqual(errors, []); cases++; await context.close();
  }
  console.log(JSON.stringify({ worldWorkspaceCases: cases, failures: 0, baseUrl }));
} finally { await browser?.close(); server?.kill('SIGTERM'); }
