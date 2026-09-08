import type { LevelIncrease } from '../features/progression';

export function formatXp(xp: number): string {
  return String(xp).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
export function describeLevelIncrease(increase: LevelIncrease): string {
  return increase.toLevel === increase.fromLevel + 1
    ? `LEVEL UP — Level ${increase.toLevel}`
    : `LEVEL UP — Level ${increase.fromLevel} → ${increase.toLevel}`;
}
