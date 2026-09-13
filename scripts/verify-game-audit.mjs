import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium } = await import(pathToFileURL(process.env.SOLARA_PLAYWRIGHT_MODULE).href);
const fixtures = JSON.parse(readFileSync(process.env.SOLARA_AUDIT_FIXTURES, 'utf8'));
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4174'], { stdio: 'inherit' });
const results = [];
let browser;
mkdirSync('browser-evidence', { recursive: true });
const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('crime-empire:save')));
const navigation = page => page.locator('.primary-navigation button');
async function settings(page, locale) {
  await page.locator('.settings-trigger').click();
  await page.getByRole('button', { name: locale === 'de' ? 'Deutsch' : locale === 'en' ? 'English' : 'Villager · Hrrm', exact: true }).click();
  await page.keyboard.press('Escape');
}
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch('http://127.0.0.1:4174')).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, 'Preview starts');
  browser = await chromium.launch({ headless: true });
  for (const locale of ['en', 'de', 'villager']) for (const width of [320, 390, 740, 1024, 1440]) for (const stage of [0, 1, 2]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ fixture, locale }) => {
      if (sessionStorage.getItem('audit-initialized')) return;
      fixture.savedAt = Date.now();
      localStorage.setItem('crime-empire:save', JSON.stringify(fixture));
      localStorage.setItem('solara-city:settings', JSON.stringify({ locale, reducedMotion: true }));
      sessionStorage.setItem('audit-initialized', 'true');
    }, { fixture: fixtures[stage], locale });
    await page.goto('http://127.0.0.1:4174');
    assert.equal(await navigation(page).count(), 5);
    for (let section = 0; section < 5; section++) {
      await navigation(page).nth(section).click();
      const heading = await page.locator('#section-heading').textContent();
      assert.ok(heading?.trim());
      if (locale === 'villager') assert.match(heading, /^H[rm]+/);
      const geometry = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        section: document.querySelector('#section-content')?.getAttribute('data-section'),
        brokenImages: [...document.images].filter(image => image.complete && image.naturalWidth === 0).map(image => image.src),
      }));
      assert.ok(geometry.overflow <= 1, JSON.stringify({ locale, width, stage, ...geometry }));
      assert.deepEqual(geometry.brokenImages, []);
      if (locale === 'villager' && stage === 1 && [390, 1440].includes(width)) {
        await page.screenshot({ path: 'browser-evidence/audit-' + width + '-' + section + '.png', fullPage: true });
      }
      results.push({ locale, width, stage, ...geometry });
    }
    // Real modal keyboard behavior, including focus restoration and locale persistence.
    const trigger = page.locator('.settings-trigger');
    await trigger.click();
    assert.equal(await page.locator('dialog').evaluate(dialog => dialog.contains(document.activeElement)), true);
    for (let key = 0; key < 9; key++) {
      await page.keyboard.press(key % 2 ? 'Shift+Tab' : 'Tab');
      assert.equal(await page.locator('dialog').evaluate(dialog => dialog.contains(document.activeElement)), true);
    }
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog').count(), 0);
    assert.equal(await trigger.evaluate(element => element === document.activeElement), true);
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('lang'), locale === 'villager' ? 'en-x-villager' : locale);
    assert.equal((await saved(page)).version, 18);
    assert.deepEqual(errors, []);
    await context.close();
  }

  // Exercise actual language switching after runtime ticks and while confirmations are open.
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4174');
  for (const locale of ['de', 'villager', 'en']) {
    await settings(page, locale);
    await navigation(page).nth(1).click();
    for (let attempt = 0; attempt < 2; attempt++) {
      await page.locator('.delivery-button').click();
      const feedback = await page.locator('.feedback-command').textContent();
      assert.ok(feedback.includes(locale === 'de' ? 'Lieferung erledigt.' : 'Delivery completed.'));
      if (locale === 'villager') assert.match(feedback, /^H[rm]+/);
      await page.waitForTimeout(300);
    }
  }
  await navigation(page).nth(4).click();
  await page.locator('.export-tools button').first().click();
  const code = await page.locator('#export-code').inputValue();
  assert.match(code, /^CE1-/);
  await page.locator('#import-code').fill('CE1-invalid');
  await page.locator('.import-tools button').first().click();
  assert.equal(await page.locator('#import-confirmation').count(), 0);
  await page.locator('.reset-panel > button').click();
  await page.locator('#reset-confirmation-text').fill('RESET');
  await settings(page, 'villager');
  assert.equal(await page.locator('#reset-confirmation-text').inputValue(), 'RESET');
  await page.locator('#reset-confirmation .confirmation-actions button').first().click();
  assert.match(await page.locator('.reset-panel [role="status"]').textContent(), /^H[rm]+/);
  const beforeReload = await saved(page);
  await page.reload();
  assert.deepEqual((await saved(page)).state.garage, beforeReload.state.garage);
  assert.deepEqual(errors, []);
  await context.close();
  console.log(JSON.stringify({ sectionCases: results.length, localeSwitchAndFeedback: true,
    keyboardModalAndReload: true, exportAndInvalidImport: true, resetConsentSurvivesLocaleSwitch: true, results }, null, 2));
} finally {
  writeFileSync('browser-evidence/game-audit.json', JSON.stringify(results, null, 2));
  await browser?.close(); server.kill('SIGTERM');
}
