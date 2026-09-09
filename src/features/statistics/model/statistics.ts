/** Lifetime observations only; no gameplay evaluator reads these values. */
export interface StatisticsState {
  readonly manualJobsCompleted: number;
  readonly automatedJobsCompleted: number;
  readonly businessLevelsPurchased: number;
  readonly territoriesAcquired: number;
  readonly crewMembersRecruited: number;
  readonly eventsResolved: number;
  readonly rebirthsCompleted: number;
  readonly peakHeat: number;
}
export type CumulativeStatistic = Exclude<keyof StatisticsState, 'peakHeat'>;
export type StatisticsError = 'statistics-overflow';
export const CUMULATIVE_STATISTICS = [
  'manualJobsCompleted', 'automatedJobsCompleted', 'businessLevelsPurchased',
  'territoriesAcquired', 'crewMembersRecruited', 'eventsResolved', 'rebirthsCompleted',
] as const satisfies readonly CumulativeStatistic[];
const FIELDS = [...CUMULATIVE_STATISTICS, 'peakHeat'] as const;
function isCounter(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}
export function createInitialStatistics(rebirthsCompleted = 0): StatisticsState {
  if (!isCounter(rebirthsCompleted)) throw new RangeError('Invalid Rebirth history');
  return { manualJobsCompleted: 0, automatedJobsCompleted: 0, businessLevelsPurchased: 0,
    territoriesAcquired: 0, crewMembersRecruited: 0, eventsResolved: 0, rebirthsCompleted, peakHeat: 0 };
}
export function isStatisticsState(value: unknown): value is StatisticsState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  if (Reflect.ownKeys(value).length !== FIELDS.length) return false;
  return FIELDS.every(key => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    const entry: unknown = descriptor?.value;
    return descriptor !== undefined && descriptor.enumerable && Object.hasOwn(descriptor, 'value')
      && isCounter(entry) && (key !== 'peakHeat' || entry <= 100);
  });
}
export function incrementStatistic(state: StatisticsState, key: CumulativeStatistic, amount: number):
  { readonly ok: true; readonly state: StatisticsState }
  | { readonly ok: false; readonly state: StatisticsState; readonly error: StatisticsError } {
  if (!isStatisticsState(state) || !CUMULATIVE_STATISTICS.includes(key) || !isCounter(amount))
    throw new RangeError('Invalid authoritative statistics update');
  // Check before adding: never create an imprecise intermediate counter.
  if (amount > Number.MAX_SAFE_INTEGER - state[key]) return { ok: false, state, error: 'statistics-overflow' };
  return { ok: true, state: amount === 0 ? state : { ...state, [key]: state[key] + amount } };
}
export function recordPeakHeat(state: StatisticsState, observedHeat: number): StatisticsState {
  if (!isStatisticsState(state) || !isCounter(observedHeat) || observedHeat > 100)
    throw new RangeError('Invalid authoritative Heat observation');
  return observedHeat <= state.peakHeat ? state : { ...state, peakHeat: observedHeat };
}
