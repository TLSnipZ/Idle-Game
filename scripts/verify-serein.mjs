import { openCollectionView, openGarageVehicle } from './collection-browser-helpers.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const {chromium}=await import(pathToFileURL(process.env.SOLARA_PLAYWRIGHT_MODULE).href);
const fixture=JSON.parse(readFileSync(process.env.SOLARA_AUDIT_FIXTURES,'utf8'))[0];
const baseUrl=process.env.SOLARA_BASE_URL || 'http://127.0.0.1:4184';
const server=process.env.SOLARA_BASE_URL ? null : spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4184'],{stdio:'inherit'});
const N='vehicle:namera-serein';
let browser,count=0;
mkdirSync('browser-evidence',{recursive:true});
try {
 for(let i=0;i<100;i++){try{if((await fetch(baseUrl)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true});
 for(const locale of ['en','de','villager'])for(const width of [320,390,740,1024,1440]){
  const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const f=structuredClone(fixture);f.version=23;f.state.progression.xp=8100;
  f.state.economy.cash='8000000';f.state.businesses.owned={'business:afterdark-customs':{level:1}};
  f.state.garage={ownedVehicleIds:[],activeVehicleId:null};
  await page.addInitScript(({f,locale})=>{
   if(sessionStorage.getItem('serein-seeded'))return;
   f.savedAt=Date.now();localStorage.setItem('crime-empire:save',JSON.stringify(f));
   localStorage.setItem('solara-city:settings',JSON.stringify({locale,reducedMotion:true}));
   sessionStorage.setItem('serein-seeded','1');
  },{f,locale});
  await page.goto(baseUrl);
  await page.locator('.primary-navigation button').nth(3).click();
  await openGarageVehicle(page,N);
  const card=page.locator('article[aria-labelledby="'+N+'-heading"]');
  assert.equal(await card.count(),1);
  await verifyArtwork(card, width);
  await card.locator('.purchase-button').click();
  let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('crime-empire:save')));
  assert.equal(saved.version,25);assert.deepEqual(saved.state.garage.ownedVehicleIds,[N]);assert.equal(saved.state.garage.activeVehicleId,N);
  await openCollectionView(page,'tuning');
  await page.locator('#tuning-vehicle').selectOption(N);
  await openCollectionView(page,'appearance');
  await page.locator('#appearance-vehicle').selectOption(N);
  assert.equal(await page.locator('.stock-only-notice').count(),2);
  assert.equal(await page.locator('.vehicle-tuning button,.vehicle-appearance button').count(),0);
  await page.reload();await page.locator('.primary-navigation button').nth(3).click();
  assert.equal(await page.locator('.stock-only-notice').count(),2);
  saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('crime-empire:save')));
  assert.equal(saved.state.garage.activeVehicleId,N);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.deepEqual(errors,[]);
  await openGarageVehicle(page,N);
  await verifyArtwork(card, width);
  await card.evaluate(element=>window.scrollBy(0,element.getBoundingClientRect().top-240));
  await card.screenshot({path:'browser-evidence/serein-'+locale+'-'+width+'.png'});
  count++;await page.close();
 }
 console.log(JSON.stringify({sereinCases:count,failures:0,artworkAcceptance:'decoded-contained-and-reloaded',baseUrl}));
}finally{await browser?.close();server?.kill('SIGTERM');}

async function verifyArtwork(card, width) {
 const picture=card.locator('.vehicle-artwork');
 assert.equal(await picture.count(),1);
 await picture.scrollIntoViewIfNeeded();
 const view=await picture.evaluate(async image=>{
  await image.decode();
  const box=image.getBoundingClientRect();
  return {width:image.naturalWidth,height:image.naturalHeight,src:image.currentSrc,
   left:box.left,right:box.right,ratio:box.width/box.height,fit:getComputedStyle(image).objectFit};
 });
 assert.equal(view.width,1672);assert.equal(view.height,940);
 assert.match(view.src,/namera-serein[^/]*\.webp$/);
 assert.equal(view.fit,'contain');
 assert.ok(view.left>=-1 && view.right<=width+1);
 assert.ok(Math.abs(view.ratio-1672/940)<0.02,'Complete Serein frame retains its aspect ratio');
}
