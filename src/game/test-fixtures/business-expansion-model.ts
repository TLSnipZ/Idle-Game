/** POST 3A analysis-only policy, adapted from the Phase 9C route.
 * Requires the test's isolated proposed catalog seam; transitions are real domain calls. */
import { BUSINESS_PROPOSALS } from './business-expansion-proposals';
import { setAutomationEnabled } from '../set-automation-enabled';
import { STARTER_BUSINESS as B, getBusinessLevel } from '../../features/businesses';
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
  return Object.entries(state.businesses.owned).reduce((total, [id, entry]) => {
    if (!entry) throw Error('Missing owned level');
    const result = evaluateBusinessProduction(state, id, entry.level);
    if (!result.ok) throw Error('Rate overflow');
    return total + Number(result.effective.numerator) / Number(result.effective.denominator) / 100;
  }, 0);
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
  readonly businessLevels: Readonly<Record<string, number>>;
  readonly businessInvestment: string;
}
export interface RouteOptions {
  readonly expanded: boolean;
  readonly skipVehicle?: boolean;
  readonly stopAtRebirth?: boolean;
  readonly enableDocksideAuto?: boolean;
  readonly newLevelCap?: number;
  readonly omitAfterdark?: boolean;
  readonly rushNights?: boolean;
}
export function runExpansionModel(model: PlayerModel, options: RouteOptions, initial = createInitialGameState()) {
  let state = initial;
  let seconds = 0;
  let businessInvestment = 0n;
  const initialJobs = initial.permanentProgression.statistics.manualJobsCompleted;
  const catalog = [B, ...(options.expanded ? BUSINESS_PROPOSALS.filter(b => !options.omitAfterdark || b.name !== 'Afterdark Customs') : [])];
  const checkpoints: Record<string, Checkpoint> = {};
  let firstRebirth: GameState | undefined;
  const manualPeriod = model === 'idle-leaning' ? 1 : 5;
  const record = (name: string, condition: boolean) => {
    if (!condition || checkpoints[name]) return;
    checkpoints[name] = { seconds, manualJobs: state.permanentProgression.statistics.manualJobsCompleted - initialJobs,
      xp: state.progression.xp, dockside: getBusinessLevel(state.businesses, B.id) ?? 0,
      cash: state.economy.cash, production: productionDollars(state), businessInvestment: businessInvestment.toString(),
      businessLevels: Object.fromEntries(Object.entries(state.businesses.owned).map(([id, entry]) => [id, entry?.level ?? 0])) };
  };
  const observe = () => {
    const level = getPlayerLevel(state.progression.xp);
    for (const b of catalog) record(b.name, getBusinessLevel(state.businesses, b.id) !== null);
    for (const target of [2, 5, 10, 12, 16, 20]) record(`Player ${target}`, level >= target);
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
      const actions: { name: string; business?: boolean; apply: (s: GameState) => Result }[] = [
        { name: B.name, business: true, apply: (s: GameState) => purchaseBusiness(s, B.id) },
        ...[EXPRESS_TIPS, STREET_CONNECTIONS, PRESSURE_WASHER].map(u => ({ name: u.name, apply: (s: GameState) => purchaseUpgrade(s, u.id) })),
        { name: D.name, apply: (s: GameState) => purchaseAutomation(s, D.id) },
        ...[DETAILING_LINE, FLEET_LOGISTICS].map(u => ({ name: u.name, apply: (s: GameState) => purchaseUpgrade(s, u.id) })),
        ...(!options.skipVehicle ? [{ name: V.name, apply: (s: GameState) => purchaseVehicle(s, V.id) }] : []),
        ...catalog.slice(1).map(b => ({ name: b.name, business: true, apply: (s: GameState) => purchaseBusiness(s, b.id) })),
        ...[RICO_VALE, JAX_MERCER].map(c => ({ name: c.name, apply: (s: GameState) => recruitCrewMember(s, c.id) })),
        { name: NEON_MILE.name, apply: (s: GameState) => acquireTerritory(s, NEON_MILE.id) },
        { name: MARA_KNOX.name, apply: (s: GameState) => recruitCrewMember(s, MARA_KNOX.id) },
        { name: A.name, apply: (s: GameState) => purchaseAutomation(s, A.id) },
      ];
      // Finite first-run envelope. No auto-target selection is modeled here.
      for (const b of catalog) if ((getBusinessLevel(state.businesses, b.id) ?? 0) < (b.id === B.id ? 25 : options.newLevelCap ?? (model === 'optimized' ? 5 : 10)))
        actions.push({ name: `${b.name} upgrade`, business: true, apply: (s: GameState) => upgradeBusiness(s, b.id) });
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
      // Stress an explicit optional Nights-before-Rebirth detour, without changing eligibility.
      const nightlife = options.rushNights && !state.businesses.owned['business:solara-nights']
        ? available.find(a => a.name === NEON_MILE.name) ?? available.find(a => a.name === 'Solara Nights') : undefined;
      const action = nightlife ?? available[0];
      if (!action) break;
      const purchase = action.apply(state);
      if (!purchase.ok) break; // Optimized saves for its chosen investment instead of buying a cheaper distraction.
      if (action.business) businessInvestment += BigInt(state.economy.cash) - BigInt(purchase.state.economy.cash);
      state = successful(purchase);
      if (action.name === A.name && options.enableDocksideAuto) state = successful(setAutomationEnabled(state, A.id, true));
      record(action.name, true);
      if (action.name === RICO_VALE.name) state = successful(assignCrewMember(state, 'operations', RICO_VALE.id));
      if (action.name === JAX_MERCER.name) state = successful(assignCrewMember(state, 'logistics', JAX_MERCER.id));
      // Mara is recruited for access/completion, not substituted for the income specialist.
      observe();
      if (firstRebirth && options.stopAtRebirth) break;
    }
  };
  observe();
  // No events as a reproducible conservative cash case; there is no random expected-value credit.
  const noSpawn = { next: () => 0.999999 };
  while (seconds < 30 * 24 * 3600) {
    if (model === 'idle-leaning' && state.permanentProgression.statistics.manualJobsCompleted - initialJobs >= 40) {
      const offline = reconcileOffline(state, seconds * 1000, (seconds + 8 * 3600) * 1000);
      if (!offline.ok) throw Error(offline.error);
      businessInvestment += BigInt(offline.progress.autoUpgrader?.spent ?? '0');
      state = offline.state;
      seconds += 8 * 3600;
    } else {
      const online = simulateOnlineElapsed(state, manualPeriod * 1000, noSpawn);
      if (!online.ok) throw Error(online.error);
      businessInvestment += BigInt(online.autoUpgrader?.spent ?? '0');
      state = online.state;
      seconds += manualPeriod;
      state = successful(performStarterJob(state));
    }
    observe();
    if (firstRebirth && options.stopAtRebirth) break;
    shop();
    if (firstRebirth && (options.stopAtRebirth || (catalog.every(b => getBusinessLevel(state.businesses, b.id) !== null)
      && state.automation.unlockedIds.includes(A.id) && state.crew.recruitedIds.length === 3))) break;
  }
  if (!firstRebirth) throw new Error('No Rebirth reached within modeled horizon');
  return { model, checkpoints, firstRebirth, state };
}
