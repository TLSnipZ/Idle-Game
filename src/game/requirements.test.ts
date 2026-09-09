import { STARTER_VEHICLE as V } from '../features/vehicles';
import { describe, expect, it } from 'vitest';
import { evaluateRequirements, newlyEligibleContent } from './requirements';
import type { Requirement } from './requirement';
import { createInitialGameState } from './game-state';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { DELIVERY_DISPATCHER as D } from '../features/automation';
import { PRESSURE_WASHER as W, DETAILING_LINE as L, FLEET_LOGISTICS as F, STREET_CONNECTIONS as S, EXPRESS_TIPS as E, UPGRADE_CATALOG } from '../features/upgrades';
import { moneyFromMinorUnits } from '../features/economy';
import { purchaseUpgrade } from './purchase-upgrade';
import { purchaseAutomation } from './purchase-automation';
import { purchaseBusiness } from './purchase-business';
import { upgradeBusiness } from './upgrade-business';
import { performStarterJob } from './perform-starter-job';
import { selectUpgrade, selectCanPurchaseBusiness } from './selectors';
import { selectDispatcher } from './automation-selectors';

function eligible(xp = 1600, level = 5) {
  const state = createInitialGameState();
  return { ...state, progression: { xp }, economy: { cash: moneyFromMinorUnits('100000000') },
    businesses: { ...state.businesses, owned: { [B.id]: { level } } }, upgrades: { purchasedIds: [W.id] } };
}
describe('central AND requirements', () => {
  it('empty requirements are met, without mutation or economic effects', () => {
    const state = Object.freeze(createInitialGameState()); const requirements = Object.freeze([]);
    expect(evaluateRequirements(state,requirements)).toEqual({ met: true, requirements: [] });
    expect(state.progression.xp).toBe(0); expect(state.economy.cash).toBe('0');
  });
  it('evaluates all entries in config order even after an unmet entry', () => {
    const requirements: readonly Requirement[] = Object.freeze([
      Object.freeze({ type: 'player-level', minimumLevel: 5 }),
      Object.freeze({ type: 'business-owned', businessId: B.id }),
      Object.freeze({ type: 'upgrade-purchased', upgradeId: W.id }),
    ]);
    const state = eligible(1599); const before = JSON.stringify({ state, requirements });
    const result = evaluateRequirements(state,requirements);
    expect(result.met).toBe(false);
    expect(result.requirements.map(r => r.met)).toEqual([false,true,true]);
    expect(result.requirements.map(r => r.requirement)).toEqual(requirements);
    expect(result).toEqual(evaluateRequirements(state,requirements));
    expect(JSON.stringify({ state, requirements })).toBe(before);
  });
  it.each([
    { requirement: { type: 'business-owned', businessId: B.id } },
    { requirement: { type: 'business-level', businessId: B.id, minimumLevel: 5 } },
    { requirement: { type: 'any-business-owned' } },
    { requirement: { type: 'upgrade-purchased', upgradeId: W.id } },
  ] satisfies { requirement: Requirement }[])('ownership requirement $requirement.type', ({ requirement }) => {
    expect(evaluateRequirements(createInitialGameState(),[requirement]).met).toBe(false);
    expect(evaluateRequirements(eligible(),[requirement]).met).toBe(true);
  });
  it('supports a synthetic automation requirement without adding content', () => {
    const requirement: Requirement = { type: 'automation-unlocked', automationId: D.id };
    expect(evaluateRequirements(eligible(),[requirement]).met).toBe(false);
    const state = purchaseAutomation(eligible(),D.id).state;
    expect(evaluateRequirements(state,[requirement])).toMatchObject({ met: true, requirements: [{ description: 'Unlock Delivery Dispatcher' }] });
  });
  it.each([
    { type: 'player-level', minimumLevel: 0 }, { type: 'player-level', minimumLevel: 101 },
    { type: 'player-level', minimumLevel: 1.5 }, { type: 'player-level', minimumLevel: NaN },
    { type: 'business-level', businessId: B.id, minimumLevel: 101 },
    { type: 'business-owned', businessId: 'business:missing' },
    { type: 'upgrade-purchased', upgradeId: 'upgrade:missing' },
    { type: 'automation-unlocked', automationId: 'automation:missing' },
  ] satisfies Requirement[])('rejects invalid configured reference/level %#', requirement => {
    expect(() => evaluateRequirements(eligible(),[requirement])).toThrow(RangeError);
  });
});
describe('canonical content gates', () => {
  it('pins every AND list without changing content count or first-business access', () => {
    expect(UPGRADE_CATALOG).toHaveLength(5);
    expect(B.requirements).toEqual([]); expect(E.requirements).toEqual([]);
    expect(S.requirements).toEqual([{ type: 'player-level', minimumLevel: 2 }]);
    expect(W.requirements).toEqual([{ type: 'business-owned', businessId: B.id }]);
    expect(L.requirements).toEqual([{ type: 'business-level', businessId: B.id, minimumLevel: 5 }]);
    expect(F.requirements).toEqual([{ type: 'any-business-owned' }, { type: 'upgrade-purchased', upgradeId: W.id }, { type: 'player-level', minimumLevel: 5 }]);
    expect(D.requirements).toEqual([{ type: 'business-owned', businessId: B.id }, { type: 'player-level', minimumLevel: 3 }]);
    for (const definition of [B,...UPGRADE_CATALOG,D]) expect(evaluateRequirements(eligible(),definition.requirements).met).toBe(true);
  });
  it.each([{ xp: 99, met: false }, { xp: 100, met: true }])('Street Connections at $xp XP', ({ xp, met }) => {
    expect(selectUpgrade(eligible(xp),S.id)?.canPurchase).toBe(met);
  });
  it.each([{ xp: 399, met: false }, { xp: 400, met: true }])('Dispatcher at $xp XP', ({ xp, met }) => {
    expect(selectDispatcher(eligible(xp)).canPurchase).toBe(met);
  });
  it.each([{ xp: 1599, met: false }, { xp: 1600, met: true }])('Fleet Logistics at $xp XP', ({ xp, met }) => {
    expect(selectUpgrade(eligible(xp),F.id)?.canPurchase).toBe(met);
  });
  it('business-level increase immediately changes eligibility without resetting progression', () => {
    const state = eligible(1600,4);
    expect(selectUpgrade(state,L.id)?.canPurchase).toBe(false);
    const upgraded = upgradeBusiness(state,B.id); expect(upgraded.ok).toBe(true);
    expect(selectUpgrade(upgraded.state,L.id)?.canPurchase).toBe(true);
  });
  it('reports structured unmet requirements before spending; affordability and duplicates are distinct', () => {
    const state = { ...eligible(99), upgrades: { purchasedIds: [] } }; const before = JSON.stringify(state);
    const failed = purchaseUpgrade(state,F.id);
    expect(failed).toMatchObject({ ok: false, error: 'prerequisite-not-met', requirements: { met: false } });
    if (failed.ok || failed.error !== 'prerequisite-not-met') throw Error('fixture');
    expect(failed.requirements.requirements.filter(r => !r.met).map(r => r.requirement.type)).toEqual(['upgrade-purchased','player-level']);
    expect(failed.state).toBe(state); expect(JSON.stringify(state)).toBe(before);
    const poor = { ...eligible(), economy: { cash: moneyFromMinorUnits('0') } };
    expect(purchaseUpgrade(poor,F.id)).toEqual({ ok: false, state: poor, error: 'insufficient-funds' });
    expect(purchaseAutomation(poor,D.id)).toEqual({ ok: false, state: poor, error: 'insufficient-funds' });
    expect(purchaseAutomation(state,D.id).state).toBe(state);
    const bought = purchaseUpgrade(eligible(),F.id); expect(bought.ok).toBe(true);
    expect(purchaseUpgrade(bought.state,F.id)).toMatchObject({ ok: false, error: 'already-purchased' });
  });
  it('has no fresh-save deadlock and does not gate the first business', () => {
    let state = createInitialGameState();
    for (let i=0;i<6;i++) { const job = performStarterJob(state); expect(job.ok).toBe(true); state=job.state; }
    expect(state.progression.xp).toBe(60);
    expect(selectCanPurchaseBusiness(state,B.id)).toBe(true);
    const bought=purchaseBusiness(state,B.id); expect(bought.ok).toBe(true); state=bought.state;
    for (let i=0;i<4;i++) state=performStarterJob(state).state;
    expect(state.progression.xp).toBe(100);
    expect(selectUpgrade(state,S.id)?.eligible).toBe(true);
  });
  it('derives useful Level 2/3/5 transitions only when all other gates are met', () => {
    expect(newlyEligibleContent(eligible(99),eligible(100))).toEqual([S.name]);
    expect(newlyEligibleContent(eligible(399),eligible(400))).toEqual([D.name]);
    expect(newlyEligibleContent(eligible(1599),eligible(1600))).toEqual([F.name,V.name]);
    const before = { ...eligible(1599), upgrades: { purchasedIds: [] } };
    expect(newlyEligibleContent(before,{ ...before, progression: { xp: 1600 } })).toEqual([V.name]);
    const purchased = { ...eligible(99), upgrades: { purchasedIds: [S.id] } };
    expect(newlyEligibleContent(purchased,{ ...purchased, progression: { xp: 100 } })).toEqual([]);
  });
});
