import { describe, expect, it, vi } from 'vitest';
import { selectGuidance } from './guidance';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { BUSINESS_CATALOG, STARTER_BUSINESS as DOCKSIDE, getUpgradeCost } from '../features/businesses';
import type { BusinessId } from '../features/businesses';
import { AUTOMATIONS, DELIVERY_DISPATCHER, BUSINESS_AUTO_UPGRADER } from '../features/automation';
import { CREW_CATALOG } from '../features/crew';
import { VEHICLE_CATALOG, STARTER_VEHICLE } from '../features/vehicles';
import { SKILL_CATALOG } from '../features/skills';
import { UPGRADE_CATALOG, FLEET_LOGISTICS, PRESSURE_WASHER } from '../features/upgrades';
import { TERRITORY_CATALOG, NEON_MILE } from '../features/territories';
import { moneyFromMinorUnits } from '../features/economy';
import { getXpThresholdForLevel } from '../features/progression';
import { selectRebirth, performRebirth } from './rebirth';
import { evaluateRequirements } from './requirements';
import { purchaseBusiness } from './purchase-business';
import { upgradeBusiness } from './upgrade-business';
import { serializeSave, parseSave } from './save-schema';
import { exportSaveCode, validateSaveCode } from './save-code';
import { simulateGameElapsed } from './simulate-game-elapsed';

const LAUNDRY: BusinessId = 'business:neon-laundry';
const AFTERDARK: BusinessId = 'business:afterdark-customs';
const NIGHTS: BusinessId = 'business:solara-nights';
function fixture(levels: Readonly<Partial<Record<BusinessId, number>>> = {}, player = 16, cash = '999999999999'): GameState {
  const state = createInitialGameState();
  return { ...state, economy: { cash: moneyFromMinorUnits(cash) }, progression: { xp: getXpThresholdForLevel(player) },
    businesses: { ...state.businesses, owned: Object.fromEntries(Object.entries(levels).map(([id, level]) => { if (level === undefined) throw Error("Missing fixture level"); return [id, { level }]; })) },
    automation: { ...state.automation, unlockedIds: [DELIVERY_DISPATCHER.id] } };
}
function immutable<T>(value: T): T {
  if (value !== null && typeof value === 'object') { Object.values(value).forEach(immutable); Object.freeze(value); }
  return value;
}

describe('derived next-objective guidance', () => {
  it('starts with Dockside, its configured purchase cost and exact missing cash', () => {
    const view = selectGuidance(createInitialGameState());
    expect(view.goal.id).toBe(DOCKSIDE.id);
    expect(view.step).toMatchObject({ kind: 'acquire', name: DOCKSIDE.name, destination: { kind: 'business', id: DOCKSIDE.id },
      cash: { current: '0', required: DOCKSIDE.purchaseCost, missing: DOCKSIDE.purchaseCost } });
  });
  it('moves to Dispatcher after the first Business, then the portfolio', () => {
    const base = createInitialGameState();
    const owned = { ...base, businesses: { ...base.businesses, owned: { [DOCKSIDE.id]: { level: 1 } } } };
    expect(selectGuidance(owned).goal.id).toBe(DELIVERY_DISPATCHER.id);
    expect(selectGuidance(owned).step.kind).toBe('player-level');
    const hired = { ...owned, automation: { ...owned.automation, unlockedIds: [DELIVERY_DISPATCHER.id] } };
    expect(selectGuidance(hired).goal.id).toBe(LAUNDRY);
  });
  it.each([
    [LAUNDRY, DOCKSIDE.id, 7], [AFTERDARK, LAUNDRY, 10], [NIGHTS, AFTERDARK, 8],
  ] as const)('uses the real prerequisite level for %s, not a parallel guidance rule', (goal, prerequisite, gate) => {
    const definition = BUSINESS_CATALOG.find(b => b.id === goal);
    expect(definition?.requirements).toContainEqual({ type: 'business-level', businessId: prerequisite, minimumLevel: gate });
    const state = fixture({ [DOCKSIDE.id]: 15, [LAUNDRY]: 10, [AFTERDARK]: 8, [prerequisite]: gate - 1 });
    // Remove the goal itself; an existing owner must never be sent back through its gates.
    const { [goal]: _ignored, ...owned } = state.businesses.owned;
    const unowned = { ...state, businesses: { ...state.businesses, owned } };
    const view = selectGuidance(unowned, goal);
    expect(view.step).toMatchObject({ kind: 'business-level', destination: { kind: 'business', id: prerequisite }, count: { current: gate - 1, required: gate } });
    expect(view.step.cash?.required).toBe(getUpgradeCost(BUSINESS_CATALOG.find(b => b.id === prerequisite) ?? DOCKSIDE, gate - 1));
  });
  it.each([LAUNDRY, AFTERDARK, NIGHTS])('follows missing ownership all the way to Dockside for a fresh %s goal', goal => {
    const view = selectGuidance(createInitialGameState(), goal);
    expect(view.goal.id).toBe(goal);
    expect(view.step.destination).toEqual({ kind: 'business', id: DOCKSIDE.id });
    expect(view.step.kind).toBe('acquire');
  });
  it('switches from Laundry development to Afterdark acquisition at exactly Laundry 10', () => {
    const below = fixture({ [DOCKSIDE.id]: 7, [LAUNDRY]: 9 });
    const exact = fixture({ [DOCKSIDE.id]: 7, [LAUNDRY]: 10 });
    expect(selectGuidance(below).step.kind).toBe('business-level');
    expect(selectGuidance(exact).step).toMatchObject({ kind: 'acquire', name: 'Afterdark Customs' });
    // Dockside 12 must not sneak back in through guidance.
    expect(evaluateRequirements(exact, BUSINESS_CATALOG.find(b => b.id === AFTERDARK)?.requirements ?? []).met).toBe(true);
  });
  it('keeps Neon Mile in the Nights path, including the Territory own prerequisites', () => {
    const state = fixture({ [DOCKSIDE.id]: 14, [LAUNDRY]: 10, [AFTERDARK]: 8 });
    const first = selectGuidance(state, NIGHTS);
    expect(first.step).toMatchObject({ kind: 'business-level', name: 'Dockside Detail', count: { required: 15 } });
    const developed = fixture({ [DOCKSIDE.id]: 15, [LAUNDRY]: 10, [AFTERDARK]: 8 });
    expect(selectGuidance(developed, NIGHTS).step).toMatchObject({ kind: 'acquire', name: NEON_MILE.name });
    const controlled = { ...developed, city: { ...developed.city, ownedTerritoryIds: [...developed.city.ownedTerritoryIds, NEON_MILE.id] } };
    expect(selectGuidance(controlled, NIGHTS).step).toMatchObject({ kind: 'acquire', name: 'Solara Nights', cash: { required: '40000000' } });
  });
  it('reads Player Level and XP thresholds from current progression authority', () => {
    const state = fixture({ [DOCKSIDE.id]: 7 }, 4);
    const step = selectGuidance(state, LAUNDRY).step;
    expect(step).toMatchObject({ kind: 'player-level', count: { current: 4, required: 5 },
      xp: { current: state.progression.xp, required: getXpThresholdForLevel(5) } });
  });
  it('follows equipment dependencies instead of treating Fleet Logistics as immediately purchasable', () => {
    const state = fixture({ [DOCKSIDE.id]: 7 });
    expect(selectGuidance(state, FLEET_LOGISTICS.id).step.destination).toEqual({ kind: 'upgrade', id: PRESSURE_WASHER.id });
    expect(selectGuidance(createInitialGameState(), FLEET_LOGISTICS.id).step.destination).toEqual({ kind: 'business', id: DOCKSIDE.id });
  });
  it.each(['3499999', '3500000', '3500001'])('keeps Laundry selected while cash crosses its boundary: %s', cash => {
    const state = fixture({ [DOCKSIDE.id]: 7 }, 5, cash);
    const view = selectGuidance(state);
    expect(view.goal.id).toBe(LAUNDRY); expect(view.step.kind).toBe('acquire');
    expect(view.step.cash?.missing).toBe(BigInt(cash) < 3500000n ? '1' : '0');
    expect(purchaseBusiness(state, LAUNDRY).ok).toBe(BigInt(cash) >= 3500000n);
  });
  it('uses exact arbitrary-precision Money and never rounds decision costs', () => {
    const state = fixture({ [DOCKSIDE.id]: 7 }, 5, '9'.repeat(100));
    expect(selectGuidance(state).step.cash).toMatchObject({ current: state.economy.cash, missing: '0' });
  });
  it('tracks only current unowned catalog content; no starting Waterfront or completed owners', () => {
    const state = fixture({ [DOCKSIDE.id]: 1, [AFTERDARK]: 1, [NIGHTS]: 1 });
    const view = selectGuidance(state, AFTERDARK);
    expect(view.goals.some(goal => goal.id === AFTERDARK || goal.id === NIGHTS || goal.id === DOCKSIDE.id || goal.id === 'territory:waterfront')).toBe(false);
    expect(view.tracked).toBe(false);
    expect(view.goal.id).toBe(LAUNDRY);
    expect(state.businesses.owned[AFTERDARK]?.level).toBe(1);
  });
  it('offers current optional vehicle, equipment, automation, Crew and skill goals without inventing content', () => {
    const state = createInitialGameState(), ids = selectGuidance(state).goals.map(goal => goal.id);
    for (const definition of [...BUSINESS_CATALOG, ...AUTOMATIONS, ...VEHICLE_CATALOG, ...CREW_CATALOG, ...UPGRADE_CATALOG, ...SKILL_CATALOG])
      expect(ids).toContain(definition.id);
    expect(ids).toContain(NEON_MILE.id); expect(new Set(ids).size).toBe(ids.length);
  });
  it('can follow KX-R requirements independently from the recommended business path', () => {
    const state = fixture({ [DOCKSIDE.id]: 5 }, 5);
    const view = selectGuidance(state, STARTER_VEHICLE.id);
    expect(view.tracked).toBe(true); expect(view.step).toMatchObject({ kind: 'acquire', name: 'Kairo KX-R', cash: { required: STARTER_VEHICLE.purchaseCost } });
  });
  it.each(CREW_CATALOG)('can route $name recruitment without assigning or replacing a specialist', member => {
    const state = fixture({ [DOCKSIDE.id]: 15 });
    const controlled = { ...state, city: { ...state.city, ownedTerritoryIds: [...state.city.ownedTerritoryIds, NEON_MILE.id] } };
    const before = JSON.stringify(controlled);
    const view = selectGuidance(controlled, member.id);
    expect(view.step.destination).toEqual({ kind: 'crew', id: member.id });
    expect(view.step.cash?.required).toBe(member.recruitmentCost);
    expect(JSON.stringify(controlled)).toBe(before);
  });
  it('completed automation is not treated as unfinished just because opt-in spending is disabled', () => {
    const state = fixture({ [DOCKSIDE.id]: 15 });
    const purchased = { ...state, automation: { ...state.automation, unlockedIds: AUTOMATIONS.map(a => a.id), enabledIds: [] } };
    expect(selectGuidance(purchased).goals.some(g => g.id === BUSINESS_AUTO_UPGRADER.id)).toBe(false);
    expect(purchased.automation.enabledIds).toEqual([]);
  });
  it('shows exact skill rank dependencies and EP costs without forcing a build', () => {
    const base = fixture({ [DOCKSIDE.id]: 7 });
    const state = { ...base, permanentProgression: { ...base.permanentProgression, empirePoints: 10 } };
    const view = selectGuidance(state, 'skill:silent-partner');
    expect(view.step).toMatchObject({ kind: 'skill-rank', name: 'Streetwise Investment', count: { current: 0, required: 3 }, epCost: 1 });
  });
  it('points EP-short skill goals to Rebirth without granting or spending EP', () => {
    const state = fixture();
    expect(selectGuidance(state, 'skill:streetwise-investment').step).toMatchObject({ kind: 'empire-points', count: { current: 0, required: 1 }, destination: { kind: 'rebirth' } });
    expect(state.permanentProgression.empirePoints).toBe(0);
  });
  it('removes max-rank skills from tracking and falls back for stale/unknown selection', () => {
    const base = fixture({ [DOCKSIDE.id]: 7 });
    const state = { ...base, permanentProgression: { ...base.permanentProgression, skills: { 'skill:streetwise-investment': 3 } } };
    const defaultView = selectGuidance(state);
    expect(selectGuidance(state, 'unknown')).toEqual(defaultView);
    expect(selectGuidance(state, 'skill:streetwise-investment')).toEqual(defaultView);
  });
  it('prioritizes eligible Rebirth with the exact shared EP preview, but permits extending the run', () => {
    const state = fixture({ [DOCKSIDE.id]: 25, [LAUNDRY]: 10 }, 20);
    const view = selectGuidance(state);
    expect(view.step.kind).toBe('rebirth'); expect(view.step.rebirthReward).toBe(selectRebirth(state).reward);
    const extended = selectGuidance(state, AFTERDARK);
    expect(extended.goal.id).toBe(AFTERDARK); expect(extended.step.kind).toBe('acquire');
  });
  it('does not suggest Rebirth readiness before both actual boundaries', () => {
    for (const [player, dockside] of [[19,25],[20,24]] as const) {
      const state = fixture({ [DOCKSIDE.id]: dockside }, player);
      expect(selectGuidance(state, 'guidance:rebirth').step.kind).not.toBe('rebirth');
    }
  });
  it('offers a finite Rebirth goal when all current Businesses are owned but gates remain', () => {
    const state = fixture(Object.fromEntries(BUSINESS_CATALOG.map(b => [b.id, 1])));
    expect(selectGuidance(state).goal.id).toBe('guidance:rebirth');
    expect(selectGuidance(state).step).toMatchObject({ kind: 'business-level', name: DOCKSIDE.name, count: { current: 1, required: 25 } });
  });
  it('every selectable current goal resolves finitely for fresh and developed states', () => {
    for (const state of [createInitialGameState(), fixture({ [DOCKSIDE.id]: 7 }), fixture({ [DOCKSIDE.id]: 100 }, 100)]) {
      for (const goal of selectGuidance(state).goals) {
        const step = selectGuidance(state, goal.id).step;
        expect(step.name.length).toBeGreaterThan(0);
        if (step.count) expect(step.count.current).toBeLessThan(step.count.required);
        if (step.kind === 'acquire') expect(step.cash).toBeDefined();
      }
    }
  });
  it('recomputes after actual acquisition and prerequisite upgrades', () => {
    const state = fixture({ [DOCKSIDE.id]: 7, [LAUNDRY]: 9 });
    const upgraded = upgradeBusiness(state, LAUNDRY); expect(upgraded.ok).toBe(true);
    expect(selectGuidance(upgraded.state).step.name).toBe('Afterdark Customs');
    const bought = purchaseBusiness(upgraded.state, AFTERDARK); expect(bought.ok).toBe(true);
    expect(selectGuidance(bought.state).goal.id).toBe(NIGHTS);
  });
  it('recomputes from retained state after Rebirth and from canonical state after New Game', () => {
    const state = fixture({ [DOCKSIDE.id]: 25, [LAUNDRY]: 10 }, 20);
    const result = performRebirth(state); expect(result.ok).toBe(true);
    expect(selectGuidance(result.state).goal.id).toBe(DOCKSIDE.id);
    expect(selectGuidance(createInitialGameState()).goal.id).toBe(DOCKSIDE.id);
  });
  it('observes offline gains without simulating more time or spending', () => {
    const state = fixture({ [DOCKSIDE.id]: 7 }, 5, '0');
    const offline = simulateGameElapsed(state, 8 * 60 * 60 * 1000); expect(offline.ok).toBe(true);
    const view = selectGuidance(offline.state);
    expect(view.step.cash?.current).toBe(offline.state.economy.cash);
  });
  it('has no RNG/clock side effects and preserves exact v17 and CE1 bytes', () => {
    const state = immutable(fixture({ [DOCKSIDE.id]: 7 }, 5));
    const save = serializeSave(state, 1000), code = exportSaveCode(state, 1000);
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => { throw Error('clock'); });
    const random = vi.spyOn(Math, 'random').mockImplementation(() => { throw Error('RNG'); });
    try {
      for (const goal of selectGuidance(state).goals) selectGuidance(state, goal.id);
      expect(serializeSave(state, 1000)).toEqual(save); expect(exportSaveCode(state, 1000)).toEqual(code);
      expect(clock).not.toHaveBeenCalled(); expect(random).not.toHaveBeenCalled();
    } finally { clock.mockRestore(); random.mockRestore(); }
    if (!save.ok || !code.ok) throw Error('fixture');
    const parsed = parseSave(save.serialized), restored = validateSaveCode(code.code);
    expect(parsed.ok && parsed.envelope.version).toBe(17);
    expect(restored.ok && selectGuidance(restored.envelope.state)).toEqual(selectGuidance(state));
  });
  it('does not change catalogs or insert guidance into GameState', () => {
    const state = createInitialGameState(), keys = Object.keys(state);
    const configs = [BUSINESS_CATALOG, AUTOMATIONS, VEHICLE_CATALOG, CREW_CATALOG, SKILL_CATALOG, UPGRADE_CATALOG, TERRITORY_CATALOG];
    const before = JSON.stringify(configs); selectGuidance(state);
    expect(Object.keys(state)).toEqual(keys); expect(JSON.stringify(configs)).toBe(before);
    expect(BUSINESS_CATALOG).toHaveLength(4);
  });
});
