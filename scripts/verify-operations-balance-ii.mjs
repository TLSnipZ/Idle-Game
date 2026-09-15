import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const { chromium } = await import(pathToFileURL(process.env.SOLARA_PLAYWRIGHT_MODULE).href);
const baseUrl = process.env.SOLARA_BASE_URL ?? 'http://127.0.0.1:4182';
const server = process.env.SOLARA_BASE_URL ? null : spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4182'], { stdio: 'inherit' });
let browser; let cases = 0;
const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('crime-empire:save')).state);
async function waitForServer() { for (let i=0;i<100;i++){try{if((await fetch(baseUrl)).ok)return;}catch{} await new Promise(r=>setTimeout(r,100));} throw new Error('Solara preview did not become ready'); }
async function noOverflow(page){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))); assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1);}
try { await waitForServer(); browser=await chromium.launch({headless:true}); mkdirSync('browser-evidence',{recursive:true});
for(const locale of ['en','de','villager']) for(const width of [390,1440]) { const context=await browser.newContext({viewport:{width,height:1000}}); const page=await context.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message)); await page.addInitScript(locale=>{localStorage.removeItem('crime-empire:save');localStorage.setItem('solara-city:settings',JSON.stringify({locale,reducedMotion:true}));},locale); await page.goto(baseUrl); if(await page.locator('.offline-continue').count()) await page.locator('.offline-continue').click(); await page.locator('.primary-navigation button').nth(1).click();
const standard=page.locator('.operations-primary-action'), risky=page.locator('.risky-delivery-button'), discreet=page.locator('.discreet-delivery-button'); assert.equal(await standard.isEnabled(),true); assert.equal(await risky.isEnabled(),true); assert.equal(await discreet.isDisabled(),true);
await standard.click(); let state=await saved(page); assert.equal(state.manualJobs,undefined); assert.equal(await standard.isEnabled(),true); assert.equal(await risky.isEnabled(),true); assert.equal(state.city.heat,1); assert.equal(state.progression.xp,10); await standard.click(); state=await saved(page); assert.equal(state.manualJobs,undefined); assert.equal(state.progression.xp,20);
await risky.click(); state=await saved(page); assert.equal(state.manualJobs.elapsedMs,0); assert.equal(await risky.isDisabled(),true); assert.equal(await standard.isEnabled(),true); await standard.click(); state=await saved(page); assert.ok(state.manualJobs); assert.equal(await standard.isEnabled(),true); await noOverflow(page);
if(locale==='en'&&width===390){await page.waitForTimeout(10300); await page.waitForFunction(()=>!document.querySelector('.risky-delivery-button')?.disabled); assert.equal(await risky.isEnabled(),true); assert.equal(await standard.isEnabled(),true);} assert.deepEqual(errors,[]); cases++; await context.close(); }
console.log(JSON.stringify({operationsCadenceCases:cases,failures:0,baseUrl})); } finally { await browser?.close(); server?.kill('SIGTERM'); }
