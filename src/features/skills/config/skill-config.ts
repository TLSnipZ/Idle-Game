import type { SkillDefinition } from '../model/skill';
export const EMPIRE_FOUNDATIONS = Object.freeze({ id: 'tree:empire-foundations', name: 'Empire Foundations' } as const);
const ROOT = 'skill:streetwise-investment';
/** Explicit display order, separate from stable modifier-ID ordering. */
const definitions: SkillDefinition[] = [
  { id: ROOT, treeId: EMPIRE_FOUNDATIONS.id, name: 'Streetwise Investment',
    description: 'Build lasting instincts for profitable operations.', maxRank: 3, costPerRank: 1, requirements: [],
    effect: { type: 'stat', target: { stat: 'business-production', businessId: null }, basisPointsPerRank: 500 } },
  { id: 'skill:fast-talker', treeId: EMPIRE_FOUNDATIONS.id, name: 'Fast Talker',
    description: 'Negotiate better delivery pay, manually or through your dispatcher.', maxRank: 2, costPerRank: 1,
    requirements: [{ type: 'skill-rank', skillId: ROOT, minimumRank: 1 }],
    effect: { type: 'stat', target: { stat: 'job-reward' }, basisPointsPerRank: 1000 } },
  { id: 'skill:learn-the-streets', treeId: EMPIRE_FOUNDATIONS.id, name: 'Learn the Streets',
    description: 'Gain more XP from deliveries and business level increases.', maxRank: 2, costPerRank: 2,
    requirements: [{ type: 'skill-rank', skillId: ROOT, minimumRank: 1 }],
    effect: { type: 'stat', target: { stat: 'xp-reward' }, basisPointsPerRank: 1000 } },
  { id: 'skill:silent-partner', treeId: EMPIRE_FOUNDATIONS.id, name: 'Silent Partner',
    description: 'Permanent backing strengthens every business.', maxRank: 2, costPerRank: 3,
    requirements: [{ type: 'skill-rank', skillId: ROOT, minimumRank: 3 }],
    effect: { type: 'stat', target: { stat: 'business-production', businessId: null }, basisPointsPerRank: 1000 } },
  { id: 'skill:never-sleeps', treeId: EMPIRE_FOUNDATIONS.id, name: 'Never Sleeps',
    description: 'Credit more time on future returns. Discarded time stays discarded.', maxRank: 2, costPerRank: 2,
    requirements: [{ type: 'skill-rank', skillId: ROOT, minimumRank: 2 }],
    effect: { type: 'offline-cap', millisecondsPerRank: 2 * 60 * 60 * 1000 } },
];
export const SKILL_CATALOG: readonly SkillDefinition[] = Object.freeze(definitions.map((definition) => {
  // Config is immutable at every consumed level.
  Object.freeze(definition.effect);
  if (definition.effect.type === 'stat') Object.freeze(definition.effect.target);
  definition.requirements.forEach(Object.freeze);
  Object.freeze(definition.requirements);
  return Object.freeze(definition);
}));
export function findSkill(id: unknown): SkillDefinition | undefined { return SKILL_CATALOG.find(skill => skill.id === id); }
