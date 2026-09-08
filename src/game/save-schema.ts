import { findUpgrade } from '../features/upgrades';
import type { UpgradeId } from '../features/upgrades';
import { isRational, ZERO_RATIONAL } from '../shared/rational';
import { findBusiness, isBusinessLevel } from '../features/businesses';
import type { BusinessId } from '../features/businesses';
import { isMoney } from '../features/economy';
import type { GameState } from './game-state';

export const SAVE_FORMAT = 'crime-empire-save';
export const CURRENT_SAVE_VERSION = 3;
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
  const current = version === CURRENT_SAVE_VERSION;
  if (!record(value) || !keys(value, current ? ['economy', 'businesses', 'upgrades'] : ['economy', 'businesses'])) return null;
  const { economy, businesses } = value;
  if (!record(economy) || !keys(economy, ['cash']) || !isMoney(economy.cash)
      || !record(businesses) || !keys(businesses, [legacy ? 'ownedIds' : 'owned', 'productionRemainderMilliCents', ...(current ? ['productionRemainderSubMilliCents'] : [])])) return null;
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
  const sub = current ? businesses.productionRemainderSubMilliCents : ZERO_RATIONAL;
  if (!isRational(sub) || BigInt(sub.numerator) >= BigInt(sub.denominator)) return null;
  const purchasedIds: UpgradeId[] = [];
  if (current) {
    if (!record(value.upgrades) || !keys(value.upgrades, ['purchasedIds']) || !Array.isArray(value.upgrades.purchasedIds)) return null;
    for (const id of value.upgrades.purchasedIds) {
      const upgrade = findUpgrade(id);
      if (!upgrade || purchasedIds.includes(upgrade.id) || !Object.hasOwn(owned, upgrade.requiredBusiness)) return null;
      purchasedIds.push(upgrade.id);
    }
  }
  return { economy: { cash: economy.cash }, businesses: { owned, productionRemainderMilliCents: remainder,
    productionRemainderSubMilliCents: { numerator: sub.numerator, denominator: sub.denominator } }, upgrades: { purchasedIds } };
}
export function validateSaveState(value: unknown): GameState | null { return validateState(value, CURRENT_SAVE_VERSION); }
function migrateV1ToV2(value: unknown): unknown {
  const valid = validateState(value, 1);
  if (!valid) return null;
  return { economy: valid.economy, businesses: { owned: valid.businesses.owned,
    productionRemainderMilliCents: valid.businesses.productionRemainderMilliCents } };
}
function migrateV2ToV3(value: unknown): GameState | null { return validateState(value, 2); }

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
