import { describe, expect, it } from 'vitest';
import { EMPIRE_FOUNDATIONS, SKILL_CATALOG, isSkillRanks } from '../features/skills';
import { purchaseSkillRank } from './purchase-skill-rank';
import { selectSkill } from './skill-selectors';
import { evaluateRequirements } from './requirements';
import { performRebirth } from './rebirth';
import { rebirthState } from './test-fixtures/rebirth-state';
import { skillState, ROOT, FAST, LEARN, SILENT, NEVER } from './test-fixtures/skill-state';
import { createInitialGameState } from './game-state';

const definitions = [
  [ROOT, 'Streetwise Investment', 3, 1, 0, 'business-production', 500],
  [FAST, 'Fast Talker', 2, 1, 1, 'job-reward', 1000],
  [LEARN, 'Learn the Streets', 2, 2, 1, 'xp-reward', 1000],
  [SILENT, 'Silent Partner', 2, 3, 3, 'business-production', 1000],
  [NEVER, 'Never Sleeps', 2, 2, 2, 'offline-cap', 7200000],
] as const;
describe('one permanent tree and its acquisition rules', () => {
  it('has exactly five stable IDs in explicit presentation order in one tree', () => {
    expect(EMPIRE_FOUNDATIONS).toEqual({ id: 'tree:empire-foundations', name: 'Empire Foundations' });
    expect(SKILL_CATALOG.map(s => s.id)).toEqual(definitions.map(d => d[0]));
    expect(new Set(SKILL_CATALOG.map(s => s.treeId))).toEqual(new Set([EMPIRE_FOUNDATIONS.id]));
    expect(new Set(SKILL_CATALOG.map(s => s.id)).size).toBe(5);
  });
  it.each(definitions)('%s has canonical config and immutable prerequisites/effect', (id, name, max, cost, minimum, stat, strength) => {
    const skill = SKILL_CATALOG.find(s => s.id === id)!;
    expect(skill.name).toBe(name); expect(skill.maxRank).toBe(max); expect(skill.costPerRank).toBe(cost);
    expect(skill.requirements).toEqual(minimum ? [{ type: 'skill-rank', skillId: ROOT, minimumRank: minimum }] : []);
    expect(skill.effect).toEqual(stat === 'offline-cap' ? { type: 'offline-cap', millisecondsPerRank: strength }
      : { type: 'stat', target: stat === 'business-production' ? { stat, businessId: null } : { stat }, basisPointsPerRank: strength });
    expect(Object.isFrozen(skill)).toBe(true); expect(Object.isFrozen(skill.effect)).toBe(true);
    expect(Object.isFrozen(skill.requirements)).toBe(true);
  });
  it.each(definitions)('%s spends only EP and increases exactly one rank up to its configured max', (id, _name, max, cost, minimum) => {
    let state = skillState(id === ROOT ? {} : { [ROOT]: minimum });
    const start = state;
    for (let rank = 1; rank <= max; rank++) {
      const before = state, text = JSON.stringify(before);
      Object.freeze(before.permanentProgression.skills); Object.freeze(before.permanentProgression); Object.freeze(before);
      const result = purchaseSkillRank(before, id); expect(result.ok).toBe(true); state = result.state;
      expect(state.permanentProgression.skills[id]).toBe(rank);
      expect(state.permanentProgression.empirePoints).toBe(start.permanentProgression.empirePoints - rank * cost);
      expect(state.economy).toBe(start.economy); expect(state.progression).toBe(start.progression);
      expect(state.permanentProgression.rebirthCount).toBe(start.permanentProgression.rebirthCount);
      expect(JSON.stringify(before)).toBe(text);
    }
    expect(purchaseSkillRank(state, id)).toEqual({ ok: false, state, error: 'max-rank-reached' });
    expect(selectSkill(state, id)).toMatchObject({ maxed: true, nextCost: null, nextEffect: null, canPurchase: false });
  });
  it.each(definitions.slice(1))('%s locks below its root prerequisite and passes exactly at it', (id, _name, _max, _cost, minimum) => {
    const below = skillState(minimum > 1 ? { [ROOT]: minimum - 1 } : {});
    const failed = purchaseSkillRank(below, id);
    expect(failed).toMatchObject({ ok: false, error: 'prerequisite-not-met', requirements: { met: false } });
    expect(failed.state).toBe(below);
    expect(purchaseSkillRank(skillState({ [ROOT]: minimum }), id).ok).toBe(true);
  });
  it('distinguishes insufficient EP and unknown skills and preserves entire original state', () => {
    const state = skillState({}, 0);
    expect(purchaseSkillRank(state, ROOT)).toEqual({ ok: false, state, error: 'insufficient-empire-points' });
    expect(purchaseSkillRank(state, 'skill:unknown')).toEqual({ ok: false, state, error: 'unknown-skill' });
    expect(purchaseSkillRank(state, ROOT).state).toBe(state);
    expect(purchaseSkillRank(skillState({}, 1), ROOT).state.permanentProgression.empirePoints).toBe(0);
  });
  it('ANDs skill requirements in config order, validates references and does not mutate', () => {
    const state = skillState({ [ROOT]: 2 }); const before = JSON.stringify(state);
    const requirements = [{ type: 'skill-rank', skillId: ROOT, minimumRank: 2 }, { type: 'skill-rank', skillId: FAST, minimumRank: 1 }] as const;
    const result = evaluateRequirements(state, requirements);
    expect(result.met).toBe(false); expect(result.requirements.map(r => r.met)).toEqual([true, false]);
    expect(result.requirements.map(r => r.requirement)).toEqual(requirements); expect(JSON.stringify(state)).toBe(before);
    expect(() => evaluateRequirements(state, [{ type: 'skill-rank', skillId: ROOT, minimumRank: 4 }])).toThrow(RangeError);
  });
  it.each([null, [], { [ROOT]: 0 }, { [ROOT]: -1 }, { [ROOT]: .5 }, { [ROOT]: 4 }, { [ROOT]: Number.MAX_SAFE_INTEGER + 1 },
    { [ROOT]: '1' }, { 'skill:unknown': 1 }, Object.create({ [ROOT]: 1 })])('rejects malformed rank state %#', skills => {
    expect(isSkillRanks(skills)).toBe(false);
  });
  it('rejects rank getters without execution and fails loudly on corrupt authoritative state', () => {
    const skills = Object.defineProperty({}, ROOT, { get: () => { throw Error('must not execute'); } });
    expect(isSkillRanks(skills)).toBe(false);
    expect(isSkillRanks(Object.defineProperty({}, ROOT, { value: 1, enumerable: false }))).toBe(false);
    const state = skillState({ [ROOT]: 0 });
    expect(() => purchaseSkillRank(state, ROOT)).toThrow(RangeError); expect(state.permanentProgression.skills[ROOT]).toBe(0);
  });
  it('preserves all five ranks and unspent EP through repeated Rebirths without refunds', () => {
    let state = { ...rebirthState(), permanentProgression: skillState({}, 22).permanentProgression };
    for (const skill of SKILL_CATALOG) for (let rank = 0; rank < skill.maxRank; rank++) {
      const result = purchaseSkillRank(state, skill.id); expect(result.ok).toBe(true); state = result.state;
    }
    expect(state.permanentProgression.empirePoints).toBe(3); // 19 EP invested.
    const ranks = state.permanentProgression.skills;
    const first = performRebirth(state); expect(first.ok).toBe(true);
    expect(first.state.permanentProgression).toEqual({ skills: ranks, empirePoints: 7, rebirthCount: 2 });
    expect(first.state.garage).toEqual(state.garage);
    expect({ ...first.state, garage: createInitialGameState().garage, permanentProgression: createInitialGameState().permanentProgression }).toEqual(createInitialGameState());
    const second = performRebirth({ ...rebirthState(37, 48), permanentProgression: first.state.permanentProgression });
    expect(second.state.permanentProgression).toEqual({ skills: ranks, empirePoints: 14, rebirthCount: 3 });
  });
});
