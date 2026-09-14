import { describe, expect, it } from 'vitest';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { evaluateDecoyCost } from './heat-support';
import { selectDecoy, deployDecoy } from './deploy-decoy';
import { HEAT_SUPPORT_RULES } from '../features/heat';
import { moneyFromMinorUnits } from '../features/economy';
import { WATERFRONT as W, NEON_MILE as N, switchCityDistrict } from '../features/territories';
import { evaluateStat, wholeStatValue } from './modifiers';
import { serializeSave, parseSave } from './save-schema';
import { exportSaveCode, validateSaveCode } from './save-code';
import { performRebirth } from './rebirth';
import { rebirthState } from './test-fixtures/rebirth-state';
import { simulateGameElapsed } from './simulate-game-elapsed';
import { reconcileOffline } from './offline-progress';

const MARA = 'crew:mara-knox', LILT = 'vehicle:namera-lilt', KXR = 'vehicle:kairo-kx-r';
function network(business = true, crew = true, car = true, neon = false): GameState {
  const s = createInitialGameState();
  const city = { ...s.city, heat: 100, heatDecayElapsedMs: 12345, ownedTerritoryIds: [W.id, N.id] };
  return { ...s, economy: { cash: moneyFromMinorUnits('125000') },
    city: neon ? { ...switchCityDistrict(city, N.id), heat: 100, heatDecayElapsedMs: 23456 } : city,
    businesses: { ...s.businesses, owned: {
      'business:dockside-detail': { level: business ? 10 : 9 },
      'business:neon-laundry': { level: business ? 10 : 9 } } },
    crew: { recruitedIds: [MARA], assignments: { operations: crew ? MARA : null, logistics: null } },
    garage: { ownedVehicleIds: [KXR, LILT], activeVehicleId: car ? LILT : KXR } };
}
const combinations = [false, true].flatMap(neon => [false, true].flatMap(business =>
  [false, true].flatMap(crew => [false, true].map(car => ({ business, crew, car, neon })))));
describe('Heat V support network', () => {
  it.each(combinations)('exact local pricing for %j', ({ business, crew, car, neon }) => {
    const s = network(business, crew, car, neon), before = JSON.stringify(s);
    const expected = 125000n * (business ? 80n : 100n) * (crew ? 90n : 100n) * (car ? 90n : 100n) / 1000000n;
    const price = evaluateDecoyCost(s);
    expect(price.cost).toBe(expected.toString());
    expect(price.applied).toHaveLength(Number(business) + Number(crew) + Number(car));
    const local = price.applied.filter(m => m.sourceId.startsWith('business:'));
    if (business) expect(local[0]?.sourceId).toBe(neon ? 'business:neon-laundry' : 'business:dockside-detail');
    const result = deployDecoy(s);
    expect(result.ok).toBe(true);
    expect(result.state.economy.cash).toBe((125000n - expected).toString());
    expect(result.state.city.heat).toBe(70);
    expect(result.state.city.heatDecayElapsedMs).toBe(s.city.heatDecayElapsedMs);
    expect(result.state.city.districts).toBe(s.city.districts);
    expect(result.state.permanentProgression).toBe(s.permanentProgression);
    expect(JSON.stringify(s)).toBe(before);
  });
  it('never uses an out-of-district Business, unassigned Crew or inactive vehicle', () => {
    const s = network(false, false, false);
    const elsewhere = { ...s, businesses: { ...s.businesses, owned: { 'business:neon-laundry': { level: 100 } } } };
    expect(evaluateDecoyCost(elsewhere).cost).toBe('125000');
    expect(evaluateDecoyCost({ ...elsewhere, city: switchCityDistrict(elsewhere.city, N.id) }).cost).toBe('100000');
    expect(evaluateDecoyCost(createInitialGameState()).applied).toEqual([]);
  });
  it('uses the discounted affordability boundary without partial spending or cooling', () => {
    const s = network();
    const enough = { ...s, economy: { cash: moneyFromMinorUnits('81000') } };
    const short = { ...s, economy: { cash: moneyFromMinorUnits('80999') } };
    expect(selectDecoy(enough)).toMatchObject({ cost: '81000', available: true, baseCost: '125000' });
    expect(deployDecoy(enough)).toMatchObject({ ok: true, state: { economy: { cash: '0' }, city: { heat: 70 } } });
    expect(selectDecoy(short).available).toBe(false);
    expect(deployDecoy(short)).toEqual({ ok: false, state: short, error: 'insufficient-funds' });
    expect(deployDecoy({ ...enough, city: { ...s.city, heat: 79 } })).toMatchObject({ ok: false, error: 'no-manhunt' });
  });
  it('shares exact modifier arithmetic, floors only once and does not leak into other stats', () => {
    const modifiers = evaluateDecoyCost(network()).applied;
    const value = evaluateStat(moneyFromMinorUnits('125001'), { stat: 'heat-response-cost' }, modifiers);
    if (!value.ok) throw Error('fixture');
    expect(value.effective).toEqual({ numerator: '10125081', denominator: '125' });
    expect(wholeStatValue(value.effective)).toBe('81000');
    for (const target of [{ stat: 'job-reward' }, { stat: 'business-production', businessId: null }] as const) {
      const other = evaluateStat(moneyFromMinorUnits('10000'), target, modifiers);
      expect(other).toMatchObject({ ok: true, applied: [], effective: { numerator: '10000', denominator: '1' } });
    }
    expect(new Set(HEAT_SUPPORT_RULES.map(r => r.modifier.id)).size).toBe(HEAT_SUPPORT_RULES.length);
    expect(() => evaluateStat(moneyFromMinorUnits('125000'), { stat: 'heat-response-cost' }, [modifiers[0]!, modifiers[0]!])).toThrow(RangeError);
  });
  it('v20/CE1 derive the network after reload and never save a price or unlock flag', () => {
    const s = network(true, true, true, true), save = serializeSave(s, 1000), code = exportSaveCode(s, 1000);
    if (!save.ok || !code.ok) throw Error('fixture');
    const loaded = parseSave(save.serialized);
    expect(validateSaveCode(code.code)).toEqual(loaded);
    if (!loaded.ok) throw Error('fixture');
    expect(loaded.envelope.version).toBe(22);
    expect(evaluateDecoyCost(loaded.envelope.state)).toEqual(evaluateDecoyCost(s));
    expect(save.serialized).not.toMatch(/support|discount|baseCost|decoy/i);
  });
  it('Rebirth removes run support and retains only an active permanent Lilt', () => {
    const s = network(), result = performRebirth({ ...rebirthState(), city: s.city, crew: s.crew, garage: s.garage });
    expect(result.ok).toBe(true);
    expect(evaluateDecoyCost(result.state)).toMatchObject({ cost: '112500' });
    expect(evaluateDecoyCost(result.state).applied.map(m => m.sourceId)).toEqual([LILT]);
    expect(evaluateDecoyCost(createInitialGameState()).cost).toBe('125000');
  });
  it('offline reconciliation never spends on support and remains the same simulation path', () => {
    const s = network(), elapsed = 3600000;
    const online = simulateGameElapsed(s, elapsed), offline = reconcileOffline(s, 1000, 1000 + elapsed);
    expect(online.ok).toBe(true); expect(offline.state).toEqual(online.state);
    expect(BigInt(offline.state.economy.cash)).toBeGreaterThan(BigInt(s.economy.cash));
    expect(offline.state.city.heat).toBe(14); // Assigned Mara and Lilt: 42-second cooling.
  });
});
