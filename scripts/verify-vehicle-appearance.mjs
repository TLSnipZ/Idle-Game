import { openCollectionView, openGarageVehicle } from './collection-browser-helpers.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium } = await import(pathToFileURL(process.env.SOLARA_PLAYWRIGHT_MODULE).href);
const fixtures = JSON.parse(readFileSync(process.env.SOLARA_AUDIT_FIXTURES, 'utf8'));
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4178'], { stdio: 'inherit' });
const K = 'vehicle:kairo-kx-r', S = 'vehicle:kairo-senda', L = 'vehicle:namera-lilt';
const catalog = [[K, ['appearance:kxr-coastal', 'appearance:kxr-graphite']],
  [S, ['appearance:senda-champagne', 'appearance:senda-amethyst']], [L, ['appearance:lilt-ivory', 'appearance:lilt-lagoon']]];
const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('crime-empire:save')));
const studio = page => page.locator('.vehicle-appearance');

async function verifyPaintEdges(page) {
  let checks = 0;
  for (const [car, looks] of catalog) {
  // These source-image locations cover the user's missed bodywork and protected lamp/glass/tyre.
  const cases = {
    [K]: {
      body: [[241,157],[544,111],[603,241],[354,217],[348,222],[125,276],[123,268],
        [156,222],[157,225],[227,229],[231,225],[239,164],[553,111],[591,167],
        [597,203],[604,215],[606,240],[550,247],[552,238],[554,233],[557,226],[559,222],[457,162]],
      protected: [[595,173],[597,179],[599,191],[600,197],[280,222],[402,214],[365,266],[370,143],[620,185]]
    },
    [S]: {
      body: [[150,183],[178,176],[233,155],[242,152],[514,188],[523,189],[607,160],
        [254,281],[247,277],[562,222],[579,197],[617,240],[608,185]],
      protected: [[612,177],[614,183],[615,186],[270,227],[368,265],[370,142],[640,180]]
    },
    [L]: {
      body: [[251,154],[256,151],[439,119],[431,146],[122,271],[127,274],[319,275],
        [325,256],[333,235],[347,217],[355,212],[380,209],[546,252],[592,198],[607,206]],
      protected: [[410,214],[611,215],[606,195],[270,215],[370,264],[370,143],[640,180]]
    }
  };
  const { body, protected: protectedPoints } = cases[car];
  await openCollectionView(page, 'appearance'); await page.locator('#appearance-vehicle').selectOption(car);
  const style = await page.addStyleTag({ content: '.paint-studio-layout{display:block}.paint-preview{width:720px}.paint-preview .vehicle-image{width:720px;height:405px;aspect-ratio:auto}.global-chrome,.collection-navigation,.workshop-navigation{position:static!important}' });
  async function sample(name) {
    const target = page.locator('.paint-preview .vehicle-image');
    await target.locator('img').evaluate(img => img.decode());
    await target.scrollIntoViewIfNeeded();
    // Preserve the raster phase used to record these 720x405 sample points in PR #43.
    // Otherwise a new card offset shifts edge samples into the neighbouring source pixel.
    await target.evaluate(element => {
      element.style.transform = 'none';
      const box = element.getBoundingClientRect();
      element.style.transform = `translate(${Math.floor(box.left) + 0.1875 - box.left}px, ${Math.floor(box.top) + 0.984375 - box.top}px)`;
    });
    const shot = await target.screenshot({ path: 'browser-evidence/' + car.split(':')[1] + '-mask-' + await page.evaluate(() => devicePixelRatio) + '-' + name + '.png' });
    return page.evaluate(async ({ png, points }) => {
      const image = new Image(); image.src = 'data:image/png;base64,' + png; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
      return points.map(([x,y]) => [...context.getImageData(Math.round(x * devicePixelRatio),Math.round(y * devicePixelRatio),1,1).data].slice(0,3));
    }, { png: shot.toString('base64'), points: [...body, ...protectedPoints] });
  }
  await studio(page).locator('.finish-option').first().click();
  const original = await sample('factory');
  for (const look of looks) {
    await studio(page).locator('[data-look-id="' + look + '"]').click();
    const pixels = await sample(look.split(':')[1]);
    for (let i = 0; i < body.length; i++) {
      assert.ok(Math.max(...pixels[i].map((c,k) => Math.abs(c-original[i][k]))) > 25,
        'Bodywork still has factory paint at ' + body[i] + ' for ' + look);
    }
    for (let i = body.length; i < pixels.length; i++) {
      assert.ok(Math.max(...pixels[i].map((c,k) => Math.abs(c-original[i][k]))) <= 2,
        'Paint leaked into protected artwork at ' + protectedPoints[i-body.length] + ' for ' + look);
    }
  }
  await page.locator('.paint-preview .vehicle-image').evaluate(element => { element.style.transform = ''; });
  await style.evaluate(el => el.remove());
  checks += 2 * (body.length + protectedPoints.length);
  }
  console.log(JSON.stringify({ paintPixelChecks: checks, failures: 0 }));
}

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
    const context = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: locale === 'de' && width === 1440 ? 2 : 1 });
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
    await openCollectionView(page, 'appearance');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'appearance-heading');
    const original = (await saved(page)).state;
    const applied = {};
    for (const [car, looks] of catalog) {
      await openCollectionView(page, 'appearance'); await page.locator('#appearance-vehicle').selectOption(car);
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
    assert.equal((await saved(page)).version, 27);
    await openCollectionView(page, 'appearance'); await page.locator('#appearance-vehicle').selectOption(K);
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
    if (locale !== 'villager' && width === 1440) await verifyPaintEdges(page);
    assert.deepEqual(errors, []);
    count++; await context.close();
  }
  console.log(JSON.stringify({ appearanceCases: count, failures: 0 }));
} finally { await browser?.close(); server.kill('SIGTERM'); }
