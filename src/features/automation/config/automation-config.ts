import type { Requirement } from '../../../game/requirement';
import { STARTER_BUSINESS } from '../../businesses';
import { moneyFromMinorUnits } from '../../economy';
import type { AutomationId } from '../model/automation';

export const DELIVERY_DISPATCHER = Object.freeze({
  id: 'automation:delivery-dispatcher' satisfies AutomationId,
  name: 'Delivery Dispatcher',
  description: 'Put a dispatcher on the waterfront route. Deliveries keep moving while you build.',
  purchaseCost: moneyFromMinorUnits('750000'),
  intervalMs: 10_000,
  requirements: Object.freeze<Requirement[]>([{ type: 'business-owned', businessId: STARTER_BUSINESS.id },
    { type: 'player-level', minimumLevel: 3 }]),
});
