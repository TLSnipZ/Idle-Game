import type { ToggleAutomationResult } from '../game/set-automation-enabled';
import { formatReward } from './number-format';
import type { AutomationSummary } from '../game/simulate-automation';

export function describeAutomatedJobs(summary: AutomationSummary): string {
  return `${summary.completedJobs} automated ${summary.completedJobs === 1 ? 'delivery' : 'deliveries'} · +${formatReward(summary.income)} · +${summary.xpEarned} XP`;
}
/** Ceiling avoids displaying zero seconds before the next job has completed. */
export function formatRemainingTime(ms: number): string { return `${Math.ceil(ms / 1000)}s`; }

export function describeAutomationToggle(result: ToggleAutomationResult, enabled: boolean): string {
  if (result.ok) return enabled ? 'Business Auto-Upgrader enabled. Cash will fund affordable Dockside upgrades.' : 'Business Auto-Upgrader disabled. Upgrade progress is paused.';
  switch (result.error) {
    case 'automation-not-owned': return 'Purchase Business Auto-Upgrader first.';
    case 'not-toggleable': return 'This automation cannot be toggled.';
    case 'unknown-automation': return 'This automation is unavailable.';
    case 'invalid-enabled': return 'The automation setting is invalid.';
  }
}
