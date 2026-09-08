import { VEHICLE_CATALOG } from '../features/vehicles';
import { findBusiness, getBusinessLevel, MAX_BUSINESS_LEVEL, STARTER_BUSINESS } from '../features/businesses';
import { findUpgrade, UPGRADE_CATALOG } from '../features/upgrades';
import { DELIVERY_DISPATCHER } from '../features/automation';
import { getPlayerLevel, MAX_PLAYER_LEVEL } from '../features/progression';
import type { GameState } from './game-state';
import type { Requirement, RequirementDetail, RequirementResult } from './requirement';

function minimum(level: number, max: number) {
  if (!Number.isSafeInteger(level) || level < 1 || level > max) throw new RangeError('Invalid requirement level');
}
function businessDefinition(id: unknown) {
  const business = findBusiness(id);
  if (!business) throw new RangeError('Unknown business requirement');
  return business;
}
/** Acquisition only: never called to validate or activate already-owned content. */
export function evaluateRequirements(state: GameState, requirements: readonly Requirement[]): RequirementResult {
  const details = requirements.map((requirement): RequirementDetail => {
    switch (requirement.type) {
      case 'player-level':
        minimum(requirement.minimumLevel, MAX_PLAYER_LEVEL);
        return { requirement, met: getPlayerLevel(state.progression.xp) >= requirement.minimumLevel,
          description: `Player Level ${requirement.minimumLevel}` };
      case 'business-owned': {
        const business = businessDefinition(requirement.businessId);
        return { requirement, met: getBusinessLevel(state.businesses, business.id) !== null, description: `Own ${business.name}` };
      }
      case 'business-level': {
        const business = businessDefinition(requirement.businessId);
        minimum(requirement.minimumLevel, MAX_BUSINESS_LEVEL);
        const level = getBusinessLevel(state.businesses, business.id);
        return { requirement, met: level !== null && level >= requirement.minimumLevel,
          description: `${business.name} Level ${requirement.minimumLevel}` };
      }
      case 'any-business-owned':
        return { requirement, met: Object.keys(state.businesses.owned).length > 0, description: 'Own at least one business' };
      case 'upgrade-purchased': {
        const upgrade = findUpgrade(requirement.upgradeId);
        if (!upgrade) throw new RangeError('Unknown upgrade requirement');
        return { requirement, met: state.upgrades.purchasedIds.includes(upgrade.id), description: `Purchase ${upgrade.name}` };
      }
      case 'automation-unlocked':
        if (requirement.automationId !== DELIVERY_DISPATCHER.id) throw new RangeError('Unknown automation requirement');
        return { requirement, met: state.automation.unlockedIds.includes(requirement.automationId),
          description: `Unlock ${DELIVERY_DISPATCHER.name}` };
    }
  });
  return { met: details.every(detail => detail.met), requirements: details };
}

/** Announcement only, in explicit catalog order; affordability is not unlock eligibility. */
export function newlyEligibleContent(before: GameState, after: GameState): readonly string[] {
  const content = [
    { definition: STARTER_BUSINESS, owned: Object.hasOwn(after.businesses.owned, STARTER_BUSINESS.id) },
    ...UPGRADE_CATALOG.map(definition => ({ definition, owned: after.upgrades.purchasedIds.includes(definition.id) })),
    { definition: DELIVERY_DISPATCHER, owned: after.automation.unlockedIds.includes(DELIVERY_DISPATCHER.id) },
    ...VEHICLE_CATALOG.map(definition => ({ definition, owned: after.garage.ownedVehicleIds.includes(definition.id) })),
  ];
  return content.filter(({ definition, owned }) => !owned
    && !evaluateRequirements(before, definition.requirements).met
    && evaluateRequirements(after, definition.requirements).met).map(({ definition }) => definition.name);
}
