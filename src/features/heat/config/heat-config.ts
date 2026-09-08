import { moneyFromMinorUnits } from '../../economy';

export const MAX_HEAT = 100;
export const HEAT_DECAY_INTERVAL_MS = 60_000;
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
