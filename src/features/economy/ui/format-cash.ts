import { moneyToDecimal } from '../model/money';
import type { Money } from '../model/money';

export function formatCash(cash: Money): string {
  return `$${moneyToDecimal(cash).replace(/\B(?=(\d{3})+\.)/g, ',')}`;
}
