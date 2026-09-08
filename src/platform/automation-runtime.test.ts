import { describe, expect, it } from 'vitest';
import { createPersistentGame } from './persistent-game';
import { createLocalSave } from './local-save';
import { createInitialGameState } from '../game/game-state';
import type { GameState } from '../game/game-state';
import { DELIVERY_DISPATCHER as D } from '../features/automation';
import { STARTER_BUSINESS } from '../features/businesses';
import { EXPRESS_TIPS, STREET_CONNECTIONS } from '../features/upgrades';
import { moneyFromMinorUnits } from '../features/economy';
import { upgradeBusiness } from '../game/upgrade-business';
import { purchaseAutomation } from '../game/purchase-automation';
import { purchaseUpgrade } from '../game/purchase-upgrade';
import { performStarterJob } from '../game/perform-starter-job';
import { simulateGameElapsed } from '../game/simulate-game-elapsed';
import { serializeSave, parseSave } from '../game/save-schema';
import { encodeSaveText, validateSaveCode } from '../game/save-code';
import { OFFLINE_CAP_MS } from '../game/offline-progress';
function owned(unlocked = true, progress = 0): GameState {
  const state = createInitialGameState();
  return { ...state, economy: { cash: moneyFromMinorUnits('10000000') },
    businesses: { ...state.businesses, owned: { [STARTER_BUSINESS.id]: { level: 4 } } },
    automation: { unlockedIds: unlocked ? [D.id] : [], starterJobElapsedMs: progress } };
}
function encode(state: GameState, savedAt = 1000) {
  const result = serializeSave(state, savedAt); if (!result.ok) throw Error('fixture'); return result.serialized;
}
function fixture(state = owned(), savedAt = 1000) {
  let raw = encode(state, savedAt); let now = 1000; let wall = 1000; let fail = false; let writes = 0;
  let tick = () => {}; let autosave = () => {}; let timers = 0;
  const make = () => createPersistentGame(view => {
    // Bootstrap publishes its candidate only after durable storage matches it.
    if (view.offline && view.persistence.kind === 'loaded') {
      const saved = parseSave(raw); if (!saved.ok) throw Error('fixture');
      expect(view.result.state).toEqual(saved.envelope.state);
    }
  }, createLocalSave(() => ({ getItem: () => raw, setItem: (_key: string, value: string) => {
    if (fail) throw Error('quota'); raw = value; writes++;
  } }), () => wall), { now: () => now, schedule: callback => { tick = callback; timers++; return () => { timers--; }; } },
  callback => { autosave = callback; timers++; return () => { timers--; }; });
  return { make, raw: () => raw, writes: () => writes, timers: () => timers, tick: () => tick(), autosave: () => autosave(),
    at: (n: number) => { now = n; }, wall: (n: number) => { wall = n; }, fail: () => { fail = true; } };
}
describe('delegation runtime transactions', () => {
  it('purchase begins at zero after nine seconds; first subsequent second counts only once', () => {
    const f = fixture({ ...owned(false), progression: { xp: 400 } }); const game = f.make(); game.start(); game.dismissOffline();
    f.at(10000); game.execute(state => purchaseAutomation(state, D.id));
    expect(game.getSnapshot().result.state.automation.starterJobElapsedMs).toBe(0);
    const bought = game.getSnapshot().result.state;
    f.at(11000); f.tick(); expect(game.getSnapshot().result.state).toEqual(simulateGameElapsed(bought, 1000).state);
    expect(game.getSnapshot().automationEvent).toBeUndefined(); game.stop(); expect(f.timers()).toBe(0);
  });
  it('discards pre-purchase sub-ms time without resetting any earned business remainder', () => {
    const f = fixture({ ...owned(false), progression: { xp: 400 } }); const game = f.make(); game.start(); game.dismissOffline();
    f.at(10000.75); game.execute(state => purchaseAutomation(state, D.id)); const bought = game.getSnapshot().result.state;
    f.at(10001); f.tick(); expect(game.getSnapshot().result.state).toBe(bought);
    f.at(10001.75); f.tick(); expect(game.getSnapshot().result.state).toEqual(simulateGameElapsed(bought, 1).state); game.stop();
  });
  it.each([STREET_CONNECTIONS, EXPRESS_TIPS])('reconciles completed jobs at old reward before $name', upgrade => {
    const f = fixture({ ...owned(), progression: { xp: 100 } }); const game = f.make(); game.start(); game.dismissOffline();
    f.at(26000); game.execute(state => purchaseUpgrade(state, upgrade.id));
    expect(game.getSnapshot().automationEvent).toMatchObject({ completedJobs: 2, income: '5000' });
    const bought = game.getSnapshot().result.state;
    expect(bought.automation.starterJobElapsedMs).toBe(5000);
    expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { state: bought } });
    f.at(31000); f.tick(); expect(game.getSnapshot().automationEvent).toMatchObject({ completedJobs: 1, income: '3000' });
    expect(game.getSnapshot().result.state).toEqual(simulateGameElapsed(bought, 5000).state); game.stop();
  });
  it('manual job at the command boundary preserves reconciled cycle progress', () => {
    const f = fixture(); const game = f.make(); game.start(); game.dismissOffline();
    f.at(5321); game.execute(performStarterJob);
    const state = game.getSnapshot().result.state;
    expect(state.automation.starterJobElapsedMs).toBe(4321);
    game.execute(performStarterJob); expect(game.getSnapshot().result.state.automation).toBe(state.automation); game.stop();
  });
  it('batches delayed callbacks and exports/autosaves current progress without per-tick writes', () => {
    const f = fixture(); const game = f.make(); game.start(); game.dismissOffline(); const writes = f.writes();
    f.at(26001); f.wall(26001); f.tick();
    expect(game.getSnapshot().automationEvent).toMatchObject({ completedJobs: 2, income: '5000' });
    expect(f.writes()).toBe(writes);
    f.autosave(); expect(f.writes()).toBe(writes + 1);
    const current = game.getSnapshot().result.state; const code = game.exportCode(); if (!code.ok) throw Error('fixture');
    expect(validateSaveCode(code.code)).toMatchObject({ ok: true, envelope: { version: 8, savedAt: 26001, state: current } });
    game.stop(); const reload = f.make(); reload.start(); expect(reload.getSnapshot().result.state).toEqual(current);
    expect(reload.getSnapshot().offline?.automation?.completedJobs).toBe(0); reload.stop();
  });
  it('offline cap and Strict Mode-style restart consume the interval once', () => {
    const initial = owned(true, 5000); const f = fixture(initial); f.wall(1000 + 12 * 3600000);
    const game = f.make(); game.start(); const expected = simulateGameElapsed(initial, OFFLINE_CAP_MS).state;
    expect(game.getSnapshot().result.state).toEqual(expected);
    expect(game.getSnapshot().offline?.automation?.completedJobs).toBe(2880);
    game.stop(); game.start(); expect(f.timers()).toBe(2); f.autosave(); expect(game.getSnapshot().result.state).toEqual(expected);
    game.stop(); const reload = f.make(); reload.start(); expect(reload.getSnapshot().result.state).toEqual(expected);
    expect(reload.getSnapshot().offline?.incomeEarned).toBe('0'); reload.stop();
  });
  it('future timestamps rebase with zero jobs and preserved progress', () => {
    const initial = owned(true, 9999); const f = fixture(initial, 2000); const game = f.make(); game.start();
    expect(game.getSnapshot().result.state).toEqual(initial);
    expect(game.getSnapshot().offline).toMatchObject({ clockAnomaly: true, automation: { completedJobs: 0 } });
    expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { savedAt: 1000 } }); game.stop();
  });
  it.each(['storage', 'overflow'])('offline %s failure preserves old durable state and stops all loops', reason => {
    const state = reason === 'overflow' ? { ...owned(true, 9999), economy: { cash: moneyFromMinorUnits(String(BigInt('9'.repeat(100)) - 1n)) } } : owned();
    const f = fixture(state); const raw = f.raw(); f.wall(1001); if (reason === 'storage') f.fail();
    const game = f.make(); game.start(); expect(game.getSnapshot().result.state).toEqual(state);
    expect(game.getSnapshot().persistence.kind).toBe('offline-error'); expect(f.raw()).toBe(raw); expect(f.timers()).toBe(0);
  });
  it('import preserves progress, ignores historical jobs and rebases future offline time', () => {
    const candidate = owned(true, 5000); const code = encodeSaveText(encode(candidate, 1));
    const f = fixture(); const game = f.make(); game.start(); f.wall(1000000);
    expect(game.importCode(code)).toEqual({ ok: true }); expect(game.getSnapshot().result.state).toEqual(candidate);
    expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { savedAt: 1000000, state: candidate } });
    game.stop(); f.wall(1005000); const reload = f.make(); reload.start();
    expect(reload.getSnapshot().result.state).toEqual(simulateGameElapsed(candidate, 5000).state); reload.stop();
  });
  it('failed import does not replace state, save or progress', () => {
    const f = fixture(owned(true, 4321)); const game = f.make(); game.start(); const before = game.getSnapshot().result.state; const raw = f.raw();
    f.fail(); expect(game.importCode(encodeSaveText(encode(owned(), 1))).ok).toBe(false);
    expect(game.getSnapshot().result.state).toBe(before); expect(f.raw()).toBe(raw); game.stop();
  });
});

it('live automation overflow suspends before publication or autosaving partial business cash', () => {
  const state = { ...owned(true, 9999), economy: { cash: moneyFromMinorUnits(String(BigInt('9'.repeat(100)) - 1n)) } };
  const f = fixture(state); const game = f.make(); game.start(); const original = game.getSnapshot().result.state;
  const raw = f.raw(); f.at(1001); f.tick();
  expect(game.getSnapshot().runtimeError).toBe('overflow'); expect(game.getSnapshot().result.state).toBe(original);
  f.autosave(); f.tick(); expect(f.raw()).toBe(raw); expect(game.getSnapshot().result.state).toBe(original); game.stop();
});
it('v3 local bootstrap keeps its original offline timestamp while migrating dispatcher locked', () => {
  const { permanentProgression: _permanent, garage: _garage, automation: _automation, progression: _progression, ...legacy } = owned(false);
  let raw = JSON.stringify({ format: 'crime-empire-save', version: 3, savedAt: 1000, state: legacy });
  const save = createLocalSave(() => ({ getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; } }), () => 26000);
  const result = save.bootstrap();
  expect(result).toMatchObject({ kind: 'loaded', state: { automation: { unlockedIds: [], starterJobElapsedMs: 0 } } });
  if (result.kind !== 'loaded') throw Error('fixture');
  expect(result.state).toEqual(simulateGameElapsed(owned(false), 25000).state);
  expect(parseSave(raw)).toMatchObject({ ok: true, envelope: { version: 8, savedAt: 26000, state: result.state } });
  expect(save.bootstrap()).toMatchObject({ kind: 'loaded', offline: { incomeEarned: '0' } });
});

describe('persistent XP transactions', () => {
  it('reconciles dispatcher XP before manual XP and saves only the completed command', () => {
    const f = fixture({ ...owned(), progression: { xp: 85 } }); const game = f.make(); game.start(); game.dismissOffline();
    f.at(21000); f.wall(21000); game.execute(performStarterJob);
    const state = game.getSnapshot().result.state;
    expect(state.progression.xp).toBe(105);
    expect(game.getSnapshot().automationEvent).toMatchObject({ completedJobs: 2, xpEarned: 10 });
    expect(game.getSnapshot().levelEvent).toMatchObject({ fromLevel: 1, toLevel: 2 });
    expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { state } });
    const code = game.exportCode(); if (!code.ok) throw Error('fixture');
    expect(validateSaveCode(code.code)).toMatchObject({ ok: true, envelope: { state } });
    game.stop(); const reload = f.make(); reload.start();
    expect(reload.getSnapshot().result.state).toEqual(state); reload.stop();
  });
  it('aggregates multiple online levels and autosaves exact XP without repeating the event', () => {
    const f = fixture(); const game = f.make(); game.start(); game.dismissOffline(); const writes = f.writes();
    f.at(1801000); f.wall(1801000); f.tick();
    expect(game.getSnapshot().result.state.progression.xp).toBe(900);
    expect(game.getSnapshot().levelEvent).toMatchObject({ fromLevel: 1, toLevel: 4, sequence: 1 });
    expect(f.writes()).toBe(writes);
    f.autosave(); f.tick();
    expect(game.getSnapshot().levelEvent?.sequence).toBe(1);
    expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { state: { progression: { xp: 900 } } } });
    game.stop();
  });
  it('XP overflow pauses shared reconciliation before publishing money or saving a candidate', () => {
    const state = { ...owned(), progression: { xp: Number.MAX_SAFE_INTEGER } };
    const f = fixture(state); const game = f.make(); game.start(); game.dismissOffline();
    const original = game.getSnapshot().result.state; const raw = f.raw();
    f.at(11000); f.tick();
    expect(game.getSnapshot().runtimeError).toBe('xp-overflow');
    expect(game.getSnapshot().result.state).toBe(original);
    f.autosave(); expect(f.raw()).toBe(raw); game.stop();
  });
  it.each(['write','xp'])('offline %s failure preserves XP and the old save', reason => {
    const state = { ...owned(), progression: { xp: reason === 'xp' ? Number.MAX_SAFE_INTEGER : 99 } };
    const f = fixture(state); const raw = f.raw(); f.wall(11000); if (reason === 'write') f.fail();
    const game = f.make(); game.start();
    expect(game.getSnapshot().result.state).toEqual(state); expect(f.raw()).toBe(raw);
    expect(game.getSnapshot().persistence.kind).toBe('offline-error'); expect(f.timers()).toBe(0);
  });
  it('consumes capped offline XP once across restarts, autosave and reload', () => {
    const f = fixture(); f.wall(1000+12*3600000);
    const game = f.make(); game.start();
    expect(game.getSnapshot().offline).toMatchObject({ xpEarned: 14400, levelIncrease: { fromLevel: 1, toLevel: 13 } });
    game.dismissOffline(); game.stop(); game.start(); f.autosave(); game.stop();
    const reload = f.make(); reload.start();
    expect(reload.getSnapshot().result.state.progression.xp).toBe(14400);
    expect(reload.getSnapshot().offline?.xpEarned).toBe(0); reload.stop();
  });
  it('import preserves XP without historical awards; new offline timing begins at import', () => {
    const candidate = { ...owned(true,5000), progression: { xp: 395 } };
    const f = fixture(); const game = f.make(); game.start(); game.dismissOffline(); f.wall(1000000);
    expect(game.importCode(encodeSaveText(encode(candidate,1))).ok).toBe(true);
    expect(game.getSnapshot().result.state).toEqual(candidate);
    expect(game.getSnapshot().levelEvent).toBeUndefined();
    game.stop(); f.wall(1005000); const reload = f.make(); reload.start();
    expect(reload.getSnapshot().result.state.progression.xp).toBe(400);
    expect(reload.getSnapshot().offline).toMatchObject({ xpEarned: 5, levelIncrease: { fromLevel: 2, toLevel: 3 } });
    reload.stop();
  });
});

it('business level boundary reconciles old production/dispatcher XP then adds 25 XP', () => {
  const initial = owned(); const f = fixture(initial); const game = f.make(); game.start(); game.dismissOffline();
  f.at(11000); game.execute(state => upgradeBusiness(state, STARTER_BUSINESS.id));
  const expected = upgradeBusiness(simulateGameElapsed(initial,10000).state,STARTER_BUSINESS.id);
  expect(game.getSnapshot().result).toEqual(expected);
  expect(expected.state.progression.xp).toBe(30);
  f.at(21000); f.tick();
  expect(game.getSnapshot().result.state).toEqual(simulateGameElapsed(expected.state,10000).state); game.stop();
});
it('job-modifier purchase changes money only after reconciling the old reward and XP', () => {
  const f = fixture({ ...owned(), progression: { xp: 100 } }); const game = f.make(); game.start(); game.dismissOffline();
  f.at(11000); game.execute(state => purchaseUpgrade(state, STREET_CONNECTIONS.id));
  expect(game.getSnapshot().automationEvent).toMatchObject({ income: '2500', xpEarned: 5 });
  expect(game.getSnapshot().result.state.progression.xp).toBe(105);
  f.at(21000); f.tick();
  expect(game.getSnapshot().automationEvent).toMatchObject({ income: '3000', xpEarned: 5 });
  expect(game.getSnapshot().result.state.progression.xp).toBe(110); game.stop();
});
it('v4 migration preserves its timestamp and awards only credited dispatcher XP before durable publication', () => {
  const { permanentProgression: _permanent, garage: _garage, progression: _progression, ...legacy } = owned(true,5000);
  let raw = JSON.stringify({ format: 'crime-empire-save', version: 4, savedAt: 1000, state: legacy });
  const save = createLocalSave(() => ({ getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; } }), () => 26000);
  expect(save.bootstrap()).toMatchObject({ kind: 'loaded', state: { progression: { xp: 15 } }, offline: { xpEarned: 15 } });
  expect(parseSave(raw)).toMatchObject({ ok: true, envelope: { version: 8, savedAt: 26000, state: { progression: { xp: 15 } } } });
  expect(save.bootstrap()).toMatchObject({ kind: 'loaded', offline: { xpEarned: 0 } });
});
