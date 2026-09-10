import { stringifySaveFixture } from './test-fixtures/save-text';
import { describe, expect, it } from 'vitest';
import { createInitialStatistics, isStatisticsState, CUMULATIVE_STATISTICS } from '../features/statistics';
import { createInitialGameState } from './game-state';
import { rebirthState } from './test-fixtures/rebirth-state';
import { crewState } from './test-fixtures/crew-state';
import { ACHIEVEMENT_CATALOG } from '../features/achievements';
import { CURRENT_SAVE_VERSION, parseSave, validateSaveState } from './save-schema';
import { exportSaveCode, validateSaveCode, encodeSaveText } from './save-code';
import { performRebirth } from './rebirth';
const envelope = (state: unknown, version = CURRENT_SAVE_VERSION) => ({ format: 'crime-empire-save', version, savedAt: 123456789, state });
function rich() {
  const s = rebirthState(37, 48), c = crewState({ operations: 'crew:mara-knox', logistics: 'crew:jax-mercer' });
  return { ...s, crew: c.crew, city: { ...c.city, heat: 90, heatDecayElapsedMs: 50000 },
    events: { pendingEventId: 'event:shakedown' as const, opportunityElapsedMs: 123456 },
    permanentProgression: { ...s.permanentProgression, empirePoints: 17, rebirthCount: 4,
      unlockedAchievementIds: ACHIEVEMENT_CATALOG.map(a => a.id),
      skills: { 'skill:fast-talker': 2, 'skill:learn-the-streets': 1, 'skill:streetwise-investment': 3, 'skill:silent-partner': 2, 'skill:never-sleeps': 2 } } };
}
describe('v14 lifetime statistics and CE1', () => {
  it('v13 migration preserves every old field and initializes only exact Rebirth history', () => {
    const s = rich(), { statistics: _statistics, ...permanentProgression } = s.permanentProgression;
    const old = { ...s, permanentProgression }, raw = stringifySaveFixture(envelope(old, 13));
    const result = parseSave(raw); expect(CURRENT_SAVE_VERSION).toBe(17); expect(result.ok).toBe(true);
    if (!result.ok) throw Error('fixture');
    const { statistics, ...previous } = result.envelope.state.permanentProgression;
    expect(statistics).toEqual({ manualJobsCompleted: 0, automatedJobsCompleted: 0, businessLevelsPurchased: 0,
      territoriesAcquired: 0, crewMembersRecruited: 0, eventsResolved: 0, rebirthsCompleted: 4, peakHeat: 0 });
    expect({ ...result.envelope.state, permanentProgression: previous }).toEqual(old);
    expect(result.envelope.savedAt).toBe(123456789); expect(stringifySaveFixture(envelope(old, 13))).toBe(raw);
    expect(validateSaveCode(encodeSaveText(raw))).toEqual(result);
    const next = performRebirth(result.envelope.state); expect(next.ok).toBe(true);
    expect(next.state.permanentProgression.statistics.rebirthsCompleted).toBe(5); expect(next.state.permanentProgression.rebirthCount).toBe(5);
  });
  it.each(CUMULATIVE_STATISTICS)('rejects every missing or malformed %s field', key => {
    const s = rich();
    for (const value of [undefined, -1, 0.1, Number.MAX_SAFE_INTEGER + 1, '1', null, true, NaN, Infinity]) {
      const bad = { ...s, permanentProgression: { ...s.permanentProgression, statistics: { ...createInitialStatistics(), [key]: value } } };
      expect(validateSaveState(bad)).toBeNull();
      expect(parseSave(stringifySaveFixture(envelope(bad)))).toEqual({ ok: false, error: 'invalid-state' });
    }
    const { [key]: _value, ...missing } = createInitialStatistics(); expect(isStatisticsState(missing)).toBe(false);
  });
  it.each([undefined, -1, 101, 0.5, '60', null, true, NaN, Infinity])('rejects malformed peakHeat %#', peakHeat => {
    const s = rich(), bad = { ...s, permanentProgression: { ...s.permanentProgression, statistics: { ...createInitialStatistics(), peakHeat } } };
    expect(validateSaveState(bad)).toBeNull(); expect(parseSave(stringifySaveFixture(envelope(bad))).ok).toBe(false);
  });
  it.each([0, 1, 60, 100])('accepts peak %i even if current Heat is different', peakHeat => {
    const s = rich(); expect(validateSaveState({ ...s, permanentProgression: { ...s.permanentProgression, statistics: { ...createInitialStatistics(), peakHeat } } })).not.toBeNull();
  });
  it('rejects missing/malformed/extra/accessor statistics without executing getters', () => {
    const s = rich(), base = createInitialStatistics();
    const badValues = [undefined, null, [], 0, 'stats', {}, { ...base, extra: 1 }, Object.create(base),
      { ...base, [Symbol('extra')]: 1 }, Object.defineProperty({ ...base }, 'peakHeat', { enumerable: false }),
      { ...base, get peakHeat() { throw Error('getter'); } }];
    for (const statistics of badValues) expect(validateSaveState({ ...s, permanentProgression: { ...s.permanentProgression, statistics } })).toBeNull();
    const { statistics: _statistics, ...missing } = s.permanentProgression;
    expect(validateSaveState({ ...s, permanentProgression: missing })).toBeNull();
  });
  it('all counters at safe maximum are valid; count equality is not a load requirement', () => {
    const statistics = { manualJobsCompleted: Number.MAX_SAFE_INTEGER, automatedJobsCompleted: Number.MAX_SAFE_INTEGER,
      businessLevelsPurchased: Number.MAX_SAFE_INTEGER, territoriesAcquired: Number.MAX_SAFE_INTEGER,
      crewMembersRecruited: Number.MAX_SAFE_INTEGER, eventsResolved: Number.MAX_SAFE_INTEGER, rebirthsCompleted: Number.MAX_SAFE_INTEGER, peakHeat: 100 };
    const s = rich(), state = { ...s, permanentProgression: { ...s.permanentProgression, statistics } };
    expect(validateSaveState(state)).toEqual(state);
    const code = exportSaveCode(state, 42); if (!code.ok) throw Error('fixture');
    expect(code.code.startsWith('CE1-')).toBe(true); expect(validateSaveCode(code.code)).toEqual({ ok: true, envelope: { ...envelope(state), savedAt: 42 } });
  });
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13])('CE1 v%i sequentially migrates without fabricated history', version => {
    const s = rich();
    const state = { economy: s.economy, businesses: version === 1 ? { ownedIds: ['business:dockside-detail'], productionRemainderMilliCents: 975 }
      : { owned: s.businesses.owned, productionRemainderMilliCents: 975, ...(version >= 3 ? { productionRemainderSubMilliCents: s.businesses.productionRemainderSubMilliCents } : {}) },
      ...(version >= 3 ? { upgrades: s.upgrades } : {}), ...(version >= 4 ? { automation: s.automation } : {}),
      ...(version >= 5 ? { progression: s.progression } : {}), ...(version >= 6 ? { garage: s.garage } : {}),
      ...(version >= 7 ? { permanentProgression: { empirePoints: 17, rebirthCount: 4, ...(version >= 8 ? { skills: s.permanentProgression.skills } : {}), ...(version >= 13 ? { unlockedAchievementIds: s.permanentProgression.unlockedAchievementIds } : {}) } } : {}),
      ...(version >= 9 ? { city: version === 9 ? { ownedTerritoryIds: s.city.ownedTerritoryIds } : s.city } : {}),
      ...(version >= 11 ? { crew: s.crew } : {}), ...(version >= 12 ? { events: s.events } : {}) };
    const r = validateSaveCode(encodeSaveText(stringifySaveFixture(envelope(state, version))));
    expect(r).toMatchObject({ ok: true, envelope: { version: 17, savedAt: 123456789, state: {
      economy: s.economy, permanentProgression: { statistics: createInitialStatistics(version >= 7 ? 4 : 0) } } } });
  });
  it('v14 empty state roundtrip adds no fields, history, or timestamps', () => {
    const state = createInitialGameState(), code = exportSaveCode(state, 1000); if (!code.ok) throw Error('fixture');
    expect(validateSaveCode(code.code)).toEqual({ ok: true, envelope: { ...envelope(state), savedAt: 1000 } });
    expect(Object.keys(state.permanentProgression.statistics)).toEqual([...CUMULATIVE_STATISTICS, 'peakHeat']);
  });
});
