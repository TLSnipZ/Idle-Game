import { describe, expect, it, vi } from 'vitest';
import { createGameRuntime } from './game-runtime';
import type { RuntimeSnapshot } from './game-runtime';
import { createInitialGameState } from '../game/game-state';
import type { GameState } from '../game/game-state';
import { performStarterJob } from '../game/perform-starter-job';
import { upgradeBusiness } from '../game/upgrade-business';
import { acquireTerritory } from '../game/acquire-territory';
import { recruitCrewMember } from '../game/crew-commands';
import { resolveEventChoice } from '../game/resolve-event-choice';
import { DELIVERY_DISPATCHER as D } from '../features/automation';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { moneyFromMinorUnits } from '../features/economy';
import { getXpThresholdForLevel } from '../features/progression';
import { rebirthRuntime } from './test-fixtures/rebirth-runtime';
import { rebirthState } from '../game/test-fixtures/rebirth-state';
import { exportSaveCode } from '../game/save-code';
import { parseSave, serializeSave } from '../game/save-schema';
import { createPersistentGame } from './persistent-game';
import { createLocalSave } from './local-save';
import { ACHIEVEMENT_CATALOG } from '../features/achievements';
const fresh = createInitialGameState;
function runtime(state: GameState) {
  let now = 0; const snapshots: RuntimeSnapshot[] = [];
  const random = { next: vi.fn(() => 0.99) };
  const game = createGameRuntime(state, s => snapshots.push(s), { now: () => now, random, schedule: () => () => {} });
  game.start(); return { game, snapshots, at: (value: number) => { now = value; } };
}
function owns(state: GameState) { return state.permanentProgression.unlockedAchievementIds; }
describe('central achievement command and elapsed boundaries', () => {
  it('one manual job publishes Money, XP, Heat and both achievements together', () => {
    const s = fresh(), input = { ...s, progression: { xp: 90 }, city: { ...s.city, heat: 59 } }, f = runtime(input);
    f.game.execute(performStarterJob);
    expect(f.snapshots).toHaveLength(1); const result = f.game.getSnapshot();
    expect(result.result.state.economy.cash).toBe('2500'); expect(result.result.state.progression.xp).toBe(100); expect(result.result.state.city.heat).toBe(60);
    expect(owns(result.result.state)).toEqual(['achievement:first-steps','achievement:running-hot']);
    expect(result.achievementEvent?.ids).toEqual(owns(result.result.state));
    f.game.execute(performStarterJob); expect(f.game.getSnapshot().achievementEvent).toBe(result.achievementEvent);
  });
  it('failed Money/XP transition never publishes achievements or partial rewards', () => {
    for (const s of [{ ...fresh(), economy: { cash: moneyFromMinorUnits('9'.repeat(100)) } }, { ...fresh(), progression: { xp: Number.MAX_SAFE_INTEGER } }]) {
      const input = { ...s, city: { ...s.city, heat: 59 } }, f = runtime(input);
      f.game.execute(performStarterJob); expect(f.game.getSnapshot().result.ok).toBe(false); expect(f.game.getSnapshot().result.state).toBe(input); expect(f.game.getSnapshot().achievementEvent).toBeUndefined();
    }
  });
  it('Dispatcher unlocks from the complete batch without a click', () => {
    const s = fresh(), f = runtime({ ...s, progression: { xp: 95 }, city: { ...s.city, heat: 59 }, automation: { businessAutoUpgradeTargetId: 'business:dockside-detail' as const, enabledIds: [], businessAutoUpgradeElapsedMs: 0, unlockedIds: [D.id], starterJobElapsedMs: 0 } });
    f.at(50000); f.game.reconcile();
    expect(owns(f.game.getSnapshot().result.state)).toEqual(['achievement:first-steps','achievement:running-hot']);
    expect(f.game.getSnapshot().result.state.progression.xp).toBe(120);
  });
  it('keeps both reconciliation and command unlocks in one grouped announcement', () => {
    const s = fresh(), f = runtime({ ...s, progression: { xp: 95 }, city: { ...s.city, heat: 59 }, automation: { businessAutoUpgradeTargetId: 'business:dockside-detail' as const, enabledIds: [], businessAutoUpgradeElapsedMs: 0, unlockedIds: [D.id], starterJobElapsedMs: 0 } });
    f.at(10000); f.game.execute(performStarterJob);
    expect(f.game.getSnapshot().achievementEvent?.ids).toEqual(['achievement:first-steps','achievement:running-hot']);
  });
  it('exact Dockside upgrade also captures upgrade XP crossing Level 2', () => {
    const s = fresh(), f = runtime({ ...s, progression: { xp: 75 }, economy: { cash: moneyFromMinorUnits('100000000') }, businesses: { ...s.businesses, owned: { [B.id]: { level: 9 } } } });
    f.game.execute(s => upgradeBusiness(s,B.id)); expect(owns(f.game.getSnapshot().result.state)).toEqual(['achievement:first-steps','achievement:dockside-operator']);
    expect(f.game.getSnapshot().result.state.progression.xp).toBe(100);
  });
  it('Neon acquisition spends exactly its cost and captures territory plus final Heat', () => {
    const s = fresh(), f = runtime({ ...s, progression: { xp: getXpThresholdForLevel(12) }, economy: { cash: moneyFromMinorUnits('5000000') }, businesses: { ...s.businesses, owned: { [B.id]: { level: 15 } } }, city: { ...s.city, heat: 50 } });
    f.game.execute(s => acquireTerritory(s,'territory:neon-mile'));
    expect(f.game.getSnapshot().result.state.economy.cash).toBe('0'); expect(f.game.getSnapshot().result.state.city.heat).toBe(60);
    expect(owns(f.game.getSnapshot().result.state)).toContain('achievement:neon-takeover'); expect(owns(f.game.getSnapshot().result.state)).toContain('achievement:running-hot');
  });
  it('third recruit unlocks without auto-assignment, XP, EP or Heat reward', () => {
    const s = rebirthState(), input = { ...s, crew: { ...s.crew, recruitedIds: ['crew:rico-vale','crew:mara-knox'] as const } }, f = runtime(input);
    f.game.execute(s => recruitCrewMember(s,'crew:jax-mercer')); const result = f.game.getSnapshot().result.state;
    expect(owns(result)).toContain('achievement:crew-chief'); expect(result.crew.assignments).toEqual(input.crew.assignments);
    expect(result.progression).toEqual(input.progression); expect(result.city).toEqual(input.city); expect(result.permanentProgression.empirePoints).toBe(0);
  });
  it.each([['event:hot-tip','choice:take-tip',55],['event:shakedown','choice:refuse',50],['event:warehouse-opportunity','choice:invest',55]] as const)('%s Heat choice unlocks only after its complete fixed outcome', (event,choice,heat) => {
    const s = fresh(), f = runtime({ ...s, economy: { cash: moneyFromMinorUnits('250000') }, city: { ...s.city, heat }, events: { pendingEventId: event, opportunityElapsedMs: 123456 } });
    f.game.execute(s => resolveEventChoice(s,event,choice)); const result = f.game.getSnapshot().result.state;
    expect(owns(result)).toEqual(['achievement:running-hot']); expect(result.city.heat).toBe(60); expect(result.events).toEqual(fresh().events); expect(result.progression.xp).toBe(0);
  });
  it('failed choice leaves all state and unlock feedback untouched', () => {
    const s = fresh(), input = { ...s, city: { ...s.city, heat: 60 }, events: { pendingEventId: 'event:warehouse-opportunity' as const, opportunityElapsedMs: 123 } }, f = runtime(input);
    f.game.execute(s => resolveEventChoice(s,'event:warehouse-opportunity','choice:invest')); expect(f.game.getSnapshot().result.state).toBe(input); expect(f.game.getSnapshot().achievementEvent).toBeUndefined();
  });
});
describe('durable achievements, bootstrap, import and Rebirth', () => {
  it.each([false,true])('offline award is written before publication, storage failure=%s', fail => {
    const s = fresh(), input = { ...s, progression: { xp: 95 }, automation: { businessAutoUpgradeTargetId: 'business:dockside-detail' as const, enabledIds: [], businessAutoUpgradeElapsedMs: 0, unlockedIds: [D.id], starterJobElapsedMs: 0 } }, encoded = serializeSave(input,0);
    if (!encoded.ok) throw Error('fixture'); let raw = encoded.serialized; const original = raw; const order: string[] = [];
    const game = createPersistentGame(v => { order.push('publish'); if (fail) expect(owns(v.result.state)).toEqual([]); else expect(owns(v.result.state)).toEqual(['achievement:first-steps']); }, createLocalSave(() => ({ getItem: () => raw, setItem: (_k,v) => { if (fail) throw Error('quota'); const saved = parseSave(v); if (!saved.ok) throw Error('fixture'); expect(owns(saved.envelope.state)).toEqual(['achievement:first-steps']); order.push('write'); raw = v; } }), () => 10000), { now: () => 0, schedule: () => () => {} }, () => () => {});
    game.start(); expect(order[0]).toBe(fail ? 'publish' : 'write');
    if (fail) { expect(raw).toBe(original); expect(game.getSnapshot().result.state).toEqual(input); }
    else { expect(game.getSnapshot().achievementEvent?.ids).toEqual(['achievement:first-steps']); game.stop(); const loaded = createLocalSave(() => ({getItem: () => raw,setItem: (_k,v) => {raw=v;}}), () => 10000).bootstrap(); expect(loaded.kind).toBe('loaded'); if (loaded.kind === 'loaded') expect(loaded.offline.newlyUnlockedAchievements).toBeUndefined(); }
    game.stop();
  });
  it('zero-duration bootstrap evaluates current conditions, while historical import preserves exact ownership', () => {
    const initial = rebirthState(), f = rebirthRuntime(initial);
    expect(owns(f.game.getSnapshot().result.state)).toEqual(['achievement:first-steps','achievement:dockside-operator']);
    const code = exportSaveCode(initial,0); if (!code.ok) throw Error('fixture'); expect(f.game.importCode(code.code)).toEqual({ok:true});
    expect(f.game.getSnapshot().result.state).toEqual(initial); expect(f.game.getSnapshot().achievementEvent).toBeUndefined();
    f.at(1); f.tick(); expect(owns(f.game.getSnapshot().result.state)).toEqual(['achievement:first-steps','achievement:dockside-operator']); f.game.stop();
  });
  it('first Rebirth unlock is inside the one durable reset write and survives reload', () => {
    const f = rebirthRuntime(); f.events.length=0; expect(f.game.rebirth().ok).toBe(true);
    const writes=f.events.filter(e=>e.type==='write'); expect(writes).toHaveLength(1); expect(owns(writes[0]!.state)).toContain('achievement:first-rebirth');
    const firstReset=f.events.findIndex(e=>e.type==='publish'&&e.state.permanentProgression.rebirthCount===1); expect(firstReset).toBeGreaterThan(f.events.findIndex(e=>e.type==='write'));
    f.game.stop(); const reload=f.make(); reload.start(); expect(owns(reload.getSnapshot().result.state)).toEqual(owns(writes[0]!.state)); reload.stop();
  });
  it('pre-Rebirth reconciliation unlock and First Rebirth are announced together', () => {
    const s = rebirthState(), f=rebirthRuntime({...s, city:{...s.city,heat:59}, automation: { businessAutoUpgradeTargetId: 'business:dockside-detail' as const,enabledIds:[],businessAutoUpgradeElapsedMs:0,unlockedIds:[D.id],starterJobElapsedMs:0}});
    f.at(50000); expect(f.game.rebirth().ok).toBe(true);
    expect(f.game.getSnapshot().achievementEvent?.ids).toEqual(['achievement:running-hot','achievement:first-rebirth']); f.game.stop();
  });
  it('failed durable Rebirth does not publish First Rebirth or reset achievements', () => {
    const f=rebirthRuntime(); const before=f.game.getSnapshot().result.state; f.fail(); expect(f.game.rebirth().ok).toBe(false);
    expect(f.game.getSnapshot().result.state).toBe(before); expect(owns(before)).not.toContain('achievement:first-rebirth'); f.game.stop();
  });
  it('all completion remains permanent with no repeated bootstrap announcement', () => {
    const s=fresh(), f=rebirthRuntime({...s,permanentProgression:{...s.permanentProgression,unlockedAchievementIds:ACHIEVEMENT_CATALOG.map(a=>a.id)}});
    expect(f.game.getSnapshot().achievementEvent).toBeUndefined(); f.at(1000); f.tick(); expect(f.game.getSnapshot().achievementEvent).toBeUndefined(); f.game.stop();
  });
});

it('successful unlock-only transition persists once; repeated evaluation saves nothing', () => {
  const f=rebirthRuntime(fresh()), imported=rebirthState(), code=exportSaveCode(imported,0);
  if(!code.ok)throw Error('fixture'); expect(f.game.importCode(code.code).ok).toBe(true); f.events.length=0;
  f.game.execute(state=>({ok:true,state}));
  const written=f.events.filter(e=>e.type==='write'); expect(written).toHaveLength(1);
  expect(owns(written[0]!.state)).toEqual(['achievement:first-steps','achievement:dockside-operator']);
  f.events.length=0; const announcement=f.game.getSnapshot().achievementEvent;
  f.game.execute(state=>({ok:true,state})); expect(f.events.filter(e=>e.type==='write')).toEqual([]);
  expect(f.game.getSnapshot().achievementEvent).toBe(announcement); f.game.stop();
});
it('ordinary save failure retains the complete live achievement and old durable state', () => {
  const s=fresh(),f=rebirthRuntime({...s,progression:{xp:90},city:{...s.city,heat:59}}),raw=f.raw();f.fail();
  f.game.execute(performStarterJob); expect(f.game.getSnapshot().persistence.kind).toBe('error');
  expect(owns(f.game.getSnapshot().result.state)).toEqual(['achievement:first-steps','achievement:running-hot']);
  expect(f.raw()).toBe(raw); f.game.stop();
});
it('failed choice retains achievements from already-completed pre-command reconciliation', () => {
  const s=fresh(),f=runtime({...s,city:{...s.city,heat:60},events:{pendingEventId:'event:warehouse-opportunity',opportunityElapsedMs:123}});
  f.at(1); f.game.execute(s=>resolveEventChoice(s,'event:warehouse-opportunity','choice:invest'));
  const current=f.game.getSnapshot();expect(current.result.ok).toBe(false);expect(owns(current.result.state)).toEqual(['achievement:running-hot']);
  expect(current.result.state.events).toEqual({pendingEventId:'event:warehouse-opportunity',opportunityElapsedMs:123});expect(current.result.state.economy.cash).toBe('0');
});
