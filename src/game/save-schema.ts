import { createInitialStatistics, isStatisticsState } from '../features/statistics';
import { isAchievementIds } from '../features/achievements';
import { createInitialEventState, isEventState } from '../features/events';
import { createInitialCrewState, isCrewState } from '../features/crew';
import { isLegacyCityState, isTerritoryOwnership, createInitialCityState, isCityState } from '../features/territories';
import { isSkillRanks } from '../features/skills';
import { isPermanentValue } from '../features/permanent-progression';
import { isVehicleAppearances, isVehicleBuilds, cloneVehicleBuilds, findVehicle } from '../features/vehicles';
import type { VehicleId } from '../features/vehicles';
import { isXp } from '../features/progression';
import { createInitialAutomationState, isAutomationState } from '../features/automation';
import { findUpgrade } from '../features/upgrades';
import type { UpgradeId } from '../features/upgrades';
import { isRational, ZERO_RATIONAL } from '../shared/rational';
import { findBusiness, isBusinessLevel, STARTER_BUSINESS } from '../features/businesses';
import type { BusinessId } from '../features/businesses';
import { isMoney } from '../features/economy';
import type { GameState } from './game-state';

export const SAVE_FORMAT = 'crime-empire-save';
export const CURRENT_SAVE_VERSION = 24;
// Historical identity is accepted only before v16, never by current catalog lookup.
const LEGACY_VEHICLE_ID: VehicleId = 'vehicle:starter-sport-sedan';
const KXR_VEHICLE_ID: VehicleId = 'vehicle:kairo-kx-r';
// UTF-16 code units: at most 128 KiB of string storage before JSON parsing.
export const MAX_SAVE_LENGTH = 65_536;

export interface SaveEnvelope {
  readonly format: typeof SAVE_FORMAT;
  readonly version: typeof CURRENT_SAVE_VERSION;
  readonly savedAt: number;
  readonly state: GameState;
}
export type SaveDataError = 'oversized' | 'malformed-json' | 'invalid-envelope'
  | 'wrong-format' | 'unsupported-version' | 'invalid-timestamp' | 'invalid-state';
type SaveResult = { readonly ok: true; readonly envelope: SaveEnvelope }
  | { readonly ok: false; readonly error: SaveDataError };

function record(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
function keys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  return Reflect.ownKeys(value).length === expected.length
    && expected.every(key => Object.getOwnPropertyDescriptor(value, key)?.get === undefined
      && Object.hasOwn(value, key));
}
export function isSaveTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

/** Shared state validation; legacy ownership is accepted only by the v1 migration. */
function validateState(value: unknown, version: number): GameState | null {
  const legacy = version === 1;
  const hasModifiers = version >= 3;
  if (!record(value) || !keys(value, ['economy', 'businesses', ...(hasModifiers ? ['upgrades'] : []), ...(version >= 4 ? ['automation'] : []), ...(version >= 5 ? ['progression'] : []), ...(version >= 6 ? ['garage'] : []), ...(version >= 7 ? ['permanentProgression'] : []), ...(version >= 9 ? ['city'] : []), ...(version >= 11 ? ['crew'] : []), ...(version >= 12 ? ['events'] : [])])) return null;
  const { economy, businesses } = value;
  if (!record(economy) || !keys(economy, ['cash']) || !isMoney(economy.cash)
      || !record(businesses) || !keys(businesses, [legacy ? 'ownedIds' : 'owned', 'productionRemainderMilliCents', ...(hasModifiers ? ['productionRemainderSubMilliCents'] : [])])) return null;
  const remainder = businesses.productionRemainderMilliCents;
  if (typeof remainder !== 'number' || !Number.isInteger(remainder) || remainder < 0 || remainder > 999) return null;
  const owned: Partial<Record<BusinessId, { readonly level: number }>> = {};
  if (legacy) {
    if (!Array.isArray(businesses.ownedIds)) return null;
    for (const id of businesses.ownedIds) {
      const business = findBusiness(id);
      if (!business || business.id !== STARTER_BUSINESS.id || Object.hasOwn(owned, business.id)) return null;
      owned[business.id] = { level: 1 };
    }
  } else {
    if (!record(businesses.owned)) return null;
    for (const id of Reflect.ownKeys(businesses.owned)) {
      const business = findBusiness(id);
      if (!business || (version < 17 && business.id !== STARTER_BUSINESS.id) || typeof id !== 'string') return null;
      const descriptor = Object.getOwnPropertyDescriptor(businesses.owned, id);
      if (!descriptor || !Object.hasOwn(descriptor, 'value')) return null;
      const entry: unknown = descriptor.value;
      if (!record(entry) || !keys(entry, ['level']) || !isBusinessLevel(entry.level)) return null;
      owned[business.id] = { level: entry.level };
    }
  }
  const sub = hasModifiers ? businesses.productionRemainderSubMilliCents : ZERO_RATIONAL;
  if (!isRational(sub) || BigInt(sub.numerator) >= BigInt(sub.denominator)) return null;
  const purchasedIds: UpgradeId[] = [];
  if (hasModifiers) {
    if (!record(value.upgrades) || !keys(value.upgrades, ['purchasedIds']) || !Array.isArray(value.upgrades.purchasedIds)) return null;
    for (const id of value.upgrades.purchasedIds) {
      const upgrade = findUpgrade(id);
      if (!upgrade || purchasedIds.includes(upgrade.id)) return null;
      purchasedIds.push(upgrade.id);
    }
  }
  let automation: unknown = version >= 4 ? value.automation : createInitialAutomationState();
  if (version >= 4 && version < 15) {
    if (!record(automation) || !keys(automation, ['unlockedIds', 'starterJobElapsedMs'])
      || !Array.isArray(automation.unlockedIds)
      || automation.unlockedIds.some(id => id !== 'automation:delivery-dispatcher')) return null;
    automation = { ...automation, enabledIds: [], businessAutoUpgradeElapsedMs: 0 };
  }
  if (version >= 4 && version < 17) {
    if (!record(automation) || !keys(automation, ['unlockedIds', 'starterJobElapsedMs', 'enabledIds', 'businessAutoUpgradeElapsedMs'])) return null;
    automation = { ...automation, businessAutoUpgradeTargetId: STARTER_BUSINESS.id };
  }
  if (!isAutomationState(automation)) return null;
  const progression = version >= 5 ? value.progression : { xp: 0 };
  if (!record(progression) || !keys(progression, ['xp']) || !isXp(progression.xp)) return null;
  const ownedVehicleIds: VehicleId[] = [];
  if (version >= 6) {
    if (!record(value.garage) || !keys(value.garage, ['ownedVehicleIds', ...(version >= 18 ? ['activeVehicleId'] : []), ...(version >= 21 && Object.hasOwn(value.garage, 'builds') ? ['builds'] : []), ...(version >= 23 && Object.hasOwn(value.garage, 'appearances') ? ['appearances'] : [])]) || !Array.isArray(value.garage.ownedVehicleIds)) return null;
    for (const id of value.garage.ownedVehicleIds) {
      const vehicleId = version < 16
        ? id === LEGACY_VEHICLE_ID ? LEGACY_VEHICLE_ID : undefined
        : version < 19 ? id === KXR_VEHICLE_ID ? KXR_VEHICLE_ID : undefined : findVehicle(id)?.id;
      if (!vehicleId || ownedVehicleIds.includes(vehicleId)) return null;
      // Historical Tier-1 envelopes must not accept future catalog identities.
      if (version >= 19 && version < 24
        && ![KXR_VEHICLE_ID, 'vehicle:kairo-senda', 'vehicle:namera-lilt'].includes(vehicleId)) return null;
      ownedVehicleIds.push(vehicleId);
    }
  }
  let activeVehicleId: VehicleId | null = ownedVehicleIds[0] ?? null;
  if (version >= 18) {
    if (!record(value.garage)) return null;
    const active = value.garage.activeVehicleId;
    if (ownedVehicleIds.length === 0) {
      if (active !== null) return null;
      activeVehicleId = null;
    } else {
      const vehicle = findVehicle(active);
      if (!vehicle || !ownedVehicleIds.includes(vehicle.id)) return null;
      activeVehicleId = vehicle.id;
    }
  }
  const builds = record(value.garage) && Object.hasOwn(value.garage, 'builds') ? value.garage.builds : undefined;
  if (record(value.garage) && Object.hasOwn(value.garage, 'builds')
    && !isVehicleBuilds(builds, ownedVehicleIds)) return null;
  if (version < 22 && record(builds) && Object.keys(builds).some(id => id !== KXR_VEHICLE_ID)) return null;
  const appearances = record(value.garage) && Object.hasOwn(value.garage, 'appearances') ? value.garage.appearances : undefined;
  if (record(value.garage) && Object.hasOwn(value.garage, 'appearances')
    && !isVehicleAppearances(appearances, ownedVehicleIds)) return null;
  const permanent = version >= 7 ? value.permanentProgression : { empirePoints: 0, rebirthCount: 0 };
  if (!record(permanent) || !keys(permanent, ['empirePoints', 'rebirthCount', ...(version >= 8 ? ['skills'] : []), ...(version >= 13 ? ['unlockedAchievementIds'] : []), ...(version >= 14 ? ['statistics'] : [])])
      || !isPermanentValue(permanent.empirePoints) || !isPermanentValue(permanent.rebirthCount)) return null;
  const statistics = version >= 14 ? permanent.statistics : createInitialStatistics(permanent.rebirthCount);
  if (!isStatisticsState(statistics)) return null;
  const unlockedAchievementIds = version >= 13 ? permanent.unlockedAchievementIds : [];
  if (!isAchievementIds(unlockedAchievementIds)) return null;
  const skills = version >= 8 ? permanent.skills : {};
  if (!isSkillRanks(skills)) return null;
  let city: unknown = version >= 9 ? value.city : createInitialCityState();
  if (version === 9) {
    if (!isTerritoryOwnership(city)) return null;
    city = { ...city, heat: 0, heatDecayElapsedMs: 0 };
  }
  if (!(version < 20 ? isLegacyCityState(city) : isCityState(city))) return null;
  if (!isCityState(city)) return null;
  const crew = version >= 11 ? value.crew : createInitialCrewState();
  if (!isCrewState(crew)) return null;
  const events = version >= 12 ? value.events : createInitialEventState();
  if (!isEventState(events)) return null;
  return { events: { ...events }, crew: { recruitedIds: [...crew.recruitedIds], assignments: { ...crew.assignments } }, city: { ...city, ...(city.districts ? { districts: { ...city.districts, parked: { ...city.districts.parked } } } : {}), ownedTerritoryIds: [...city.ownedTerritoryIds] }, permanentProgression: { statistics: { ...statistics }, empirePoints: permanent.empirePoints, rebirthCount: permanent.rebirthCount, skills: { ...skills }, unlockedAchievementIds: [...unlockedAchievementIds] }, garage: { ownedVehicleIds, activeVehicleId, ...(appearances !== undefined && isVehicleAppearances(appearances, ownedVehicleIds) ? { appearances: { ...appearances } } : {}), ...(builds !== undefined && isVehicleBuilds(builds, ownedVehicleIds) ? { builds: cloneVehicleBuilds(builds) } : {}) }, progression: { xp: progression.xp }, automation: { ...automation, unlockedIds: [...automation.unlockedIds], enabledIds: [...automation.enabledIds] }, economy: { cash: economy.cash }, businesses: { owned, productionRemainderMilliCents: remainder,
    productionRemainderSubMilliCents: { numerator: sub.numerator, denominator: sub.denominator } }, upgrades: { purchasedIds } };
}
export function validateSaveState(value: unknown): GameState | null { return validateState(value, CURRENT_SAVE_VERSION); }
function migrateV1ToV2(value: unknown): unknown {
  const valid = validateState(value, 1);
  if (!valid) return null;
  return { economy: valid.economy, businesses: { owned: valid.businesses.owned,
    productionRemainderMilliCents: valid.businesses.productionRemainderMilliCents } };
}
function migrateV2ToV3(value: unknown): unknown {
  const valid = validateState(value, 2);
  if (!valid) return null;
  return { economy: valid.economy, businesses: valid.businesses, upgrades: valid.upgrades };
}
function migrateV3ToV4(value: unknown): unknown {
  const valid = validateState(value, 3);
  if (!valid) return null;
  return { economy: valid.economy, businesses: valid.businesses, upgrades: valid.upgrades, automation: valid.automation };
}
function migrateV4ToV5(value: unknown): unknown {
  const valid = validateState(value, 4);
  if (!valid) return null;
  return { economy: valid.economy, businesses: valid.businesses, upgrades: valid.upgrades,
    automation: valid.automation, progression: valid.progression };
}
function migrateV5ToV6(value: unknown): unknown {
  const valid = validateState(value, 5);
  if (!valid) return null;
  return { economy: valid.economy, businesses: valid.businesses, upgrades: valid.upgrades,
    automation: valid.automation, progression: valid.progression, garage: valid.garage };
}
function migrateV6ToV7(value: unknown): unknown {
  const valid = validateState(value, 6);
  if (!valid) return null;
  const { events: _events, crew: _crew, city: _city, ...legacy } = valid;
  return { ...legacy, permanentProgression: { empirePoints: valid.permanentProgression.empirePoints, rebirthCount: valid.permanentProgression.rebirthCount } };
}
function migrateV7ToV8(value: unknown): unknown {
  const valid = validateState(value, 7);
  if (!valid) return null;
  const { events: _events, crew: _crew, city: _city, ...legacy } = valid;
  return withoutAchievementsAndStatistics(legacy);
}
function migrateV8ToV9(value: unknown): unknown {
  const valid = validateState(value, 8);
  if (!valid) return null;
  const { events: _events, crew: _crew, ...legacy } = valid;
  return { ...withoutAchievementsAndStatistics(legacy), city: { ownedTerritoryIds: valid.city.ownedTerritoryIds } };
}
function migrateV9ToV10(value: unknown): unknown {
  const valid = validateState(value, 9);
  if (!valid) return null;
  const { events: _events, crew: _crew, ...legacy } = valid;
  return withoutAchievementsAndStatistics(legacy);
}
function migrateV10ToV11(value: unknown): unknown {
  const valid = validateState(value, 10);
  if (!valid) return null;
  const { events: _events, ...legacy } = valid;
  return withoutAchievementsAndStatistics(legacy);
}
function withoutAchievementsAndStatistics<T extends { readonly permanentProgression: GameState['permanentProgression'] }>(state: T) {
  const { statistics: _statistics, unlockedAchievementIds: _achievements, ...permanentProgression } = state.permanentProgression;
  return { ...state, permanentProgression };
}
function migrateV11ToV12(value: unknown): unknown {
  const valid = validateState(value, 11);
  return valid ? withoutAchievementsAndStatistics(valid) : null;
}
function migrateV12ToV13(value: unknown): unknown {
  const valid = validateState(value, 12);
  if (!valid) return null;
  const { statistics: _statistics, ...permanentProgression } = valid.permanentProgression;
  return { ...valid, permanentProgression };
}
/** Schema-only addition: Rebirth count is the sole existing exact historical counter. */
function migrateV13ToV14(value: unknown): GameState | null { return validateState(value, 13); }

function migrateV14ToV15(value: unknown): GameState | null { return validateState(value, 14); }

/** Identity only: historical strict validation rejects duplicates/unknown IDs. */
function migrateV15ToV16(value: unknown): GameState | null {
  const valid = validateState(value, 15);
  return valid ? { ...valid, garage: { activeVehicleId: valid.garage.ownedVehicleIds.length ? KXR_VEHICLE_ID : null, ownedVehicleIds: valid.garage.ownedVehicleIds.map(
    id => id === LEGACY_VEHICLE_ID ? KXR_VEHICLE_ID : id,
  ) } } : null;
}

/** Emit historical automation shape between sequential legacy migrations. */
function legacyAutomation(value: unknown): unknown {
  if (!record(value) || !record(value.automation)) return value;
  const { enabledIds: _enabled, businessAutoUpgradeElapsedMs: _elapsed, businessAutoUpgradeTargetId: _target, ...automation } = value.automation;
  return { ...value, automation };
}

/** Preserve the historical v15/v16 targetless contract between sequential steps. */
function withoutTarget(value: GameState | null): unknown {
  if (!value) return null;
  const { businessAutoUpgradeTargetId: _target, ...automation } = value.automation;
  return { ...value, automation };
}
/** Schema transformation only; all elapsed progress is retained for runtime. */
function migrateV16ToV17(value: unknown): GameState | null { return validateState(value, 16); }

/** Emit the exact historical Garage shape after a validated pre-v18 step. */
function withoutActiveVehicle(value: unknown): unknown {
  if (!record(value) || !record(value.garage)) return value;
  const { activeVehicleId: _active, ...garage } = value.garage;
  return { ...value, garage };
}
/** Validated v17 owners automatically retain their existing vehicle's production bonus. */
function migrateV17ToV18(value: unknown): GameState | null { return validateState(value, 17); }

/** Future versions add real sequential vN -> vN+1 migrations here before final validation. */
export function migrateToCurrentSave(value: unknown): SaveResult {
  if (!record(value) || !keys(value, ['format', 'version', 'savedAt', 'state'])) {
    return { ok: false, error: 'invalid-envelope' };
  }
  if (value.format !== SAVE_FORMAT) return { ok: false, error: 'wrong-format' };
  if (!isSaveTimestamp(value.version) || value.version < 1) return { ok: false, error: 'invalid-envelope' };
  // Sequential migration: validated v1 ownership becomes v2 level-1 records.
  if (value.version > CURRENT_SAVE_VERSION) return { ok: false, error: 'unsupported-version' };
  if (!isSaveTimestamp(value.savedAt)) return { ok: false, error: 'invalid-timestamp' };
  let migrated: unknown = value.state;
  if (value.version === 1) migrated = withoutActiveVehicle(legacyAutomation(migrateV1ToV2(migrated)));
  if (value.version <= 2) migrated = withoutActiveVehicle(legacyAutomation(migrateV2ToV3(migrated)));
  if (value.version <= 3) migrated = withoutActiveVehicle(legacyAutomation(migrateV3ToV4(migrated)));
  if (value.version <= 4) migrated = withoutActiveVehicle(legacyAutomation(migrateV4ToV5(migrated)));
  if (value.version <= 5) migrated = withoutActiveVehicle(legacyAutomation(migrateV5ToV6(migrated)));
  if (value.version <= 6) migrated = withoutActiveVehicle(legacyAutomation(migrateV6ToV7(migrated)));
  if (value.version <= 7) migrated = withoutActiveVehicle(legacyAutomation(migrateV7ToV8(migrated)));
  if (value.version <= 8) migrated = withoutActiveVehicle(legacyAutomation(migrateV8ToV9(migrated)));
  if (value.version <= 9) migrated = withoutActiveVehicle(legacyAutomation(migrateV9ToV10(migrated)));
  if (value.version <= 10) migrated = withoutActiveVehicle(legacyAutomation(migrateV10ToV11(migrated)));
  if (value.version <= 11) migrated = withoutActiveVehicle(legacyAutomation(migrateV11ToV12(migrated)));
  if (value.version <= 12) migrated = withoutActiveVehicle(legacyAutomation(migrateV12ToV13(migrated)));
  if (value.version <= 13) migrated = withoutActiveVehicle(legacyAutomation(migrateV13ToV14(migrated)));
  if (value.version <= 14) migrated = withoutActiveVehicle(withoutTarget(migrateV14ToV15(migrated)));
  if (value.version <= 15) migrated = withoutActiveVehicle(withoutTarget(migrateV15ToV16(migrated)));
  if (value.version <= 16) migrated = withoutActiveVehicle(migrateV16ToV17(migrated));
  if (value.version <= 17) migrated = migrateV17ToV18(migrated);
  // v18 has the same shape but a frozen one-car identity set. No rewards or timing changes.
  if (value.version <= 18) migrated = validateState(migrated, 18);
  // v19 -> v20: retain old Heat/remainder at Waterfront; implicit Neon Mile starts cold.
  if (value.version <= 19) migrated = validateState(migrated, 19);
  // v20 -> v21: stock builds remain implicit; no purchase, reward or timestamp changes.
  if (value.version <= 20) migrated = validateState(migrated, 20);
  // v21 -> v22: preserve KX-R builds and validate before accepting new model parts.
  if (value.version <= 21) migrated = validateState(migrated, 21);
  // v22 -> v23: keep factory looks implicit and preserve every existing build.
  if (value.version <= 22) migrated = validateState(migrated, 22);
  // v23 -> v24: validate the frozen Tier-1 identity boundary before adding Serein.
  if (value.version <= 23) migrated = validateState(migrated, 23);
  const state = validateSaveState(migrated);
  if (!state) return { ok: false, error: 'invalid-state' };
  return { ok: true, envelope: { format: SAVE_FORMAT, version: CURRENT_SAVE_VERSION, savedAt: value.savedAt, state } };
}

export function parseSave(serialized: string): SaveResult {
  if (serialized.length > MAX_SAVE_LENGTH) return { ok: false, error: 'oversized' };
  let decoded: unknown;
  try { decoded = JSON.parse(serialized); }
  catch { return { ok: false, error: 'malformed-json' }; }
  return migrateToCurrentSave(decoded);
}

export function serializeSave(state: GameState, savedAt: number):
  { readonly ok: true; readonly serialized: string } | { readonly ok: false; readonly error: SaveDataError } {
  const result = migrateToCurrentSave({ format: SAVE_FORMAT, version: CURRENT_SAVE_VERSION, savedAt, state });
  if (!result.ok) return result;
  const serialized = JSON.stringify(result.envelope);
  return serialized.length <= MAX_SAVE_LENGTH ? { ok: true, serialized } : { ok: false, error: 'oversized' };
}
