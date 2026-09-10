import { describe, expect, it, vi } from 'vitest';
import { BUSINESS_CATALOG, STARTER_BUSINESS as D, getLevelProduction, getUpgradeCost, MAX_BUSINESS_LEVEL } from '../features/businesses';
import { moneyFromMinorUnits as money } from '../features/economy';
import { getXpThresholdForLevel, MAX_XP } from '../features/progression';
import { STARTER_VEHICLE } from '../features/vehicles';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { purchaseBusiness } from './purchase-business';
import { upgradeBusiness } from './upgrade-business';
import { evaluateBusinessProduction, effectiveProductionRates } from './effective-stats';
import { simulateElapsed } from './simulate-elapsed';
import { evaluateRequirements } from './requirements';
import { selectBusinessProgress } from './selectors';
import { rational, addRational, ZERO_RATIONAL } from '../shared/rational';

const packages = [
  { id: 'business:neon-laundry', price: '3500000', base: '500', upgrade: '100000', player: 5, dock: 7 },
  { id: 'business:afterdark-customs', price: '12500000', base: '1500', upgrade: '400000', player: 10, dock: 12 },
  { id: 'business:solara-nights', price: '40000000', base: '4000', upgrade: '1200000', player: 16, dock: 0 },
] as const;
function ready(player = 20, dock = 25): GameState {
  const s = createInitialGameState();
  return { ...s, economy: { cash: money('100000000000') }, progression: { xp: getXpThresholdForLevel(player) },
    businesses: { ...s.businesses, owned: dock ? { [D.id]: { level: dock } } : {} },
    city: { ...s.city, ownedTerritoryIds: [...s.city.ownedTerritoryIds, 'territory:neon-mile'] } };
}
function definition(id: string) { const d = BUSINESS_CATALOG.find(b => b.id === id); if (!d) throw Error(id); return d; }
function elapsed(s: GameState, ms: number) { const r = simulateElapsed(s, ms); if (!r.ok) throw Error(r.error); return r.state; }

describe('approved Business portfolio authority', () => {
  it('retains Dockside balance and canonical four-content order', () => {
    expect(BUSINESS_CATALOG.map(b => b.id)).toEqual([D.id, ...packages.map(p => p.id)]);
    expect(D).toMatchObject({ id: 'business:dockside-detail', purchaseCost: '15000', requirements: [], baseProductionCentsPerSecond: '75', baseUpgradeCost: '15000' });
    expect(MAX_BUSINESS_LEVEL).toBe(100);
  });
  for (const p of packages) describe(p.id, () => {
    it('has the exact approved package and only its approved gates', () => {
      const d = definition(p.id);
      expect(d).toMatchObject({ purchaseCost: p.price, baseProductionCentsPerSecond: p.base, baseUpgradeCost: p.upgrade });
      expect(d.requirements).toEqual([{ type: 'player-level', minimumLevel: p.player }, p.dock
        ? { type: 'business-level', businessId: D.id, minimumLevel: p.dock }
        : { type: 'territory-owned', territoryId: 'territory:neon-mile' }]);
    });
    it('rejects either missing progression gate without mutation', () => {
      const first = ready(p.player - 1, p.dock), valid = ready(p.player, p.dock);
      const second = p.dock ? ready(p.player, p.dock - 1) : { ...valid, city: createInitialGameState().city };
      for (const s of [first, second]) expect(purchaseBusiness(s, p.id)).toMatchObject({ ok: false, state: s, error: 'prerequisite-not-met' });
    });
    it('uses exact affordability; acquisition creates only Level 1 with no XP, Heat or upgrade statistic', () => {
      let s = ready(p.player, p.dock);
      if (p.dock) s = { ...s, city: createInitialGameState().city };
      const poor = { ...s, economy: { cash: money(String(BigInt(p.price) - 1n)) } };
      expect(purchaseBusiness(poor, p.id)).toEqual({ ok: false, state: poor, error: 'insufficient-funds' });
      s = { ...s, economy: { cash: money(p.price) } };
      const result = purchaseBusiness(s, p.id); expect(result.ok).toBe(true);
      expect(result.state).toEqual({ ...s, economy: { cash: '0' }, businesses: { ...s.businesses, owned: { ...s.businesses.owned, [p.id]: { level: 1 } } } });
      expect(purchaseBusiness(result.state, p.id)).toEqual({ ok: false, state: result.state, error: 'already-owned' });
    });
    it.each([1, 5, 10, 50, 99])('prices a paid upgrade at current Level %i exactly', level => {
      expect(getUpgradeCost(definition(p.id), level)).toBe(String(BigInt(p.upgrade) * BigInt(level * level)));
    });
    it.each([1, 5, 10, 50, 100])('produces the approved linear rate at Level %i', level => {
      expect(getLevelProduction(definition(p.id), level)).toBe(String(BigInt(p.base) * BigInt(level)));
    });
    it('upgrades only the selected Business with normal XP/statistics and unchanged Heat', () => {
      const s = ready(), owned = { ...s, businesses: { ...s.businesses, owned: { ...s.businesses.owned, [p.id]: { level: 1 } } } };
      const result = upgradeBusiness(owned, p.id); expect(result.ok).toBe(true);
      expect(result.state.economy.cash).toBe(String(BigInt(owned.economy.cash) - BigInt(p.upgrade)));
      expect(result.state.businesses.owned).toEqual({ ...owned.businesses.owned, [p.id]: { level: 2 } });
      expect(result.state.progression.xp).toBe(owned.progression.xp + 25);
      expect(result.state.permanentProgression.statistics.businessLevelsPurchased).toBe(1);
      expect(result.state.city).toEqual(owned.city);
      expect(result.state.automation).toEqual(owned.automation);
      expect(selectBusinessProgress(result.state, p.id)?.production).toEqual(rational(BigInt(p.base) * 2n));
    });
    it('rejects unowned, poor, maxed and overflowing upgrades atomically', () => {
      const s = ready(), base = { ...s, businesses: { ...s.businesses, owned: { ...s.businesses.owned, [p.id]: { level: 1 } } } };
      const cases = [s, { ...base, economy: { cash: money('0') } },
        { ...base, businesses: { ...base.businesses, owned: { ...base.businesses.owned, [p.id]: { level: 100 } } } },
        { ...base, progression: { xp: MAX_XP } },
        { ...base, permanentProgression: { ...base.permanentProgression, statistics: { ...base.permanentProgression.statistics, businessLevelsPurchased: Number.MAX_SAFE_INTEGER } } }];
      for (const state of cases) { const before = structuredClone(state); const result = upgradeBusiness(state, p.id); expect(result.ok).toBe(false); expect(result.state).toBe(state); expect(state).toEqual(before); }
    });
  });
  it('rejects unknown IDs and keeps selectors/purchases free of clock and RNG side effects', () => {
    const s = ready(); const random = vi.spyOn(Math, 'random').mockImplementation(() => { throw Error('RNG'); });
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => { throw Error('clock'); });
    try {
      expect(purchaseBusiness(s, 'business:unknown').ok).toBe(false); expect(upgradeBusiness(s, 'business:unknown').ok).toBe(false);
      for (const p of packages) { expect(evaluateRequirements(s, definition(p.id).requirements).met).toBe(true); expect(purchaseBusiness(s, p.id).ok).toBe(true); }
      elapsed(s, 997);
    } finally { random.mockRestore(); clock.mockRestore(); }
  });
  it('aggregates all four exactly and applies KX-R once; Neon Mile never boosts Business production', () => {
    const s = ready(), portfolio = { ...s, businesses: { ...s.businesses, owned: Object.fromEntries(BUSINESS_CATALOG.map(b => [b.id, { level: 1 }])) } };
    const total = (state: GameState) => { const r = effectiveProductionRates(state); if (!r.ok) throw Error(r.error); return r.rates.reduce(addRational, ZERO_RATIONAL); };
    expect(total(portfolio)).toEqual(rational(6075n));
    expect(total({ ...portfolio, city: createInitialGameState().city })).toEqual(total(portfolio));
    expect(total({ ...portfolio, garage: { ownedVehicleIds: [STARTER_VEHICLE.id] } })).toEqual(rational(13365n, 2n));
  });
  it('keeps Dockside equipment scoped and global Skill/vehicle modifiers on all Businesses', () => {
    const s = ready(), enhanced = { ...s, upgrades: { purchasedIds: ['upgrade:commercial-pressure-washer' as const] },
      garage: { ownedVehicleIds: [STARTER_VEHICLE.id] }, permanentProgression: { ...s.permanentProgression, skills: { 'skill:streetwise-investment': 1 } } };
    expect(evaluateBusinessProduction(enhanced, packages[0].id, 1)).toMatchObject({ ok: true, effective: rational(1155n, 2n) });
    expect(evaluateBusinessProduction(enhanced, D.id, 1)).toMatchObject({ ok: true, effective: rational(3465n, 32n) });
  });
  it('pools both fractional remainders exactly across partitions, acquisition and upgrade', () => {
    const s = ready(), fractional = { ...s, businesses: { ...s.businesses, productionRemainderMilliCents: 731, productionRemainderSubMilliCents: rational(1n, 3n) }, garage: { ownedVehicleIds: [STARTER_VEHICLE.id] } };
    const before = elapsed(fractional, 333), bought = purchaseBusiness(before, packages[0].id); expect(bought.ok).toBe(true);
    expect(bought.state.businesses.productionRemainderMilliCents).toBe(before.businesses.productionRemainderMilliCents);
    expect(bought.state.businesses.productionRemainderSubMilliCents).toEqual(before.businesses.productionRemainderSubMilliCents);
    const up = upgradeBusiness(bought.state, packages[0].id); expect(up.ok).toBe(true);
    expect(up.state.businesses.productionRemainderSubMilliCents).toEqual(before.businesses.productionRemainderSubMilliCents);
    expect(elapsed(up.state, 997)).toEqual(elapsed(elapsed(up.state, 333), 664));
  });
});
