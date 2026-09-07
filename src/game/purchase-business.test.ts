import { describe, expect, it } from 'vitest';
import { STARTER_BUSINESS, ownsBusiness } from '../features/businesses';
import { earnCash, moneyFromMinorUnits, MAX_MONEY_DIGITS } from '../features/economy';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { purchaseBusiness } from './purchase-business';
import { performStarterJob } from './perform-starter-job';
import { selectCash, selectCanPurchaseBusiness, selectOwnsBusiness } from './selectors';

const id = STARTER_BUSINESS.id;

function funded(cents: string): GameState {
  const state = createInitialGameState();
  const result = earnCash(state.economy, moneyFromMinorUnits(cents));
  if (!result.ok) throw new Error('Invalid funded test fixture');
  return { ...state, economy: result.state };
}

function freezeState(state: GameState): GameState {
  Object.freeze(state.economy);
  Object.freeze(state.businesses.ownedIds);
  Object.freeze(state.businesses);
  return Object.freeze(state);
}

describe('atomic business purchase', () => {
  it('starts with unchanged initial cash and no owned business', () => {
    const state = createInitialGameState();
    expect(selectCash(state)).toBe('0');
    expect(selectOwnsBusiness(state, id)).toBe(false);
    expect(selectCanPurchaseBusiness(state, id)).toBe(false);
  });

  it.each(['business:missing', '__proto__', null])('rejects unknown business %s without touching either slice', unknownId => {
    const state = freezeState(funded('20000'));
    const result = purchaseBusiness(state, unknownId);
    expect(result).toEqual({ ok: false, state, error: 'unknown-business' });
    expect(result.state).toBe(state);
    expect(selectOwnsBusiness(state, unknownId)).toBe(false);
    expect(selectCanPurchaseBusiness(state, unknownId)).toBe(false);
  });

  it.each(['0', '14999'])('preserves the whole state when cash is %s', cents => {
    const state = freezeState(funded(cents));
    const before = JSON.stringify(state);
    const result = purchaseBusiness(state, id);
    expect(result).toEqual({ ok: false, state, error: 'insufficient-funds' });
    expect(result.state).toBe(state);
    expect(result.state.economy).toBe(state.economy);
    expect(result.state.businesses).toBe(state.businesses);
    expect(JSON.stringify(state)).toBe(before);
    expect(selectOwnsBusiness(result.state, id)).toBe(false);
  });

  it.each([['15000', '0'], ['20000', '5000'], ['9007199254740993', '9007199254725993']])(
    'atomically purchases from %s cents, leaving exactly %s', (balance, remaining) => {
      const state = freezeState(funded(balance));
      const before = JSON.stringify(state);
      expect(selectCanPurchaseBusiness(state, id)).toBe(true);
      const result = purchaseBusiness(state, id);
      expect(result.ok).toBe(true);
      expect(selectCash(result.state)).toBe(remaining);
      expect(result.state.businesses.ownedIds).toEqual([id]);
      expect(ownsBusiness(result.state.businesses, id)).toBe(true);
      expect(selectOwnsBusiness(result.state, id)).toBe(true);
      expect(selectCanPurchaseBusiness(result.state, id)).toBe(false);
      expect(result.state).not.toBe(state);
      expect(result.state.economy).not.toBe(state.economy);
      expect(result.state.businesses).not.toBe(state.businesses);
      expect(JSON.stringify(state)).toBe(before);
      const decoded: unknown = JSON.parse(JSON.stringify(result.state));
      expect(decoded).toEqual(result.state);
    },
  );

  it('keeps exact cents even at the maximum supported balance', () => {
    const state = funded('9'.repeat(MAX_MONEY_DIGITS));
    const result = purchaseBusiness(state, id);
    expect(result.ok).toBe(true);
    expect(selectCash(result.state)).toBe('9'.repeat(MAX_MONEY_DIGITS - 5) + '84999');
  });

  it.each(['15000', '30000'])('blocks duplicate purchases even when initial funding is %s', cents => {
    const first = purchaseBusiness(funded(cents), id);
    expect(first.ok).toBe(true);
    const state = freezeState(first.state);
    const result = purchaseBusiness(state, id);
    expect(result).toEqual({ ok: false, state, error: 'already-owned' });
    expect(result.state).toBe(state);
    expect(result.state.businesses.ownedIds).toEqual([id]);
  });

  it('reaches the first purchase after six unchanged starter deliveries', () => {
    let state = createInitialGameState();
    for (let delivery = 0; delivery < 6; delivery++) {
      expect(selectCanPurchaseBusiness(state, id)).toBe(false);
      const earned = performStarterJob(state);
      expect(earned.ok).toBe(true);
      state = earned.state;
    }
    const result = purchaseBusiness(state, id);
    expect(result.ok).toBe(true);
    expect(selectCash(result.state)).toBe('0');
    expect(selectOwnsBusiness(result.state, id)).toBe(true);
    const nextDelivery = performStarterJob(result.state);
    expect(selectCash(nextDelivery.state)).toBe('2500');
    expect(nextDelivery.state.businesses).toBe(result.state.businesses);
  });

  it('returns deterministic success and failure results for the same input', () => {
    for (const state of [createInitialGameState(), funded('20000')]) {
      expect(purchaseBusiness(state, id)).toEqual(purchaseBusiness(state, id));
    }
  });
});
