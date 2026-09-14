import { readFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium } = await import(pathToFileURL(process.env.SOLARA_PLAYWRIGHT_MODULE).href);
const fixtures = JSON.parse(readFileSync(process.env.SOLARA_AUDIT_FIXTURES, 'utf8'));
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4177'], { stdio: 'inherit' });
const K = 'vehicle:kairo-kx-r', S = 'vehicle:kairo-senda', L = 'vehicle:namera-lilt';
const E = 'tuning:senda-express-ecu', F = 'tuning:senda-fleet-gearing', Q = 'tuning:lilt-quiet-running', D = 'tuning:lilt-decoy-kit';
const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('crime-empire:save')));
const nav = (page, index) => page.locator('.primary-navigation button').nth(index).click();
const part = (page, id) => page.locator('[data-tuning-id="' + id + '"] button');
let browser, count = 0;
mkdirSync('browser-evidence', { recursive: true });
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch('http://127.0.0.1:4177')).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready);
  browser = await chromium.launch({ headless: true });
  for (const locale of ['en', 'de', 'villager']) for (const width of [320, 390, 740, 1024, 1440]) {
    const fixture = structuredClone(fixtures[0]);
    fixture.version = 21;
    fixture.state.economy.cash = '100000000';
    fixture.state.garage = { ownedVehicleIds: [K, S, L], activeVehicleId: S,
      builds: { [K]: { purchasedIds: ['tuning:kxr-fleet-gearing'], selectedId: 'tuning:kxr-fleet-gearing' } } };
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ fixture, locale }) => {
      if (sessionStorage.getItem('models-initialized')) return;
      fixture.savedAt = Date.now();
      localStorage.setItem('crime-empire:save', JSON.stringify(fixture));
      localStorage.setItem('solara-city:settings', JSON.stringify({ locale, reducedMotion: true }));
      sessionStorage.setItem('models-initialized', 'true');
    }, { fixture, locale });
    await page.goto('http://127.0.0.1:4177');
    await nav(page, 3);
    const originalGarage = (await saved(page)).state.garage;
    await page.locator('#tuning-vehicle').selectOption(S);
    assert.deepEqual((await saved(page)).state.garage, originalGarage, 'Workshop selection is not vehicle activation');
    await page.evaluate(() => {
      const write = Storage.prototype.setItem;
      document.documentElement.dataset.failModelSave = 'true';
      Storage.prototype.setItem = function(key, value) {
        if (key === 'crime-empire:save' && document.documentElement.dataset.failModelSave === 'true') throw Error('quota');
        return write.call(this, key, value);
      };
    });
    await part(page, E).click();
    assert.equal((await saved(page)).state.economy.cash, '100000000');
    assert.equal((await saved(page)).state.garage.builds[S], undefined);
    assert.ok(await page.locator('.save-status-warning').isVisible());
    await page.evaluate(() => { document.documentElement.dataset.failModelSave = 'false'; });
    await part(page, E).click();
    assert.equal((await saved(page)).state.economy.cash, '98200000');
    await nav(page, 1);
    await page.locator('.operations-primary-action').click();
    assert.equal((await saved(page)).state.economy.cash, '98203024');
    await nav(page, 3); await page.locator('#tuning-vehicle').selectOption(S);
    await part(page, F).click();
    await page.locator('#tuning-vehicle').selectOption(L);
    await part(page, Q).click();
    assert.equal((await saved(page)).state.garage.activeVehicleId, S);
    await page.locator('article[aria-labelledby="' + L + '-heading"] button').click();
    await nav(page, 2);
    assert.ok((await page.locator('.heat-panel').textContent()).includes('54'));
    await nav(page, 3); await page.locator('#tuning-vehicle').selectOption(L);
    await part(page, D).click();
    assert.equal((await saved(page)).state.economy.cash, '93603024');
    await nav(page, 1);
    assert.ok((await page.locator('.manhunt-decoy-button').textContent()).includes('1,012.50'));
    await page.locator('.heat-support summary').click();
    assert.equal(await page.locator('.heat-support [data-support-active="true"]').count(), 2);
    await nav(page, 3); await page.locator('#tuning-vehicle').selectOption(L);
    await page.evaluate(() => { document.documentElement.dataset.failModelSave = 'true'; });
    await page.locator('.tuning-stock').click();
    assert.equal((await saved(page)).state.garage.builds[L].selectedId, D);
    await page.evaluate(() => { document.documentElement.dataset.failModelSave = 'false'; });
    await page.locator('.tuning-stock').click();
    assert.equal((await saved(page)).state.garage.builds[L].selectedId, null);
    assert.equal((await saved(page)).state.garage.builds[S].selectedId, F);
    assert.deepEqual((await saved(page)).state.garage.builds[K], originalGarage.builds[K]);
    await part(page, Q).click();
    await part(page, D).click();
    await page.reload(); await nav(page, 3); await page.locator('#tuning-vehicle').selectOption(L);
    const current = await saved(page);
    assert.equal(current.version, 22);
    assert.equal(current.state.economy.cash, '93603024');
    assert.deepEqual(current.state.garage.builds[S].purchasedIds, [E, F]);
    assert.deepEqual(current.state.garage.builds[L].purchasedIds, [Q, D]);
    assert.equal(await part(page, D).isDisabled(), true);
    if (locale === 'villager') {
      const prose = await page.locator('.vehicle-tuning').textContent();
      assert.equal(/\p{L}/u.test(prose.replace(/[hmr]/gi, '')), false, 'Workshop remains pure Villager');
    }
    await page.evaluate(() => { document.documentElement.style.fontSize = '20px'; });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.locator('#tuning-heading').evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await page.screenshot({ path: 'browser-evidence/model-tuning-' + locale + '-' + width + '.png' });
    assert.deepEqual(errors, []); count++; await context.close();
  }
  console.log(JSON.stringify({ modelTuningCases: count, failures: 0 }));
} finally { await browser?.close(); server.kill('SIGTERM'); }
