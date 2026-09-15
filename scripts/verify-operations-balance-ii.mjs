import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const { chromium } = await import(pathToFileURL(process.env.SOLARA_PLAYWRIGHT_MODULE).href);
const baseUrl = process.env.SOLARA_BASE_URL ?? 'http://127.0.0.1:4182';
const server = process.env.SOLARA_BASE_URL ? null : spawn(process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4182'], { stdio: 'inherit' });
let browser;
let cases = 0;

const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('crime-empire:save')).state);

async function waitForServer() {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(baseUrl)).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Solara preview did not become ready');
}

async function checkNoHorizontalOverflow(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(overflow <= 1, `horizontal overflow: ${overflow}px`);
}

try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  mkdirSync('browser-evidence', { recursive: true });

  for (const locale of ['en', 'de', 'villager']) for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(locale => {
      localStorage.removeItem('crime-empire:save');
      localStorage.setItem('solara-city:settings', JSON.stringify({ locale, reducedMotion: true }));
    }, locale);
    await page.goto(baseUrl);
    if (await page.locator('.offline-continue').count()) await page.locator('.offline-continue').click();
    await page.locator('.primary-navigation button').nth(1).click();

    const standard = page.locator('.operations-primary-action');
    const risky = page.locator('.risky-delivery-button');
    const discreet = page.locator('.discreet-delivery-button');
    const readiness = page.locator('.manual-readiness');

    assert.equal(await readiness.count(), 3);
    assert.equal(await standard.isEnabled(), true);
    assert.equal(await risky.isEnabled(), true);
    assert.equal(await discreet.isDisabled(), true);
    assert.equal(await page.locator('.manual-readiness.is-ready').count(), 3);
    const before = await saved(page);
    assert.ok(!Object.hasOwn(before.manualJobs, 'elapsedMs'));

    await standard.click();
    const pending = await saved(page);
    assert.equal(pending.manualJobs.elapsedMs, 0);
    assert.equal(await standard.isDisabled(), true);
    assert.equal(await risky.isDisabled(), true);
    assert.equal(await discreet.isDisabled(), true);
    assert.equal(await page.locator('.manual-readiness.is-ready').count(), 0);
    assert.equal(pending.city.heat, before.city.heat + 1);
    assert.equal(pending.progression.xp, before.progression.xp + 10);
    await checkNoHorizontalOverflow(page);

    if (locale === 'de' && width === 390)
      await page.screenshot({ path: 'browser-evidence/operations-balance-ii-mobile.png', fullPage: true });
    if (locale === 'en' && width === 1440)
      await page.screenshot({ path: 'browser-evidence/operations-balance-ii-desktop.png', fullPage: true });

    if (locale === 'en' && width === 390) {
      await page.waitForTimeout(10_300);
      await page.waitForFunction(() => !document.querySelector('.operations-primary-action')?.disabled);
      const ready = await saved(page);
      assert.ok(!Object.hasOwn(ready.manualJobs, 'elapsedMs'));
      assert.equal(await standard.isEnabled(), true);
      assert.equal(await risky.isEnabled(), true);
      assert.equal(await discreet.isEnabled(), true);
      const xp = ready.progression.xp;
      const heat = ready.city.heat;
      await discreet.click();
      const afterDiscreet = await saved(page);
      assert.equal(afterDiscreet.progression.xp, xp);
      assert.equal(afterDiscreet.city.heat, Math.max(0, heat - 2));
      assert.equal(afterDiscreet.manualJobs.elapsedMs, 0);
      assert.equal(await standard.isDisabled(), true);
    }

    assert.deepEqual(errors, []);
    cases++;
    await context.close();
  }
  console.log(JSON.stringify({ operationsBalanceIICases: cases, failures: 0, baseUrl }));
} finally {
  await browser?.close();
  server?.kill('SIGTERM');
}
