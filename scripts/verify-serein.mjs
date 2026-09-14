import { readFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const {chromium}=await import(pathToFileURL(process.env.SOLARA_PLAYWRIGHT_MODULE).href);
const fixture=JSON.parse(readFileSync(process.env.SOLARA_AUDIT_FIXTURES,'utf8'))[0];
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4184'],{stdio:'inherit'});
const N='vehicle:namera-serein';
let browser,count=0;
mkdirSync('browser-evidence',{recursive:true});
try {
 for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:4184')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
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
  await page.goto('http://127.0.0.1:4184');
  await page.locator('.primary-navigation button').nth(3).click();
  const card=page.locator('article[aria-labelledby="'+N+'-heading"]');
  assert.equal(await card.count(),1);
  await card.locator('.purchase-button').click();
  let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('crime-empire:save')));
  assert.equal(saved.version,24);assert.deepEqual(saved.state.garage.ownedVehicleIds,[N]);assert.equal(saved.state.garage.activeVehicleId,N);
  await page.locator('#tuning-vehicle').selectOption(N);
  await page.locator('#appearance-vehicle').selectOption(N);
  assert.equal(await page.locator('.stock-only-notice').count(),2);
  assert.equal(await page.locator('.vehicle-tuning button,.vehicle-appearance button').count(),0);
  await page.reload();await page.locator('.primary-navigation button').nth(3).click();
  assert.equal(await page.locator('.stock-only-notice').count(),2);
  saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('crime-empire:save')));
  assert.equal(saved.state.garage.activeVehicleId,N);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.deepEqual(errors,[]);
  // Asset loading/crop acceptance remains a release blocker until approved PNG is transferred.
  if(width===390)await page.screenshot({path:'browser-evidence/serein-'+locale+'.png'});
  count++;await page.close();
 }
 console.log(JSON.stringify({sereinCases:count,failures:0,artworkAcceptance:'pending-approved-file-transfer'}));
}finally{await browser?.close();server.kill('SIGTERM');}
