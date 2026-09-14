import { openCollectionView, openGarageVehicle } from './collection-browser-helpers.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium } = await import(pathToFileURL(process.env.SOLARA_PLAYWRIGHT_MODULE).href);
const fixture = JSON.parse(readFileSync(process.env.SOLARA_AUDIT_FIXTURES, 'utf8'))[0];
const baseUrl = process.env.SOLARA_BASE_URL ?? 'http://127.0.0.1:4185';
const server = process.env.SOLARA_BASE_URL ? null : spawn(process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4185'], { stdio: 'inherit' });
const K = 'vehicle:kairo-kx-r', N = 'vehicle:namera-serein';
const models = ['toseki-rendan', 'sevrin-canto-club'];
const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('crime-empire:save')));
let browser, cases = 0;
mkdirSync('browser-evidence', { recursive: true });
try {
  for (let i = 0; i < 100; i++) { try { if ((await fetch(baseUrl)).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
  browser = await chromium.launch({ headless: true });
  for (const model of models) for (const locale of ['en', 'de', 'villager']) for (const width of [320, 390, 740, 1024, 1440]) {
    const id = `vehicle:${model}`, page = await browser.newPage({ viewport: { width, height: 1000 } }), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const f = structuredClone(fixture);
    f.version = 24; f.state.progression.xp = 16900; f.state.economy.cash = '16500000';
    f.state.businesses.owned = { 'business:afterdark-customs': { level: 5 } };
    f.state.garage = { ownedVehicleIds: [K, N], activeVehicleId: K,
      builds: { [K]: { purchasedIds: ['tuning:kxr-fleet-gearing'], selectedId: 'tuning:kxr-fleet-gearing' } },
      appearances: { [K]: 'appearance:kxr-coastal' } };
    await page.addInitScript(({ f, locale }) => {
      if (sessionStorage.getItem('ivc-seeded')) return;
      f.savedAt = Date.now(); localStorage.setItem('crime-empire:save', JSON.stringify(f));
      localStorage.setItem('solara-city:settings', JSON.stringify({ locale, reducedMotion: true }));
      sessionStorage.setItem('ivc-seeded', '1');
    }, { f, locale });
    await page.goto(baseUrl);
    await page.locator('.primary-navigation button').nth(3).click();
    await openGarageVehicle(page, id);
    const card = page.locator(`article[aria-labelledby="${id}-heading"]`);
    const image = card.locator('img.vehicle-artwork');
    await image.scrollIntoViewIfNeeded(); await image.evaluate(img => img.decode());
    const dimensions = await image.evaluate(img => ({ w: img.naturalWidth, h: img.naturalHeight,
      ratio: img.clientWidth / img.clientHeight, fit: getComputedStyle(img).objectFit, src: img.currentSrc }));
    assert.equal(dimensions.w, 1672); assert.equal(dimensions.h, 940);
    assert.match(dimensions.src, new RegExp(`${model}[^/]*\\.webp$`));
    assert.equal(dimensions.fit, 'contain'); assert.ok(Math.abs(dimensions.ratio - 1672 / 940) < .02);
    if (locale === 'en') {
      const effect = await card.locator('.production').textContent();
      assert.match(effect, /Dispatcher Cash/);
      if (model === 'sevrin-canto-club') { assert.match(effect, /\+18% Business Production/); assert.match(effect, /\+12% Dispatcher Cash/); }
      else assert.match(effect, /\+18% Manual Job & Dispatcher Cash/);
    }
    assert.deepEqual((await saved(page)).state.garage.ownedVehicleIds, [K, N]);
    await card.locator('.purchase-button').click();
    let snapshot = await saved(page);
    assert.equal(snapshot.version, 26);
    assert.deepEqual(snapshot.state.garage.ownedVehicleIds, [K, N, id]);
    assert.equal(snapshot.state.garage.activeVehicleId, K, 'Buying does not activate a later car');
    assert.deepEqual(snapshot.state.garage.builds, f.state.garage.builds);
    assert.deepEqual(snapshot.state.garage.appearances, f.state.garage.appearances);
    await card.locator('.vehicle-specification > button[aria-label]').click();
    assert.equal((await saved(page)).state.garage.activeVehicleId, id);
    await openCollectionView(page, 'tuning'); await page.locator('#tuning-vehicle').selectOption(id);
    await openCollectionView(page, 'appearance'); await page.locator('#appearance-vehicle').selectOption(id);
    assert.equal(await page.locator('.stock-only-notice').count(), 0);
    assert.equal(await page.locator('.vehicle-tuning [data-tuning-id]').count(), 2);
    await page.reload(); await page.locator('.primary-navigation button').nth(3).click();
    snapshot = await saved(page); assert.equal(snapshot.state.garage.activeVehicleId, id);
    assert.deepEqual(snapshot.state.garage.builds, f.state.garage.builds);
    assert.deepEqual(snapshot.state.garage.appearances, f.state.garage.appearances);
    await openGarageVehicle(page, id); await image.scrollIntoViewIfNeeded(); await image.evaluate(img => img.decode());
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.evaluate(() => { document.documentElement.style.fontSize = '20px'; });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    if (locale === 'de' && [390, 1440].includes(width)) await card.screenshot({ path: `browser-evidence/${model}-${width}.png` });
    assert.deepEqual(errors, []); cases++; await page.close();
  }
  console.log(JSON.stringify({ rendanCantoCases: cases, failures: 0, baseUrl }));
} finally { await browser?.close(); server?.kill('SIGTERM'); }
