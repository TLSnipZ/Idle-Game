import { stringifySaveFixture } from './test-fixtures/save-text';
import { createInitialStatistics } from '../features/statistics';
import { describe, expect, it } from 'vitest';
import { parseSave, serializeSave, validateSaveState, CURRENT_SAVE_VERSION } from './save-schema';
import { encodeSaveText, validateSaveCode, exportSaveCode } from './save-code';
import { PRESSURE_WASHER } from '../features/upgrades';
import { rational, ZERO_RATIONAL } from '../shared/rational';
import { createInitialGameState } from './game-state';
const id = 'business:dockside-detail';
const legacy = () => ({ format: 'crime-empire-save', version: 2, savedAt: 123456789,
  state: { economy: { cash: '900719925474099312345' }, businesses: { owned: { [id]: { level: 7 } }, productionRemainderMilliCents: 975 } } });
function current() {
  const result = parseSave(stringifySaveFixture(legacy()));
  if (!result.ok) throw Error('fixture');
  return { ...result.envelope.state, upgrades: { purchasedIds: [PRESSURE_WASHER.id] },
    businesses: { ...result.envelope.state.businesses, productionRemainderSubMilliCents: rational(1n, 3n) } };
}
describe('v3 upgrade and precision schema', () => {
  it('migrates realistic v2 saves preserving level, cash, milli-cents and savedAt', () => {
    const old = legacy(); const before = stringifySaveFixture(old);
    const result = parseSave(before);
    expect(result).toEqual({ ok: true, envelope: { ...old, version: CURRENT_SAVE_VERSION, state: {
      ...old.state, events: { opportunityElapsedMs: 0, pendingEventId: null }, crew: { recruitedIds: [], assignments: { operations: null, logistics: null } }, city: { heat: 0, heatDecayElapsedMs: 0, ownedTerritoryIds: ['territory:waterfront'] }, permanentProgression: { statistics: createInitialStatistics(0), unlockedAchievementIds: [], skills: {}, empirePoints: 0, rebirthCount: 0 }, garage: { ownedVehicleIds: [] }, progression: { xp: 0 }, automation: { enabledIds: [], businessAutoUpgradeElapsedMs: 0, unlockedIds: [], starterJobElapsedMs: 0 }, upgrades: { purchasedIds: [] }, businesses: { ...old.state.businesses, productionRemainderSubMilliCents: ZERO_RATIONAL },
    } } });
    expect(stringifySaveFixture(old)).toBe(before);
    expect(validateSaveCode(encodeSaveText(before))).toEqual(result);
  });
  it('round trips purchased equipment and both fractional components through storage and CE1', () => {
    const state = current();
    const result = serializeSave(state, 999); if (!result.ok) throw Error('fixture');
    expect(parseSave(result.serialized)).toEqual({ ok: true, envelope: { format: 'crime-empire-save', version: CURRENT_SAVE_VERSION, savedAt: 999, state } });
    const code = exportSaveCode(state, 999); if (!code.ok) throw Error('fixture');
    expect(code.code.startsWith('CE1-')).toBe(true);
    expect(validateSaveCode(code.code)).toEqual(parseSave(result.serialized));
  });
  it.each([['upgrade:unknown'], [PRESSURE_WASHER.id, PRESSURE_WASHER.id], [null], null, 'ids'])('rejects invalid purchased IDs %#', purchasedIds => {
    expect(validateSaveState({ ...current(), upgrades: { purchasedIds } })).toBeNull();
  });
  it('accepts owned equipment without acquisition requirements; rejects missing/extra state', () => {
    expect(validateSaveState({ ...createInitialGameState(), upgrades: { purchasedIds: [PRESSURE_WASHER.id] } })).not.toBeNull();
    const { upgrades: _upgrades, ...missing } = current();
    expect(validateSaveState(missing)).toBeNull();
    expect(validateSaveState({ ...current(), modifiers: [] })).toBeNull();
  });
  it.each([
    { numerator: '1', denominator: '0' }, { numerator: '-1', denominator: '2' },
    { numerator: '01', denominator: '2' }, { numerator: '2', denominator: '4' },
    { numerator: '0', denominator: '2' }, { numerator: '1', denominator: '1' },
    { numerator: 1, denominator: '2' }, { numerator: '1', denominator: '9'.repeat(257) }, null,
  ])('rejects malformed/noncanonical/out-of-range sub-milli-cent fraction %#', productionRemainderSubMilliCents => {
    const state = current();
    expect(validateSaveState({ ...state, businesses: { ...state.businesses, productionRemainderSubMilliCents } })).toBeNull();
  });
  it('rejects rational accessors and custom prototypes without executing getters', () => {
    const fraction = { numerator: '1', denominator: '2' };
    Object.defineProperty(fraction, 'numerator', { get() { throw Error('do not execute'); } });
    const state = current();
    expect(validateSaveState({ ...state, businesses: { ...state.businesses, productionRemainderSubMilliCents: fraction } })).toBeNull();
    expect(validateSaveState({ ...state, businesses: { ...state.businesses, productionRemainderSubMilliCents: Object.create(rational(1n, 2n)) } })).toBeNull();
  });
  it.each([0, 101, 1.5, '7'])('rejects invalid v2 levels during migration %#', level => {
    const old = legacy();
    expect(parseSave(stringifySaveFixture({ ...old, state: { ...old.state, businesses: { ...old.state.businesses, owned: { [id]: { level } } } } })).ok).toBe(false);
  });
  it('rejects corrupt v2 cash, remainder, extras and future versions', () => {
    const old = legacy();
    expect(parseSave(stringifySaveFixture({ ...old, state: { ...old.state, economy: { cash: '01' } } })).ok).toBe(false);
    expect(parseSave(stringifySaveFixture({ ...old, state: { ...old.state, businesses: { ...old.state.businesses, productionRemainderMilliCents: 1000 } } })).ok).toBe(false);
    expect(parseSave(stringifySaveFixture({ ...old, state: { ...old.state, automation: { enabledIds: [], businessAutoUpgradeElapsedMs: 0, unlockedIds: [], starterJobElapsedMs: 0 }, upgrades: { purchasedIds: [] } } })).ok).toBe(false);
    expect(parseSave(stringifySaveFixture({ ...old, version: CURRENT_SAVE_VERSION + 1 }))).toEqual({ ok: false, error: 'unsupported-version' });
  });
});
