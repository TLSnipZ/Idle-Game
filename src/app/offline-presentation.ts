import type { OfflineProgress } from '../game/offline-progress';

export function formatOfflineDuration(elapsedMs: number): string {
  const seconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  if (hours) return `${hours}h${minutes ? ` ${minutes}m` : ''}`;
  if (minutes) return `${minutes}m${seconds % 60 ? ` ${seconds % 60}s` : ''}`;
  return `${seconds}s`;
}
export function showOfflineReward(progress: OfflineProgress | null): progress is OfflineProgress {
  return progress !== null && progress.incomeEarned !== '0';
}
