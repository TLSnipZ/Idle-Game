import type { LevelIncrease } from '../features/progression';

export { formatInteger as formatXp } from './number-format';
export function describeLevelIncrease(increase: LevelIncrease): string {
  return increase.toLevel === increase.fromLevel + 1
    ? `LEVEL UP — Level ${increase.toLevel}`
    : `LEVEL UP — Level ${increase.fromLevel} → ${increase.toLevel}`;
}
