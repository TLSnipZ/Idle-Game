/** Permanent integer counters are separate from Money and XP. */
export interface PermanentProgressionState {
  readonly empirePoints: number;
  readonly rebirthCount: number;
}
export const MAX_PERMANENT_VALUE = Number.MAX_SAFE_INTEGER;
export function isPermanentValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= MAX_PERMANENT_VALUE;
}
export function createInitialPermanentProgression(): PermanentProgressionState {
  return { empirePoints: 0, rebirthCount: 0 };
}
export function addRebirthReward(state: PermanentProgressionState, reward: number):
  { readonly ok: true; readonly state: PermanentProgressionState }
  | { readonly ok: false; readonly error: 'overflow'; readonly state: PermanentProgressionState } {
  if (!isPermanentValue(state.empirePoints) || !isPermanentValue(state.rebirthCount) || !isPermanentValue(reward))
    throw new RangeError('Invalid permanent progression');
  const points = BigInt(state.empirePoints) + BigInt(reward);
  const count = BigInt(state.rebirthCount) + 1n;
  if (points > BigInt(MAX_PERMANENT_VALUE) || count > BigInt(MAX_PERMANENT_VALUE)) return { ok: false, error: 'overflow', state };
  return { ok: true, state: { empirePoints: Number(points), rebirthCount: Number(count) } };
}
