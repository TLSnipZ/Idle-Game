import type { RandomSource } from '../features/events';
/** Only production RNG adapter. No call until an eligible online opportunity. */
export const browserRandom: RandomSource = { next: () => Math.random() };
