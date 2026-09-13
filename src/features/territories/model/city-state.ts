import { isHeatProgress } from '../../heat';
import { findTerritory, TERRITORY_CATALOG } from '../config/territory-config';
import type { DistrictState, CityState, TerritoryId } from './territory';
import type { Modifier } from '../../../game/modifiers';

export function createInitialCityState(): CityState {
  return { heat: 0, heatDecayElapsedMs: 0, ownedTerritoryIds: TERRITORY_CATALOG.filter(territory => territory.starting).map(territory => territory.id) };
}
/** Validate ownership only; acquisition gates never revoke a controlled territory. */
export function isTerritoryOwnership(value: unknown): value is Pick<CityState, 'ownedTerritoryIds'> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  const descriptor = Object.getOwnPropertyDescriptor(value, 'ownedTerritoryIds');
  if (Reflect.ownKeys(value).length !== 1 || !descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) return false;
  const ids: unknown = descriptor.value;
  if (!Array.isArray(ids) || Object.getPrototypeOf(ids) !== Array.prototype || ids.length > TERRITORY_CATALOG.length || Reflect.ownKeys(ids).length !== ids.length + 1) return false;
  const seen = new Set<TerritoryId>();
  for (let index = 0; index < ids.length; index++) {
    const entry = Object.getOwnPropertyDescriptor(ids, index);
    if (!entry?.enumerable || !Object.hasOwn(entry, 'value')) return false;
    const territory = findTerritory(entry.value);
    if (!territory || seen.has(territory.id)) return false;
    seen.add(territory.id);
  }
  return TERRITORY_CATALOG.every(territory => !territory.starting || seen.has(territory.id));
}
export function isCityState(value: unknown): value is CityState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  const extended = Object.hasOwn(value, 'districts');
  if (Reflect.ownKeys(value).length !== (extended ? 4 : 3)) return false;
  if (extended) {
    const descriptor = Object.getOwnPropertyDescriptor(value, 'districts');
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value') || !isDistrictState(descriptor.value)) return false;
  }
  for (const key of ['ownedTerritoryIds', 'heat', 'heatDecayElapsedMs']) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) return false;
  }
  const heat: unknown = Object.getOwnPropertyDescriptor(value, 'heat')?.value;
  const elapsed: unknown = Object.getOwnPropertyDescriptor(value, 'heatDecayElapsedMs')?.value;
  const ids: unknown = Object.getOwnPropertyDescriptor(value, 'ownedTerritoryIds')?.value;
  const ownership = { ownedTerritoryIds: ids };
  return isHeatProgress(heat, elapsed) && isTerritoryOwnership(ownership)
    && (!extended || ownership.ownedTerritoryIds.includes('territory:neon-mile'));
}
export function requireCityState(value: unknown): asserts value is CityState {
  if (!isCityState(value)) throw new RangeError('Invalid authoritative city state');
}
export function collectTerritoryModifiers(state: CityState): readonly Modifier[] {
  requireCityState(state);
  return TERRITORY_CATALOG.filter(territory => state.ownedTerritoryIds.includes(territory.id))
    .flatMap(territory => territory.modifiers);
}

function dataRecord(value: unknown, expected: readonly string[]): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return (prototype === Object.prototype || prototype === null)
    && Reflect.ownKeys(value).length === expected.length && expected.every(key => {
      const d = Object.getOwnPropertyDescriptor(value, key);
      return d?.enumerable && Object.hasOwn(d, 'value');
    });
}
function isDistrictState(value: unknown): value is DistrictState {
  return dataRecord(value, ['activeId', 'parked']) && findTerritory(value.activeId) !== undefined
    && dataRecord(value.parked, ['heat', 'heatDecayElapsedMs'])
    && isHeatProgress(value.parked.heat, value.parked.heatDecayElapsedMs);
}
/** Freeze v10–v19 validation; future district fields must never pass old envelopes. */
export function isLegacyCityState(value: unknown): value is CityState {
  return isCityState(value) && !Object.hasOwn(value, 'districts');
}
