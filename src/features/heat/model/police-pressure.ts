import { getHeatTier } from './heat';
import { POLICE_SURVEILLANCE_HEAT, RISKY_DELIVERY_HEAT_LIMIT,
  RISKY_DELIVERY_BONUS_BASIS_POINTS, WATCHED_RISK_BONUS_BASIS_POINTS } from '../config/heat-config';

/** Police pressure is derived from existing Heat, never a second saved meter. */
export function getPolicePressure(heat: number) {
  const tier = getHeatTier(heat);
  const surveillance = heat >= POLICE_SURVEILLANCE_HEAT;
  return { tier, surveillance, riskyAvailable: heat < RISKY_DELIVERY_HEAT_LIMIT,
    riskyBonusBasisPoints: surveillance ? WATCHED_RISK_BONUS_BASIS_POINTS : RISKY_DELIVERY_BONUS_BASIS_POINTS };
}
