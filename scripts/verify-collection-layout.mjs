import { readFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { openCollectionView, openGarageVehicle } from './collection-browser-helpers.mjs';
const { chromium } = await import(pathToFileURL(process.env.SOLARA_PLAYWRIGHT_MODULE).href);
const fixture = JSON.parse(readFileSync(process.env.SOLARA_AUDIT_FIXTURES, 'utf8'))[0];
const baseUrl = process.env.SOLARA_BASE_URL || 'http://127.0.0.1:4185';
const server = process.env.SOLARA_BASE_URL ? null : spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4185'], { stdio: 'inherit' });
const K = 'vehicle:kairo-kx-r', S = 'vehicle:kairo-senda', N = 'vehicle:namera-serein';
const garage = page => page.evaluate(() => JSON.parse(localStorage.getItem('crime-empire:save')).state.garage);
let browser, count = 0;
mkdirSync('browser-evidence', { recursive: true });
try {
  let ready = false;
  for (let i=0;i<100;i++) { try { if ((await fetch(baseUrl)).ok) { ready=true; break; } } catch {} await new Promise(r=>setTimeout(r,100)); }
  assert.ok(ready);
  browser = await chromium.launch({ headless: true });
  for (const locale of ['en','de','villager']) for (const width of [320,390,740,1024,1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } }), errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const f=structuredClone(fixture);f.version=24;f.state.garage={ownedVehicleIds:[K,S],activeVehicleId:K};
    await page.addInitScript(({f,locale})=>{
      if(sessionStorage.getItem('collection-seeded'))return;
      f.savedAt=Date.now();localStorage.setItem('crime-empire:save',JSON.stringify(f));
      localStorage.setItem('solara-city:settings',JSON.stringify({locale,reducedMotion:true}));sessionStorage.setItem('collection-seeded','1');
    },{f,locale});
    await page.goto(baseUrl);await page.locator('.primary-navigation button').nth(3).click();
    const original=await garage(page);
    assert.equal(await page.locator('.garage').isVisible(),true);
    assert.equal(await page.locator('.vehicle-tuning').isVisible(),false);
    assert.equal(await page.locator('.vehicle-appearance').isVisible(),false);
    const filter=page.locator('.garage-filters select').first();
    await filter.selectOption('owned');assert.equal(await page.locator('.garage-tile').count(),2);
    await filter.selectOption('missing');assert.equal(await page.locator('.garage-tile').count(),2);
    await filter.selectOption('all');
    await page.locator('.garage-filters select').last().selectOption('name');
    const names=await page.locator('.tile-copy strong').allTextContents();
    assert.equal(names.length,6);
    assert.deepEqual(names,[...names].sort((a,b)=>a.localeCompare(b,locale==='villager'?'en':locale)),'Displayed names sort correctly');
    for (const picture of await page.locator('.garage-tile img').all()) { await picture.scrollIntoViewIfNeeded(); await picture.evaluate(image=>image.decode()); }
    await page.locator('.collection-workspace').screenshot({path:`browser-evidence/collection-grid-${locale}-${width}.png`});
    await openGarageVehicle(page,S);
    const card=page.locator(`article[aria-labelledby="${S}-heading"]`);
    assert.equal(await card.isVisible(),true);
    assert.equal(await page.locator('.vehicle-card:visible').count(),1);
    await card.locator('.vehicle-artwork').evaluate(image=>image.decode());
    assert.deepEqual(await garage(page),original,'Inspecting and filtering never activates a car');
    if(width<=740) { assert.equal(await page.locator('.garage-rail').isVisible(),false);await page.locator('.garage-back').click();assert.equal(await page.locator('.garage-rail').isVisible(),true);await openGarageVehicle(page,S); }
    await card.locator('.garage-workshop-link').click();
    assert.equal(await page.locator('#tuning-vehicle').inputValue(),S);
    const controls = await page.locator('#tuning-vehicle').boundingBox();
    const navigationBottom = await page.locator('.workshop-navigation').evaluate(element=>element.getBoundingClientRect().bottom);
    assert.ok(controls.y >= navigationBottom, 'Workshop selector clears both sticky navigation rows');
    assert.equal(await page.locator('.garage').isVisible(),false);
    assert.equal(await page.locator('.vehicle-tuning').isVisible(),true);
    assert.equal(await page.locator('.vehicle-appearance').isVisible(),false);
    await page.locator('.vehicle-tuning').screenshot({path:`browser-evidence/collection-tuning-${locale}-${width}.png`});
    await openCollectionView(page,'appearance');
    assert.equal(await page.locator('#appearance-vehicle').inputValue(),S);
    await page.locator('.vehicle-appearance [data-look-id]').first().click();
    const draft=await page.locator('.paint-preview .vehicle-image').getAttribute('data-appearance');
    assert.notEqual(draft,'factory');
    await openCollectionView(page,'tuning');await page.locator('#tuning-vehicle').selectOption(K);
    await openCollectionView(page,'appearance');assert.equal(await page.locator('#appearance-vehicle').inputValue(),K);
    await page.locator('#appearance-vehicle').selectOption(S);assert.equal(await page.locator('.paint-preview .vehicle-image').getAttribute('data-appearance'),draft,'Draft survives tab and car changes');
    assert.deepEqual(await garage(page),original);
    await page.locator('.vehicle-appearance').screenshot({path:`browser-evidence/collection-paint-${locale}-${width}.png`});
    await page.locator('.discard-appearance').click();assert.equal(await page.locator('.paint-preview .vehicle-image').getAttribute('data-appearance'),'factory');
    await page.locator('#appearance-vehicle').selectOption(N);assert.equal(await page.locator('.vehicle-appearance .stock-only-notice').isVisible(),true);
    await openCollectionView(page,'tuning');assert.equal(await page.locator('#tuning-vehicle').inputValue(),N);assert.equal(await page.locator('.vehicle-tuning .stock-only-notice').isVisible(),true);
    await page.evaluate(()=>{document.documentElement.style.fontSize='20px';});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'125% text stays inside viewport');
    await openCollectionView(page,'garage');
    if(await page.locator('.garage-back').isVisible())await page.locator('.garage-back').click();
    const tile=page.locator(`[data-vehicle-id="${S}"]`);await tile.focus();await page.keyboard.press('Enter');assert.equal(await card.isVisible(),true);
    await card.locator('button[aria-label]').click();assert.equal((await garage(page)).activeVehicleId,S);
    await page.reload();await page.locator('.primary-navigation button').nth(3).click();assert.equal((await garage(page)).activeVehicleId,S);
    assert.deepEqual(errors,[]);count++;await page.close();
  }
  console.log(JSON.stringify({collectionLayoutCases:count,failures:0,baseUrl}));
} finally { await browser?.close();server?.kill('SIGTERM'); }
