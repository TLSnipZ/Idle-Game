import { describe, expect, it } from 'vitest';
import { createPersistentGame } from './persistent-game';
import { createLocalSave } from './local-save';
import { createInitialGameState } from '../game/game-state';
import { serializeSave, parseSave, CURRENT_SAVE_VERSION } from '../game/save-schema';
import { exportSaveCode, validateSaveCode } from '../game/save-code';
import { STREET_CONNECTIONS as S, FLEET_LOGISTICS as F } from '../features/upgrades';
import { DELIVERY_DISPATCHER as D } from '../features/automation';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { evaluateJobReward, evaluateBusinessProduction } from '../game/effective-stats';
import { simulateGameElapsed } from '../game/simulate-game-elapsed';
import { reconcileOffline, OFFLINE_CAP_MS } from '../game/offline-progress';
import { selectUpgrade } from '../game/selectors';
import { selectDispatcher } from '../game/automation-selectors';
import { performStarterJob } from '../game/perform-starter-job';
import { purchaseUpgrade } from '../game/purchase-upgrade';
import { rational } from '../shared/rational';
import { moneyFromMinorUnits } from '../features/economy';

function grandfathered() {
  const state = createInitialGameState();
  return { ...state, businesses: { ...state.businesses, owned: { [B.id]: { level: 1 } } },
    upgrades: { purchasedIds: [S.id,F.id] },
    automation: { unlockedIds: [D.id], starterJobElapsedMs: 5000 } };
}
describe('acquisition-only gates preserve live saves', () => {
  it('keeps low-level owned upgrades and dispatcher active without the newly required washer', () => {
    const state = grandfathered();
    expect(selectUpgrade(state,S.id)).toMatchObject({ purchased: true, eligible: false });
    expect(selectUpgrade(state,F.id)).toMatchObject({ purchased: true, eligible: false });
    expect(selectDispatcher(state)).toMatchObject({ unlocked: true, eligible: false });
    expect(evaluateJobReward(state)).toMatchObject({ ok: true, reward: '3000' });
    expect(evaluateBusinessProduction(state,B.id,1)).toMatchObject({ ok: true, effective: rational(165n,2n) });
    const simulated=simulateGameElapsed(state,25000);
    expect(simulated.ok).toBe(true);
    expect(simulated.state.progression.xp).toBe(15);
    expect(simulated.ok && simulated.automation).toMatchObject({ completedJobs: 3, income: '9000' });
    expect(reconcileOffline(state,0,25000).state).toEqual(simulated.state);
  });
  it('retains current schema/CE1 and exact gated ownership on roundtrip even without any business', () => {
    const state={ ...grandfathered(), businesses: createInitialGameState().businesses };
    expect(CURRENT_SAVE_VERSION).toBe(14);
    const serialized=serializeSave(state,42); if (!serialized.ok) throw Error('fixture');
    expect(parseSave(serialized.serialized)).toMatchObject({ ok: true, envelope: { version: 14, state } });
    const code=exportSaveCode(state,42); if (!code.ok) throw Error('fixture');
    expect(code.code.startsWith('CE1-')).toBe(true);
    expect(validateSaveCode(code.code)).toEqual(parseSave(serialized.serialized));
    expect(simulateGameElapsed(state,5000).state.progression.xp).toBe(5);
  });
  it('uses the same eight-hour window and clock-anomaly behavior for grandfathered systems', () => {
    const state=grandfathered();
    const offline=reconcileOffline(state,0,12*3600000);
    expect(offline.state).toEqual(simulateGameElapsed(state,OFFLINE_CAP_MS).state);
    expect(offline.ok && offline.progress).toMatchObject({ capped: true, xpEarned: 14400 });
    expect(reconcileOffline(state,10000,0).state).toEqual(state);
  });
  it('imports without historical reward, then consumes offline XP once with durable publication', () => {
    let raw: string | null=null; let wall=1000000; let now=0;
    const save=createLocalSave(() => ({ getItem: () => raw, setItem: (_key:string,value:string) => { raw=value; } }),() => wall);
    const make=() => createPersistentGame(view => {
      if (view.offline && view.persistence.kind==='loaded') {
        expect(raw && parseSave(raw)).toMatchObject({ ok:true,envelope:{state:view.result.state} });
      }
    },save,{ random: { next: () => 0.99 }, now: () =>now, schedule:()=>()=>{} },()=>()=>{});
    const game=make(); game.start();
    const code=exportSaveCode(grandfathered(),1); if (!code.ok) throw Error('fixture');
    expect(game.importCode(code.code)).toEqual({ ok:true });
    expect(game.getSnapshot().result.state).toEqual(grandfathered());
    expect(raw && parseSave(raw)).toMatchObject({ ok:true,envelope:{savedAt:wall,state:grandfathered()} });
    game.stop(); wall+=25000; now+=25000;
    const reload=make(); reload.start();
    expect(reload.getSnapshot().result.state).toEqual(simulateGameElapsed(grandfathered(),25000).state);
    expect(reload.getSnapshot().offline?.xpEarned).toBe(15); reload.stop();
    const second=make(); second.start();
    expect(second.getSnapshot().offline?.xpEarned).toBe(0); second.stop();
  });
  it('reconciles before testing a level gate and announces the newly eligible content', () => {
    let raw: string | null=null; let now=0;
    const state={ ...grandfathered(), progression:{xp:95}, upgrades:{purchasedIds:[]},
      economy:{cash:moneyFromMinorUnits('100000')} };
    const encoded=serializeSave(state,1); if (!encoded.ok) throw Error('fixture'); raw=encoded.serialized;
    const save=createLocalSave(()=>({getItem:()=>raw,setItem:(_key:string,value:string)=>{raw=value;}}),()=>1);
    const game=createPersistentGame(()=>{},save,{random: { next: () => 0.99 }, now: () =>now,schedule:()=>()=>{}},()=>()=>{});
    game.start(); game.dismissOffline();
    now=5000; game.execute(current=>purchaseUpgrade(current,S.id));
    expect(game.getSnapshot().result.ok).toBe(true);
    expect(game.getSnapshot().result.state.progression.xp).toBe(100);
    expect(game.getSnapshot().automationEvent).toMatchObject({income:'2500',xpEarned:5});
    expect(game.getSnapshot().levelEvent).toMatchObject({fromLevel:1,toLevel:2,unlocks:[S.name]});
    game.execute(performStarterJob);
    expect(game.getSnapshot().result.state.progression.xp).toBe(110); game.stop();
  });
});
