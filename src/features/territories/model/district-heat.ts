import { decayHeat, requireHeatState } from '../../heat';
import type { HeatState } from '../../heat';
import { WATERFRONT, findTerritory } from '../config/territory-config';
import { requireCityState } from './city-state';
import type { CityState, TerritoryId } from './territory';

const COLD: HeatState = Object.freeze({ heat: 0, heatDecayElapsedMs: 0 });
export function getActiveDistrictId(city: CityState): TerritoryId {
  return city.districts?.activeId ?? WATERFRONT.id;
}
export function getDistrictHeat(city: CityState, id: TerritoryId): HeatState {
  requireCityState(city);
  if (!findTerritory(id)) throw new RangeError('Unknown Heat district');
  return id === getActiveDistrictId(city) ? city : city.districts?.parked ?? COLD;
}
export function maximumDistrictHeat(city: CityState): number {
  requireCityState(city);
  return Math.max(city.heat, city.districts?.parked.heat ?? 0);
}
export function withDistrictHeat(city: CityState, id: TerritoryId, heat: HeatState): CityState {
  requireCityState(city); requireHeatState(heat);
  if (!city.ownedTerritoryIds.includes(id)) throw new RangeError('Heat district is not controlled');
  const old = getDistrictHeat(city, id);
  if (old.heat === heat.heat && old.heatDecayElapsedMs === heat.heatDecayElapsedMs) return city;
  if (id === getActiveDistrictId(city)) return { ...city, heat: heat.heat, heatDecayElapsedMs: heat.heatDecayElapsedMs };
  return { ...city, districts: { activeId: getActiveDistrictId(city),
    parked: { heat: heat.heat, heatDecayElapsedMs: heat.heatDecayElapsedMs } } };
}
export function switchCityDistrict(city: CityState, id: TerritoryId): CityState {
  requireCityState(city);
  if (!city.ownedTerritoryIds.includes(id)) throw new RangeError('Travel district is not controlled');
  if (id === getActiveDistrictId(city)) return city;
  const destination = getDistrictHeat(city, id);
  return { ...city, heat: destination.heat, heatDecayElapsedMs: destination.heatDecayElapsedMs,
    districts: { activeId: id, parked: { heat: city.heat, heatDecayElapsedMs: city.heatDecayElapsedMs } } };
}
/** Same credited elapsed and cooling modifiers in both districts; no per-tick loop. */
export function coolDistricts(city: CityState, elapsedMs: number, intervalMs: number): CityState {
  requireCityState(city);
  const active = decayHeat(city, elapsedMs, intervalMs);
  if (!city.districts) return active;
  const parked = decayHeat(city.districts.parked, elapsedMs, intervalMs);
  return parked === city.districts.parked ? active
    : { ...active, districts: { ...city.districts, parked } };
}
