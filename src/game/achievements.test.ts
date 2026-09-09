import { describe, expect, it } from 'vitest';
import { ACHIEVEMENT_CATALOG as C } from '../features/achievements';
import { getXpThresholdForLevel } from '../features/progression';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { CREW_CATALOG } from '../features/crew';
import { getEligibleAchievementIds, unlockEligibleAchievements, selectAchievements, achievementAnnouncement } from './achievements';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { rebirthState } from './test-fixtures/rebirth-state';
import { performRebirth } from './rebirth';
import { crewState } from './test-fixtures/crew-state';
import { simulateGameElapsed } from './simulate-game-elapsed';
import { reconcileOffline } from './offline-progress';
import { DELIVERY_DISPATCHER as D } from '../features/automation';
import { evaluateJobReward, effectiveProductionRates } from './effective-stats';
import { getOfflineCapMs } from './offline-cap';
import { getHeatDecayIntervalMs } from './heat-decay-interval';
const fresh = createInitialGameState;
const ids = C.map(a => a.id);
function milestone(index: number, value: number): GameState {
  const s = fresh();
  switch (index) {
    case 0: return { ...s, progression: { xp: getXpThresholdForLevel(value) } };
    case 1: return { ...s, businesses: { ...s.businesses, owned: value ? { [B.id]: { level: value } } : {} } };
    case 2: return { ...s, city: { ...s.city, ownedTerritoryIds: value ? ['territory:waterfront', 'territory:neon-mile'] : ['territory:waterfront'] } };
    case 3: return { ...s, city: { ...s.city, heat: value } };
    case 4: return { ...s, crew: { ...s.crew, recruitedIds: CREW_CATALOG.slice(0, value).map(c => c.id) } };
    default: return { ...s, permanentProgression: { ...s.permanentProgression, rebirthCount: value } };
  }
}
function allMilestones(): GameState {
  const s = rebirthState();
  return { ...s, crew: crewState().crew, city: { ...crewState().city, heat: 70, heatDecayElapsedMs: 40000 }, permanentProgression: { ...s.permanentProgression, rebirthCount: 1 } };
}
describe('six permanent observational achievements', () => {
  it('has exactly the canonical stable catalog, order and no rewards', () => {
    expect(ids).toEqual(['achievement:first-steps','achievement:dockside-operator','achievement:neon-takeover','achievement:running-hot','achievement:crew-chief','achievement:first-rebirth']);
    expect(C.map(a => a.name)).toEqual(['First Steps','Dockside Operator','Neon Takeover','Running Hot','Crew Chief','First Rebirth']);
    expect(new Set(ids).size).toBe(6);
    for (const a of C) expect(Object.keys(a).sort()).toEqual(['condition','description','id','name']);
  });
  it.each([[0,1,false],[0,2,true],[0,20,true],[1,0,false],[1,9,false],[1,10,true],[1,100,true],[2,0,false],[2,1,true],[3,59,false],[3,60,true],[3,100,true],[4,0,false],[4,1,false],[4,2,false],[4,3,true],[5,0,false],[5,1,true],[5,3,true]] as const)('condition %i at %i is %s', (index,value,eligible) => {
    expect(getEligibleAchievementIds(milestone(index,value)).includes(ids[index]!)).toBe(eligible);
  });
  it.each(ids)('%s is permanent, immutable and idempotent after the condition disappears', id => {
    const original = allMilestones(), before = structuredClone(original);
    const unlocked = unlockEligibleAchievements(original);
    expect(original).toEqual(before);
    const reset = { ...fresh(), permanentProgression: { ...fresh().permanentProgression, unlockedAchievementIds: [id] } };
    expect(unlockEligibleAchievements(reset)).toEqual({ state: reset, newlyUnlocked: [] });
    expect(unlockEligibleAchievements(reset).state).toBe(reset);
    expect(selectAchievements(reset).cards.find(a => a.id === id)?.progress).toBe('Completed');
    expect(unlocked.newlyUnlocked).toContain(id);
  });
  it('unlocks all satisfied conditions in canonical order without changing any other value', () => {
    const s = allMilestones(), r = unlockEligibleAchievements(s);
    expect(r.newlyUnlocked).toEqual(ids); expect(r.state).toEqual({ ...s, permanentProgression: { ...s.permanentProgression, unlockedAchievementIds: ids } });
    expect(unlockEligibleAchievements(r.state).state).toBe(r.state);
    expect(unlockEligibleAchievements(r.state).newlyUnlocked).toEqual([]);
    expect(evaluateJobReward(r.state)).toEqual(evaluateJobReward(s));
    expect(effectiveProductionRates(r.state)).toEqual(effectiveProductionRates(s));
    expect(getOfflineCapMs(r.state)).toBe(getOfflineCapMs(s));
    expect(getHeatDecayIntervalMs(r.state)).toBe(getHeatDecayIntervalMs(s));
  });
  it('returns only new IDs and leaves unmet milestones locked', () => {
    const s = milestone(3,60); const result = unlockEligibleAchievements(s);
    expect(result.newlyUnlocked).toEqual(['achievement:running-hot']);
    expect(selectAchievements(result.state).unlockedCount).toBe(1);
  });
  it('Crew assignments are irrelevant to recruiting all three', () => {
    for (const operations of [null,'crew:rico-vale','crew:mara-knox'] as const) expect(getEligibleAchievementIds(crewState({operations,logistics:'crew:jax-mercer'}))).toContain('achievement:crew-chief');
  });
  it.each([0,1,2])('offline cap rank %i observes only the final Heat and preserves all credited subsystem results', rank => {
    const s = { ...milestone(3,59), automation: { enabledIds: [], businessAutoUpgradeElapsedMs: 0, unlockedIds: [D.id], starterJobElapsedMs: 0 }, permanentProgression: { ...fresh().permanentProgression, skills: rank ? { 'skill:never-sleeps': rank } : {} } };
    const short = reconcileOffline(s,0,50000); expect(short.ok).toBe(true); expect(short.state.city.heat).toBe(60); expect(short.state.permanentProgression.unlockedAchievementIds).toContain('achievement:running-hot');
    const long = reconcileOffline(s,0,120000); expect(long.state.city.heat).toBe(59); expect(long.state.permanentProgression.unlockedAchievementIds).not.toContain('achievement:running-hot');
    const capped = reconcileOffline(s,0,20*3600000), online = simulateGameElapsed(s,getOfflineCapMs(s)); expect(capped.state).toEqual(online.state);
  });
  it('captures every pre-Rebirth milestone, then First Rebirth, in the single reset candidate', () => {
    const base = allMilestones(), s = { ...base, permanentProgression: { ...base.permanentProgression, rebirthCount: 0, empirePoints: 7 } };
    const result = performRebirth(s); expect(result.ok).toBe(true);
    expect(result.state).toEqual({ ...fresh(), garage: s.garage, permanentProgression: { ...s.permanentProgression, statistics: { ...s.permanentProgression.statistics, rebirthsCompleted: 1 }, empirePoints: 11, rebirthCount: 1, unlockedAchievementIds: ids } });
    const again = performRebirth({ ...s, permanentProgression: result.state.permanentProgression });
    expect(again.state.permanentProgression.unlockedAchievementIds).toEqual(ids);
    expect(again.state.permanentProgression.empirePoints).toBe(15);
  });
  it('announcements represent every new name once in configured order', () => {
    expect(achievementAnnouncement(['achievement:running-hot'])).toBe('ACHIEVEMENT UNLOCKED — Running Hot');
    expect(achievementAnnouncement([...ids].reverse())).toBe(`ACHIEVEMENTS UNLOCKED — ${C.map(a => a.name).join(' · ')}`);
    expect(achievementAnnouncement([])).toBe('');
  });
});
