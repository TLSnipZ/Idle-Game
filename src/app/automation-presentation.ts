import { formatCash } from '../features/economy/ui';
import type { AutomationSummary } from '../game/simulate-automation';

export function describeAutomatedJobs(summary: AutomationSummary): string {
  return `${summary.completedJobs} automated ${summary.completedJobs === 1 ? 'delivery' : 'deliveries'} · +${formatCash(summary.income)}`;
}
/** Ceiling avoids displaying zero seconds before the next job has completed. */
export function formatRemainingTime(ms: number): string { return `${Math.ceil(ms / 1000)}s`; }
