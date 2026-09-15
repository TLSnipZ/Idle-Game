import type { Modifier } from '../../../game/modifiers';

type SupportCondition =
  | { readonly kind: 'local-business'; readonly districtId: string; readonly minimumLevel: number }
  | { readonly kind: 'assigned-crew' }
  | { readonly kind: 'active-vehicle' };
export type HeatSupportRule = SupportCondition & { readonly modifier: Modifier };
/** Prospective decoy-only support; no purchase, saved unlock or passive modifier. */
export const HEAT_SUPPORT_RULES: readonly HeatSupportRule[] = Object.freeze([
  Object.freeze({ kind: 'local-business', districtId: 'territory:waterfront', minimumLevel: 10,
    modifier: Object.freeze({ id: 'modifier:decoy-dockside', sourceId: 'business:dockside-detail', target: Object.freeze({ stat: 'heat-response-cost' }), operation: 'multiply-basis-points', bonusBasisPoints: -2000 }) }),
  Object.freeze({ kind: 'local-business', districtId: 'territory:neon-mile', minimumLevel: 10,
    modifier: Object.freeze({ id: 'modifier:decoy-laundry', sourceId: 'business:neon-laundry', target: Object.freeze({ stat: 'heat-response-cost' }), operation: 'multiply-basis-points', bonusBasisPoints: -2000 }) }),
  Object.freeze({ kind: 'assigned-crew', modifier: Object.freeze({ id: 'modifier:decoy-mara', sourceId: 'crew:mara-knox', target: Object.freeze({ stat: 'heat-response-cost' }), operation: 'multiply-basis-points', bonusBasisPoints: -1000 }) }),
  Object.freeze({ kind: 'active-vehicle', modifier: Object.freeze({ id: 'modifier:decoy-lilt', sourceId: 'vehicle:namera-lilt', target: Object.freeze({ stat: 'heat-response-cost' }), operation: 'multiply-basis-points', bonusBasisPoints: -1000 }) }),
  Object.freeze({ kind: 'active-vehicle', modifier: Object.freeze({ id: 'modifier:decoy-raizan', sourceId: 'vehicle:toseki-raizan', target: Object.freeze({ stat: 'heat-response-cost' }), operation: 'multiply-basis-points', bonusBasisPoints: -1500 }) }),
]);
