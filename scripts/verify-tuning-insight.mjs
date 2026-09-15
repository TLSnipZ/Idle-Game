import { openCollectionView } from './collection-browser-helpers.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium } = await import(pathToFileURL(process.env.SOLARA_PLAYWRIGHT_MODULE).href);
const fixture = JSON.parse(readFileSync(process.env.SOLARA_AUDIT_FIXTURES, 'utf8'))[0];
const baseUrl = process.env.SOLARA_BASE_URL ?? 'http://127.0.0.1:4188';
const server = process.env.SOLARA_BASE_URL ? null : spawn(process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4188'], { stdio: 'inherit' });
const K = 'vehicle:kairo-kx-r', S = 'vehicle:namera-serein', L = 'vehicle:namera-lilt';
const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('crime-empire:save')).state);
let browser, cases = 0;
mkdirSync('browser-evidence', { recursive: true });
try {
  for (let i = 0; i < 100; i++) { try { if ((await fetch(baseUrl)).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
  browser = await chromium.launch({ headless: true });
  for (const locale of ['en', 'de', 'villager']) for (const width of [320, 390, 740, 1024, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } }), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const f = structuredClone(fixture);
    f.version = 26; f.state.economy.cash = '100000000';
    f.state.businesses.owned = { 'business:dockside-detail': { level: 10 } };
    f.state.upgrades.purchasedIds = []; f.state.automation.unlockedIds = []; f.state.automation.enabledIds = [];
    f.state.automation.starterJobElapsedMs = 0; f.state.automation.businessAutoUpgradeElapsedMs = 0;
    f.state.crew = { recruitedIds: [], assignments: { operations: null, logistics: null } };
    f.state.garage = { ownedVehicleIds: [K, S, L], activeVehicleId: K,
      builds: { [S]: { purchasedIds: ['tuning:serein-workshop-gearing'], selectedId: 'tuning:serein-workshop-gearing' },
        [L]: { purchasedIds: ['tuning:lilt-quiet-running'], selectedId: 'tuning:lilt-quiet-running' } } };
    await page.addInitScript(({ f, locale }) => {
      if (sessionStorage.getItem('insight-seeded')) return;
      f.savedAt = Date.now(); localStorage.setItem('crime-empire:save', JSON.stringify(f));
      localStorage.setItem('solara-city:settings', JSON.stringify({ locale, reducedMotion: true }));
      sessionStorage.setItem('insight-seeded', '1');
    }, { f, locale });
    await page.goto(baseUrl); await page.locator('.primary-navigation button').nth(3).click();
    await openCollectionView(page, 'tuning'); await page.locator('#tuning-vehicle').selectOption(S);
    const card = page.locator('[data-tuning-id="tuning:serein-nightshift-ecu"]');
    const insight = card.locator('.tuning-insight');
    assert.equal(await insight.getAttribute('open'), null);
    const garage = (await saved(page)).garage;
    await insight.locator('summary').focus(); await page.keyboard.press('Enter');
    assert.notEqual(await insight.getAttribute('open'), null);
    assert.equal(await insight.locator('dl > div').count(), 3);
    assert.ok(await insight.locator('.tuning-insight-notice').isVisible());
    if (locale === 'villager') assert.ok(!/\p{L}/u.test((await insight.textContent()).replace(/[hmr]/gi, '')), 'Villager insight has no readable prose');
    const values = await insight.locator('dd').allTextContents();
    assert.match(values[0], /\$7\.88\/.*\$7\.50\//);
    assert.match(values[1], /\$75\.60.*\$81\.64/);
    assert.deepEqual((await saved(page)).garage, garage);
    await page.evaluate(() => { document.documentElement.style.fontSize = '20px'; });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.ok(await card.locator('button').isEnabled());
    if (locale === 'de' && [390, 1440].includes(width)) await card.screenshot({ path: `browser-evidence/tuning-insight-${width}.png` });
    await card.locator('button').click();
    assert.equal((await saved(page)).garage.activeVehicleId, K);
    assert.match((await insight.locator('dd').allTextContents())[1], /\$81\.64.*\$81\.64/);
    await page.locator('#tuning-vehicle').selectOption(L);
    const lilt = page.locator('[data-tuning-id="tuning:lilt-decoy-kit"] .tuning-insight');
    await lilt.locator('summary').click();
    const support = await lilt.locator('dd').allTextContents();
    assert.match(support[3], /54.*57/);
    assert.match(support[4], /\$900\.00.*\$810\.00/);
    await page.locator('#tuning-vehicle').selectOption('vehicle:toseki-rendan');
    assert.equal(await page.locator('.tuning-insight').count(), 0);
    await page.reload(); await page.locator('.primary-navigation button').nth(3).click();
    await openCollectionView(page, 'tuning'); await page.locator('#tuning-vehicle').selectOption(S);
    assert.equal((await saved(page)).garage.builds[S].selectedId, 'tuning:serein-nightshift-ecu');
    assert.equal(await page.locator('.tuning-insight[open]').count(), 0);
    assert.deepEqual(errors, []);
    await page.close(); cases++;
    console.log(`Workshop insight: ${locale} / ${width}px passed`);
  }
  console.log(JSON.stringify({ cases, failures: 0 }));
} finally { await browser?.close(); server?.kill(); }
