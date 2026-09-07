import { describe, expect, it } from 'vitest';
import { createInitialEconomyState, earnCash, spendCash, canAfford, readCash } from './economy';
import { MAX_MONEY_DIGITS, moneyFromMinorUnits } from './money';

const cash = (value: string) => Object.freeze({ cash: moneyFromMinorUnits(value) });

describe('economy transitions', () => {
  it('starts with zero cash and independent state objects', () => {
    const first = createInitialEconomyState();
    expect(readCash(first)).toBe('0');
    expect(createInitialEconomyState()).not.toBe(first);
  });

  it('earns exactly and preserves the input object', () => {
    const previous = cash('10');
    const result = earnCash(previous, moneyFromMinorUnits('20'));
    expect(result).toEqual({ ok: true, state: { cash: '30' } });
    expect(previous.cash).toBe('10');
    expect(result.state).not.toBe(previous);
  });

  it('adds repeated earnings without fractional drift', () => {
    let state = createInitialEconomyState();
    for (let i = 0; i < 100; i++) {
      const result = earnCash(state, '1');
      expect(result.ok).toBe(true);
      state = result.state;
    }
    expect(readCash(state)).toBe('100');
  });

  it('checks below, exactly at and above the balance numerically', () => {
    const state = cash('100');
    expect(canAfford(state, '99')).toBe(true);
    expect(canAfford(state, '100')).toBe(true);
    expect(canAfford(state, '101')).toBe(false);
    expect(canAfford(state, '9')).toBe(true);
  });

  it('spends atomically and permits spending the full balance', () => {
    const previous = cash('100');
    expect(spendCash(previous, '25')).toEqual({ ok: true, state: { cash: '75' } });
    expect(spendCash(previous, '100')).toEqual({ ok: true, state: { cash: '0' } });
    expect(previous.cash).toBe('100');
  });

  it('leaves the exact previous object untouched when funds are insufficient', () => {
    const previous = cash('100');
    const result = spendCash(previous, '101');
    expect(result).toEqual({ ok: false, state: previous, error: 'insufficient-funds' });
    expect(result.state).toBe(previous);
    expect(spendCash(cash('0'), '1').state.cash).toBe('0');
  });

  it('defines zero-value earn/spend as successful no-value changes', () => {
    expect(earnCash(cash('0'), '0').ok).toBe(true);
    expect(spendCash(cash('0'), '0').ok).toBe(true);
    expect(canAfford(cash('0'), '0')).toBe(true);
  });

  it.each([
    NaN, Infinity, -Infinity, -1, 1, 0, 1.5, 1n, null, undefined, {}, [],
    '', '01', '-0', '-1', '+1', ' 1', '1 ', '1\n', '1\r', '1.5', '1e3', 'NaN', 'Infinity',
    '1'.repeat(MAX_MONEY_DIGITS + 1),
  ])('rejects invalid economic input %s without changing state', amount => {
    const previous = cash('100');
    for (const transition of [earnCash, spendCash]) {
      const result = transition(previous, amount);
      expect(result.ok).toBe(false);
      expect(result).toEqual({ ok: false, state: previous, error: 'invalid-amount' });
      expect(result.state).toBe(previous);
    }
    expect(canAfford(previous, amount)).toBe(false);
  });

  it('rejects overflow without losing the previous balance', () => {
    const previous = cash('9'.repeat(MAX_MONEY_DIGITS));
    const result = earnCash(previous, '1');
    expect(result).toEqual({ ok: false, state: previous, error: 'overflow' });
    expect(result.state).toBe(previous);
    expect(earnCash(previous, '0').ok).toBe(true);
  });

  it('is deterministic', () => {
    const state = cash('1234');
    expect(earnCash(state, '567')).toEqual(earnCash(state, '567'));
    expect(spendCash(state, '234')).toEqual(spendCash(state, '234'));
    expect(spendCash(state, '9999')).toEqual(spendCash(state, '9999'));
  });
});
