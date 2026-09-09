import type { GameState } from '../game/game-state';
import { selectCash } from '../game/selectors';
import { selectHeat } from '../game/heat-selectors';
import { selectCity } from '../game/territory-selectors';
import { selectCrew } from '../game/crew-selectors';
import { selectGarage } from '../game/vehicle-selectors';
import { selectRebirth } from '../game/rebirth';
import { selectAutoUpgrader } from '../game/automation-selectors';
import { effectiveProductionRates } from '../game/effective-stats';
import { getLevelProgress } from '../features/progression';
import { formatCash } from '../features/economy/ui';
import { addRational, ZERO_RATIONAL } from '../shared/rational';
import { formatProduction } from './stat-format';
import { eventPresentation } from './event-presentation';
/** Formatting and aggregation only; each gameplay value comes from its existing selector. */
export function dashboardPresentation(state: GameState) {
  const rates = effectiveProductionRates(state);
  const auto = selectAutoUpgrader(state);
  return { cash: formatCash(selectCash(state)), player: getLevelProgress(state.progression.xp),
    production: rates.ok ? formatProduction(rates.rates.reduce(addRational, ZERO_RATIONAL)) : 'Unavailable',
    heat: selectHeat(state), city: selectCity(state), crew: selectCrew(state), garage: selectGarage(state),
    empire: selectRebirth(state), event: eventPresentation(state), autoActive: auto.owned && auto.enabled };
}
