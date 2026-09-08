export * from './config/heat-config';
export { isHeat, isHeatProgress, requireHeatState, getHeatTier, gainHeat, reduceHeat, dispatcherHeatGain, decayHeat, collectHeatModifiers } from './model/heat';
export type { HeatState, HeatTier } from './model/heat';
