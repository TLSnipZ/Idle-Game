import { CURRENT_SAVE_VERSION } from './save-schema';
import { describe, expect, it } from 'vitest';
import { UPGRADE_CATALOG, PRESSURE_WASHER, DETAILING_LINE, FLEET_LOGISTICS, STREET_CONNECTIONS, EXPRESS_TIPS } from '../features/upgrades';
import { STARTER_BUSINESS } from '../features/businesses';
import { isMoney, moneyFromMinorUnits } from '../features/economy';
import type { GameState } from './game-state';
import { createInitialGameState } from './game-state';
import { purchaseUpgrade } from './purchase-upgrade';
import { evaluateBusinessProduction, evaluateJobReward } from './effective-stats';
import { evaluateStat } from './modifiers';
import { performStarterJob } from './perform-starter-job';
import { simulateElapsed } from './simulate-elapsed';
import { serializeSave, parseSave } from './save-schema';
import { encodeSaveText, validateSaveCode } from './save-code';
import { rational } from '../shared/rational';
const id = STARTER_BUSINESS.id;
function owned(): GameState {
  const state = createInitialGameState();
  return { ...state, economy: { cash: moneyFromMinorUnits('9007199254740993') }, businesses: { ...state.businesses, owned: { [id]: { level: 4 } }, productionRemainderMilliCents: 975, productionRemainderSubMilliCents: rational(1n, 3n) } };
}
describe('five-upgrade catalog', () => {
  it('locks unique stable presentation order, costs and sources', () => {
    expect(UPGRADE_CATALOG.map(u => u.id)).toEqual(['upgrade:commercial-pressure-washer', 'upgrade:industrial-detailing-line', 'upgrade:fleet-logistics', 'upgrade:street-connections', 'upgrade:express-tips']);
    expect(UPGRADE_CATALOG.map(u => u.purchaseCost)).toEqual(['250000', '1000000', '1500000', '75000', '40000']);
    expect(new Set(UPGRADE_CATALOG.map(u => u.modifier.id)).size).toBe(5);
    for (const u of UPGRADE_CATALOG) { expect(isMoney(u.purchaseCost)).toBe(true); expect(u.modifier.sourceId).toBe(u.id); }
  });
  it.each(UPGRADE_CATALOG)('purchases $name exactly, once, immutably', upgrade => {
    const state = { ...owned(), progression: { xp: 1600 }, businesses: { ...owned().businesses, owned: { [id]: { level: 5 } } },
      upgrades: { purchasedIds: upgrade.id === FLEET_LOGISTICS.id ? [PRESSURE_WASHER.id] : [] } }; const before = JSON.stringify(state);
    const result = purchaseUpgrade(state, upgrade.id);
    expect(result.ok).toBe(true);
    expect(result.state.economy.cash).toBe(String(BigInt(state.economy.cash) - BigInt(upgrade.purchaseCost)));
    expect(result.state.businesses).toBe(state.businesses);
    expect(JSON.stringify(state)).toBe(before);
    expect(purchaseUpgrade(result.state, upgrade.id)).toEqual({ ok: false, state: result.state, error: 'already-purchased' });
    const poor = { ...state, economy: { cash: moneyFromMinorUnits('0') } };
    expect(purchaseUpgrade(poor, upgrade.id)).toEqual({ ok: false, state: poor, error: 'insufficient-funds' });
  });
  it.each([PRESSURE_WASHER, DETAILING_LINE, FLEET_LOGISTICS])('requires a business for $name', upgrade => {
    const state = { ...createInitialGameState(), economy: owned().economy };
    expect(purchaseUpgrade(state, upgrade.id)).toMatchObject({ ok: false, state, error: 'prerequisite-not-met' });
  });
  it.each([STREET_CONNECTIONS, EXPRESS_TIPS])('allows $name before business ownership', upgrade => {
    const result = purchaseUpgrade({ ...createInitialGameState(), progression: { xp: 100 }, economy: owned().economy }, upgrade.id);
    expect(result.ok).toBe(true);
    expect(simulateElapsed(result.state, 10000).state).toEqual(result.state);
    const save = serializeSave(result.state, 100); expect(save.ok).toBe(true);
    if (save.ok) expect(parseSave(save.serialized)).toMatchObject({ ok: true, envelope: { state: result.state } });
  });
  it.each([[[], '2500'], [[STREET_CONNECTIONS.id], '3000'], [[EXPRESS_TIPS.id], '3000'], [[STREET_CONNECTIONS.id, EXPRESS_TIPS.id], '3600']] as const)('credits exact job combination %#', (ids, reward) => {
    const state = { ...owned(), upgrades: { purchasedIds: [...ids] } };
    expect(evaluateJobReward(state)).toMatchObject({ ok: true, reward });
    expect(performStarterJob(state).state.economy.cash).toBe(String(BigInt(state.economy.cash) + BigInt(reward)));
  });
  it.each([[PRESSURE_WASHER, 375n], [DETAILING_LINE, 450n], [FLEET_LOGISTICS, 330n]] as const)('evaluates individual level-4 production %#', (upgrade, rate) => {
    const state = { ...owned(), upgrades: { purchasedIds: [upgrade.id] } };
    expect(evaluateBusinessProduction(state, id, 4)).toMatchObject({ ok: true, effective: rational(rate) });
  });
  it('stacks all production factors exactly and preserves both fractions across split time', () => {
    const state: GameState = { ...owned(), upgrades: { purchasedIds: UPGRADE_CATALOG.map(u => u.id) } };
    expect(state.businesses.productionRemainderMilliCents).toBe(975);
    expect(state.businesses.productionRemainderSubMilliCents).toEqual(rational(1n, 3n));
    const rate = evaluateBusinessProduction(state, id, 4);
    expect(rate).toMatchObject({ ok: true, effective: rational(2475n, 4n) });
    expect(evaluateBusinessProduction({ ...state, upgrades: { purchasedIds: [...state.upgrades.purchasedIds].reverse() } }, id, 4)).toEqual(rate);
    let split = state;
    for (let i = 0; i < 1001; i++) split = simulateElapsed(split, 1).state;
    expect(split).toEqual(simulateElapsed(state, 1001).state);
  });
  it('applies flat before percentage even when stable IDs sort the other way', () => {
    const flat = { ...EXPRESS_TIPS.modifier, id: 'z-flat', operation: 'add-flat', amount: moneyFromMinorUnits('20') } as const;
    const a = { ...STREET_CONNECTIONS.modifier, id: 'a-percent', bonusBasisPoints: 1000 };
    const b = { ...STREET_CONNECTIONS.modifier, id: 'b-percent', bonusBasisPoints: 2500 };
    const result = evaluateStat(moneyFromMinorUnits('100'), { stat: 'job-reward' }, [b, a, flat]);
    expect(result).toMatchObject({ ok: true, effective: rational(165n) });
    expect(result.ok && result.applied.map(m => m.id)).toEqual(['z-flat', 'a-percent', 'b-percent']);
    expect(evaluateStat(moneyFromMinorUnits('9'.repeat(100)), { stat: 'job-reward' }, [flat])).toEqual({ ok: false, error: 'overflow' });
  });
  it('global production applies to another business, scoped and job modifiers do not', () => {
    const result = evaluateStat(moneyFromMinorUnits('100'), { stat: 'business-production', businessId: 'business:future-test' }, UPGRADE_CATALOG.map(u => u.modifier));
    expect(result).toMatchObject({ ok: true, effective: rational(110n), applied: [FLEET_LOGISTICS.modifier] });
  });
  it('roundtrips all five through the current schema and CE1 validation', () => {
    const state: GameState = { ...owned(), upgrades: { purchasedIds: UPGRADE_CATALOG.map(u => u.id) } };
    const encoded = serializeSave(state, 1234); if (!encoded.ok) throw Error('fixture');
    expect(parseSave(encoded.serialized)).toMatchObject({ ok: true, envelope: { version: CURRENT_SAVE_VERSION, savedAt: 1234, state } });
    expect(validateSaveCode(encodeSaveText(encoded.serialized))).toMatchObject({ ok: true, envelope: { state } });
    for (const ids of [[...state.upgrades.purchasedIds, PRESSURE_WASHER.id], ['upgrade:retired']]) {
      expect(parseSave(JSON.stringify({ ...JSON.parse(encoded.serialized), state: { ...state, upgrades: { purchasedIds: ids } } })).ok).toBe(false);
    }
  });
});
