import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BusinessId } from '../features/businesses';
import { BUSINESS_CATALOG, STARTER_BUSINESS as D } from '../features/businesses';
import { BUSINESS_AUTO_UPGRADER as A } from '../features/automation';
import { moneyFromMinorUnits as money } from '../features/economy';
import { MAX_XP } from '../features/progression';
import { rational } from '../shared/rational';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { autoUpgraderState } from './test-fixtures/auto-upgrader-state';
import { rebirthState } from './test-fixtures/rebirth-state';
import { setBusinessAutoUpgraderTarget } from './set-auto-upgrader-target';
import { simulateGameElapsed } from './simulate-game-elapsed';
import { upgradeBusiness } from './upgrade-business';
import { attemptBusinessAutoUpgrade } from './simulate-auto-upgrader';
import { reconcileOffline } from './offline-progress';
import { performRebirth, selectRebirth } from './rebirth';
import { migrateToCurrentSave, CURRENT_SAVE_VERSION, validateSaveState } from './save-schema';
import { encodeSaveText, exportSaveCode, validateSaveCode } from './save-code';
import { selectAutoUpgrader } from './automation-selectors';
const L: BusinessId = 'business:neon-laundry', C: BusinessId = 'business:afterdark-customs', N: BusinessId = 'business:solara-nights';
function portfolio(): GameState {
  const s = autoUpgraderState();
  return { ...s, businesses: { ...s.businesses, owned: { ...s.businesses.owned, [L]: { level: 1 }, [C]: { level: 1 }, [N]: { level: 1 } },
    productionRemainderMilliCents: 937, productionRemainderSubMilliCents: rational(2n, 3n) },
    automation: { ...s.automation, businessAutoUpgradeTargetId: C, businessAutoUpgradeElapsedMs: 20000 } };
}
function simulate(s: GameState, ms: number) { const result = simulateGameElapsed(s, ms); if (!result.ok) throw Error(result.error); return result; }
const envelope = <T>(state: T, version = 17) => ({ format: 'crime-empire-save', version, savedAt: 123456789, state });
function historical(s: GameState) { const { businessAutoUpgradeTargetId: _target, ...automation } = s.automation; return { ...s, automation }; }
afterEach(() => vi.restoreAllMocks());
describe('v17 target compatibility', () => {
  it('adds only the stable target to fresh automation; new Businesses remain absent', () => {
    const s = createInitialGameState(); expect(CURRENT_SAVE_VERSION).toBe(17);
    expect(s.businesses.owned).toEqual({});
    expect(s.automation).toEqual({ unlockedIds: [], enabledIds: [], starterJobElapsedMs: 0, businessAutoUpgradeElapsedMs: 0, businessAutoUpgradeTargetId: D.id });
  });
  it.each(['unowned', 'disabled', 'enabled'])('v16 %s migration is pure and preserves all prior fields, fractions and timestamps', mode => {
    const rich = rebirthState(37, 48), s = { ...rich, automation: { ...rich.automation,
      unlockedIds: mode === 'unowned' ? [] : [A.id], enabledIds: mode === 'enabled' ? [A.id] : [], starterJobElapsedMs: 0,
      businessAutoUpgradeElapsedMs: mode === 'unowned' ? 0 : 23456 } };
    const input = envelope(historical(s), 16), before = structuredClone(input);
    expect(input.state.automation).not.toHaveProperty('businessAutoUpgradeTargetId');
    vi.spyOn(Date, 'now').mockImplementation(() => { throw Error('clock'); });
    vi.spyOn(Math, 'random').mockImplementation(() => { throw Error('RNG'); });
    const migrated = migrateToCurrentSave(input);
    expect(migrated).toEqual({ ok: true, envelope: envelope(s) });
    expect(input).toEqual(before); expect(migrateToCurrentSave(input)).toEqual(migrated);
    expect(validateSaveCode(encodeSaveText(JSON.stringify(input)))).toEqual(migrated);
    expect(Object.keys(s.businesses.owned)).toEqual([D.id]);
  });
  it.each([15, 16])('v%i rejects future Businesses and the future target field', version => {
    const s = autoUpgraderState();
    expect(migrateToCurrentSave(envelope(s, version)).ok).toBe(false);
    expect(migrateToCurrentSave(envelope({ ...historical(s), businesses: portfolio().businesses }, version)).ok).toBe(false);
  });
  it.each(['Neon Laundry', 'business:unknown', 1, null])('rejects invalid current target %s', target => {
    const s = portfolio(); expect(validateSaveState({ ...s, automation: { ...s.automation, businessAutoUpgradeTargetId: target } })).toBeNull();
  });
  it('CE1 current roundtrip preserves the complete portfolio, target and exact progress', () => {
    const s = portfolio(), code = exportSaveCode(s, 123456789); if (!code.ok) throw Error(code.error);
    expect(code.code.startsWith('CE1-')).toBe(true); expect(validateSaveCode(code.code)).toEqual({ ok: true, envelope: envelope(s) });
  });
  it('valid unowned target is dormant, never auto-acquired or silently replaced', () => {
    const s = autoUpgraderState(), input = { ...s, automation: { ...s.automation, businessAutoUpgradeTargetId: N } };
    expect(validateSaveState(input)).toEqual(input);
    const r = simulate(input, 60000); expect(r.state.businesses.owned).toEqual(input.businesses.owned);
    expect(r.state.automation.businessAutoUpgradeTargetId).toBe(N); expect(r.autoUpgrader?.levelsPurchased).toBe(0);
  });
});
describe('one explicit continuous automation timeline', () => {
  it.each([true, false])('switch enabled=%s preserves 20s progress and all non-target state, with no immediate purchase', enabled => {
    const s = portfolio(), input = { ...s, automation: { ...s.automation, enabledIds: enabled ? [A.id] : [] } };
    const switched = setBusinessAutoUpgraderTarget(input, L); expect(switched.ok).toBe(true);
    expect(switched.state).toEqual({ ...input, automation: { ...input.automation, businessAutoUpgradeTargetId: L } });
    expect(selectAutoUpgrader(switched.state).remainingMs).toBe(10000);
    const early = simulate(switched.state, 9999); expect(early.state.businesses.owned).toEqual(input.businesses.owned);
    const boundary = simulate(early.state, 1); expect(boundary.state.businesses.owned[L]?.level).toBe(enabled ? 2 : 1);
    expect(boundary.state.businesses.owned[C]).toEqual(input.businesses.owned[C]);
    expect(boundary.state.businesses.owned[D.id]).toEqual(input.businesses.owned[D.id]);
  });
  it('rejects unknown/unowned targets and configuration before automation purchase', () => {
    const s = autoUpgraderState();
    for (const id of ['business:unknown', L]) expect(setBusinessAutoUpgraderTarget(s, id)).toMatchObject({ ok: false, state: s });
    const unowned = { ...portfolio(), automation: createInitialGameState().automation };
    expect(setBusinessAutoUpgraderTarget(unowned, L)).toEqual({ ok: false, state: unowned, error: 'automation-not-owned' });
  });
  it.each([L, C, N] as const)('automatic %s uses exactly the same paid upgrade transaction as manual', target => {
    const s = portfolio(), input = { ...s, automation: { ...s.automation, businessAutoUpgradeTargetId: target } };
    expect(attemptBusinessAutoUpgrade(input)).toEqual({ ...upgradeBusiness(input, target), outcome: 'upgraded' });
  });
  it('consumes unaffordable attempts and uses only Cash earned before the later boundary', () => {
    const s = autoUpgraderState(), input = { ...s, economy: { cash: money('0') }, businesses: { ...createInitialGameState().businesses, owned: { [L]: { level: 1 } } },
      automation: { ...s.automation, businessAutoUpgradeTargetId: L } };
    const first = simulate(input, 180000); expect(first.state.economy.cash).toBe('90000'); expect(first.autoUpgrader?.levelsPurchased).toBe(0);
    const later = simulate(first.state, 60000); expect(later.state.businesses.owned[L]?.level).toBe(2);
    expect(later.state.economy.cash).toBe('35000'); expect(later.state.automation.businessAutoUpgradeElapsedMs).toBe(0);
    expect(later.state.progression.xp).toBe(input.progression.xp + 25);
  });
  it('max transition buys one final level, retains target and collapses later no-ops', () => {
    const s = portfolio(), input = { ...s, businesses: { ...s.businesses, owned: { [L]: { level: 99 } } },
      economy: { cash: money('10000000000') }, automation: { ...s.automation, businessAutoUpgradeTargetId: L } };
    const result = simulate(input, 43200000);
    expect(result.state.businesses.owned[L]?.level).toBe(100);
    expect(result.autoUpgrader).toEqual({ targetId: L, levelsPurchased: 1, spent: '980100000' });
    expect(result.state.automation.businessAutoUpgradeTargetId).toBe(L);
  });
  it.each(['disabled', 'unowned'])('%s automation never spends or changes Business levels', mode => {
    const s = portfolio(), input = { ...s, automation: mode === 'unowned' ? createInitialGameState().automation : { ...s.automation, enabledIds: [] } };
    expect(simulate(input, 43200000).state.businesses.owned).toEqual(input.businesses.owned);
  });
  it('rejects automatic XP overflow atomically', () => {
    const s = portfolio(), input = { ...s, progression: { xp: MAX_XP } };
    const result = simulateGameElapsed(input, 10000); expect(result).toMatchObject({ ok: false, error: 'xp-overflow', state: input });
  });
  it('oversized non-collapsible selected-target work fails without partial state', () => {
    const s = portfolio(), input = { ...s, economy: { cash: money('0') }, businesses: { ...s.businesses, owned: { [N]: { level: 1 } } },
      automation: { ...s.automation, businessAutoUpgradeTargetId: N, businessAutoUpgradeElapsedMs: 0 } };
    const before = structuredClone(input), r = simulateGameElapsed(input, 4097 * 30000);
    expect(r).toMatchObject({ ok: false, state: input, error: 'simulation-limit' }); expect(input).toEqual(before);
  });
});
describe('offline portfolio and canonical Rebirth', () => {
  it.each([0, 1, 2])('shares the unchanged cap at Never Sleeps rank %i without acquiring anything', rank => {
    const s = portfolio(), input = { ...s, automation: { ...s.automation, enabledIds: [] },
      permanentProgression: { ...s.permanentProgression, skills: rank ? { 'skill:never-sleeps': rank } : {} } };
    const r = reconcileOffline(input, 0, 86400000); if (!r.ok) throw Error(r.error);
    expect(r.progress.rewardedElapsedMs).toBe((8 + rank * 2) * 3600000);
    expect(r.state).toEqual(simulate(input, r.progress.rewardedElapsedMs).state);
    expect(r.state.businesses.owned).toEqual(input.businesses.owned);
  });
  it('offline Cash never acquires a new Business and offline eligibility never triggers Rebirth', () => {
    const s = autoUpgraderState(); const result = reconcileOffline(s, 0, 43200000); if (!result.ok) throw Error(result.error);
    expect(Object.keys(result.state.businesses.owned)).toEqual([D.id]);
    expect(result.state.permanentProgression.rebirthCount).toBe(s.permanentProgression.rebirthCount);
  });
  it('resets all four Businesses and target while retaining permanent progression and the original EP formula', () => {
    const s = rebirthState(), input = { ...s, businesses: { ...s.businesses, owned: { ...s.businesses.owned, ...Object.fromEntries(BUSINESS_CATALOG.slice(1).map(b => [b.id, { level: 40 }])) } }, automation: portfolio().automation };
    const result = performRebirth(input); expect(result.ok).toBe(true); expect(result.state.businesses).toEqual(createInitialGameState().businesses);
    expect(result.state.automation).toEqual(createInitialGameState().automation); expect(result.state.garage).toEqual(input.garage);
    expect(result.state.permanentProgression.empirePoints).toBe(input.permanentProgression.empirePoints + 4);
    expect(selectRebirth(result.state).eligible).toBe(false);
  });
  it('preserves the existing offline Dockside Auto-Upgrader higher-EP behavior', () => {
    const s = autoUpgraderState(25, '1000000000');
    const enabled = reconcileOffline(s, 0, 28800000), disabled = reconcileOffline({ ...s, automation: { ...s.automation, enabledIds: [] } }, 0, 28800000);
    if (!enabled.ok || !disabled.ok) throw Error('offline');
    expect(enabled.state.businesses.owned[D.id]!.level).toBeGreaterThan(disabled.state.businesses.owned[D.id]!.level);
    expect(selectRebirth(enabled.state).reward).toBeGreaterThan(selectRebirth(disabled.state).reward!);
  });
});
