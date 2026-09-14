import { readFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium } = await import(pathToFileURL(process.env.SOLARA_PLAYWRIGHT_MODULE).href);
const fixtures = JSON.parse(readFileSync(process.env.SOLARA_AUDIT_FIXTURES, 'utf8'));
const baseUrl = process.env.SOLARA_BASE_URL ?? 'http://127.0.0.1:4178';
const server = process.env.SOLARA_BASE_URL ? null : spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4178'], { stdio: 'inherit' });
let browser, cases = 0;
const ids = ['business:dockside-detail', 'business:neon-laundry', 'business:afterdark-customs', 'business:solara-nights'];
const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('crime-empire:save')).state);
async function checkLayout(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const result = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - innerWidth,
    clipped: [...document.querySelectorAll('.business-tile, .business-stat-grid strong, .operations-tabs button')].filter(el => el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1).map(el => el.textContent) }));
  assert.ok(result.overflow <= 1, JSON.stringify(result)); assert.deepEqual(result.clipped, []);
}
try {
  for (let i = 0; i < 100; i++) { try { if ((await fetch(baseUrl)).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
  browser = await chromium.launch({ headless: true });
  mkdirSync('browser-evidence', { recursive: true });
  for (const locale of ['en', 'de', 'villager']) for (const width of [320, 390, 740, 1024, 1440]) for (const stage of [0, 2]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(({ fixture, locale }) => {
      if (sessionStorage.getItem('business-test')) return;
      fixture.savedAt = Date.now(); localStorage.setItem('crime-empire:save', JSON.stringify(fixture));
      localStorage.setItem('solara-city:settings', JSON.stringify({ locale, reducedMotion: true }));
      sessionStorage.setItem('business-test', '1');
    }, { fixture: fixtures[stage], locale });
    await page.goto(baseUrl);
    if (await page.locator('.offline-continue').count()) await page.locator('.offline-continue').click();
    await page.locator('.primary-navigation button').nth(1).click();
    assert.ok(await page.locator('.jobs-block').isVisible());
    assert.equal(await page.locator('.businesses-block').isVisible(), false);
    if (stage === 2 && (await saved(page)).automation.enabledIds.includes('automation:business-auto-upgrader')) {
      await page.locator('[data-operations-view="automation"]').click();
      await page.locator('.auto-spend-card > button').click();
    }
    const before = await saved(page);
    await page.locator('[data-operations-view="businesses"]').click();
    assert.equal(await page.locator('.jobs-block').isVisible(), false);
    for (const id of ids) {
      if (await page.locator('.business-back').isVisible()) await page.locator('.business-back').click();
      await page.locator(`[data-business-id="${id}"]`).click();
      const headingId = id === ids[0] ? 'business-name' : `${id}-name`;
      assert.equal(await page.evaluate(() => document.activeElement?.id), headingId);
      assert.ok(await page.evaluate(id => !document.getElementById(id).closest('[hidden]'), headingId));
      assert.equal(await page.locator('.business-card:visible').count(), 1);
      await checkLayout(page);
    }
    const inspected = await saved(page);
    assert.deepEqual(inspected.businesses.owned, before.businesses.owned);
    assert.equal(inspected.automation.businessAutoUpgradeTargetId, before.automation.businessAutoUpgradeTargetId);
    await page.locator('[data-operations-view="equipment"]').click();
    assert.equal(await page.locator('.businesses-block').isVisible(), false);
    assert.ok(await page.locator('.upgrades-block').isVisible());
    await page.locator('[data-operations-view="automation"]').click();
    assert.ok(await page.locator('.automation-block').isVisible());
    await page.locator('[data-operations-view="businesses"]').click();
    assert.equal(await page.locator(`[data-business-id="${ids[3]}"]`).getAttribute('aria-pressed'), 'true');
    if (await page.locator('.business-back').isVisible()) {
      await page.locator('.business-back').click();
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-business-id')), ids[3]);
    }
    await page.locator(`[data-business-id="${ids[0]}"]`).click();
    if (stage === 2) {
      const level = (await saved(page)).businesses.owned[ids[0]].level;
      const upgrade = page.locator('.business-card:visible .purchase-button');
      await upgrade.focus(); await page.keyboard.press('Enter');
      assert.equal((await saved(page)).businesses.owned[ids[0]].level, level + 1);
      assert.ok(await upgrade.evaluate(el => el === document.activeElement));
    }
    await page.evaluate(() => { document.documentElement.style.fontSize = '20px'; });
    await checkLayout(page);
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    if (locale === 'de' && [390, 1440].includes(width) && stage === 2) {
      await page.locator('[data-operations-view="businesses"]').click();
      await page.screenshot({ path: `browser-evidence/business-workspace-${width}.png`, fullPage: true });
    }
    await page.reload();
    if (await page.locator('.offline-continue').count()) await page.locator('.offline-continue').click();
    assert.deepEqual((await saved(page)).businesses.owned, stage === 2 ? { ...before.businesses.owned, [ids[0]]: { level: before.businesses.owned[ids[0]].level + 1 } } : before.businesses.owned);
    assert.deepEqual(errors, []); cases++; await context.close();
  }
  console.log(JSON.stringify({ businessWorkspaceCases: cases, failures: 0, baseUrl }));
} finally { await browser?.close(); server?.kill('SIGTERM'); }
