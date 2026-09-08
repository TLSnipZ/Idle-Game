import { findTerritory } from '../features/territories';
import type { TerritoryDefinition } from '../features/territories';
import type { AcquireTerritoryResult } from '../game/acquire-territory';
import { selectTerritory } from '../game/territory-selectors';
import type { GameState } from '../game/game-state';
import { formatCash } from '../features/economy/ui';
import { formatModifier } from './stat-format';

export function describeTerritoryEffect(definition: TerritoryDefinition): string {
  if (definition.modifiers.length === 0) return 'Starting foothold · No gameplay bonus';
  return definition.modifiers.map(modifier => `${formatModifier(modifier)} starter-job & Dispatcher cash reward`).join(' · ') + ' · XP unchanged';
}
export function territoryPresentation(state: GameState, id: unknown) {
  const view = selectTerritory(state, id);
  if (!view) return null;
  return { ...view, effect: describeTerritoryEffect(view.definition),
    status: view.owned ? 'CONTROLLED' : view.eligible ? 'AVAILABLE' : 'LOCKED',
    availability: view.owned ? 'Under your control.' : !view.eligible ? 'Requirements not met.'
      : view.affordable ? 'Ready to take control.' : 'Requirements satisfied · Insufficient cash.',
  };
}
export function describeTerritoryAcquisition(result: AcquireTerritoryResult, id: unknown): string {
  const territory = findTerritory(id);
  if (result.ok && territory) return `${territory.name} controlled. -${formatCash(territory.purchaseCost)} · ${describeTerritoryEffect(territory)}.`;
  if (result.ok) return 'Territory controlled.';
  switch (result.error) {
    case 'requirements-not-met': return 'Requirements not met: ' + result.requirements.requirements
      .filter(detail => !detail.met).map(detail => detail.description).join('; ') + '.';
    case 'insufficient-funds': return 'Not enough cash to take control. No acquisition was made.';
    case 'already-owned': return 'This territory is already controlled.';
    case 'unknown-territory': return 'This territory is unavailable. No acquisition was made.';
    case 'invalid-amount':
    case 'overflow': return 'Territory acquisition could not be completed. Nothing was spent.';
  }
}
