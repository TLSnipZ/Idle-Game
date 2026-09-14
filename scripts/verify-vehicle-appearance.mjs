import { readFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium } = await import(pathToFileURL(process.env.SOLARA_PLAYWRIGHT_MODULE).href);
const fixtures = JSON.parse(readFileSync(process.env.SOLARA_AUDIT_FIXTURES, 'utf8'));
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4178'], { stdio: 'inherit' });
const K = 'vehicle:kairo-kx-r', S = 'vehicle:kairo-senda', L = 'vehicle:namera-lilt';
const catalog = [[K, ['appearance:kxr-coastal', 'appearance:kxr-graphite']],
  [S, ['appearance:senda-champagne', 'appearance:senda-amethyst']], [L, ['appearance:lilt-ivory', 'appearance:lilt-lagoon']]];
const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('crime-empire:save')));
const studio = page => page.locator('.vehicle-appearance');
let browser, count = 0;
mkdirSync('browser-evidence', { recursive: true });
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch('http://127.0.0.1:4178')).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready);
  browser = await chromium.launch({ headless: true });
  for (const locale of ['en', 'de', 'villager']) for (const width of [320, 390, 740, 1024, 1440]) {
    const fixture = structuredClone(fixtures[0]);
    fixture.version = 22;
    fixture.state.garage = { ownedVehicleIds: [K, S], activeVehicleId: K,
      builds: { [S]: { purchasedIds: ['tuning:senda-express-ecu'], selectedId: 'tuning:senda-express-ecu' } } };
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ fixture, locale }) => {
      if (sessionStorage.getItem('paint-initialized')) return;
      fixture.savedAt = Date.now();
      localStorage.setItem('crime-empire:save', JSON.stringify(fixture));
      localStorage.setItem('solara-city:settings', JSON.stringify({ locale, reducedMotion: true }));
      sessionStorage.setItem('paint-initialized', 'true');
    }, { fixture, locale });
    await page.goto('http://127.0.0.1:4178');
    await page.locator('.primary-navigation button').nth(3).click();
    await page.locator('.section-index button').nth(2).click();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'appearance-heading');
    const original = (await saved(page)).state;
    const applied = {};
    for (const [car, looks] of catalog) {
      await page.locator('#appearance-vehicle').selectOption(car);
      for (const look of looks) {
        const before = (await saved(page)).state.garage;
        await studio(page).locator('[data-look-id="' + look + '"]').click();
        assert.deepEqual((await saved(page)).state.garage, before, 'Preview is not a save or activation');
        assert.equal(await studio(page).locator('.vehicle-image').getAttribute('data-appearance'), look);
        assert.equal(await studio(page).locator('.vehicle-paint').count(), 1);
        if (car === L) {
          assert.ok(await studio(page).locator('.apply-appearance').isDisabled(), 'Unowned cars are preview-only');
        } else {
          if (car === K && look === looks[0]) {
            await page.evaluate(() => {
              const write = Storage.prototype.setItem;
              document.documentElement.dataset.failPaintSave = 'true';
              Storage.prototype.setItem = function(key, value) {
                if (key === 'crime-empire:save' && document.documentElement.dataset.failPaintSave === 'true') throw Error('quota');
                return write.call(this, key, value);
              };
            });
            await studio(page).locator('.apply-appearance').click();
            assert.deepEqual((await saved(page)).state.garage, before);
            assert.ok(await studio(page).locator('.apply-appearance').isEnabled(), 'Failed apply remains a draft');
            await page.evaluate(() => { document.documentElement.dataset.failPaintSave = 'false'; });
          }
          await studio(page).locator('.apply-appearance').click();
          applied[car] = look;
          assert.deepEqual((await saved(page)).state.garage.appearances, applied);
          assert.equal(await page.locator('article[aria-labelledby="' + car + '-heading"] .vehicle-image').getAttribute('data-appearance'), look);
        }
        if (locale === 'en' && width === 1440) {
          await page.locator('.paint-preview').evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
          await page.screenshot({ path: 'browser-evidence/paint-' + look.split(':')[1] + '.png' });
        }
      }
    }
    const result = (await saved(page)).state;
    assert.equal(result.economy.cash, original.economy.cash);
    assert.equal(result.garage.activeVehicleId, K);
    assert.deepEqual(result.garage.builds, original.garage.builds);
    await page.reload(); await page.locator('.primary-navigation button').nth(3).click();
    assert.deepEqual((await saved(page)).state.garage.appearances, applied);
    assert.equal((await saved(page)).version, 23);
    await page.locator('#appearance-vehicle').selectOption(K);
    await studio(page).locator('.finish-option').first().click();
    await studio(page).locator('.discard-appearance').click();
    assert.equal(await studio(page).locator('.vehicle-image').getAttribute('data-appearance'), applied[K]);
    await studio(page).locator('.finish-option').first().click();
    await studio(page).locator('.apply-appearance').click();
    delete applied[K];
    assert.deepEqual((await saved(page)).state.garage.appearances, applied);
    await page.evaluate(() => { document.documentElement.style.fontSize = '20px'; });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '125% text overflow');
    if (locale === 'villager') assert.equal(((await studio(page).textContent()) ?? '').replace(/[hmr\W\d]/gi, ''), '');
    assert.deepEqual(errors, []);
    count++; await context.close();
  }
  console.log(JSON.stringify({ appearanceCases: count, failures: 0 }));
} finally { await browser?.close(); server.kill('SIGTERM'); }
