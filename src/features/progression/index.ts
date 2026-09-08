export { MAX_XP, MAX_PLAYER_LEVEL, XP_THRESHOLD_FACTOR, XP_REWARDS } from './config/progression-config';
export { isXp, requireXp, addXp, getPlayerLevel, getLevelProgress, getXpThresholdForLevel, getLevelIncrease } from './model/progression';
export type { ProgressionState, XpError, XpResult, LevelIncrease } from './model/progression';
