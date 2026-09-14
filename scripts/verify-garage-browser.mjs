import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium } = await import(pathToFileURL(process.env.SOLARA_PLAYWRIGHT_MODULE).href);
const fixtures = JSON.parse(readFileSync(process.env.SOLARA_BROWSER_FIXTURES, 'utf8'));
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'], { stdio: 'inherit' });
let browser;
const results = [];
async function verifyArtwork(page, width, locale) {
  const pictures = page.locator('.garage .vehicle-artwork');
  assert.equal(await pictures.count(), 3, 'Every configured vehicle has its own image');
  const sources = [];
  for (const picture of await pictures.all()) {
    await picture.scrollIntoViewIfNeeded();
    const view = await picture.evaluate(async image => {
      await image.decode();
      const box = image.getBoundingClientRect();
      return { src: image.currentSrc, alt: image.alt, width: image.naturalWidth, height: image.naturalHeight,
        left: box.left, right: box.right, ratio: box.width / box.height,
        loading: image.loading, fit: getComputedStyle(image).objectFit };
    });
    assert.equal(view.width, 1672); assert.equal(view.height, 941);
    assert.ok(view.left >= -1 && view.right <= width + 1, 'Whole artwork fits viewport');
    assert.ok(Math.abs(view.ratio - 1672 / 941) < 0.02, 'Artwork is not distorted');
    assert.equal(view.fit, 'contain'); assert.equal(view.loading, 'lazy');
    assert.ok(view.src.endsWith('.webp') && !view.src.includes('reference'));
    assert.ok(view.alt.length > 0);
    if (locale === 'villager') assert.match(view.alt, /^[hmr -]+$/i);
    sources.push(view.src);
  }
  assert.equal(new Set(sources).size, 3, 'Models never reuse another car image');
}
mkdirSync('browser-evidence', { recursive: true });
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch('http://127.0.0.1:4173')).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, 'Production preview starts');
  browser = await chromium.launch({ headless: true });
  for (const locale of ['en', 'de', 'villager']) for (const width of [320, 390, 740, 1024, 1440]) for (const owner of [false, true]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const errors = [];
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    // Disposable validated fixture only; no access to a player's real browser save.
    await page.addInitScript(({ fixture, locale }) => {
      if (!sessionStorage.getItem('solara-test-initialized')) {
        fixture.savedAt = Date.now();
        localStorage.setItem('crime-empire:save', JSON.stringify(fixture));
        localStorage.setItem('solara-city:settings', JSON.stringify({ locale, reducedMotion: true }));
        sessionStorage.setItem('solara-test-initialized', 'true');
      }
    }, { fixture: fixtures[Number(owner)], locale });
    await page.goto('http://127.0.0.1:4173');
    await page.locator('button[data-section="collection"]').count().then(async count => {
      if (count) await page.locator('button[data-section="collection"]').click();
      else await page.locator('.primary-navigation button').nth(3).click();
    });
    await page.locator('.garage-active-summary').waitFor();
    let saved = await page.evaluate(() => JSON.parse(localStorage.getItem('crime-empire:save')));
    assert.equal(saved.version, 23);
    assert.equal(saved.state.garage.activeVehicleId, owner ? 'vehicle:kairo-kx-r' : null);
    if (!owner) {
      await page.locator('article[aria-labelledby="vehicle:kairo-kx-r-heading"] .purchase-button').click();
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('crime-empire:save')).state.garage.activeVehicleId === 'vehicle:kairo-kx-r');
    }
    const carName = await page.locator('.garage-active-summary strong').textContent();
    if (locale === 'villager') assert.match(carName, /^[hmr -]+$/i);
    else assert.equal(carName, 'Kairo KX-R');
    assert.equal(await page.locator('article[aria-labelledby="vehicle:kairo-kx-r-heading"] button').count(), 0, 'Active car has no redundant selection/purchase button');
    await verifyArtwork(page, width, locale);
    const geometry = await page.locator('.garage-active-summary').evaluate(element => {
      const box = element.getBoundingClientRect();
      return { x: box.x, right: box.right, width: box.width, scroll: element.scrollWidth, client: element.clientWidth,
        documentOverflow: document.documentElement.scrollWidth - innerWidth };
    });
    assert.ok(geometry.x >= -1 && geometry.right <= width + 1, 'Summary fits viewport');
    assert.ok(geometry.scroll <= geometry.client + 1, 'Summary text does not overflow');
    if (width === 390 || width === 1440) await page.screenshot({ path: 'browser-evidence/garage-' + locale + '-' + width + '-' + owner + '.png', fullPage: true });
    await page.reload();
    saved = await page.evaluate(() => JSON.parse(localStorage.getItem('crime-empire:save')));
    assert.equal(saved.state.garage.activeVehicleId, 'vehicle:kairo-kx-r');
    assert.deepEqual(errors, []);
    results.push({ locale, width, migratedOwner: owner, purchaseAndReload: true, geometry });
    await context.close();
  }
  for (const locale of ['en', 'de', 'villager']) for (const width of [320, 390, 740, 1024, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ fixture, locale }) => {
      if (!sessionStorage.getItem('tier-one')) {
        fixture.savedAt = Date.now();
        localStorage.setItem('crime-empire:save', JSON.stringify(fixture));
        localStorage.setItem('solara-city:settings', JSON.stringify({ locale, reducedMotion: true }));
        sessionStorage.setItem('tier-one', 'true');
      }
    }, { fixture: fixtures[2], locale });
    await page.goto('http://127.0.0.1:4173');
    await page.locator('.primary-navigation button').nth(3).click();
    await verifyArtwork(page, width, locale);
    const ids = ['vehicle:kairo-senda', 'vehicle:namera-lilt', 'vehicle:kairo-kx-r'];
    for (const id of ids) {
      const card = page.locator('article[aria-labelledby="' + id + '-heading"]');
      await card.locator('.purchase-button').click();
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('crime-empire:save')));
      assert.ok(saved.state.garage.ownedVehicleIds.includes(id));
      assert.equal(saved.state.garage.activeVehicleId, ids[0], 'Later purchase preserves first activation');
    }
    for (const id of [ids[1], ids[2], ids[0]]) {
      const card = page.locator('article[aria-labelledby="' + id + '-heading"]');
      const select = card.locator('button');
      await select.focus(); await page.keyboard.press('Enter');
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('crime-empire:save')));
      assert.equal(saved.version, 23); assert.equal(saved.state.garage.activeVehicleId, id);
      assert.equal(await card.locator('button').count(), 0);
      assert.equal(await page.locator('.garage button').count(), 2);
      assert.equal(saved.state.garage.ownedVehicleIds.length, 3);
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Three-car Garage fits viewport');
    if (width === 390 || width === 1440) await page.screenshot({ path: 'browser-evidence/tier-one-' + locale + '-' + width + '.png', fullPage: true });
    await page.reload();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('crime-empire:save')).state.garage.activeVehicleId), ids[0]);
    assert.deepEqual(errors, []); results.push({ locale, width, tierOnePurchaseSwitchReload: true });
    await context.close();
  }
  // Real Settings controls switch the presentation without changing the selected vehicle.
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:4173');
  await page.locator('.settings-trigger').click();
  await page.locator('.settings-segment button').nth(1).click();
  assert.equal(await page.locator('html').getAttribute('lang'), 'de');
  await page.locator('.settings-segment button').nth(0).click();
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  console.log(JSON.stringify({ cases: results.length, results }, null, 2));
} finally {
  writeFileSync('browser-evidence/results.json', JSON.stringify(results, null, 2));
  await browser?.close(); server.kill('SIGTERM');
}
