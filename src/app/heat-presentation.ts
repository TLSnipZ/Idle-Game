import { HEAT_SOURCE_ID, HEAT_TIERS, LAY_LOW_COST, LAY_LOW_REDUCTION } from '../features/heat';
import type { Modifier } from '../game/modifiers';
import type { GameState } from '../game/game-state';
import type { LayLowResult } from '../game/lay-low';
import { selectHeat } from '../game/heat-selectors';
import { formatCash } from '../features/economy/ui';
import { formatBonus } from './stat-format';
export function heatModifierName(modifier: Modifier): string | undefined {
  if (modifier.sourceId !== HEAT_SOURCE_ID || modifier.operation !== 'multiply-basis-points') return undefined;
  const tier = HEAT_TIERS.find(t => t.bonusBasisPoints === modifier.bonusBasisPoints);
  return tier ? `Heat — ${tier.label}` : 'Heat';
}
export function heatPresentation(state: GameState) {
  const view = selectHeat(state);
  return { ...view, penalty: view.tier.bonusBasisPoints === 0 ? 'No starter-job cash penalty'
    : `Starter jobs & Dispatcher cash ${formatBonus(view.tier.bonusBasisPoints)}`,
    countdown: view.untilDecayMs === null ? null : `Cooling in ${Math.ceil(view.untilDecayMs / 1000)}s`,
    availability: view.heat === 0 ? 'Already cold' : !view.affordable ? 'Insufficient cash' : 'Ready to lay low',
  };
}
export function describeLayLow(result: LayLowResult): string {
  if (result.ok) return `Laid low. -${formatCash(LAY_LOW_COST)} · Heat reduced by up to ${LAY_LOW_REDUCTION}. Heat now ${result.state.city.heat}.`;
  switch (result.error) {
    case 'already-cold': return 'Already cold. Nothing was spent.';
    case 'insufficient-funds': return 'Not enough cash to lay low. Nothing was spent.';
    case 'invalid-amount': case 'overflow': return 'Could not lay low. Nothing changed.';
  }
}
