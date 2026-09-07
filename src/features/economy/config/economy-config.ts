import { moneyFromMinorUnits } from '../model/money';

export const INITIAL_CASH = moneyFromMinorUnits('0');
export const STARTER_JOB = Object.freeze({
  label: 'Run a waterfront delivery',
  reward: moneyFromMinorUnits('2500'),
});
