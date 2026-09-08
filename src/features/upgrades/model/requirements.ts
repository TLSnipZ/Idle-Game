import type { BusinessState } from '../../businesses';
import type { UpgradeDefinition } from './upgrade';
/** Shared by purchases, selectors, source collection and validated saves. */
export function meetsUpgradeRequirement(upgrade: UpgradeDefinition, owned: BusinessState['owned']): boolean {
  switch (upgrade.requirement.kind) {
    case 'none': return true;
    case 'any-business': return Object.keys(owned).length > 0;
    case 'business': return Object.hasOwn(owned, upgrade.requirement.businessId);
  }
}
