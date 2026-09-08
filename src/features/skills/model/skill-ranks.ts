import { findSkill, SKILL_CATALOG } from '../config/skill-config';
import type { SkillDefinition, SkillRanks } from './skill';
import type { Modifier } from '../../../game/modifiers';
/** Validate ownership shape only, never acquisition prerequisites. */
export function isSkillRanks(value: unknown): value is SkillRanks {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  return Reflect.ownKeys(value).every(id => {
    const skill = findSkill(id), descriptor = Object.getOwnPropertyDescriptor(value, id);
    if (!skill || !descriptor || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) return false;
    const rank: unknown = descriptor.value;
    return typeof rank === 'number' && Number.isSafeInteger(rank) && rank > 0 && rank <= skill.maxRank;
  });
}
export function requireSkillRanks(value: unknown): asserts value is SkillRanks {
  if (!isSkillRanks(value)) throw new RangeError('Invalid authoritative skill ranks');
}
export function getSkillRank(ranks: SkillRanks, id: unknown): number {
  requireSkillRanks(ranks);
  const skill = findSkill(id);
  if (!skill) throw new RangeError('Unknown skill');
  return Object.hasOwn(ranks, skill.id) ? ranks[skill.id] ?? 0 : 0;
}
/** One rank-to-effect calculation for simulation and preview, including rank zero. */
export function getSkillEffect(skill: SkillDefinition, rank: number) {
  if (!Number.isSafeInteger(rank) || rank < 0 || rank > skill.maxRank) throw new RangeError('Invalid skill effect rank');
  return skill.effect.type === 'stat'
    ? { type: 'stat' as const, target: skill.effect.target,
      basisPoints: Number(BigInt(rank) * BigInt(skill.effect.basisPointsPerRank)) }
    : { type: 'offline-cap' as const, extraMs: Number(BigInt(rank) * BigInt(skill.effect.millisecondsPerRank)) };
}
export function collectSkillModifiers(ranks: SkillRanks): readonly Modifier[] {
  requireSkillRanks(ranks);
  return SKILL_CATALOG.flatMap(skill => {
    const rank = getSkillRank(ranks, skill.id), effect = getSkillEffect(skill, rank);
    return rank && effect.type === 'stat' ? [{ id: `modifier:${skill.id}`, sourceId: skill.id,
      target: effect.target, operation: 'multiply-basis-points' as const,
      bonusBasisPoints: effect.basisPoints }] : [];
  });
}
