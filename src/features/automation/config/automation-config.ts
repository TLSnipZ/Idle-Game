import { NEON_MILE } from '../../territories';
import type { Requirement } from '../../../game/requirement';
import { STARTER_BUSINESS } from '../../businesses';
import { moneyFromMinorUnits } from '../../economy';
import type { AutomationId } from '../model/automation';

export const DELIVERY_DISPATCHER = Object.freeze({
  id: 'automation:delivery-dispatcher' satisfies AutomationId,
  name: 'Delivery Dispatcher',
  description: 'Put a dispatcher on the waterfront route. Deliveries keep moving while you build.',
  purchaseCost: moneyFromMinorUnits('500000'),
  intervalMs: 10_000,
  requirements: Object.freeze<Requirement[]>([{ type: 'business-owned', businessId: STARTER_BUSINESS.id },
    { type: 'player-level', minimumLevel: 3 }]),
});

export const BUSINESS_AUTO_UPGRADER = Object.freeze({
  id: 'automation:business-auto-upgrader' satisfies AutomationId,
  name: 'Business Auto-Upgrader',
  description: 'Automatically attempts one Dockside level upgrade every 30 seconds.',
  purchaseCost: moneyFromMinorUnits('5000000'),
  intervalMs: 30_000,
  targetBusinessId: STARTER_BUSINESS.id,
  requirements: Object.freeze<Requirement[]>([
    { type: 'player-level', minimumLevel: 12 },
    { type: 'business-owned', businessId: STARTER_BUSINESS.id },
    { type: 'business-level', businessId: STARTER_BUSINESS.id, minimumLevel: 15 },
    { type: 'territory-owned', territoryId: NEON_MILE.id },
  ]),
});
export const AUTOMATIONS = [DELIVERY_DISPATCHER, BUSINESS_AUTO_UPGRADER] as const;
export function findAutomation(id: unknown) { return AUTOMATIONS.find(definition => definition.id === id); }
