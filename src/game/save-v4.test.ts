import { stringifySaveFixture } from './test-fixtures/save-text';
import { createInitialStatistics } from '../features/statistics';
import { describe, expect, it } from 'vitest';
import { DELIVERY_DISPATCHER as D } from '../features/automation';
import { UPGRADE_CATALOG } from '../features/upgrades';
import { STARTER_BUSINESS } from '../features/businesses';
import { CURRENT_SAVE_VERSION, parseSave, serializeSave, validateSaveState } from './save-schema';
import { encodeSaveText, exportSaveCode, validateSaveCode } from './save-code';

const old = () => ({ format: 'crime-empire-save', version: 3, savedAt: 123456789,
  state: { economy: { cash: '900719925474099312345' },
    businesses: { owned: { [STARTER_BUSINESS.id]: { level: 7 } }, productionRemainderMilliCents: 975,
      productionRemainderSubMilliCents: { numerator: '1', denominator: '3' } },
    upgrades: { purchasedIds: UPGRADE_CATALOG.map(u => u.id) } } });
function current() {
  const loaded = parseSave(stringifySaveFixture(old())); if (!loaded.ok) throw Error('fixture');
  return { ...loaded.envelope.state, automation: { businessAutoUpgradeTargetId: 'business:dockside-detail' as const, enabledIds: [], businessAutoUpgradeElapsedMs: 0, unlockedIds: [D.id], starterJobElapsedMs: 4321 } };
}
describe('v4 delegation saves', () => {
  it('migrates realistic v3 with all upgrades preserving every previous field and timestamp', () => {
    const original = old(); const text = stringifySaveFixture(original); const result = parseSave(text);
    expect(CURRENT_SAVE_VERSION).toBe(17);
    expect(result).toEqual({ ok: true, envelope: { ...original, version: CURRENT_SAVE_VERSION,
      state: { ...original.state, events: { opportunityElapsedMs: 0, pendingEventId: null }, crew: { recruitedIds: [], assignments: { operations: null, logistics: null } }, city: { heat: 0, heatDecayElapsedMs: 0, ownedTerritoryIds: ['territory:waterfront'] }, permanentProgression: { statistics: createInitialStatistics(0), unlockedAchievementIds: [], skills: {}, empirePoints: 0, rebirthCount: 0 }, garage: { ownedVehicleIds: [] }, progression: { xp: 0 }, automation: { businessAutoUpgradeTargetId: 'business:dockside-detail' as const, enabledIds: [], businessAutoUpgradeElapsedMs: 0, unlockedIds: [], starterJobElapsedMs: 0 } } } });
    expect(stringifySaveFixture(original)).toBe(text);
    expect(validateSaveCode(encodeSaveText(text))).toEqual(result);
  });
  it('roundtrips v4 progress/ownership with fresh metadata and unchanged CE1 transport', () => {
    const state = current(); const encoded = serializeSave(state, 42); if (!encoded.ok) throw Error('fixture');
    expect(parseSave(encoded.serialized)).toEqual({ ok: true, envelope: { format: 'crime-empire-save', version: CURRENT_SAVE_VERSION, savedAt: 42, state } });
    const code = exportSaveCode(state, 42); if (!code.ok) throw Error('fixture');
    expect(code.code.startsWith('CE1-')).toBe(true); expect(validateSaveCode(code.code)).toEqual(parseSave(encoded.serialized));
    expect(encoded.serialized).not.toMatch(/automationEvent|completedJobs|baseline|runtimeError/);
  });
  it.each([-1, 10000, .5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '5', null])('rejects malformed progress %#', starterJobElapsedMs => {
    const state = current(); expect(validateSaveState({ ...state, automation: { ...state.automation, starterJobElapsedMs } })).toBeNull();
  });
  it.each([['automation:unknown'], [D.id, D.id], [null], null, 'ids'])('rejects malformed IDs %#', unlockedIds => {
    expect(validateSaveState({ ...current(), automation: { ...current().automation, unlockedIds, starterJobElapsedMs: 0 } })).toBeNull();
  });
  it('rejects locked progress/missing/extra data but allows grandfathered ownership', () => {
    const state = current();
    for (const automation of [{ ...state.automation, unlockedIds: [], starterJobElapsedMs: 1 }, {}, { unlockedIds: [] }, { ...state.automation, count: 1 }])
      expect(validateSaveState({ ...state, automation })).toBeNull();
    expect(validateSaveState({ ...state, upgrades: { purchasedIds: [] }, businesses: { ...state.businesses, owned: {} } })).not.toBeNull();
    const { automation: _automation, ...missing } = state; expect(validateSaveState(missing)).toBeNull();
  });
  it('rejects custom prototypes and accessors without invoking them', () => {
    const state = current(); const automation = { ...state.automation };
    Object.defineProperty(automation, 'unlockedIds', { get: () => { throw Error('must not read'); } });
    expect(validateSaveState({ ...state, automation })).toBeNull();
    expect(validateSaveState({ ...state, automation: Object.create(state.automation) })).toBeNull();
  });
  it('does not reinterpret malformed v3 or accept a future schema', () => {
    expect(parseSave(stringifySaveFixture({ ...old(), state: current() }))).toEqual({ ok: false, error: 'invalid-state' });
    const previous = old();
    expect(parseSave(stringifySaveFixture({ ...previous, state: { ...previous.state, economy: { cash: '01' } } })).ok).toBe(false);
    expect(parseSave(stringifySaveFixture({ ...previous, version: CURRENT_SAVE_VERSION + 1 }))).toEqual({ ok: false, error: 'unsupported-version' });
  });
});
