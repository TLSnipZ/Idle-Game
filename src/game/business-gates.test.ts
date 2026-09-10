import { describe, expect, it } from 'vitest';
import { BUSINESS_CATALOG, getUpgradeCost } from '../features/businesses';
import { moneyFromMinorUnits as money } from '../features/economy';
import { getXpThresholdForLevel } from '../features/progression';
import { createInitialGameState } from './game-state';
import { purchaseBusiness } from './purchase-business';
import { upgradeBusiness } from './upgrade-business';
import { simulateElapsed } from './simulate-elapsed';
import { evaluateRequirements } from './requirements';
import { CURRENT_SAVE_VERSION, validateSaveState } from './save-schema';
import { exportSaveCode, validateSaveCode } from './save-code';
import { performRebirth } from './rebirth';

const L = 'business:neon-laundry', A = 'business:afterdark-customs', N = 'business:solara-nights';
describe('POST 3D acquisition-only ladder', () => {
  it.each([A, N] as const)('%s keeps grandfathered ownership, production and paid upgrades through v17/CE1', id => {
    const fresh = createInitialGameState();
    const state = { ...fresh, economy: { cash: money('100000000') },
      businesses: { ...fresh.businesses, owned: { [id]: { level: 3 } } } };
    const definition = BUSINESS_CATALOG.find(b => b.id === id)!;
    expect(evaluateRequirements(state, definition.requirements).met).toBe(false);
    expect(CURRENT_SAVE_VERSION).toBe(17);
    expect(validateSaveState(state)).toEqual(state);
    const code = exportSaveCode(state, 123); if (!code.ok) throw Error(code.error);
    expect(code.code.startsWith('CE1-')).toBe(true);
    expect(validateSaveCode(code.code)).toMatchObject({ ok: true, envelope: { version: 17, state } });
    expect(purchaseBusiness(state, id)).toMatchObject({ ok: false, error: 'already-owned', state });
    const produced = simulateElapsed(state, 1000); expect(produced.ok).toBe(true);
    expect(produced.state.economy.cash).toBe(String(BigInt(state.economy.cash) + BigInt(definition.baseProductionCentsPerSecond) * 3n));
    expect(upgradeBusiness(state, id)).toMatchObject({ ok: true, state: { businesses: { owned: { [id]: { level: 4 } } } } });
  });
  it('Rebirth retains its reset and requires the new ladder when reacquiring', () => {
    const fresh = createInitialGameState();
    const prior = { ...fresh, progression: { xp: getXpThresholdForLevel(20) },
      businesses: { ...fresh.businesses, owned: { 'business:dockside-detail': { level: 25 }, [L]: { level: 10 }, [A]: { level: 8 }, [N]: { level: 1 } } } };
    const reset = performRebirth(prior); expect(reset.ok).toBe(true);
    expect(reset.state.businesses.owned).toEqual({});
    const ready = { ...reset.state, progression: prior.progression, economy: { cash: money('100000000') },
      city: { ...reset.state.city, ownedTerritoryIds: ['territory:waterfront', 'territory:neon-mile'] as const } };
    for (const id of [A, N]) expect(purchaseBusiness(ready, id)).toMatchObject({ ok: false, error: 'prerequisite-not-met' });
    const laundry = { ...ready, businesses: { ...ready.businesses, owned: { [L]: { level: 10 } } } };
    const acquired = purchaseBusiness(laundry, A); expect(acquired.ok).toBe(true);
    expect(purchaseBusiness(acquired.state, N).ok).toBe(false);
    const developed = { ...acquired.state, businesses: { ...acquired.state.businesses, owned: { [A]: { level: 8 } } } };
    expect(purchaseBusiness(developed, N).ok).toBe(true);
  });
  it.each([[L, 10, '28500000'], [A, 8, '56000000']] as const)('protects the approved investment in %s to Level %i', (id, level, expected) => {
    const definition = BUSINESS_CATALOG.find(b => b.id === id)!;
    let cost = 0n;
    for (let current = 1; current < level; current++) cost += BigInt(getUpgradeCost(definition, current)!);
    expect(cost.toString()).toBe(expected);
  });
});
