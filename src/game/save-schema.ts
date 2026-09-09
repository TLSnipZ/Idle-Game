import { isAchievementIds } from '../features/achievements';
import { createInitialEventState, isEventState } from '../features/events';
import { createInitialCrewState, isCrewState } from '../features/crew';
import { isTerritoryOwnership, createInitialCityState, isCityState } from '../features/territories';
import { isSkillRanks } from '../features/skills';
import { isPermanentValue } from '../features/permanent-progression';
import { findVehicle } from '../features/vehicles';
import type { VehicleId } from '../features/vehicles';
import { isXp } from '../features/progression';
import { createInitialAutomationState, isAutomationState } from '../features/automation';
import { findUpgrade } from '../features/upgrades';
import type { UpgradeId } from '../features/upgrades';
import { isRational, ZERO_RATIONAL } from '../shared/rational';
import { findBusiness, isBusinessLevel } from '../features/businesses';
import type { BusinessId } from '../features/businesses';
import { isMoney } from '../features/economy';
import type { GameState } from './game-state';

export const SAVE_FORMAT = 'crime-empire-save';
export const CURRENT_SAVE_VERSION = 13;
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
      if (!business || Object.hasOwn(owned, business.id)) return null;
      owned[business.id] = { level: 1 };
    }
  } else {
    if (!record(businesses.owned)) return null;
    for (const id of Reflect.ownKeys(businesses.owned)) {
      const business = findBusiness(id);
      if (!business || typeof id !== 'string') return null;
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
  const automation = version >= 4 ? value.automation : createInitialAutomationState();
  if (!isAutomationState(automation)) return null;
  const progression = version >= 5 ? value.progression : { xp: 0 };
  if (!record(progression) || !keys(progression, ['xp']) || !isXp(progression.xp)) return null;
  const ownedVehicleIds: VehicleId[] = [];
  if (version >= 6) {
    if (!record(value.garage) || !keys(value.garage, ['ownedVehicleIds']) || !Array.isArray(value.garage.ownedVehicleIds)) return null;
    for (const id of value.garage.ownedVehicleIds) {
      const vehicle = findVehicle(id);
      if (!vehicle || ownedVehicleIds.includes(vehicle.id)) return null;
      ownedVehicleIds.push(vehicle.id);
    }
  }
  const permanent = version >= 7 ? value.permanentProgression : { empirePoints: 0, rebirthCount: 0 };
  if (!record(permanent) || !keys(permanent, ['empirePoints', 'rebirthCount', ...(version >= 8 ? ['skills'] : []), ...(version >= 13 ? ['unlockedAchievementIds'] : [])])
      || !isPermanentValue(permanent.empirePoints) || !isPermanentValue(permanent.rebirthCount)) return null;
  const unlockedAchievementIds = version >= 13 ? permanent.unlockedAchievementIds : [];
  if (!isAchievementIds(unlockedAchievementIds)) return null;
  const skills = version >= 8 ? permanent.skills : {};
  if (!isSkillRanks(skills)) return null;
  let city: unknown = version >= 9 ? value.city : createInitialCityState();
  if (version === 9) {
    if (!isTerritoryOwnership(city)) return null;
    city = { ...city, heat: 0, heatDecayElapsedMs: 0 };
  }
  if (!isCityState(city)) return null;
  const crew = version >= 11 ? value.crew : createInitialCrewState();
  if (!isCrewState(crew)) return null;
  const events = version >= 12 ? value.events : createInitialEventState();
  if (!isEventState(events)) return null;
  return { events: { ...events }, crew: { recruitedIds: [...crew.recruitedIds], assignments: { ...crew.assignments } }, city: { ...city, ownedTerritoryIds: [...city.ownedTerritoryIds] }, permanentProgression: { empirePoints: permanent.empirePoints, rebirthCount: permanent.rebirthCount, skills: { ...skills }, unlockedAchievementIds: [...unlockedAchievementIds] }, garage: { ownedVehicleIds }, progression: { xp: progression.xp }, automation: { unlockedIds: [...automation.unlockedIds], starterJobElapsedMs: automation.starterJobElapsedMs }, economy: { cash: economy.cash }, businesses: { owned, productionRemainderMilliCents: remainder,
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
  return withoutAchievements(legacy);
}
function migrateV8ToV9(value: unknown): unknown {
  const valid = validateState(value, 8);
  if (!valid) return null;
  const { events: _events, crew: _crew, ...legacy } = valid;
  return { ...withoutAchievements(legacy), city: { ownedTerritoryIds: valid.city.ownedTerritoryIds } };
}
function migrateV9ToV10(value: unknown): unknown {
  const valid = validateState(value, 9);
  if (!valid) return null;
  const { events: _events, crew: _crew, ...legacy } = valid;
  return withoutAchievements(legacy);
}
function migrateV10ToV11(value: unknown): unknown {
  const valid = validateState(value, 10);
  if (!valid) return null;
  const { events: _events, ...legacy } = valid;
  return withoutAchievements(legacy);
}
function withoutAchievements<T extends { readonly permanentProgression: GameState['permanentProgression'] }>(state: T) {
  const { unlockedAchievementIds: _achievements, ...permanentProgression } = state.permanentProgression;
  return { ...state, permanentProgression };
}
function migrateV11ToV12(value: unknown): unknown {
  const valid = validateState(value, 11);
  return valid ? withoutAchievements(valid) : null;
}
function migrateV12ToV13(value: unknown): GameState | null { return validateState(value, 12); }

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
  if (value.version === 1) migrated = migrateV1ToV2(migrated);
  if (value.version <= 2) migrated = migrateV2ToV3(migrated);
  if (value.version <= 3) migrated = migrateV3ToV4(migrated);
  if (value.version <= 4) migrated = migrateV4ToV5(migrated);
  if (value.version <= 5) migrated = migrateV5ToV6(migrated);
  if (value.version <= 6) migrated = migrateV6ToV7(migrated);
  if (value.version <= 7) migrated = migrateV7ToV8(migrated);
  if (value.version <= 8) migrated = migrateV8ToV9(migrated);
  if (value.version <= 9) migrated = migrateV9ToV10(migrated);
  if (value.version <= 10) migrated = migrateV10ToV11(migrated);
  if (value.version <= 11) migrated = migrateV11ToV12(migrated);
  if (value.version <= 12) migrated = migrateV12ToV13(migrated);
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
