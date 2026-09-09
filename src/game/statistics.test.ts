import { describe, expect, it } from 'vitest';
import { createInitialStatistics, CUMULATIVE_STATISTICS, incrementStatistic, recordPeakHeat } from '../features/statistics';
import type { StatisticsState } from '../features/statistics';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { performStarterJob } from './perform-starter-job';
import { purchaseBusiness } from './purchase-business';
import { upgradeBusiness } from './upgrade-business';
import { acquireTerritory } from './acquire-territory';
import { recruitCrewMember, assignCrewMember, unassignCrewSlot } from './crew-commands';
import { resolveEventChoice } from './resolve-event-choice';
import { layLow } from './lay-low';
import { performRebirth } from './rebirth';
import { simulateGameElapsed } from './simulate-game-elapsed';
import { reconcileOffline } from './offline-progress';
import { simulateOnlineElapsed } from './simulate-online-elapsed';
import { rebirthState } from './test-fixtures/rebirth-state';
import { crewState } from './test-fixtures/crew-state';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { DELIVERY_DISPATCHER as D } from '../features/automation';
import { CREW_CATALOG } from '../features/crew';
import { EVENT_CATALOG } from '../features/events';
import { moneyFromMinorUnits } from '../features/economy';
import { ACHIEVEMENT_CATALOG } from '../features/achievements';
import { unlockEligibleAchievements } from './achievements';
const fresh = createInitialGameState;
function stats(state: GameState) { return state.permanentProgression.statistics; }
function history(state: GameState, changes: Partial<StatisticsState>): GameState {
  return { ...state, permanentProgression: { ...state.permanentProgression, statistics: { ...stats(state), ...changes } } };
}
function heat(state: GameState, value: number): GameState {
  return { ...state, city: { ...state.city, heat: value, heatDecayElapsedMs: 0 } };
}
function success<T extends { readonly ok: boolean; readonly state: GameState }>(result: T): GameState {
  expect(result.ok).toBe(true); return result.state;
}
function noHistory(state: GameState) {
  const { statistics: _statistics, ...permanentProgression } = state.permanentProgression;
  return { ...state, permanentProgression };
}
describe('eight permanent lifetime observations', () => {
  it('fresh state has exactly eight zero values, independent of other fresh instances', () => {
    expect(stats(fresh())).toEqual({ manualJobsCompleted: 0, automatedJobsCompleted: 0, businessLevelsPurchased: 0,
      territoriesAcquired: 0, crewMembersRecruited: 0, eventsResolved: 0, rebirthsCompleted: 0, peakHeat: 0 });
    expect(stats(fresh())).not.toBe(stats(fresh()));
  });
  it.each(CUMULATIVE_STATISTICS)('%s has exact checked immutable addition and overflow', key => {
    const s = Object.freeze({ ...createInitialStatistics(), [key]: Number.MAX_SAFE_INTEGER - 3 });
    expect(incrementStatistic(s, key, 3)).toEqual({ ok: true, state: { ...s, [key]: Number.MAX_SAFE_INTEGER } });
    expect(incrementStatistic(s, key, 4)).toEqual({ ok: false, state: s, error: 'statistics-overflow' });
    expect(incrementStatistic(s, key, 0).state).toBe(s);
    expect(s[key]).toBe(Number.MAX_SAFE_INTEGER - 3);
  });
  it.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('rejects invalid addition %s without mutation', amount => {
    const s = Object.freeze(createInitialStatistics()); expect(() => incrementStatistic(s, 'manualJobsCompleted', amount)).toThrow(RangeError);
  });
  it('manual actions count independently and retain exact existing Money/XP/Heat', () => {
    let s = fresh(); for (let i = 0; i < 10; i++) s = success(performStarterJob(s));
    expect(stats(s)).toEqual({ ...createInitialStatistics(), manualJobsCompleted: 10, peakHeat: 10 });
    expect(s.economy.cash).toBe('25000'); expect(s.progression.xp).toBe(100); expect(s.city.heat).toBe(10);
    const failed = performStarterJob({ ...s, progression: { xp: Number.MAX_SAFE_INTEGER } });
    expect(failed.ok).toBe(false); expect(stats(failed.state)).toEqual(stats(s));
  });
  it.each([0, 1, 3, 100])('counts %i completed cycles once in online and offline batches', cycles => {
    const s = { ...fresh(), automation: { enabledIds: [], businessAutoUpgradeElapsedMs: 0, unlockedIds: [D.id], starterJobElapsedMs: 5000 } };
    for (const r of [simulateGameElapsed(s, cycles * 10000), reconcileOffline(s, 1000, 1000 + cycles * 10000)]) {
      expect(r.ok).toBe(true); expect(stats(r.state).automatedJobsCompleted).toBe(cycles);
      expect(stats(r.state).manualJobsCompleted).toBe(0); expect(r.state.automation.starterJobElapsedMs).toBe(5000);
    }
  });
  it('split elapsed counts the same total cycles without double counting remainder', () => {
    const s = { ...fresh(), automation: { enabledIds: [], businessAutoUpgradeElapsedMs: 0, unlockedIds: [D.id], starterJobElapsedMs: 9000 } };
    const split = success(simulateGameElapsed(success(simulateGameElapsed(s, 16000)), 15000));
    expect(stats(split).automatedJobsCompleted).toBe(4);
    expect(stats(simulateGameElapsed(s, 31000).state).automatedJobsCompleted).toBe(4);
  });
  it('initial purchase excluded, each paid level upgrade counted, failed upgrade excluded', () => {
    let s = success(purchaseBusiness({ ...fresh(), economy: rebirthState().economy }, B.id));
    expect(stats(s).businessLevelsPurchased).toBe(0);
    s = success(upgradeBusiness(s, B.id)); s = success(upgradeBusiness(s, B.id));
    expect(s.businesses.owned[B.id]?.level).toBe(3); expect(stats(s).businessLevelsPurchased).toBe(2);
    const poor = { ...s, economy: { cash: moneyFromMinorUnits('0') } };
    expect(upgradeBusiness(poor, B.id).state).toBe(poor);
  });
  it('counts repeat territory takeovers across Rebirth without counting Waterfront', () => {
    const s = heat(rebirthState(), 55); expect(stats(s).territoriesAcquired).toBe(0);
    const first = success(acquireTerritory(s, 'territory:neon-mile'));
    expect(stats(first)).toEqual({ ...stats(s), territoriesAcquired: 1, peakHeat: 65 });
    expect(acquireTerritory(first, 'territory:neon-mile').state).toBe(first);
    const reset = success(performRebirth(first)); expect(stats(reset).territoriesAcquired).toBe(1);
    expect(acquireTerritory(reset, 'territory:neon-mile').state).toBe(reset);
    const rebuilt = { ...rebirthState(), permanentProgression: reset.permanentProgression };
    expect(stats(success(acquireTerritory(rebuilt, 'territory:neon-mile'))).territoriesAcquired).toBe(2);
  });
  it('counts recruitment actions, not assignments, and counts repeat post-Rebirth recruits', () => {
    let s = { ...rebirthState(), city: crewState().city };
    for (const member of CREW_CATALOG) s = success(recruitCrewMember(s, member.id));
    expect(stats(s).crewMembersRecruited).toBe(3);
    expect(recruitCrewMember(s, 'crew:rico-vale').state).toBe(s);
    s = success(assignCrewMember(s, 'operations', 'crew:rico-vale'));
    s = success(assignCrewMember(s, 'operations', 'crew:mara-knox'));
    s = success(unassignCrewSlot(s, 'operations')); expect(stats(s).crewMembersRecruited).toBe(3);
    const reset = success(performRebirth(s));
    const rebuilt = { ...rebirthState(), permanentProgression: reset.permanentProgression };
    expect(stats(success(recruitCrewMember(rebuilt, 'crew:rico-vale'))).crewMembersRecruited).toBe(4);
  });
  it.each(EVENT_CATALOG.flatMap(event => event.choices.map(choice => ({ event, choice }))))('$event.name / $choice.id counts one resolution including PASS', ({ event, choice }) => {
    const s = { ...heat(rebirthState(), 59), events: { pendingEventId: event.id, opportunityElapsedMs: 123456 } };
    const after = success(resolveEventChoice(s, event.id, choice.id));
    expect(stats(after)).toEqual({ ...stats(s), eventsResolved: 1, peakHeat: Math.max(0, Math.min(100, 59 + choice.heatChange)) });
    expect(after.events).toEqual(fresh().events); expect(after.progression).toBe(s.progression);
    expect(after.permanentProgression.empirePoints).toBe(s.permanentProgression.empirePoints);
    expect(stats(after).manualJobsCompleted).toBe(0);
  });
  it('spawn, failed choice and pending discard do not count a resolution', () => {
    const s = { ...rebirthState(), automation: fresh().automation };
    const spawned = success(simulateOnlineElapsed(s, 600000, { next: () => 0 }));
    expect(spawned.events.pendingEventId).toBe('event:hot-tip'); expect(stats(spawned).eventsResolved).toBe(0);
    expect(resolveEventChoice(spawned, 'event:hot-tip', 'choice:invest').state).toBe(spawned);
    expect(stats(success(performRebirth(spawned))).eventsResolved).toBe(0);
  });
  it('both Rebirth counts increment once per success; failed Rebirth preserves both', () => {
    const first = success(performRebirth(rebirthState()));
    expect(first.permanentProgression.rebirthCount).toBe(1); expect(stats(first).rebirthsCompleted).toBe(1);
    expect(performRebirth(first).state).toBe(first);
    const second = success(performRebirth({ ...rebirthState(), permanentProgression: first.permanentProgression }));
    expect(second.permanentProgression.rebirthCount).toBe(2); expect(stats(second).rebirthsCompleted).toBe(2);
  });
  it('peak never decreases through direct actions, cooling, Lay Low and Rebirth', () => {
    const first = success(performStarterJob(fresh())); expect(stats(first).peakHeat).toBe(1);
    const cold = success(simulateGameElapsed(first, 60000)); expect(cold.city.heat).toBe(0); expect(stats(cold).peakHeat).toBe(1);
    const hot = success(performStarterJob(heat(cold, 59))); expect(stats(hot).peakHeat).toBe(60);
    const max = success(performStarterJob(heat(hot, 99))); expect(stats(max).peakHeat).toBe(100);
    const lower = success(layLow({ ...max, economy: rebirthState().economy })); expect(stats(lower).peakHeat).toBe(100);
    const reset = success(performRebirth({ ...rebirthState(), permanentProgression: lower.permanentProgression }));
    expect(reset.city.heat).toBe(0); expect(stats(reset).peakHeat).toBe(100);
  });
  it('observes only final Heat, never the hidden intermediate Dispatcher maximum', () => {
    // Saved progress + 499 seconds completes 50 jobs: 55 + 10 - 8 = 57.
    const s = { ...heat(fresh(), 55), automation: { enabledIds: [], businessAutoUpgradeElapsedMs: 0, unlockedIds: [D.id], starterJobElapsedMs: 1000 } };
    const r = success(simulateGameElapsed(s, 499000));
    expect(r.city.heat).toBe(57); expect(stats(r).peakHeat).toBe(57); expect(stats(r).automatedJobsCompleted).toBe(50);
    expect(r.permanentProgression.unlockedAchievementIds).not.toContain('achievement:running-hot');
    expect(stats(reconcileOffline(s, 0, 499000).state).peakHeat).toBe(57);
  });
  it('zero elapsed and future-clock bootstrap do not infer peak Heat', () => {
    const s = heat(fresh(), 90);
    expect(stats(simulateGameElapsed(s, 0).state).peakHeat).toBe(0);
    expect(stats(reconcileOffline(s, 100, 0).state).peakHeat).toBe(0);
  });
  it('Rebirth preserves all eight values except its own single increment', () => {
    const values = { manualJobsCompleted: 1284, automatedJobsCompleted: 8419, businessLevelsPurchased: 48,
      territoriesAcquired: 3, crewMembersRecruited: 9, eventsResolved: 24, rebirthsCompleted: 7, peakHeat: 100 };
    const s = history(heat(rebirthState(), 90), values), r = success(performRebirth(s));
    expect(stats(r)).toEqual({ ...values, rebirthsCompleted: 8 }); expect(r.city).toEqual(fresh().city);
    expect(r.crew).toEqual(fresh().crew); expect(r.events).toEqual(fresh().events); expect(r.garage).toBe(s.garage);
  });
  it.each([
    { key: 'manualJobsCompleted', command: performStarterJob },
    { key: 'automatedJobsCompleted', command: (s: GameState) => simulateGameElapsed(s, 30000) },
    { key: 'businessLevelsPurchased', command: (s: GameState) => upgradeBusiness(s, B.id) },
    { key: 'territoriesAcquired', command: (s: GameState) => acquireTerritory(s, 'territory:neon-mile') },
    { key: 'crewMembersRecruited', command: (s: GameState) => recruitCrewMember(s, 'crew:rico-vale') },
    { key: 'eventsResolved', command: (s: GameState) => resolveEventChoice(s, 'event:warehouse-opportunity', 'choice:invest') },
    { key: 'rebirthsCompleted', command: performRebirth },
  ] as const)('$key overflow rejects the entire gameplay candidate, including achievements', ({ key, command }) => {
    const s = history({ ...heat(rebirthState(), 59), events: { pendingEventId: 'event:warehouse-opportunity', opportunityElapsedMs: 123456 } }, { [key]: Number.MAX_SAFE_INTEGER });
    const before = structuredClone(s); Object.freeze(s); Object.freeze(stats(s));
    const r = command(s); expect(r).toEqual({ ok: false, state: s, error: 'statistics-overflow' }); expect(r.state).toBe(s); expect(s).toEqual(before);
  });
  it('no history value affects any existing job, elapsed, or event outcome', () => {
    const s = { ...heat(crewState({ operations: 'crew:rico-vale', logistics: 'crew:jax-mercer' }), 80), events: { pendingEventId: 'event:hot-tip' as const, opportunityElapsedMs: 0 } };
    const richHistory = history(s, { manualJobsCompleted: 1000, automatedJobsCompleted: 2000, businessLevelsPurchased: 40,
      territoriesAcquired: 8, crewMembersRecruited: 20, eventsResolved: 90, rebirthsCompleted: 17, peakHeat: 100 });
    for (const command of [performStarterJob, (s: GameState) => simulateGameElapsed(s, 30000), (s: GameState) => resolveEventChoice(s, 'event:hot-tip', 'choice:take-tip')]) {
      expect(noHistory(success(command(richHistory)))).toEqual(noHistory(success(command(s))));
    }
    expect(ACHIEVEMENT_CATALOG).toHaveLength(6);
    const cold = history(fresh(), { peakHeat: 100 });
    expect(unlockEligibleAchievements(cold).newlyUnlocked).not.toContain('achievement:running-hot');
  });
  it.each([0, 1, 60, 100])('peak helper records exact %i and returns stable state when unchanged', value => {
    const s = recordPeakHeat(createInitialStatistics(), value);
    expect(s.peakHeat).toBe(value); expect(recordPeakHeat(s, 0)).toBe(s);
  });
});
