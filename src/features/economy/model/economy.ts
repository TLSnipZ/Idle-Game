import { INITIAL_CASH } from '../config/economy-config';
import { addMoney, compareMoney, isMoney, moneyFromMinorUnits, subtractMoney } from './money';
import type { Money } from './money';

export interface EconomyState {
  readonly cash: Money;
}

export type EconomyError = 'invalid-amount' | 'overflow' | 'insufficient-funds';
export type EconomyTransition =
  | { readonly ok: true; readonly state: EconomyState }
  | { readonly ok: false; readonly state: EconomyState; readonly error: EconomyError };

export function createInitialEconomyState(): EconomyState {
  return { cash: INITIAL_CASH };
}

export function readCash(state: EconomyState): Money {
  return moneyFromMinorUnits(state.cash);
}

/** Invalid offers are not affordable. Transitions return a precise failure. */
export function canAfford(state: EconomyState, amount: unknown): boolean {
  const cash = readCash(state);
  return isMoney(amount) && compareMoney(cash, amount) >= 0;
}

export function earnCash(state: EconomyState, amount: unknown): EconomyTransition {
  const cash = readCash(state);
  if (!isMoney(amount)) return { ok: false, state, error: 'invalid-amount' };
  const result = addMoney(cash, amount);
  if (!result.ok) return { ok: false, state, error: result.error };
  return { ok: true, state: { ...state, cash: result.value } };
}

export function spendCash(state: EconomyState, amount: unknown): EconomyTransition {
  const cash = readCash(state);
  if (!isMoney(amount)) return { ok: false, state, error: 'invalid-amount' };
  const result = subtractMoney(cash, amount);
  if (!result.ok) return { ok: false, state, error: result.error };
  return { ok: true, state: { ...state, cash: result.value } };
}
