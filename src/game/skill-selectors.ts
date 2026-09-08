import { getOfflineCapMs } from './offline-cap';
import { EMPIRE_FOUNDATIONS, findSkill, getSkillRank, getSkillEffect } from '../features/skills';
import type { GameState } from './game-state';
import { evaluateRequirements } from './requirements';

export function selectSkill(state: GameState, id: unknown) {
  const skill = findSkill(id);
  if (!skill) return null;
  const rank = getSkillRank(state.permanentProgression.skills, skill.id);
  const maxed = rank === skill.maxRank;
  const requirements = evaluateRequirements(state, skill.requirements);
  const nextCost = maxed ? null : skill.costPerRank;
  const affordable = nextCost !== null && state.permanentProgression.empirePoints >= nextCost;
  const strength = (level: number) => {
    const effect = getSkillEffect(skill, level);
    if (effect.type === 'stat') return effect;
    const skills = { ...state.permanentProgression.skills };
    if (level === 0) delete skills[skill.id]; else skills[skill.id] = level;
    return { type: 'offline-cap' as const, capMs: getOfflineCapMs({ ...state,
      permanentProgression: { ...state.permanentProgression, skills } }) };
  };
  return { skill, tree: EMPIRE_FOUNDATIONS, rank, maxRank: skill.maxRank, maxed, nextCost,
    currentEffect: strength(rank), nextEffect: maxed ? null : strength(rank + 1),
    requirements, affordable, insufficientEp: !maxed && !affordable,
    canPurchase: !maxed && requirements.met && affordable, availableEp: state.permanentProgression.empirePoints };
}
