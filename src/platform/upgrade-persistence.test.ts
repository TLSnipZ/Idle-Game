import { onlineElapsed } from './test-fixtures/online-elapsed';
import { CURRENT_SAVE_VERSION } from '../game/save-schema';
import { describe, expect, it } from 'vitest';
import { createPersistentGame } from './persistent-game';
import { createLocalSave } from './local-save';
import { createInitialGameState } from '../game/game-state';
import { serializeSave, parseSave } from '../game/save-schema';
import { validateSaveCode, encodeSaveText } from '../game/save-code';
import { moneyFromMinorUnits } from '../features/economy';
import { UPGRADE_CATALOG, PRESSURE_WASHER } from '../features/upgrades';
import { STARTER_BUSINESS } from '../features/businesses';
import { purchaseUpgrade } from '../game/purchase-upgrade';
import { simulateElapsed } from '../game/simulate-elapsed';
import { OFFLINE_CAP_MS } from '../game/offline-progress';
import type { GameState } from '../game/game-state';
function owned(level = 1): GameState {
  const initial = createInitialGameState();
  return { ...initial, economy: { cash: moneyFromMinorUnits('1000000') }, businesses: { ...initial.businesses, owned: { [STARTER_BUSINESS.id]: { level } } } };
}
function fixture(state = owned(), savedAt = 1000) {
  const encoded = serializeSave(state, savedAt); if (!encoded.ok) throw Error('fixture');
  let raw = encoded.serialized; let now = 1000; let wall = 1000; let fail = false; let writes = 0;
  let tick = () => {}; let autosave = () => {}; let activeTimers = 0;
  const storage = { getItem: () => raw, setItem: (_key: string, value: string) => { if (fail) throw Error('quota'); raw = value; writes++; } };
  const make = () => {
    let firstPublication = true;
    return createPersistentGame(view => {
    if (firstPublication && view.offline) {
      const saved = parseSave(raw); if (!saved.ok) throw Error('fixture');
      expect(view.result.state).toEqual(saved.envelope.state);
    }
    firstPublication = false;
  }, createLocalSave(() => storage, () => wall), {
    random: { next: () => 0.99 }, now: () => now, schedule: callback => { tick = callback; activeTimers++; return () => { activeTimers--; }; },
  }, callback => { autosave = callback; activeTimers++; return () => { activeTimers--; }; });
  };
  return { make, tick: () => tick(), autosave: () => autosave(), raw: () => raw, writes: () => writes,
    timers: () => activeTimers, fail: () => { fail = true; }, at: (value: number) => { now = value; }, wall: (value: number) => { wall = value; } };
}
describe('equipment runtime, persistence and offline contracts', () => {
  it('reconciles old modifiers before purchase and saves only the completed transaction', () => {
    const f = fixture(owned(4)); const game = f.make(); game.start();
    f.at(11000); f.wall(11000); game.execute(state => purchaseUpgrade(state, PRESSURE_WASHER.id));
    const state = game.getSnapshot().result.state;
    expect(state.economy.cash).toBe('753000'); // $10k + $30 old production - $2500
    expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { state, savedAt: 11000 } });
    f.at(12000); f.tick(); expect(game.getSnapshot().result.state.economy.cash).toBe('753375');
    game.stop(); expect(f.timers()).toBe(0);
  });
  it('retains earned fractions but clears old sub-ms runtime time on bonus acquisition', () => {
    const f = fixture(); const game = f.make(); game.start();
    f.at(1001.75); game.execute(state => purchaseUpgrade(state, PRESSURE_WASHER.id));
    const purchased = game.getSnapshot().result.state;
    expect(purchased.businesses.productionRemainderMilliCents).toBe(75);
    f.at(1002); f.tick(); expect(game.getSnapshot().result.state).toBe(purchased);
    f.at(1002.75); f.tick();
    expect(game.getSnapshot().result.state).toEqual(onlineElapsed(purchased, 1).state);
    game.stop();
  });
  it('failed purchase retains reconciled production and the old modifier set', () => {
    const initial = { ...owned(), economy: { cash: moneyFromMinorUnits('0') } };
    const f = fixture(initial); const game = f.make(); game.start();
    f.at(11000); game.execute(state => purchaseUpgrade(state, PRESSURE_WASHER.id));
    expect(game.getSnapshot().result).toMatchObject({ ok: false, error: 'insufficient-funds' });
    expect(game.getSnapshot().result.state).toEqual(onlineElapsed(initial, 10000).state);
    f.at(12000); f.tick(); expect(game.getSnapshot().result.state).toEqual(onlineElapsed(initial, 11000).state); game.stop();
  });
  it('autosave, export and reload retain equipment and exact fraction without per-tick writes', () => {
    const initial = purchaseUpgrade(owned(), PRESSURE_WASHER.id).state;
    const f = fixture(initial); const game = f.make(); game.start(); const baselineWrites = f.writes();
    f.at(1001); f.wall(1001); f.tick(); expect(f.writes()).toBe(baselineWrites);
    f.autosave(); expect(f.writes()).toBe(baselineWrites + 1);
    const snapshot = game.getSnapshot().result.state;
    const code = game.exportCode(); if (!code.ok) throw Error('fixture');
    expect(validateSaveCode(code.code)).toMatchObject({ ok: true, envelope: { state: snapshot, savedAt: 1001 } });
    game.stop(); const reload = f.make(); reload.start();
    expect(reload.getSnapshot().result.state).toEqual(snapshot);
    expect(reload.getSnapshot().offline?.incomeEarned).toBe('0'); reload.stop();
  });
  it('offline equipped level-7 catch-up uses shared simulation, caps eight hours, consumes once', () => {
    const initial = purchaseUpgrade(owned(7), PRESSURE_WASHER.id).state;
    const f = fixture(initial); f.wall(Number.MAX_SAFE_INTEGER);
    const game = f.make(); game.start();
    expect(game.getSnapshot().result.state).toEqual(simulateElapsed(initial, OFFLINE_CAP_MS).state);
    expect(game.getSnapshot().offline).toMatchObject({ capped: true, rewardedElapsedMs: 28800000, incomeEarned: '18900000' });
    const after = game.getSnapshot().result.state;
    game.stop(); game.start(); expect(f.timers()).toBe(2); f.autosave(); expect(game.getSnapshot().result.state).toEqual(after);
    game.stop(); const reload = f.make(); reload.start(); expect(reload.getSnapshot().result.state).toEqual(after);
    expect(reload.getSnapshot().offline?.incomeEarned).toBe('0'); reload.stop();
  });
  it('future timestamps award zero and safely rebase upgraded state', () => {
    const initial = purchaseUpgrade(owned(), PRESSURE_WASHER.id).state;
    const f = fixture(initial, 2000); const game = f.make(); game.start();
    expect(game.getSnapshot().offline).toMatchObject({ clockAnomaly: true, incomeEarned: '0' });
    expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { savedAt: 1000, state: initial } }); game.stop();
  });
  it.each(['storage', 'overflow'])('preserves old durable state and pauses on offline %s failure', failure => {
    const bought = purchaseUpgrade(owned(), PRESSURE_WASHER.id).state;
    const state = failure === 'overflow' ? { ...bought, economy: { cash: moneyFromMinorUnits('9'.repeat(100)) } } : bought;
    const f = fixture(state); const raw = f.raw(); f.wall(2000); if (failure === 'storage') f.fail();
    const game = f.make(); game.start();
    expect(game.getSnapshot().result.state).toEqual(state); expect(game.getSnapshot().persistence.kind).toBe('offline-error');
    expect(f.raw()).toBe(raw); expect(f.timers()).toBe(0); expect(game.getSnapshot().offline).toBeNull();
  });
  it('imports old v2 code without historical rewards; next reload uses import timestamp', () => {
    const code = encodeSaveText(JSON.stringify({ format: 'crime-empire-save', version: 2, savedAt: 1,
      state: { economy: { cash: '12345' }, businesses: { owned: { [STARTER_BUSINESS.id]: { level: 7 } }, productionRemainderMilliCents: 975 } } }));
    const f = fixture(); const game = f.make(); game.start(); f.wall(10000);
    expect(game.importCode(code)).toEqual({ ok: true });
    const imported = game.getSnapshot().result.state;
    expect(imported.economy.cash).toBe('12345'); expect(imported.upgrades.purchasedIds).toEqual([]);
    game.stop(); f.wall(11000); const reload = f.make(); reload.start();
    expect(reload.getSnapshot().result.state).toEqual(simulateElapsed(imported, 1000).state); reload.stop();
  });
  it('imports equipment with no historical reward and preserves old state/save on failed write', () => {
    const candidate = purchaseUpgrade(owned(7), PRESSURE_WASHER.id).state;
    const encoded = serializeSave(candidate, 1); if (!encoded.ok) throw Error('fixture');
    const code = encodeSaveText(encoded.serialized);
    const f = fixture(); const game = f.make(); game.start();
    expect(game.importCode(code)).toEqual({ ok: true }); expect(game.getSnapshot().result.state).toEqual(candidate);
    f.at(1001); f.wall(1001); f.autosave(); const before = game.getSnapshot().result.state; const raw = f.raw();
    f.fail(); expect(game.importCode(code).ok).toBe(false);
    expect(game.getSnapshot().result.state).toBe(before); expect(f.raw()).toBe(raw); game.stop();
  });
});

it('local v2 bootstrap preserves the old timestamp for catch-up before durably writing the current schema', () => {
  let raw = JSON.stringify({ format: 'crime-empire-save', version: 2, savedAt: 1000,
    state: { economy: { cash: '0' }, businesses: { owned: { [STARTER_BUSINESS.id]: { level: 7 } }, productionRemainderMilliCents: 975 } } });
  const save = createLocalSave(() => ({ getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; } }), () => 2000);
  const result = save.bootstrap();
  expect(result).toMatchObject({ kind: 'loaded', state: { economy: { cash: '525' }, upgrades: { purchasedIds: [] }, businesses: { productionRemainderMilliCents: 975 } } });
  expect(parseSave(raw)).toMatchObject({ ok: true, envelope: { version: CURRENT_SAVE_VERSION, savedAt: 2000 } });
  expect(save.bootstrap()).toMatchObject({ kind: 'loaded', offline: { incomeEarned: '0' } });
});

function fullyEquipped(): GameState {
  return { ...owned(4), upgrades: { purchasedIds: UPGRADE_CATALOG.map(u => u.id) } };
}
it('reconciles before every catalog purchase using the previous modifier set', () => {
  const initial = { ...owned(5), progression: { xp: 1600 }, economy: { cash: moneyFromMinorUnits('100000000') } };
  const f = fixture(initial); const game = f.make(); game.start();
  let expected: GameState = initial;
  UPGRADE_CATALOG.forEach((upgrade, index) => {
    f.at(1000 + (index + 1) * 1001); f.wall(1000 + (index + 1) * 1001);
    expected = purchaseUpgrade(onlineElapsed(expected, 1001).state, upgrade.id).state;
    game.execute(state => purchaseUpgrade(state, upgrade.id));
    expect(game.getSnapshot().result.state).toEqual(expected);
    expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { state: expected } });
  });
  game.stop();
});
it('all modifiers survive autosave, export/import and offline cap with one-time consumption', () => {
  const initial = fullyEquipped(); const f = fixture(initial); f.wall(1000 + OFFLINE_CAP_MS + 1);
  const game = f.make(); game.start();
  expect(game.getSnapshot().result.state).toEqual(simulateElapsed(initial, OFFLINE_CAP_MS).state);
  expect(game.getSnapshot().offline).toMatchObject({ capped: true, incomeEarned: '17820000' });
  f.at(1001); f.tick(); f.autosave(); const current = game.getSnapshot().result.state;
  const code = game.exportCode(); if (!code.ok) throw Error('fixture');
  expect(game.importCode(code.code)).toEqual({ ok: true });
  expect(game.getSnapshot().result.state).toEqual(current);
  game.stop(); const reload = f.make(); reload.start();
  expect(reload.getSnapshot().result.state).toEqual(current);
  expect(reload.getSnapshot().offline?.incomeEarned).toBe('0'); reload.stop();
});
it('all-modifier future timestamp rebases without income and failed write never publishes', () => {
  const state = fullyEquipped(); const future = fixture(state, 2000); const game = future.make(); game.start();
  expect(game.getSnapshot().offline).toMatchObject({ clockAnomaly: true, incomeEarned: '0' }); game.stop();
  const f = fixture(state); const raw = f.raw(); f.wall(2000); f.fail(); const failed = f.make(); failed.start();
  expect(failed.getSnapshot().result.state).toEqual(state); expect(f.raw()).toBe(raw); expect(f.timers()).toBe(0);
});
