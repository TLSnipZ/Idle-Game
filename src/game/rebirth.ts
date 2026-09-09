import { countStatistic } from './statistics';
import type { StatisticsError } from '../features/statistics';
import { unlockEligibleAchievements } from './achievements';
import { STARTER_BUSINESS, getBusinessLevel } from '../features/businesses';
import { getPlayerLevel } from '../features/progression';
import { addRebirthReward } from '../features/permanent-progression';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import type { Requirement, RequirementResult } from './requirement';
import { evaluateRequirements } from './requirements';
import { validateSaveState } from './save-schema';

export const REBIRTH_REQUIREMENTS: readonly Requirement[] = Object.freeze([
  { type: 'player-level', minimumLevel: 20 },
  { type: 'business-level', businessId: STARTER_BUSINESS.id, minimumLevel: 25 },
]);
const REBIRTH_LEVELS_PER_POINT = 10n;
/** Exhaustive slice policy: new GameState slices require an explicit retention decision. */
export const REBIRTH_POLICY = {
  events: { action: 'reset', labels: ['Active city event and opportunity progress'] },
  crew: { action: 'reset', labels: ['Recruited Crew and active assignments'] },
  city: { action: 'reset', labels: ['Territories beyond the starting Waterfront foothold', 'Heat / current police attention'] },
  economy: { action: 'reset', labels: ['Cash'] },
  businesses: { action: 'reset', labels: ['Businesses and business levels', 'Temporary production progress (both fractional remainders)'] },
  upgrades: { action: 'reset', labels: ['Normal upgrades'] },
  automation: { action: 'reset', labels: ['Delivery Dispatcher and unfinished delivery progress'] },
  progression: { action: 'reset', labels: ['Player XP / Level (returns to Level 1)'] },
  garage: { action: 'retain', labels: ['Vehicles'] },
  permanentProgression: { action: 'accumulate', labels: ['Empire Points', 'Rebirth count', 'Permanent skills', 'Achievements', 'Lifetime Statistics'] },
} as const satisfies Record<keyof GameState, { readonly action: 'reset' | 'retain' | 'accumulate'; readonly labels: readonly string[] }>;

/** One reward path for preview and command. Ineligible states have no payable reward. */
export function selectRebirth(state: GameState) {
  const requirements = evaluateRequirements(state, REBIRTH_REQUIREMENTS);
  const businessLevel = getBusinessLevel(state.businesses, STARTER_BUSINESS.id);
  const reward = requirements.met && businessLevel !== null
    ? Number(BigInt(getPlayerLevel(state.progression.xp)) / REBIRTH_LEVELS_PER_POINT + BigInt(businessLevel) / REBIRTH_LEVELS_PER_POINT)
    : null;
  return { ...state.permanentProgression, eligible: requirements.met, requirements, reward };
}
export type RebirthResult = { readonly ok: true; readonly state: GameState; readonly reward: number }
  | { readonly ok: false; readonly state: GameState; readonly error: 'requirements-not-met'; readonly requirements: RequirementResult }
  | { readonly ok: false; readonly state: GameState; readonly error: 'overflow' | StatisticsError };

export function performRebirth(state: GameState): RebirthResult {
  // Validate before resetting: a fresh run must never hide corrupt authoritative data.
  if (!validateSaveState(state)) throw new RangeError('Invalid authoritative state for Rebirth');
  const preview = selectRebirth(state);
  if (preview.reward === null) return { ok: false, state, error: 'requirements-not-met', requirements: preview.requirements };
  const permanent = addRebirthReward(unlockEligibleAchievements(state).state.permanentProgression, preview.reward);
  if (!permanent.ok) return { ok: false, state, error: permanent.error };
  // Authoritative reset construction: fresh temporary slices, explicit permanent retention.
  const candidate: GameState = { ...createInitialGameState(), garage: state.garage, permanentProgression: permanent.state };
  const counted = countStatistic(state, candidate, 'rebirthsCompleted');
  if (!counted.ok) return counted;
  return { ok: true, state: unlockEligibleAchievements(counted.state).state, reward: preview.reward };
}
