import { MANHUNT_HEAT, DECOY_HEAT_REDUCTION } from '../config/heat-config';
import { isHeat } from './heat';
export function getManhunt(heat: number) {
  if (!isHeat(heat)) throw new RangeError('Invalid authoritative MANHUNT Heat');
  const active = heat >= MANHUNT_HEAT;
  return { active, travelBlocked: active, threshold: MANHUNT_HEAT,
    heatToClear: active ? heat - MANHUNT_HEAT + 1 : 0,
    heatAfterDecoy: active ? Math.max(0, heat - DECOY_HEAT_REDUCTION) : heat };
}
