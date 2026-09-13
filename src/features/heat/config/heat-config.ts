import { moneyFromMinorUnits } from '../../economy';

export const MAX_HEAT = 100;
export const HEAT_DECAY_INTERVAL_MS = 60_000;
/** Defensive floor for shared duration reductions; current Lilt/Mara minimum is 42s. */
export const MIN_HEAT_DECAY_INTERVAL_MS = 1_000;
export const MANUAL_JOB_HEAT = 1;
export const DISPATCHER_JOBS_PER_HEAT = 5;
export const NEON_MILE_ACQUISITION_HEAT = 10;
export const LAY_LOW_COST = moneyFromMinorUnits('50000');
export const LAY_LOW_REDUCTION = 10;
export const HEAT_MODIFIER_ID = 'modifier:heat-job-reward';
export const HEAT_SOURCE_ID = 'heat:city-pressure';
export const HEAT_TIERS = Object.freeze([
  Object.freeze({ id: 'cold', label: 'COLD', minimum: 0, bonusBasisPoints: 0 }),
  Object.freeze({ id: 'noticed', label: 'NOTICED', minimum: 20, bonusBasisPoints: 0 }),
  Object.freeze({ id: 'watched', label: 'WATCHED', minimum: 40, bonusBasisPoints: 0 }),
  Object.freeze({ id: 'hot', label: 'HOT', minimum: 60, bonusBasisPoints: -1000 }),
  Object.freeze({ id: 'manhunt', label: 'MANHUNT', minimum: 80, bonusBasisPoints: -2500 }),
] as const);

/** Optional manual risk; the client refuses work once the HOT tier begins. */
export const RISKY_DELIVERY_HEAT = 5;
export const RISKY_DELIVERY_HEAT_LIMIT = HEAT_TIERS[3].minimum;
export const RISKY_DELIVERY_BONUS_BASIS_POINTS = 5_000;

export const POLICE_SURVEILLANCE_HEAT = HEAT_TIERS[2].minimum;
export const WATCHED_RISK_BONUS_BASIS_POINTS = 2_500;
export const DISCREET_DELIVERY_BONUS_BASIS_POINTS = -5_000;
export const DISCREET_DELIVERY_HEAT_REDUCTION = 2;

/** Local pursuit uses the existing MANHUNT tier, never a second saved meter. */
export const MANHUNT_HEAT = HEAT_TIERS[4].minimum;
export const DECOY_COST = moneyFromMinorUnits('125000');
export const DECOY_HEAT_REDUCTION = 30;
