import type { Modifier } from '../game/modifiers';
import { formatReward, formatPercent } from './number-format';
export { formatRate as formatProduction, formatPercent as formatBonus } from './number-format';
export function formatModifier(modifier: Modifier): string {
  return modifier.operation === 'add-flat' ? `+${formatReward(modifier.amount)}` : formatPercent(modifier.bonusBasisPoints);
}
