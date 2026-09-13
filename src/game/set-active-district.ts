import { getManhunt } from '../features/heat';
import { findTerritory, getActiveDistrictId, switchCityDistrict } from '../features/territories';
import type { GameState } from './game-state';
import { validateSaveState } from './save-schema';
export type ActiveDistrictResult = { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly state: GameState; readonly error: 'unknown-territory' | 'district-not-owned' | 'district-event-pending' | 'district-manhunt' };
export function setActiveDistrict(state: GameState, id: unknown): ActiveDistrictResult {
  if (!validateSaveState(state)) throw new RangeError('Invalid authoritative district selection');
  const district = findTerritory(id);
  if (!district) return { ok: false, state, error: 'unknown-territory' };
  if (!state.city.ownedTerritoryIds.includes(district.id)) return { ok: false, state, error: 'district-not-owned' };
  if (getActiveDistrictId(state.city) === district.id) return { ok: true, state };
  if (state.events.pendingEventId !== null) return { ok: false, state, error: 'district-event-pending' };
  if (getManhunt(state.city.heat).travelBlocked) return { ok: false, state, error: 'district-manhunt' };
  return { ok: true, state: { ...state, city: switchCityDistrict(state.city, district.id) } };
}
