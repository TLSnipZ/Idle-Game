import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium } = await import(pathToFileURL(process.env.SOLARA_PLAYWRIGHT_MODULE).href);
const fixtures = JSON.parse(readFileSync(process.env.SOLARA_BROWSER_FIXTURES, 'utf8'));
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'], { stdio: 'inherit' });
let browser;
const results = [];
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
      else await page.getByRole('button', { name: locale === 'de' ? /^SAMMLUNG$/i : /COLLECTION$/i }).click();
    });
    await page.locator('.garage-active-summary').waitFor();
    let saved = await page.evaluate(() => JSON.parse(localStorage.getItem('crime-empire:save')));
    assert.equal(saved.version, 18);
    assert.equal(saved.state.garage.activeVehicleId, owner ? 'vehicle:kairo-kx-r' : null);
    if (!owner) {
      await page.getByRole('button', { name: locale === 'de' ? /Kairo KX-R kaufen$/ : /Buy Kairo KX-R$/ }).click();
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('crime-empire:save')).state.garage.activeVehicleId === 'vehicle:kairo-kx-r');
    }
    assert.equal(await page.locator('.garage-active-summary strong').textContent(), 'Kairo KX-R');
    assert.equal(await page.locator('.garage button').count(), 0, 'Active car has no redundant selection/purchase button');
    const image = page.locator('.vehicle-artwork');
    await image.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => { const image = document.querySelector('.vehicle-artwork'); return image?.complete && image.naturalWidth > 0; });
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
  // Real Settings controls switch the presentation without changing the selected vehicle.
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:4173');
  await page.locator('.settings-trigger').click();
  await page.getByRole('button', { name: 'Deutsch', exact: true }).click();
  assert.equal(await page.locator('html').getAttribute('lang'), 'de');
  await page.getByRole('button', { name: 'English', exact: true }).click();
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  console.log(JSON.stringify({ cases: results.length, results }, null, 2));
} finally {
  writeFileSync('browser-evidence/results.json', JSON.stringify(results, null, 2));
  await browser?.close(); server.kill('SIGTERM');
}
