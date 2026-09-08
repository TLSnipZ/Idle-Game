import { MAX_XP, MAX_PLAYER_LEVEL, XP_THRESHOLD_FACTOR } from '../config/progression-config';

export interface ProgressionState { readonly xp: number }
export type XpError = 'xp-overflow';
export type XpResult = { readonly ok: true; readonly state: ProgressionState }
  | { readonly ok: false; readonly state: ProgressionState; readonly error: XpError };
export function isXp(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= MAX_XP;
}
export function requireXp(value: unknown): asserts value is number {
  if (!isXp(value)) throw new RangeError('Expected nonnegative safe integer XP');
}
/** Exact batch addition, never clamping; no per-award loop. Invalid inputs are programming errors. */
export function addXp(state: ProgressionState, amount: number, count = 1): XpResult {
  requireXp(state.xp); requireXp(amount); requireXp(count);
  const total = BigInt(state.xp) + BigInt(amount) * BigInt(count);
  if (total > BigInt(MAX_XP)) return { ok: false, state, error: 'xp-overflow' };
  return { ok: true, state: total === BigInt(state.xp) ? state : { xp: Number(total) } };
}
const THRESHOLDS: readonly number[] = Object.freeze(Array.from({ length: MAX_PLAYER_LEVEL }, (_, i) => XP_THRESHOLD_FACTOR * i * i));
export function getXpThresholdForLevel(level: number): number {
  if (!Number.isSafeInteger(level) || level < 1 || level > MAX_PLAYER_LEVEL) throw new RangeError('Invalid player level');
  const threshold = THRESHOLDS[level - 1];
  if (threshold === undefined) throw new Error('Missing player level threshold');
  return threshold;
}
export function getPlayerLevel(xp: number): number {
  requireXp(xp);
  let low = 1; let high = MAX_PLAYER_LEVEL;
  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    if (getXpThresholdForLevel(mid) <= xp) low = mid;
    else high = mid - 1;
  }
  return low;
}
export function getLevelProgress(xp: number) {
  const currentLevel = getPlayerLevel(xp);
  const currentLevelStartXp = getXpThresholdForLevel(currentLevel);
  const isMaxLevel = currentLevel === MAX_PLAYER_LEVEL;
  const nextLevelXp = isMaxLevel ? null : getXpThresholdForLevel(currentLevel + 1);
  const xpIntoLevel = xp - currentLevelStartXp;
  const xpNeededForLevel = nextLevelXp === null ? 0 : nextLevelXp - currentLevelStartXp;
  return { currentLevel, currentXp: xp, currentLevelStartXp, nextLevelXp, xpIntoLevel, xpNeededForLevel,
    isMaxLevel, progressRatio: isMaxLevel ? 1 : xpIntoLevel / xpNeededForLevel };
}
export interface LevelIncrease { readonly fromLevel: number; readonly toLevel: number }
export function getLevelIncrease(beforeXp: number, afterXp: number): LevelIncrease | null {
  const fromLevel = getPlayerLevel(beforeXp); const toLevel = getPlayerLevel(afterXp);
  return toLevel > fromLevel ? { fromLevel, toLevel } : null;
}
