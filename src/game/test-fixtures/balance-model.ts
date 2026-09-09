/** Development-only Phase 9C scenarios. Policy is modeled; all transitions are real domain calls. */
import { STARTER_BUSINESS as B, getBusinessLevel, getUpgradeCost } from '../../features/businesses';
import { BUSINESS_AUTO_UPGRADER as A, DELIVERY_DISPATCHER as D } from '../../features/automation';
import { EXPRESS_TIPS, STREET_CONNECTIONS, PRESSURE_WASHER, DETAILING_LINE, FLEET_LOGISTICS } from '../../features/upgrades';
import { STARTER_VEHICLE as V } from '../../features/vehicles';
import { NEON_MILE } from '../../features/territories';
import { RICO_VALE, MARA_KNOX, JAX_MERCER } from '../../features/crew';
import { getPlayerLevel } from '../../features/progression';
import { moneyFromMinorUnits } from '../../features/economy';
import type { Money } from '../../features/economy';
import type { GameState } from '../game-state';
import { createInitialGameState } from '../game-state';
import { performStarterJob } from '../perform-starter-job';
import { purchaseBusiness } from '../purchase-business';
import { upgradeBusiness } from '../upgrade-business';
import { purchaseUpgrade } from '../purchase-upgrade';
import { purchaseAutomation } from '../purchase-automation';
import { purchaseVehicle } from '../purchase-vehicle';
import { acquireTerritory } from '../acquire-territory';
import { recruitCrewMember, assignCrewMember } from '../crew-commands';
import { simulateOnlineElapsed } from '../simulate-online-elapsed';
import { reconcileOffline } from '../offline-progress';
import { selectRebirth } from '../rebirth';
import { evaluateRequirements } from '../requirements';
import { evaluateBusinessProduction, evaluateJobReward } from '../effective-stats';
import { unlockEligibleAchievements } from '../achievements';

export type PlayerModel = 'active' | 'idle-leaning' | 'optimized';
type Result = { readonly ok: boolean; readonly state: GameState };
export function successful(result: Result): GameState {
  if (!result.ok) throw new Error('Balance scenario transition failed');
  return unlockEligibleAchievements(result.state).state;
}
export function productionDollars(state: GameState): number {
  const level = getBusinessLevel(state.businesses, B.id);
  if (level === null) return 0;
  const result = evaluateBusinessProduction(state, B.id, level);
  if (!result.ok) throw new Error('Balance rate overflow');
  return Number(result.effective.numerator) / Number(result.effective.denominator) / 100;
}
function income(state: GameState, manualPerSecond: number): number {
  const reward = evaluateJobReward(state);
  if (!reward.ok) throw new Error('Balance reward overflow');
  return productionDollars(state) + Number(reward.reward) / 100 *
    (manualPerSecond + (state.automation.unlockedIds.includes(D.id) ? 1000 / D.intervalMs : 0));
}
export interface Checkpoint {
  readonly seconds: number;
  readonly manualJobs: number;
  readonly xp: number;
  readonly dockside: number;
  readonly cash: Money;
  readonly production: number;
}
export function runBalanceModel(model: PlayerModel, initial = createInitialGameState()) {
  let state = initial;
  let seconds = 0;
  const checkpoints: Record<string, Checkpoint> = {};
  let firstRebirth: GameState | undefined;
  const manualPeriod = model === 'idle-leaning' ? 1 : 5;
  const record = (name: string, condition: boolean) => {
    if (!condition || checkpoints[name]) return;
    checkpoints[name] = { seconds, manualJobs: state.permanentProgression.statistics.manualJobsCompleted,
      xp: state.progression.xp, dockside: getBusinessLevel(state.businesses, B.id) ?? 0,
      cash: state.economy.cash, production: productionDollars(state) };
  };
  const observe = () => {
    const level = getPlayerLevel(state.progression.xp);
    for (const target of [2, 7, 20]) record(`Player ${target}`, level >= target);
    for (const target of [1, 5, 10, 15, 25]) record(`Dockside ${target}`, (getBusinessLevel(state.businesses, B.id) ?? 0) >= target);
    for (const definition of [D, A]) {
      record(`${definition.name} eligible`, evaluateRequirements(state, definition.requirements).met);
      record(definition.name, state.automation.unlockedIds.includes(definition.id));
    }
    for (const definition of [V, NEON_MILE]) record(`${definition.name} eligible`, evaluateRequirements(state, definition.requirements).met);
    record(V.name, state.garage.ownedVehicleIds.includes(V.id));
    record(NEON_MILE.name, state.city.ownedTerritoryIds.includes(NEON_MILE.id));
    for (const member of [RICO_VALE, MARA_KNOX, JAX_MERCER]) record(member.name, state.crew.recruitedIds.includes(member.id));
    if (selectRebirth(state).eligible) {
      record('Rebirth eligible', true);
      firstRebirth ??= state;
    }
  };
  // Finite content-completion route. Optimized chooses the shortest immediate income payback;
  // it is a transparent greedy policy, not a proof of globally optimal human play.
  const shop = () => {
    for (let purchases = 0; purchases < 50; purchases++) {
      const actions: { name: string; apply: (s: GameState) => Result }[] = [
        { name: B.name, apply: (s: GameState) => purchaseBusiness(s, B.id) },
        ...[EXPRESS_TIPS, STREET_CONNECTIONS, PRESSURE_WASHER].map(u => ({ name: u.name, apply: (s: GameState) => purchaseUpgrade(s, u.id) })),
        { name: D.name, apply: (s: GameState) => purchaseAutomation(s, D.id) },
        ...[DETAILING_LINE, FLEET_LOGISTICS].map(u => ({ name: u.name, apply: (s: GameState) => purchaseUpgrade(s, u.id) })),
        { name: V.name, apply: (s: GameState) => purchaseVehicle(s, V.id) },
        ...[RICO_VALE, JAX_MERCER].map(c => ({ name: c.name, apply: (s: GameState) => recruitCrewMember(s, c.id) })),
        { name: NEON_MILE.name, apply: (s: GameState) => acquireTerritory(s, NEON_MILE.id) },
        { name: MARA_KNOX.name, apply: (s: GameState) => recruitCrewMember(s, MARA_KNOX.id) },
        { name: A.name, apply: (s: GameState) => purchaseAutomation(s, A.id) },
      ];
      if ((getBusinessLevel(state.businesses, B.id) ?? 0) < 25) actions.push({ name: 'Dockside upgrade', apply: (s: GameState) => upgradeBusiness(s, B.id) });
      const planning = model === 'optimized'
        ? { ...state, economy: { cash: moneyFromMinorUnits('1000000000000') } } : state;
      const available = actions.map(action => ({ ...action, result: action.apply(planning) })).filter(a => a.result.ok);
      if (model === 'optimized') {
        const before = income(state, 1 / manualPeriod);
        const payback = (candidate: Result) => {
          let projected = candidate.state;
          if (projected.crew.recruitedIds.includes(RICO_VALE.id) && !state.crew.recruitedIds.includes(RICO_VALE.id))
            projected = successful(assignCrewMember(projected, 'operations', RICO_VALE.id));
          if (projected.crew.recruitedIds.includes(JAX_MERCER.id) && !state.crew.recruitedIds.includes(JAX_MERCER.id))
            projected = successful(assignCrewMember(projected, 'logistics', JAX_MERCER.id));
          const increase = income(projected, 1 / manualPeriod) - before;
          return increase > 0 ? Number(BigInt(planning.economy.cash) - BigInt(candidate.state.economy.cash)) / 100 / increase : Infinity;
        };
        available.sort((a, b) => payback(a.result) - payback(b.result));
      }
      const action = available[0];
      if (!action) break;
      const purchase = action.apply(state);
      if (!purchase.ok) break; // Optimized saves for its chosen investment instead of buying a cheaper distraction.
      state = successful(purchase);
      record(action.name, true);
      if (action.name === RICO_VALE.name) state = successful(assignCrewMember(state, 'operations', RICO_VALE.id));
      if (action.name === JAX_MERCER.name) state = successful(assignCrewMember(state, 'logistics', JAX_MERCER.id));
      // Mara is recruited for access/completion, not substituted for the income specialist.
      observe();
    }
  };
  observe();
  // No events as a reproducible conservative cash case; there is no random expected-value credit.
  const noSpawn = { next: () => 0.999999 };
  while (seconds < 30 * 24 * 3600) {
    if (model === 'idle-leaning' && state.permanentProgression.statistics.manualJobsCompleted >= 40) {
      state = successful(reconcileOffline(state, seconds * 1000, (seconds + 8 * 3600) * 1000));
      seconds += 8 * 3600;
    } else {
      state = successful(simulateOnlineElapsed(state, manualPeriod * 1000, noSpawn));
      seconds += manualPeriod;
      state = successful(performStarterJob(state));
    }
    observe();
    shop();
    if (firstRebirth && state.automation.unlockedIds.includes(A.id) && state.crew.recruitedIds.length === 3) break;
  }
  if (!firstRebirth) throw new Error('No Rebirth reached within modeled horizon');
  return { model, checkpoints, firstRebirth, state };
}

/** Derived acquisition/upgrade bill; no copied quadratic formula. */
export function docksideBill(target: number): bigint {
  let total = BigInt(B.purchaseCost);
  for (let level = 1; level < target; level++) {
    const price = getUpgradeCost(B, level);
    if (price === null) throw new Error('Invalid checkpoint');
    total += BigInt(price);
  }
  return total;
}
