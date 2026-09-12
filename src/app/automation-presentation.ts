import type { ToggleAutomationResult } from '../game/set-automation-enabled';
import { formatReward } from './number-format';
import type { AutomationSummary } from '../game/simulate-automation';
import { DEFAULT_LOCALE } from './localization';
import type { Locale } from './localization';
import { localize } from './LocalizationProvider';

export function describeAutomatedJobs(summary: AutomationSummary, locale: Locale = DEFAULT_LOCALE): string {
  return localize(locale,
    `${summary.completedJobs} automated ${summary.completedJobs === 1 ? 'delivery' : 'deliveries'} · +${formatReward(summary.income)} · +${summary.xpEarned} XP`,
    `${summary.completedJobs} automatisierte ${summary.completedJobs === 1 ? 'Lieferung' : 'Lieferungen'} · +${formatReward(summary.income)} · +${summary.xpEarned} XP`);
}
/** Ceiling avoids displaying zero seconds before the next job has completed. */
export function formatRemainingTime(ms: number): string { return `${Math.ceil(ms / 1000)}s`; }

export function describeAutomationToggle(result: ToggleAutomationResult, enabled: boolean, locale: Locale = DEFAULT_LOCALE): string {
  if (result.ok) return enabled
    ? localize(locale, 'Business Auto-Upgrader enabled. Cash will fund affordable upgrades.', 'Business Auto-Upgrader aktiviert. Dein Cash darf jetzt selbstständig Karriere machen.')
    : localize(locale, 'Business Auto-Upgrader disabled. Upgrade progress is paused.', 'Business Auto-Upgrader deaktiviert. Dein Konto bekommt kurz Aufsicht.');
  switch (result.error) {
    case 'automation-not-owned': return localize(locale, 'Purchase Business Auto-Upgrader first.', 'Erst den Business Auto-Upgrader kaufen. Automatisierung arbeitet ungern gratis.');
    case 'not-toggleable': return localize(locale, 'This automation cannot be toggled.', 'Diese Automatisierung lässt sich nicht umschalten. Offenbar Betriebsrat.');
    case 'unknown-automation': return localize(locale, 'This automation is unavailable.', 'Diese Automatisierung ist nicht verfügbar. Manuelle Arbeit wurde bereits informiert.');
    case 'invalid-enabled': return localize(locale, 'The automation setting is invalid.', 'Automationsstatus ungültig. Sogar die Maschine ist verwirrt.');
  }
}
