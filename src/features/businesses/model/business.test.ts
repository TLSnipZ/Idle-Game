import { describe, expect, it } from 'vitest';
import { createInitialBusinessState, findBusiness, ownsBusiness, prepareBusinessOwnership, STARTER_BUSINESS } from '../index';
import { isMoney } from '../../economy';

describe('business content and ownership', () => {
  it('starts with fresh empty ownership arrays', () => {
    const first = createInitialBusinessState();
    expect(first).toEqual({ ownedIds: [] });
    expect(createInitialBusinessState().ownedIds).not.toBe(first.ownedIds);
    expect(ownsBusiness(first, STARTER_BUSINESS.id)).toBe(false);
  });

  it('looks up the single original business with a canonical Money cost', () => {
    expect(findBusiness('business:dockside-detail')).toBe(STARTER_BUSINESS);
    expect(STARTER_BUSINESS.name).toBe('Dockside Detail');
    expect(isMoney(STARTER_BUSINESS.purchaseCost)).toBe(true);
    expect(STARTER_BUSINESS.purchaseCost).toBe('15000');
    expect(Object.isFrozen(STARTER_BUSINESS)).toBe(true);
  });

  it.each(['business:missing', '__proto__', 'constructor', '', null, undefined, 1, {}])(
    'rejects unknown lookup/ownership request %s', id => {
      const state = createInitialBusinessState();
      expect(findBusiness(id)).toBeUndefined();
      const result = prepareBusinessOwnership(state, id);
      expect(result).toEqual({ ok: false, state, error: 'unknown-business' });
      expect(result.state).toBe(state);
    },
  );

  it('prepares only IDs without mutating or duplicating config in state', () => {
    const state = createInitialBusinessState();
    Object.freeze(state.ownedIds);
    Object.freeze(state);
    const result = prepareBusinessOwnership(state, STARTER_BUSINESS.id);
    expect(result.ok).toBe(true);
    expect(result.state).toEqual({ ownedIds: [STARTER_BUSINESS.id] });
    expect(state.ownedIds).toEqual([]);
    expect(ownsBusiness(result.state, STARTER_BUSINESS.id)).toBe(true);
    const duplicate = prepareBusinessOwnership(result.state, STARTER_BUSINESS.id);
    expect(duplicate).toEqual({ ok: false, state: result.state, error: 'already-owned' });
    expect(duplicate.state).toBe(result.state);
  });
});
