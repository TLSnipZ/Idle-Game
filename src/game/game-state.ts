import { createInitialEconomyState } from '../features/economy';
import type { EconomyState } from '../features/economy';

export interface GameState {
  readonly economy: EconomyState;
}

export function createInitialGameState(): GameState {
  return { economy: createInitialEconomyState() };
}
