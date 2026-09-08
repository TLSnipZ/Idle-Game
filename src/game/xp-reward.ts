import { addXp, MAX_XP, requireXp, XP_REWARDS } from '../features/progression';
import { collectModifiers } from './effective-stats';
import { evaluateStat } from './modifiers';
import type { GameState } from './game-state';

export type XpSource = keyof typeof XP_REWARDS;
/** Dispatcher evaluates the complete batch before flooring once. No fractional XP carry. */
export function evaluateXpReward(state: GameState, source: XpSource, count = 1) {
  requireXp(count);
  const base = BigInt(XP_REWARDS[source]) * BigInt(count);
  const result = evaluateStat(base, { stat: 'xp-reward' }, collectModifiers(state));
  if (!result.ok) return { ok: false as const, error: 'xp-overflow' as const };
  const whole = BigInt(result.effective.numerator) / BigInt(result.effective.denominator);
  if (whole > BigInt(MAX_XP)) return { ok: false as const, error: 'xp-overflow' as const };
  return { ok: true as const, reward: Number(whole), base: result.base, applied: result.applied };
}
export function awardXp(state: GameState, source: XpSource, count = 1) {
  const reward = evaluateXpReward(state, source, count);
  if (!reward.ok) return { ...reward, state: state.progression };
  return addXp(state.progression, reward.reward);
}
