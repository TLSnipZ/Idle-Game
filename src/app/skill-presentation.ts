import type { selectSkill } from '../game/skill-selectors';
import { selectSkill as select } from '../game/skill-selectors';
import type { PurchaseSkillResult } from '../game/purchase-skill-rank';
import { formatBonus } from './stat-format';
import { formatOfflineDuration } from './offline-presentation';
import { DEFAULT_LOCALE } from './localization';
import type { Locale } from './localization';
import { localize } from './LocalizationProvider';
import { localizedContent } from './content-localization';

type SkillView = NonNullable<ReturnType<typeof selectSkill>>;
export function describeSkillEffect(effect: SkillView['currentEffect'], locale: Locale = DEFAULT_LOCALE): string {
  if (effect.type === 'offline-cap') return localize(locale, `${formatOfflineDuration(effect.capMs)} offline cap`, `${formatOfflineDuration(effect.capMs)} Offline-Limit`);
  const scope = effect.target.stat === 'business-production' ? localize(locale, 'global business production', 'globale Business-Produktion')
    : effect.target.stat === 'job-reward' ? localize(locale, 'Starter Job cash reward', 'Cash aus Jobs') : localize(locale, 'XP gain', 'XP-Gewinn');
  return `${formatBonus(effect.basisPoints)} ${scope}`;
}
export function describeSkillPurchase(result: PurchaseSkillResult, id: unknown, locale: Locale = DEFAULT_LOCALE): string {
  if (result.ok) {
    const view = select(result.state, id);
    if (!view) throw new RangeError('Missing purchased skill');
    const name = localizedContent(locale, view.skill.id, 'name', view.skill.name);
    return localize(locale,
      `${name} upgraded to Rank ${view.rank}. −${view.skill.costPerRank} EP · ${describeSkillEffect(view.currentEffect, locale)}. Permanent across Rebirth.`,
      `${name} auf Rang ${view.rank}. −${view.skill.costPerRank} EP · ${describeSkillEffect(view.currentEffect, locale)}. Permanent durch Rebirth — endlich etwas, das nicht verschwindet.`);
  }
  switch (result.error) {
    case 'unknown-skill': return localize(locale, 'This skill is unavailable. No Empire Points were spent.', 'Skill nicht verfügbar. Keine Empire Points verbrannt, also fast ein Gewinn.');
    case 'insufficient-empire-points': return localize(locale, 'Not enough Empire Points. No rank was purchased.', 'Zu wenig Empire Points. Macht auf Raten wurde leider abgelehnt.');
    case 'max-rank-reached': return localize(locale, 'This skill is already at max rank. No Empire Points were spent.', 'Skill schon auf Max-Rang. Mehr Kompetenz wäre vermutlich verdächtig.');
    case 'prerequisite-not-met': return localize(locale, 'Requirements not met.', 'Voraussetzungen nicht erfüllt. Auch permanente Macht braucht Bürokratie.');
  }
}
