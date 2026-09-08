import type { selectSkill } from '../game/skill-selectors';
import { selectSkill as select } from '../game/skill-selectors';
import type { PurchaseSkillResult } from '../game/purchase-skill-rank';
import { formatBonus } from './stat-format';
import { formatOfflineDuration } from './offline-presentation';

type SkillView = NonNullable<ReturnType<typeof selectSkill>>;
export function describeSkillEffect(effect: SkillView['currentEffect']): string {
  if (effect.type === 'offline-cap') return `${formatOfflineDuration(effect.capMs)} offline cap`;
  const scope = effect.target.stat === 'business-production' ? 'global business production'
    : effect.target.stat === 'job-reward' ? 'starter-job Money reward' : 'XP gain';
  return `${formatBonus(effect.basisPoints)} ${scope}`;
}
export function describeSkillPurchase(result: PurchaseSkillResult, id: unknown): string {
  if (result.ok) {
    const view = select(result.state, id);
    if (!view) throw new RangeError('Missing purchased skill');
    return `${view.skill.name} upgraded to Rank ${view.rank}. −${view.skill.costPerRank} EP · ${describeSkillEffect(view.currentEffect)}. Permanent across Rebirth.`;
  }
  switch (result.error) {
    case 'unknown-skill': return 'This skill is unavailable. No Empire Points were spent.';
    case 'insufficient-empire-points': return 'Not enough Empire Points. No rank was purchased.';
    case 'max-rank-reached': return 'This skill is already at max rank. No Empire Points were spent.';
    case 'prerequisite-not-met': return 'Requirements not met: ' + result.requirements.requirements.filter(detail => !detail.met).map(detail => detail.description).join('; ') + '.';
  }
}
