import { incrementStatistic, recordPeakHeat } from '../features/statistics';
import type { CumulativeStatistic, StatisticsError } from '../features/statistics';
import type { GameState } from './game-state';

/** Final Heat only. Never call on an intermediate Dispatcher heat-gain slice. */
export function observePeakHeat(state: GameState): GameState {
  const statistics = recordPeakHeat(state.permanentProgression.statistics, state.city.heat);
  return statistics === state.permanentProgression.statistics ? state
    : { ...state, permanentProgression: { ...state.permanentProgression, statistics } };
}
/** Complete a local candidate; overflow returns the entire original transaction input. */
export function countStatistic(original: GameState, candidate: GameState, key: CumulativeStatistic, amount = 1):
  { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly state: GameState; readonly error: StatisticsError } {
  const result = incrementStatistic(candidate.permanentProgression.statistics, key, amount);
  if (!result.ok) return { ok: false, state: original, error: result.error };
  return { ok: true, state: result.state === candidate.permanentProgression.statistics ? candidate
    : { ...candidate, permanentProgression: { ...candidate.permanentProgression, statistics: result.state } } };
}
