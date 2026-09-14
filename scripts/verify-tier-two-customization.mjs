import { openCollectionView, openGarageVehicle } from './collection-browser-helpers.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium } = await import(pathToFileURL(process.env.SOLARA_PLAYWRIGHT_MODULE).href);
const fixture = JSON.parse(readFileSync(process.env.SOLARA_AUDIT_FIXTURES, 'utf8'))[0];
const baseUrl = process.env.SOLARA_BASE_URL ?? 'http://127.0.0.1:4186';
const server = process.env.SOLARA_BASE_URL ? null : spawn(process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4186'], { stdio: 'inherit' });
const K = 'vehicle:kairo-kx-r';
const models = [
  { id: 'vehicle:namera-serein', parts: ['serein-nightshift-ecu','serein-workshop-gearing'], looks: ['serein-plum','serein-copper'],
    body: [[400,460],[805,450],[1150,510],[800,265],[1130,374],[590,368],[1438,368],[800,704]],
    protected: [[635,534],[645,655],[895,650],[910,320],[300,620],[1580,410],[1489,442]] },
  { id: 'vehicle:toseki-rendan', parts: ['rendan-dispatch-gearing','rendan-express-ecu'], looks: ['rendan-crimson','rendan-ice'],
    body: [[400,460],[840,450],[1180,510],[895,232],[1100,375],[560,365],[1425,351],[800,704]],
    protected: [[672,527],[675,649],[920,650],[925,310],[390,640],[570,419],[1580,410],[1468,443]] },
  { id: 'vehicle:sevrin-canto-club', parts: ['canto-fleet-gearing','canto-dispatch-ecu'], looks: ['canto-burgundy','canto-slate'],
    body: [[400,460],[830,450],[1160,510],[925,252],[1130,374],[596,364],[800,704]],
    protected: [[640,523],[635,650],[890,650],[910,310],[390,640],[1580,410],[1498,441]] },
];
const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('crime-empire:save')));
let browser, cases = 0, pixelChecks = 0;
mkdirSync('browser-evidence', { recursive: true });
try {
  for (let i = 0; i < 100; i++) { try { if ((await fetch(baseUrl)).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
  browser = await chromium.launch({ headless: true });
  for (const model of models) for (const locale of ['en','de','villager']) for (const width of [320,390,740,1024,1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } }), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const f = structuredClone(fixture);
    f.version = 25; f.state.economy.cash = '100000000'; f.state.businesses.owned = {};
    f.state.automation.enabledIds = [];
    f.state.garage = { ownedVehicleIds: [K, ...models.map(m => m.id)], activeVehicleId: K,
      builds: { [K]: { purchasedIds: ['tuning:kxr-fleet-gearing'], selectedId: 'tuning:kxr-fleet-gearing' } },
      appearances: { [K]: 'appearance:kxr-coastal' } };
    await page.addInitScript(({ f, locale }) => {
      if (sessionStorage.getItem('ivd-seeded')) return;
      f.savedAt = Date.now(); localStorage.setItem('crime-empire:save', JSON.stringify(f));
      localStorage.setItem('solara-city:settings', JSON.stringify({ locale, reducedMotion: true }));
      sessionStorage.setItem('ivd-seeded','1');
    }, { f, locale });
    await page.goto(baseUrl); await page.locator('.primary-navigation button').nth(3).click();
    assert.equal((await saved(page)).version, 26);
    await openCollectionView(page, 'tuning'); await page.locator('#tuning-vehicle').selectOption(model.id);
    const part0 = page.locator(`[data-tuning-id="tuning:${model.parts[0]}"] button`);
    // A quota failure must retain the player's Cash and old build, then allow retry.
    await page.evaluate(() => { window.ivdSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function(key,value) {
      if (key === 'crime-empire:save') throw new DOMException('Quota','QuotaExceededError');
      return window.ivdSetItem.call(this,key,value);
    }; });
    await part0.click(); assert.equal((await saved(page)).state.garage.builds[model.id], undefined);
    assert.equal((await saved(page)).state.economy.cash, '100000000');
    await page.evaluate(() => { Storage.prototype.setItem = window.ivdSetItem; });
    await part0.click();
    await page.locator(`[data-tuning-id="tuning:${model.parts[1]}"] button`).click();
    await part0.click();
    let snap = await saved(page);
    assert.deepEqual(snap.state.garage.builds[model.id], { purchasedIds: model.parts.map(p => `tuning:${p}`), selectedId: `tuning:${model.parts[0]}` });
    assert.equal(snap.state.garage.activeVehicleId, K);
    await page.locator('.tuning-stock').click();
    assert.equal((await saved(page)).state.garage.builds[model.id].selectedId, null);
    await part0.click();
    const cash = (await saved(page)).state.economy.cash;
    await openCollectionView(page,'appearance'); await page.locator('#appearance-vehicle').selectOption(model.id);
    for (const look of model.looks) {
      await page.locator(`[data-look-id="appearance:${look}"]`).click();
      assert.equal((await saved(page)).state.garage.appearances[model.id], undefined);
    }
    await page.locator('.discard-appearance').click();
    assert.equal(await page.locator('.paint-preview [data-appearance="factory"]').count(), 1);
    await page.locator(`[data-look-id="appearance:${model.looks[0]}"]`).click();
    await page.locator('.apply-appearance').click();
    assert.equal((await saved(page)).state.garage.appearances[model.id], `appearance:${model.looks[0]}`);
    assert.equal((await saved(page)).state.economy.cash, cash);
    assert.equal((await saved(page)).state.garage.activeVehicleId, K);
    await page.reload(); await page.locator('.primary-navigation button').nth(3).click();
    await openGarageVehicle(page, model.id);
    const card = page.locator(`article[aria-labelledby="${model.id}-heading"]`);
    assert.equal(await card.locator(`[data-appearance="appearance:${model.looks[0]}"]`).count(),1);
    await card.locator('.vehicle-specification > button[aria-label]').click();
    snap = await saved(page); assert.equal(snap.state.garage.activeVehicleId,model.id);
    assert.deepEqual(snap.state.garage.builds[K], f.state.garage.builds[K]);
    assert.equal(snap.state.garage.appearances[K], 'appearance:kxr-coastal');
    await openCollectionView(page,'appearance'); await page.locator('#appearance-vehicle').selectOption(model.id);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.evaluate(() => { document.documentElement.style.fontSize = '20px'; });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    if (locale === 'de' && [390,1440].includes(width)) await page.locator('.vehicle-appearance').screenshot({path:`browser-evidence/ivd-${model.id.slice(8)}-${width}.png`});
    if (locale === 'en' && width === 1440) {
      const style = await page.addStyleTag({ content: '.paint-studio-layout{display:block}.paint-preview{width:1003.2px}.paint-preview .vehicle-image{width:1003.2px;height:564px;aspect-ratio:auto}.global-chrome,.collection-navigation,.workshop-navigation{position:static!important}' });
      const target = page.locator('.paint-preview .vehicle-image');
      async function sample(name) {
        await target.locator('img').evaluate(img => img.decode());
        const png = await target.screenshot({path:`browser-evidence/ivd-${model.id.slice(8)}-${name}.png`});
        return page.evaluate(async ({png,points}) => {
          const img = new Image(); img.src = 'data:image/png;base64,'+png; await img.decode();
          const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
          const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
          return points.map(([x,y])=>[...ctx.getImageData(Math.round(x*img.width/1672),Math.round(y*img.height/940),1,1).data].slice(0,3));
        },{png:png.toString('base64'),points:[...model.body,...model.protected]});
      }
      await page.locator('.vehicle-appearance .finish-option').first().click();
      const factory=await sample('factory');
      for (const look of model.looks) {
        await page.locator(`[data-look-id="appearance:${look}"]`).click();
        const pixels=await sample(look);
        for(let i=0;i<pixels.length;i++) {
          const delta=Math.max(...pixels[i].map((v,k)=>Math.abs(v-factory[i][k])));
          assert.ok(i<model.body.length ? delta>12 : delta<=2, `${look} ${i<model.body.length?'body':'protected'} ${[...model.body,...model.protected][i]} delta ${delta}`);
          pixelChecks++;
        }
      }
      await style.evaluate(el=>el.remove());
    }
    assert.deepEqual(errors,[]);cases++;await page.close();
  }
  console.log(JSON.stringify({tierTwoCustomizationCases:cases,paintPixelChecks:pixelChecks,failures:0,baseUrl}));
} finally {await browser?.close();server?.kill('SIGTERM');}
