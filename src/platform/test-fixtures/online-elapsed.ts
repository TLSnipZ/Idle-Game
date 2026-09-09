import { simulateOnlineElapsed } from '../../game/simulate-online-elapsed';
import type { GameState } from '../../game/game-state';
/** Existing runtime regressions use deterministic failed event rolls. */
export const noEventRandom = { next: () => 0.99 };
export function onlineElapsed(state: GameState, elapsedMs: number) {
  return simulateOnlineElapsed(state, elapsedMs, noEventRandom);
}
