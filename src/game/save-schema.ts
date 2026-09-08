import { findBusiness } from '../features/businesses';
import type { BusinessId } from '../features/businesses';
import { isMoney } from '../features/economy';
import type { GameState } from './game-state';

export const SAVE_FORMAT = 'crime-empire-save';
export const CURRENT_SAVE_VERSION = 1;
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
function timestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

/** Validate and reconstruct only authoritative fields; never cast decoded JSON. */
export function validateSaveState(value: unknown): GameState | null {
  if (!record(value) || !keys(value, ['economy', 'businesses'])) return null;
  const { economy, businesses } = value;
  if (!record(economy) || !keys(economy, ['cash']) || !isMoney(economy.cash)
      || !record(businesses) || !keys(businesses, ['ownedIds', 'productionRemainderMilliCents'])) return null;
  const { ownedIds, productionRemainderMilliCents: remainder } = businesses;
  if (!Array.isArray(ownedIds) || typeof remainder !== 'number'
      || !Number.isInteger(remainder) || remainder < 0 || remainder > 999) return null;
  const ids: BusinessId[] = [];
  for (const candidate of ownedIds) {
    const business = findBusiness(candidate);
    if (!business || ids.includes(business.id)) return null;
    ids.push(business.id);
  }
  return { economy: { cash: economy.cash }, businesses: { ownedIds: ids, productionRemainderMilliCents: remainder } };
}

/** Future versions add real sequential vN -> vN+1 migrations here before final validation. */
export function migrateToCurrentSave(value: unknown): SaveResult {
  if (!record(value) || !keys(value, ['format', 'version', 'savedAt', 'state'])) {
    return { ok: false, error: 'invalid-envelope' };
  }
  if (value.format !== SAVE_FORMAT) return { ok: false, error: 'wrong-format' };
  if (!timestamp(value.version) || value.version < 1) return { ok: false, error: 'invalid-envelope' };
  // v1 is the first format: there are no historical migrations to invent.
  if (value.version !== CURRENT_SAVE_VERSION) return { ok: false, error: 'unsupported-version' };
  if (!timestamp(value.savedAt)) return { ok: false, error: 'invalid-timestamp' };
  const state = validateSaveState(value.state);
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
