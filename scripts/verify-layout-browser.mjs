import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium } = await import(pathToFileURL(process.env.SOLARA_PLAYWRIGHT_MODULE).href);
const fixtures = JSON.parse(readFileSync(process.env.SOLARA_AUDIT_FIXTURES, 'utf8'));
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4176'], { stdio: 'inherit' });
const targets = [[], ['starter-heading', 'businesses-heading', 'upgrades-heading', 'automation-heading'], ['city-heading', 'crew-heading', 'city-events-heading'], ['garage-heading', 'tuning-heading', 'appearance-heading'], ['rebirth-heading', 'skill-tree-heading', 'achievements-heading', 'statistics-heading', 'save-transfer-heading']];
const results = [];
let browser;
mkdirSync('browser-evidence', { recursive: true });
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch('http://127.0.0.1:4176')).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready);
  browser = await chromium.launch({ headless: true });
  for (const locale of ['en', 'de', 'villager']) for (const width of [320, 390, 740, 1024, 1440]) for (const stage of [0, 1, 2]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ fixture, locale }) => {
      fixture.savedAt = Date.now();
      localStorage.setItem('crime-empire:save', JSON.stringify(fixture));
      localStorage.setItem('solara-city:settings', JSON.stringify({ locale, reducedMotion: false }));
    }, { fixture: fixtures[stage], locale });
    await page.goto('http://127.0.0.1:4176');
    if (await page.locator('.offline-continue').count()) await page.locator('.offline-continue').click();
    for (let section = 0; section < 5; section++) {
      await page.locator('.primary-navigation button').nth(section).click();
      await page.evaluate(() => { document.documentElement.style.fontSize = '20px'; });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const geometry = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        hud: document.querySelector('.global-chrome').getBoundingClientRect().height,
        offset: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hud-offset')),
        clipped: [...document.querySelectorAll('.primary-navigation button, .section-index button')].some(el => el.scrollWidth > el.clientWidth + 1),
      }));
      assert.ok(geometry.overflow <= 1, JSON.stringify({ locale, width, stage, section, geometry }));
      assert.equal(geometry.clipped, false);
      assert.ok(Math.abs(geometry.hud - geometry.offset) <= 1, 'Measured HUD offset tracks text zoom');
      for (let i = 0; i < targets[section].length; i++) {
        await page.locator('.section-index button').nth(i).click();
        const id = targets[section][i];
        assert.equal(await page.evaluate(() => document.activeElement?.id), id);
        const box = await page.locator('#' + id).boundingBox();
        const hudBottom = await page.locator('.global-chrome').evaluate(el => el.getBoundingClientRect().bottom);
        assert.ok(box.y >= hudBottom - 1, 'Target clears sticky HUD: ' + JSON.stringify({ locale, width, id, box, hudBottom }));
      }
      if (section === 2 && stage === 2) {
        await page.locator('.activity-event').click();
        assert.equal(await page.evaluate(() => document.activeElement?.id), 'city-events-heading');
        await page.locator('.activity-event').click();
        assert.equal(await page.evaluate(() => document.activeElement?.id), 'city-events-heading');
      }
      if (section === 4 && stage === 2) {
        assert.equal(await page.locator('.rebirth-review-desktop').isVisible(), width > 480);
        assert.equal(await page.locator('.rebirth-review-mobile').isVisible(), width <= 480);
        const hidden = await page.locator('.rebirth-notice-slot .sr-only').boundingBox();
        assert.ok(hidden.width <= 1 && hidden.height <= 1);
      }
      await page.evaluate(() => { document.documentElement.style.fontSize = ''; window.scrollTo(0, 0); });
      if (stage === 1 && locale === 'en') await page.screenshot({ path: 'browser-evidence/layout-' + width + '-' + section + '.png' });
      results.push({ locale, width, stage, section, geometry });
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  writeFileSync('browser-evidence/layout-audit.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ layoutCases: results.length, failures: 0 }));
} finally { await browser?.close(); server.kill('SIGTERM'); }
