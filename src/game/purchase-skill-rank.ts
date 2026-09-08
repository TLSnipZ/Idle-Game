import { findSkill } from '../features/skills';
import type { GameState } from './game-state';
import type { RequirementResult } from './requirement';
import { selectSkill } from './skill-selectors';
import { validateSaveState } from './save-schema';
export type PurchaseSkillResult = { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly state: GameState; readonly error: 'unknown-skill' | 'insufficient-empire-points' | 'max-rank-reached' }
  | { readonly ok: false; readonly state: GameState; readonly error: 'prerequisite-not-met'; readonly requirements: RequirementResult };
export function purchaseSkillRank(state: GameState, id: unknown): PurchaseSkillResult {
  if (!validateSaveState(state)) throw new RangeError('Invalid authoritative skill purchase state');
  const skill = findSkill(id);
  if (!skill) return { ok: false, state, error: 'unknown-skill' };
  const view = selectSkill(state, skill.id);
  if (!view) throw new Error('Missing skill definition');
  if (view.maxed || view.nextCost === null) return { ok: false, state, error: 'max-rank-reached' };
  if (!view.requirements.met) return { ok: false, state, error: 'prerequisite-not-met', requirements: view.requirements };
  if (!view.affordable) return { ok: false, state, error: 'insufficient-empire-points' };
  return { ok: true, state: { ...state, permanentProgression: {
    empirePoints: Number(BigInt(state.permanentProgression.empirePoints) - BigInt(view.nextCost)),
    rebirthCount: state.permanentProgression.rebirthCount,
    skills: { ...state.permanentProgression.skills, [skill.id]: view.rank + 1 },
  } } };
}
