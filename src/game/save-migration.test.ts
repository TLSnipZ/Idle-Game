import { describe, expect, it } from 'vitest';
import { parseSave, CURRENT_SAVE_VERSION, validateSaveState } from './save-schema';
import { encodeSaveText, validateSaveCode } from './save-code';
const id = 'business:dockside-detail';
const legacy = () => ({ format: 'crime-empire-save', version: 1, savedAt: 123456789,
  state: { economy: { cash: '900719925474099312345' }, businesses: { ownedIds: [id], productionRemainderMilliCents: 975 } } });
describe('v1 migration through v2 ownership', () => {
  it('preserves exact cash, earned fraction and timestamp, assigns every owner level 1', () => {
    const old = legacy(); const text = JSON.stringify(old);
    const result = parseSave(text);
    expect(result).toEqual({ ok: true, envelope: { ...old, version: CURRENT_SAVE_VERSION, state: {
      progression: { xp: 0 }, automation: { unlockedIds: [], starterJobElapsedMs: 0 }, upgrades: { purchasedIds: [] }, economy: old.state.economy, businesses: { productionRemainderSubMilliCents: { numerator: '0', denominator: '1' }, owned: { [id]: { level: 1 } }, productionRemainderMilliCents: 975 },
    } } });
    expect(JSON.stringify(old)).toBe(text);
    expect(validateSaveCode(encodeSaveText(text))).toEqual(result);
  });
  it('keeps unowned businesses absent', () => {
    const old = legacy(); old.state.businesses.ownedIds = [];
    const result = parseSave(JSON.stringify(old));
    expect(result.ok && result.envelope.state.businesses.owned).toEqual({});
  });
  it.each([[id, id], ['business:missing'], [null], 'ids'])('rejects corrupt v1 ownership %#', ownedIds => {
    const old = legacy();
    expect(parseSave(JSON.stringify({ ...old, state: { ...old.state, businesses: { ...old.state.businesses, ownedIds } } })).ok).toBe(false);
  });
  it.each([0, -1, 1.5, 101, Number.MAX_SAFE_INTEGER + 1, '2', null])('rejects v2 level %#', level => {
    const old = legacy();
    expect(parseSave(JSON.stringify({ ...old, version: 2, state: { ...old.state, businesses: { owned: { [id]: { level } }, productionRemainderMilliCents: 975 } } })).ok).toBe(false);
  });
  it('rejects malformed legacy cash/remainder and unsupported future version', () => {
    const old = legacy(); old.state.economy.cash = '01';
    expect(parseSave(JSON.stringify(old)).ok).toBe(false);
    expect(parseSave(JSON.stringify({ ...legacy(), version: CURRENT_SAVE_VERSION + 1 }))).toEqual({ ok: false, error: 'unsupported-version' });
    const broken = legacy(); broken.state.businesses.productionRemainderMilliCents = 1000;
    expect(parseSave(JSON.stringify(broken)).ok).toBe(false);
  });
  it('does not reinterpret current payload as legacy or allow extra progression fields', () => {
    expect(parseSave(JSON.stringify({ ...legacy(), version: CURRENT_SAVE_VERSION })).ok).toBe(false);
    const old = legacy();
    expect(validateSaveState({ ...old.state, upgrades: { purchasedIds: [] }, businesses: { productionRemainderSubMilliCents: { numerator: '0', denominator: '1' }, owned: { [id]: { level: 1, rate: '75' } }, productionRemainderMilliCents: 975 } })).toBeNull();
  });
});
