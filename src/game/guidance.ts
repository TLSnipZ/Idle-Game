import { AUTOMATIONS, DELIVERY_DISPATCHER } from '../features/automation';
import type { AutomationId } from '../features/automation';
import { BUSINESS_CATALOG, STARTER_BUSINESS, getBusinessLevel, getUpgradeCost } from '../features/businesses';
import type { BusinessId } from '../features/businesses';
import { CREW_CATALOG } from '../features/crew';
import type { CrewMemberId } from '../features/crew';
import { compareMoney, moneyFromMinorUnits, subtractMoney } from '../features/economy';
import type { Money } from '../features/economy';
import { getPlayerLevel, getXpThresholdForLevel } from '../features/progression';
import { SKILL_CATALOG, getSkillRank } from '../features/skills';
import type { SkillId } from '../features/skills';
import { TERRITORY_CATALOG } from '../features/territories';
import type { TerritoryId } from '../features/territories';
import { UPGRADE_CATALOG } from '../features/upgrades';
import type { UpgradeId } from '../features/upgrades';
import { VEHICLE_CATALOG } from '../features/vehicles';
import type { VehicleId } from '../features/vehicles';
import type { GameState } from './game-state';
import type { Requirement } from './requirement';
import { evaluateRequirements } from './requirements';
import { REBIRTH_REQUIREMENTS, selectRebirth } from './rebirth';
import { selectSkill } from './skill-selectors';

/** Read-only destinations, not executable commands or persisted quest state. */
export type GuidanceDestination =
  | { readonly kind: 'business'; readonly id: BusinessId }
  | { readonly kind: 'automation'; readonly id: AutomationId }
  | { readonly kind: 'upgrade'; readonly id: UpgradeId }
  | { readonly kind: 'vehicle'; readonly id: VehicleId }
  | { readonly kind: 'territory'; readonly id: TerritoryId }
  | { readonly kind: 'crew'; readonly id: CrewMemberId }
  | { readonly kind: 'skill'; readonly id: SkillId }
  | { readonly kind: 'jobs' }
  | { readonly kind: 'rebirth' };

interface Goal {
  readonly id: string;
  readonly name: string;
  readonly destination: Exclude<GuidanceDestination, { readonly kind: 'jobs' }>;
  readonly requirements: readonly Requirement[];
  readonly cost: Money | null;
  readonly complete: boolean;
}
export interface GuidanceCount {
  readonly label: 'Business Level' | 'Player Level' | 'Skill rank' | 'Empire Points';
  readonly current: number;
  readonly required: number;
}
export interface GuidanceBudget {
  readonly current: Money;
  readonly required: Money;
  readonly missing: Money;
  readonly purpose: 'acquisition' | 'next-upgrade';
}
interface StepDetails {
  readonly name: string;
  readonly destination: GuidanceDestination;
  readonly count?: GuidanceCount;
  readonly cash?: GuidanceBudget;
  readonly xp?: { readonly current: number; readonly required: number };
  readonly epCost?: number;
  readonly rebirthReward?: number;
}
/** Each action carries its required data; presentation never invents a zero cost/reward. */
export type GuidanceStep = StepDetails & (
  | { readonly kind: 'acquire'; readonly cash: GuidanceBudget }
  | { readonly kind: 'business-level'; readonly count: GuidanceCount; readonly cash: GuidanceBudget }
  | { readonly kind: 'player-level'; readonly count: GuidanceCount; readonly xp: { readonly current: number; readonly required: number } }
  | { readonly kind: 'skill-rank'; readonly count: GuidanceCount; readonly epCost: number }
  | { readonly kind: 'empire-points'; readonly count: GuidanceCount }
  | { readonly kind: 'rebirth'; readonly rebirthReward: number }
);
const REBIRTH_GOAL: Goal = {
  id: 'guidance:rebirth', name: 'Rebirth', destination: { kind: 'rebirth' },
  requirements: REBIRTH_REQUIREMENTS, cost: null, complete: false,
};

/** Catalogs supply every name, gate and price. Ownership never rechecks old gates. */
function catalogGoals(state: GameState): readonly Goal[] {
  return [
    ...BUSINESS_CATALOG.map((b): Goal => ({ id: b.id, name: b.name, destination: { kind: 'business', id: b.id },
      requirements: b.requirements, cost: b.purchaseCost, complete: getBusinessLevel(state.businesses, b.id) !== null })),
    ...AUTOMATIONS.map((a): Goal => ({ id: a.id, name: a.name, destination: { kind: 'automation', id: a.id },
      requirements: a.requirements, cost: a.purchaseCost, complete: state.automation.unlockedIds.includes(a.id) })),
    ...VEHICLE_CATALOG.map((v): Goal => ({ id: v.id, name: v.name, destination: { kind: 'vehicle', id: v.id },
      requirements: v.requirements, cost: v.purchaseCost, complete: state.garage.ownedVehicleIds.includes(v.id) })),
    ...TERRITORY_CATALOG.map((t): Goal => ({ id: t.id, name: t.name, destination: { kind: 'territory', id: t.id },
      requirements: t.requirements, cost: t.purchaseCost, complete: state.city.ownedTerritoryIds.includes(t.id) })),
    ...CREW_CATALOG.map((c): Goal => ({ id: c.id, name: c.name, destination: { kind: 'crew', id: c.id },
      requirements: c.requirements, cost: c.recruitmentCost, complete: state.crew.recruitedIds.includes(c.id) })),
    ...UPGRADE_CATALOG.map((u): Goal => ({ id: u.id, name: u.name, destination: { kind: 'upgrade', id: u.id },
      requirements: u.requirements, cost: u.purchaseCost, complete: state.upgrades.purchasedIds.includes(u.id) })),
    ...SKILL_CATALOG.map((s): Goal => ({ id: s.id, name: s.name, destination: { kind: 'skill', id: s.id },
      requirements: s.requirements, cost: null, complete: getSkillRank(state.permanentProgression.skills, s.id) === s.maxRank })),
    REBIRTH_GOAL,
  ];
}
function budget(state: GameState, required: Money, purpose: GuidanceBudget['purpose']): GuidanceBudget {
  const current = state.economy.cash;
  const missing = compareMoney(current, required) >= 0 ? moneyFromMinorUnits('0') : (() => {
    const difference = subtractMoney(required, current);
    if (!difference.ok) throw new RangeError('Invalid guidance cash difference');
    return difference.value;
  })();
  return { current, required, missing, purpose };
}

/** Deterministic suggested route, not an optimal strategy or mandatory purchase order.
 * Cash never selects the goal, so ticking income cannot reshuffle the route.
 * Explicit optional tracking is ephemeral input from presentation only.
 */
export function selectGuidance(state: GameState, trackedGoalId: string | null = null) {
  const catalog = catalogGoals(state);
  const goals = catalog.filter(goal => !goal.complete);
  const rebirth = selectRebirth(state);
  const recommended = rebirth.eligible ? REBIRTH_GOAL
    : goals.find(goal => goal.id === STARTER_BUSINESS.id)
      ?? goals.find(goal => goal.id === DELIVERY_DISPATCHER.id)
      ?? goals.find(goal => goal.destination.kind === 'business')
      ?? REBIRTH_GOAL;
  const selected = goals.find(goal => goal.id === trackedGoalId) ?? recommended;

  function requireGoal(id: string): Goal {
    const found = catalog.find(goal => goal.id === id);
    if (!found) throw new RangeError('Unknown guidance prerequisite');
    return found;
  }
  function prerequisite(requirement: Requirement, visited: ReadonlySet<string>): GuidanceStep {
    switch (requirement.type) {
      case 'player-level': return { kind: 'player-level', name: 'Player Level', destination: { kind: 'jobs' },
        count: { label: 'Player Level', current: getPlayerLevel(state.progression.xp), required: requirement.minimumLevel },
        xp: { current: state.progression.xp, required: getXpThresholdForLevel(requirement.minimumLevel) } };
      case 'business-level': {
        const definition = BUSINESS_CATALOG.find(b => b.id === requirement.businessId);
        if (!definition) throw new RangeError('Unknown guidance business');
        const level = getBusinessLevel(state.businesses, definition.id);
        if (level === null) return resolve(requireGoal(definition.id), visited);
        const cost = getUpgradeCost(definition, level);
        if (cost === null) throw new RangeError('Unreachable guidance business level');
        return { kind: 'business-level', name: definition.name, destination: { kind: 'business', id: definition.id },
          count: { label: 'Business Level', current: level, required: requirement.minimumLevel },
          cash: budget(state, cost, 'next-upgrade') };
      }
      case 'business-owned': return resolve(requireGoal(requirement.businessId), visited);
      case 'any-business-owned': return resolve(requireGoal(STARTER_BUSINESS.id), visited);
      case 'territory-owned': return resolve(requireGoal(requirement.territoryId), visited);
      case 'upgrade-purchased': return resolve(requireGoal(requirement.upgradeId), visited);
      case 'automation-unlocked': return resolve(requireGoal(requirement.automationId), visited);
      case 'skill-rank': return resolve(requireGoal(requirement.skillId), visited, requirement.minimumRank);
    }
  }
  function resolve(goal: Goal, previous: ReadonlySet<string> = new Set<string>(), requiredRank?: number): GuidanceStep {
    if (previous.has(goal.id)) throw new RangeError('Cyclic guidance prerequisites');
    const visited = new Set(previous).add(goal.id);
    const missing = evaluateRequirements(state, goal.requirements).requirements.filter(detail => !detail.met);
    // Establish prerequisite businesses/upgrades first: those can also grant needed XP.
    const blocker = missing.find(detail => detail.requirement.type !== 'player-level') ?? missing[0];
    if (blocker) return prerequisite(blocker.requirement, visited);
    if (goal.destination.kind === 'rebirth') {
      if (!rebirth.eligible || rebirth.reward === null) throw new RangeError('Invalid guidance Rebirth readiness');
      return { kind: 'rebirth', name: goal.name, destination: goal.destination, rebirthReward: rebirth.reward };
    }
    if (goal.destination.kind === 'skill') {
      const view = selectSkill(state, goal.destination.id);
      if (!view || view.nextCost === null) throw new RangeError('Invalid guidance skill');
      if (!view.affordable) return { kind: 'empire-points', name: goal.name, destination: { kind: 'rebirth' },
        count: { label: 'Empire Points', current: view.availableEp, required: view.nextCost } };
      return { kind: 'skill-rank', name: goal.name, destination: goal.destination,
        count: { label: 'Skill rank', current: view.rank, required: requiredRank ?? view.rank + 1 }, epCost: view.nextCost };
    }
    if (goal.cost === null) throw new RangeError('Missing guidance acquisition price');
    return { kind: 'acquire', name: goal.name, destination: goal.destination, cash: budget(state, goal.cost, 'acquisition') };
  }
  return {
    goal: { id: selected.id, name: selected.name }, step: resolve(selected),
    goals: goals.map(goal => ({ id: goal.id, name: goal.name })),
    tracked: selected.id === trackedGoalId,
  };
}
export type Guidance = ReturnType<typeof selectGuidance>;
