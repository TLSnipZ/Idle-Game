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
  await page.locator('.settings-segment button').nth(['en', 'de', 'villager'].indexOf(locale)).click();
  await page.keyboard.press('Escape');
}

// Check rendered copy, collapsed details, option labels and accessible descriptions.
// Editable backup/input data and the separately displayed RESET token are not prose.
async function assertVillagerOnly(page) {
  const leaks = await page.evaluate(() => {
    const found = [];
    const inspect = (value, element, kind) => {
      if (!value || !/\p{L}/u.test(value.replace(/[hmr]/gi, ''))) return;
      found.push({ kind, tag: element.tagName, className: element.className, value: value.slice(0, 140) });
    };
    const walker = document.createTreeWalker(document.querySelector('.app-shell'), NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const element = node.parentElement;
      if (element.closest('textarea, input, code, script, style')) continue;
      inspect(node.textContent, element, 'text');
    }
    for (const element of document.querySelectorAll('.app-shell [aria-label], .app-shell [aria-valuetext], .app-shell [title], .app-shell [alt], .app-shell [placeholder]')) {
      for (const attribute of ['aria-label', 'aria-valuetext', 'title', 'alt', 'placeholder']) inspect(element.getAttribute(attribute), element, attribute);
    }
    inspect(document.title, document.documentElement, 'title');
    for (const element of document.querySelectorAll('.app-shell *')) {
      for (const pseudo of ['::before', '::after']) {
        const content = getComputedStyle(element, pseudo).content;
        if (content !== 'none' && content !== 'normal') inspect(content, element, pseudo);
      }
    }
    return found;
  });
  assert.deepEqual(leaks, [], 'Villager contains no readable prose');
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
      if (section === 1 && stage === 0) assert.equal(await page.locator('#active-district option[value="territory:neon-mile"]').isDisabled(), true);
      const heading = await page.locator('#section-heading').textContent();
      assert.ok(heading?.trim());
      if (locale === 'villager') {
        assert.match(heading, /^[HhMmRr]+/);
        if (await page.locator('.objective-expand').getAttribute('aria-expanded') === 'false') await page.locator('.objective-expand').click();
        await assertVillagerOnly(page);
      }

      if (section === 1) {
        assert.equal(await page.locator('.operations-primary-action').evaluate(button =>
          Boolean(button.compareDocumentPosition(document.querySelector('.district-heat')) & Node.DOCUMENT_POSITION_FOLLOWING)), true, 'Primary job precedes district management');
        assert.ok(await page.locator('.operations-primary-action').isVisible());
        if (stage === 1) {
          const summary = page.locator('.activity-news summary');
          if (await summary.count()) {
            await summary.focus();
            await page.keyboard.press('Enter');
            assert.equal(await summary.locator('..').getAttribute('open'), '');
            await page.waitForTimeout(550);
            assert.equal(await summary.evaluate(element => document.activeElement === element), true, 'Ticks preserve disclosure focus');
            assert.equal(await summary.locator('..').getAttribute('open'), '', 'Ticks preserve expanded feedback');
            await page.keyboard.press('Enter');
          }
          if (await page.locator('.activity-event').count()) {
            assert.equal(await page.locator('.activity-center-items > :first-child').getAttribute('class'), 'activity-item activity-event');
          }
          await page.evaluate(() => { document.documentElement.style.fontSize = '20px'; });
          const zoom = await page.evaluate(() => ({
            overflow: document.documentElement.scrollWidth - innerWidth,
            clipped: [...document.querySelectorAll('.operations-tabs button, .global-status > div')].some(el => el.scrollWidth > el.clientWidth + 1),
          }));
          assert.ok(zoom.overflow <= 1, 'Operations fits with 125% text scaling: ' + JSON.stringify({ locale, width, zoom }));
          assert.equal(zoom.clipped, false, 'HUD and operation labels wrap at text zoom');
          await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
        }
      }

      const brokenAutomationDescriptions = await page.locator('.automation-card button[aria-describedby]').evaluateAll(buttons =>
        buttons.flatMap(button => button.getAttribute('aria-describedby').split(/\s+/).filter(id => !document.getElementById(id)?.textContent?.trim())));
      assert.deepEqual(brokenAutomationDescriptions, [], 'Automation actions reference existing explanatory text');
      const geometry = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        chromeHeight: Math.round(document.querySelector('.global-chrome')?.getBoundingClientRect().height ?? 0),
        section: document.querySelector('#section-content')?.getAttribute('data-section'),
        overflowNodes: [...document.querySelectorAll('a, button, select, h2, h3, strong, dt, .app-header span, .app-footer span, .operations-section-heading')].filter(element => {
          const box = element.getBoundingClientRect();
          return box.right > innerWidth + 1 && box.width > 0 && !element.closest('.activity-center-items, .global-status');
        }).slice(0, 8).map(element => ({ tag: element.tagName, className: element.className, text: element.textContent.slice(0, 100), right: Math.round(element.getBoundingClientRect().right) })),
        clippedMetrics: [...document.querySelectorAll('.business-stat-grid strong, .job-metrics dt, .primary-navigation button, .operations-tabs button')].filter(element => element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1).map(element => ({ text: element.textContent, client: element.clientWidth, scroll: element.scrollWidth })),
        brokenImages: [...document.images].filter(image => image.complete && image.naturalWidth === 0).map(image => image.src),
      }));
      if (geometry.overflow > 1 || geometry.clippedMetrics.length) console.log('LAYOUT FINDING ' + JSON.stringify({ locale, width, stage, ...geometry }));
      assert.deepEqual(geometry.brokenImages, []);
      if (locale === 'villager' && stage === 1 && [390, 1440].includes(width)) {
        await page.screenshot({ path: 'browser-evidence/audit-' + width + '-' + section + '.png', fullPage: true });
      }
      results.push({ locale, width, stage, ...geometry });
    }
    // Real modal keyboard behavior, including focus restoration and locale persistence.
    const trigger = page.locator('.settings-trigger');
    await trigger.click();
    if (locale === 'villager') await assertVillagerOnly(page);
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
    assert.equal((await saved(page)).version, 21);
    assert.deepEqual(errors, []);
    await context.close();
  }


  // Saving errors stay visible while the ordinary delivery remains live; retry clears the warning.
  const storageContext = await browser.newContext({ viewport: { width: 320, height: 900 } });
  const storagePage = await storageContext.newPage();
  await storagePage.goto('http://127.0.0.1:4174');
  await navigation(storagePage).nth(1).click();
  await storagePage.locator('.operations-primary-action').click();
  const storedBeforeFailure = await saved(storagePage);
  const cashBeforeFailure = await storagePage.locator('.hud-cash dd').textContent();
  await storagePage.evaluate(() => {
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'crime-empire:save' && document.documentElement.dataset.failSave === 'true') throw new Error('Simulated storage failure');
      return write.call(this, key, value);
    };
    document.documentElement.dataset.failSave = 'true';
  });
  await storagePage.locator('.operations-primary-action').click();
  assert.notEqual(await storagePage.locator('.hud-cash dd').textContent(), cashBeforeFailure, 'Ordinary delivery remains live');
  assert.deepEqual(await saved(storagePage), storedBeforeFailure, 'Failed write leaves stored progress intact');
  assert.ok(await storagePage.locator('.save-status-warning summary').isVisible());
  assert.ok(await storagePage.locator('.runtime-error').isVisible());
  await storagePage.locator('.save-status summary').click();
  assert.match(await storagePage.locator('.save-status-details').textContent(), /Saving failed/);
  assert.ok(await storagePage.locator('.save-status-details').evaluate(el => {
    const box = el.getBoundingClientRect(); return box.left >= 0 && box.right <= innerWidth;
  }), 'Save explanation fits mobile width');
  await storagePage.evaluate(() => { document.documentElement.dataset.failSave = 'false'; });
  await storagePage.locator('.operations-primary-action').click();
  assert.equal(await storagePage.locator('.save-status-warning').count(), 0);
  assert.equal(await storagePage.locator('.save-status').getAttribute('open'), '', 'Recovery preserves disclosure state');
  assert.match(await storagePage.locator('.save-status-details').textContent(), /last save result/);
  await storageContext.close();

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
      await page.locator('.operations-primary-action').click();
      const feedback = await page.locator('.feedback-command').textContent();
      if (locale !== 'villager') assert.ok(feedback.includes(locale === 'de' ? 'Lieferung erledigt.' : 'Delivery completed.'));
      else assert.doesNotMatch(feedback, /[a-gi-ln-qs-z]/i);
      if (locale === 'villager') assert.match(feedback, /^[HhMmRr]+/);
      await page.waitForTimeout(300);
    }
  }
  await navigation(page).nth(4).click();
  await page.locator('.export-tools button').first().click();
  const code = await page.locator('#export-code').inputValue();
  assert.match(code, /^CE1-/);
  await page.locator('#import-code').fill('CE1-invalid');
  await page.locator('.import-tools button').first().click();
  assert.equal(await page.locator('.import-tools .save-confirm').count(), 0);
  assert.equal(await page.locator('#import-code').getAttribute('aria-invalid'), 'true');
  assert.ok((await saved(page)).state.permanentProgression.statistics.manualJobsCompleted >= 6);
  await page.locator('.reset-panel > button').click();
  await page.locator('#reset-confirmation-text').fill('RESET');
  await settings(page, 'villager');
  await assertVillagerOnly(page);
  assert.equal(await page.locator('#reset-confirmation-text').inputValue(), 'RESET');
  await page.locator('#reset-confirmation .confirmation-actions button').first().click();
  assert.match(await page.locator('.reset-panel [role="status"]').textContent(), /^[HhMmRr]+/);
  const beforeReload = await saved(page);
  await page.reload();
  assert.deepEqual((await saved(page)).state.garage, beforeReload.state.garage);
  assert.deepEqual(errors, []);
  await context.close();
  // Cross-feature commands in each locale using a disposable advanced save.
  for (const locale of ['en', 'de', 'villager']) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ fixture, locale }) => {
      if (sessionStorage.getItem('advanced-audit')) return;
      fixture.savedAt = Date.now();
      localStorage.setItem('crime-empire:save', JSON.stringify(fixture));
      localStorage.setItem('solara-city:settings', JSON.stringify({ locale, reducedMotion: true }));
      sessionStorage.setItem('advanced-audit', 'true');
    }, { fixture: fixtures[2], locale });
    await page.goto('http://127.0.0.1:4174');
    await navigation(page).nth(1).click();
    await page.locator('.auto-spend-card > button').click();
    assert.deepEqual((await saved(page)).state.automation.enabledIds, []);
    await page.locator('#auto-upgrader-target').selectOption('business:dockside-detail');
    assert.equal((await saved(page)).state.automation.businessAutoUpgradeTargetId, 'business:dockside-detail');
    const level = (await saved(page)).state.businesses.owned['business:dockside-detail'].level;
    await page.locator('.business-card .purchase-button').first().click();
    assert.equal((await saved(page)).state.businesses.owned['business:dockside-detail'].level, level + 1);
    await navigation(page).nth(2).click();
    const heat = (await saved(page)).state.city.heat;
    await page.locator('.heat-action button').click();
    assert.ok((await saved(page)).state.city.heat < heat);
    await page.locator('.crew-slots .crew-slot button').first().click();
    assert.equal((await saved(page)).state.crew.assignments.operations, null);
    assert.equal(await page.locator('#active-district').isDisabled(), true);
    await page.locator('.event-choice button').first().click();
    assert.equal(await page.locator('#active-district').isDisabled(), false);
    assert.equal((await saved(page)).state.events.pendingEventId, null);
    await navigation(page).nth(4).click();
    const ep = (await saved(page)).state.permanentProgression.empirePoints;
    await page.locator('.skill-node button:not(:disabled)').first().click();
    assert.ok((await saved(page)).state.permanentProgression.empirePoints < ep);
    await page.locator('.rebirth-panel > .rebirth-button').click();
    const nextLocale = locale === 'de' ? 'villager' : 'de';
    await settings(page, nextLocale);
    assert.equal(await page.locator('#rebirth-warning').count(), 1);
    await page.locator('.rebirth-panel .confirmation-actions button').first().click();
    const cancellation = await page.locator('.rebirth-panel > [role="status"]').textContent();
    if (nextLocale === 'villager') assert.match(cancellation, /^[HhMmRr]+/);
    else assert.ok(cancellation.includes('Rebirth abgebrochen.'));
    const before = (await saved(page)).state;
    await page.locator('.rebirth-panel > .rebirth-button').click();
    await page.locator('.rebirth-panel .confirmation-actions .rebirth-button').click();
    const reborn = (await saved(page)).state;
    assert.deepEqual(reborn.garage, before.garage);
    assert.equal(reborn.permanentProgression.rebirthCount, before.permanentProgression.rebirthCount + 1);
    assert.deepEqual(reborn.businesses.owned, {});
    await page.locator('.reset-panel > button').click();
    await page.locator('#reset-confirmation-text').fill('reset');
    assert.equal(await page.locator('#reset-confirmation .danger-button').isDisabled(), true);
    await page.locator('#reset-confirmation-text').fill('RESET');
    await page.locator('#reset-confirmation .danger-button').click();
    const restarted = await saved(page);
    assert.deepEqual(restarted.state.garage, { ownedVehicleIds: [], activeVehicleId: null });
    assert.equal(restarted.state.permanentProgression.empirePoints, 0);
    await page.reload();
    assert.deepEqual((await saved(page)).state.garage, restarted.state.garage);
    assert.deepEqual(errors, []);
    await context.close();
  }

  // Risk & Reward: actual click, exact payout, HOT cutoff, Lay Low and reload.
  for (const locale of ['en', 'de', 'villager']) for (const width of [320, 390, 740, 1024, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ fixture, locale }) => {
      if (sessionStorage.getItem('risk-audit')) return;
      fixture.savedAt = Date.now();
      fixture.state.city.heat = 59;
      fixture.state.city.heatDecayElapsedMs = 0;
      fixture.state.economy.cash = '100000';
      localStorage.setItem('crime-empire:save', JSON.stringify(fixture));
      localStorage.setItem('solara-city:settings', JSON.stringify({ locale, reducedMotion: true }));
      sessionStorage.setItem('risk-audit', 'true');
    }, { fixture: fixtures[0], locale });
    await page.goto('http://127.0.0.1:4174');
    await navigation(page).nth(1).click();
    const button = page.locator('.risky-delivery-button');
    assert.equal(await button.isDisabled(), false);
    if (locale === 'villager') await assertVillagerOnly(page);
    const before = (await saved(page)).state;
    await button.focus();
    await page.keyboard.press('Enter');
    const after = (await saved(page)).state;
    assert.equal(after.city.heat, 64);
    assert.equal(BigInt(after.economy.cash) - BigInt(before.economy.cash), 3125n);
    assert.equal(after.permanentProgression.statistics.manualJobsCompleted, before.permanentProgression.statistics.manualJobsCompleted + 1);
    assert.equal(await button.isDisabled(), true);
    assert.equal(await page.locator('.operations-primary-action').isDisabled(), false);
    if (locale === 'villager') await assertVillagerOnly(page);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: 'browser-evidence/risk-' + locale + '-' + width + '.png', fullPage: true });
    await page.reload();
    await navigation(page).nth(1).click();
    assert.equal(await button.isDisabled(), true);
    await navigation(page).nth(2).click();
    await page.locator('.heat-action button').click();
    assert.equal((await saved(page)).state.city.heat, 54);
    await navigation(page).nth(1).click();
    assert.equal(await button.isDisabled(), false);
    assert.deepEqual(errors, []);
    await context.close();
  }


  // Police Pressure: watch threshold, current premium, active cooling, HOT and persistence.
  for (const locale of ['en', 'de', 'villager']) for (const width of [320, 390, 740, 1024, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ fixture, locale }) => {
      if (sessionStorage.getItem('police-audit')) return;
      fixture.savedAt = Date.now(); fixture.state.city.heat = 40;
      fixture.state.city.heatDecayElapsedMs = 0; fixture.state.economy.cash = '100000';
      localStorage.setItem('crime-empire:save', JSON.stringify(fixture));
      localStorage.setItem('solara-city:settings', JSON.stringify({ locale, reducedMotion: true }));
      sessionStorage.setItem('police-audit', 'true');
    }, { fixture: fixtures[0], locale });
    await page.goto('http://127.0.0.1:4174');
    await navigation(page).nth(1).click();
    const discreet = page.locator('.discreet-delivery-button'), risk = page.locator('.risky-delivery-button');
    assert.ok((await page.locator('.risky-delivery:not(.discreet-delivery)').textContent()).includes('+25%'));
    await discreet.focus(); await page.keyboard.press('Enter');
    let current = (await saved(page)).state;
    assert.equal(current.city.heat, 38); assert.equal(current.economy.cash, '101250');
    assert.equal(current.progression.xp, 0);
    assert.ok((await page.locator('.risky-delivery:not(.discreet-delivery)').textContent()).includes('+50%'));
    await risk.click(); current = (await saved(page)).state;
    assert.equal(current.city.heat, 43); assert.equal(current.economy.cash, '105000');
    for (let i = 0; i < 4; i++) await risk.click();
    current = (await saved(page)).state;
    assert.equal(current.city.heat, 63); assert.equal(current.economy.cash, '117500');
    assert.equal(await risk.isDisabled(), true);
    await discreet.click(); await discreet.click();
    current = (await saved(page)).state;
    assert.equal(current.city.heat, 59); assert.equal(current.economy.cash, '119750');
    assert.equal(current.progression.xp, 50);
    assert.equal(await risk.isDisabled(), false);
    if (locale === 'villager') await assertVillagerOnly(page);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: 'browser-evidence/police-' + locale + '-' + width + '.png', fullPage: true });
    await page.reload(); await navigation(page).nth(1).click();
    assert.equal((await saved(page)).state.economy.cash, '119750');
    assert.equal((await saved(page)).state.city.heat, 59);
    await navigation(page).nth(2).click();
    assert.equal(await page.locator('.police-pressure').count(), 1);
    if (locale === 'villager') await assertVillagerOnly(page);
    assert.deepEqual(errors, []);
    await context.close();
  }


  // District Heat: real travel, local jobs, preserved parked Heat and durable reload.
  for (const locale of ['en', 'de', 'villager']) for (const width of [320, 390, 740, 1024, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ fixture, locale }) => {
      if (sessionStorage.getItem('district-audit')) return;
      fixture.savedAt = Date.now();
      fixture.state.city = { heat: 79, heatDecayElapsedMs: 0,
        ownedTerritoryIds: ['territory:waterfront', 'territory:neon-mile'] };
      fixture.state.economy.cash = '100000';
      localStorage.setItem('crime-empire:save', JSON.stringify(fixture));
      localStorage.setItem('solara-city:settings', JSON.stringify({ locale, reducedMotion: true }));
      sessionStorage.setItem('district-audit', 'true');
    }, { fixture: fixtures[0], locale });
    await page.goto('http://127.0.0.1:4174');
    await navigation(page).nth(1).click();
    const district = page.locator('#active-district');
    await district.selectOption('territory:neon-mile');
    let current = (await saved(page)).state;
    assert.equal(current.city.heat, 0);
    assert.equal(current.city.districts.parked.heat, 79);
    await page.locator('.risky-delivery-button').focus();
    await page.keyboard.press('Enter');
    current = (await saved(page)).state;
    assert.equal(current.city.heat, 5);
    assert.equal(current.economy.cash, '104125');
    await page.locator('.discreet-delivery-button').click();
    current = (await saved(page)).state;
    assert.equal(current.city.heat, 3);
    assert.equal(current.city.districts.parked.heat, 79);
    assert.equal(current.economy.cash, '105500');
    assert.equal(current.progression.xp, 10);
    await district.selectOption('territory:waterfront');
    await page.locator('.operations-primary-action').click();
    current = (await saved(page)).state;
    assert.equal(current.economy.cash, '107975');
    assert.equal(current.city.heat, 80);
    assert.equal(current.city.districts.parked.heat, 3);
    if (locale === 'villager') await assertVillagerOnly(page);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: 'browser-evidence/district-' + locale + '-' + width + '.png', fullPage: true });
    await page.reload(); await navigation(page).nth(2).click();
    current = (await saved(page)).state;
    assert.equal(current.city.districts.activeId, 'territory:waterfront');
    assert.equal(current.city.heat, 80); assert.equal(current.city.districts.parked.heat, 3);
    assert.equal(await page.locator('#active-district').isDisabled(), true);
    await navigation(page).nth(1).click();
    await page.locator('.discreet-delivery-button').click();
    assert.equal(await page.locator('#active-district').isDisabled(), false);
    await page.locator('#active-district').selectOption('territory:neon-mile');
    assert.equal((await saved(page)).state.city.heat, 3);
    if (locale === 'villager') await assertVillagerOnly(page);
    assert.deepEqual(errors, []);
    await context.close();
  }


  // MANHUNT: maximum local pursuit, durable paid escape, travel and reload.
  for (const locale of ['en', 'de', 'villager']) for (const width of [320, 390, 740, 1024, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ fixture, locale }) => {
      if (sessionStorage.getItem('manhunt-audit')) return;
      fixture.savedAt = Date.now();
      fixture.state.city = { heat: 100, heatDecayElapsedMs: 0,
        ownedTerritoryIds: ['territory:waterfront', 'territory:neon-mile'] };
      fixture.state.economy.cash = '125000';
      localStorage.setItem('crime-empire:save', JSON.stringify(fixture));
      localStorage.setItem('solara-city:settings', JSON.stringify({ locale, reducedMotion: true }));
      sessionStorage.setItem('manhunt-audit', 'true');
    }, { fixture: fixtures[0], locale });
    await page.goto('http://127.0.0.1:4174'); await navigation(page).nth(1).click();
    const travel = page.locator('#active-district'), decoy = page.locator('.manhunt-decoy-button');
    assert.equal(await travel.isDisabled(), true);
    assert.equal(await decoy.isDisabled(), false);
    assert.equal(await page.locator('.operations-primary-action').isDisabled(), false);
    assert.equal(await page.locator('.discreet-delivery-button').isDisabled(), false);
    assert.equal(await page.locator('.risky-delivery-button').isDisabled(), true);
    if (locale === 'villager') await assertVillagerOnly(page);
    await decoy.focus(); await page.keyboard.press('Enter');
    let current = (await saved(page)).state;
    assert.equal(current.city.heat, 70); assert.equal(current.economy.cash, '0');
    assert.equal(current.progression.xp, 0);
    assert.equal(current.permanentProgression.statistics.manualJobsCompleted, 0);
    assert.equal(await travel.isDisabled(), false);
    assert.equal(await decoy.isDisabled(), true);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: 'browser-evidence/manhunt-' + locale + '-' + width + '.png', fullPage: true });
    await travel.selectOption('territory:neon-mile');
    current = (await saved(page)).state;
    assert.equal(current.city.heat, 0); assert.equal(current.city.districts.parked.heat, 70);
    await page.reload(); await navigation(page).nth(2).click();
    current = (await saved(page)).state;
    assert.equal(current.economy.cash, '0');
    assert.equal(current.city.districts.activeId, 'territory:neon-mile');
    assert.equal(current.city.districts.parked.heat, 70);
    assert.equal(await page.locator('.manhunt-decoy-button').isDisabled(), true);
    if (locale === 'villager') await assertVillagerOnly(page);
    assert.deepEqual(errors, []); await context.close();
  }


  // Heat V: visible scoped discounts, active car/Crew changes and local cover.
  for (const locale of ['en', 'de', 'villager']) for (const width of [320, 390, 740, 1024, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ fixture, locale }) => {
      // Deterministic action-only clock isolates exact spending from Business production.
      Date.now = () => 1700000000000;
      Object.defineProperty(performance, 'now', { value: () => 0 });
      if (sessionStorage.getItem('support-audit')) return;
      fixture.savedAt = Date.now();
      fixture.state.city = { heat: 100, heatDecayElapsedMs: 0,
        ownedTerritoryIds: ['territory:waterfront', 'territory:neon-mile'] };
      fixture.state.economy.cash = '1000000';
      fixture.state.businesses.owned = { 'business:dockside-detail': { level: 10 } };
      fixture.state.crew = { recruitedIds: ['crew:mara-knox'],
        assignments: { operations: 'crew:mara-knox', logistics: null } };
      fixture.state.garage = { ownedVehicleIds: ['vehicle:kairo-kx-r', 'vehicle:namera-lilt'],
        activeVehicleId: 'vehicle:namera-lilt' };
      localStorage.setItem('crime-empire:save', JSON.stringify(fixture));
      localStorage.setItem('solara-city:settings', JSON.stringify({ locale, reducedMotion: true }));
      sessionStorage.setItem('support-audit', 'true');
    }, { fixture: fixtures[0], locale });
    await page.goto('http://127.0.0.1:4174'); await navigation(page).nth(1).click();
    await page.locator('.heat-support summary').click();
    assert.equal(await page.locator('.heat-support [data-support-active="true"]').count(), 3);
    assert.ok((await page.locator('.manhunt-decoy-button').textContent()).includes('810'));
    if (locale === 'villager') await assertVillagerOnly(page);
    await navigation(page).nth(3).click();
    await page.locator('article[aria-labelledby="vehicle:kairo-kx-r-heading"] button').click();
    await navigation(page).nth(1).click();
    assert.ok((await page.locator('.manhunt-decoy-button').textContent()).includes('900'));
    assert.equal(await page.locator('.heat-support [data-support-active="true"]').count(), 2);
    await navigation(page).nth(3).click();
    await page.locator('article[aria-labelledby="vehicle:namera-lilt-heading"] button').click();
    await navigation(page).nth(1).click();
    const decoy = page.locator('.manhunt-decoy-button');
    assert.ok((await decoy.textContent()).includes('810'));
    await decoy.focus(); await page.keyboard.press('Enter');
    let current = (await saved(page)).state;
    assert.equal(current.economy.cash, '919000'); assert.equal(current.city.heat, 70);
    await page.locator('.heat-support summary').click();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    if (locale === 'villager') await assertVillagerOnly(page);
    await page.screenshot({ path: 'browser-evidence/support-' + locale + '-' + width + '.png', fullPage: true });
    await navigation(page).nth(2).click();
    await page.locator('.crew-slots .crew-slot button').first().click();
    assert.ok((await page.locator('.manhunt-decoy-button').textContent()).includes('900'));
    await page.locator('#active-district').selectOption('territory:neon-mile');
    assert.equal(await page.locator('.heat-support [data-support-active="true"]').count(), 1);
    current = (await saved(page)).state;
    assert.equal(current.city.districts.parked.heat, 70); assert.equal(current.city.heat, 0);
    await page.reload(); await navigation(page).nth(2).click();
    assert.equal((await saved(page)).state.economy.cash, '919000');
    assert.equal(await page.locator('.heat-support [data-support-active="true"]').count(), 1);
    if (locale === 'villager') await assertVillagerOnly(page);
    assert.deepEqual(errors, []); await context.close();
  }


  // KX-R tuning: v20 migration, durable purchase failure, one active setup, free swaps and reload.
  for (const locale of ['en', 'de', 'villager']) for (const width of [320, 390, 740, 1024, 1440]) {
    const fixture = structuredClone(fixtures[0]);
    fixture.version = 20;
    fixture.state.economy.cash = '5000000';
    fixture.state.garage = { ownedVehicleIds: ['vehicle:kairo-kx-r', 'vehicle:kairo-senda'], activeVehicleId: 'vehicle:kairo-kx-r' };
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ fixture, locale }) => {
      if (sessionStorage.getItem('tuning-initialized')) return;
      fixture.savedAt = Date.now();
      localStorage.setItem('crime-empire:save', JSON.stringify(fixture));
      localStorage.setItem('solara-city:settings', JSON.stringify({ locale, reducedMotion: true }));
      sessionStorage.setItem('tuning-initialized', 'true');
    }, { fixture, locale });
    await page.goto('http://127.0.0.1:4174');
    await navigation(page).nth(3).click();
    const fleet = page.locator('[data-tuning-id="tuning:kxr-fleet-gearing"] button');
    const courier = page.locator('[data-tuning-id="tuning:kxr-courier-ecu"] button');
    await page.evaluate(() => {
      const write = Storage.prototype.setItem;
      document.documentElement.dataset.failTuningSave = 'true';
      Storage.prototype.setItem = function(key, value) {
        if (key === 'crime-empire:save' && document.documentElement.dataset.failTuningSave === 'true') throw Error('quota');
        return write.call(this, key, value);
      };
    });
    await fleet.click();
    assert.equal((await saved(page)).state.economy.cash, '5000000');
    assert.equal((await saved(page)).state.garage.builds, undefined);
    assert.ok(await page.locator('.save-status-warning').isVisible());
    await page.evaluate(() => { document.documentElement.dataset.failTuningSave = 'false'; });
    await fleet.click();
    assert.equal((await saved(page)).state.economy.cash, '3500000');
    assert.equal(await fleet.isDisabled(), true);
    await courier.click();
    assert.equal((await saved(page)).state.economy.cash, '2500000');
    assert.equal(await courier.isDisabled(), true);
    await navigation(page).nth(1).click();
    await page.locator('.operations-primary-action').click();
    assert.equal((await saved(page)).state.economy.cash, '2502700');
    await navigation(page).nth(3).click();
    await fleet.click();
    assert.equal((await saved(page)).state.economy.cash, '2502700');
    assert.equal((await saved(page)).state.garage.builds['vehicle:kairo-kx-r'].purchasedIds.length, 2);
    await page.locator('.tuning-stock').click();
    assert.equal((await saved(page)).state.garage.builds['vehicle:kairo-kx-r'].selectedId, null);
    await courier.click();
    await page.reload(); await navigation(page).nth(3).click();
    assert.equal((await saved(page)).version, 21);
    assert.equal(await courier.isDisabled(), true);
    assert.equal((await saved(page)).state.garage.builds['vehicle:kairo-kx-r'].selectedId, 'tuning:kxr-courier-ecu');
    if (locale === 'villager') await assertVillagerOnly(page);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: 'browser-evidence/tuning-' + locale + '-' + width + '.png', fullPage: true });
    assert.deepEqual(errors, []); await context.close();
  }

  const layoutFailures = results.filter(item => item.overflow > 1 || item.clippedMetrics.length);
  assert.deepEqual(layoutFailures, [], 'No page overflow or clipped financial metrics across the full matrix');
  console.log(JSON.stringify({ sectionCases: results.length, riskDeliveryCases: 15, policePressureCases: 15, districtHeatCases: 15, manhuntCases: 15, heatSupportCases: 15, tuningCases: 15, localeSwitchAndFeedback: true,
    keyboardModalAndReload: true, advancedCrossFeatureFlows: 3, exportAndInvalidImport: true, resetConsentSurvivesLocaleSwitch: true, results }, null, 2));
} finally {
  writeFileSync('browser-evidence/game-audit.json', JSON.stringify(results, null, 2));
  await browser?.close(); server.kill('SIGTERM');
}
