export { INITIAL_CASH, STARTER_JOB } from './config/economy-config';
export { createInitialEconomyState, readCash, earnCash, canAfford, spendCash } from './model/economy';
export type { EconomyState, EconomyError, EconomyTransition } from './model/economy';
export { moneyFromMinorUnits, isMoney, compareMoney, addMoney, subtractMoney, moneyToDecimal, MAX_MONEY_DIGITS } from './model/money';
export type { Money, MoneyResult } from './model/money';
