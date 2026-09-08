import { findTerritory, TERRITORY_CATALOG } from '../config/territory-config';
import type { CityState, TerritoryId } from './territory';
import type { Modifier } from '../../../game/modifiers';

export function createInitialCityState(): CityState {
  return { ownedTerritoryIds: TERRITORY_CATALOG.filter(territory => territory.starting).map(territory => territory.id) };
}
/** Validate ownership only; acquisition gates never revoke a controlled territory. */
export function isCityState(value: unknown): value is CityState {
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
export function requireCityState(value: unknown): asserts value is CityState {
  if (!isCityState(value)) throw new RangeError('Invalid authoritative territory ownership');
}
export function collectTerritoryModifiers(state: CityState): readonly Modifier[] {
  requireCityState(state);
  return TERRITORY_CATALOG.filter(territory => state.ownedTerritoryIds.includes(territory.id))
    .flatMap(territory => territory.modifiers);
}
