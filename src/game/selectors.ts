import { readCash } from '../features/economy';
import type { Money } from '../features/economy';
import type { GameState } from './game-state';

export function selectCash(state: GameState): Money {
  return readCash(state.economy);
}
