import { EVENT_CATALOG, EVENT_OPPORTUNITY_MS, findEvent, requireEventState } from '../features/events';
import type { EventChoice, EventDefinition } from '../features/events';
import { canAfford } from '../features/economy';
import { requireHeatState } from '../features/heat';
import { evaluateRequirements } from './requirements';
import type { GameState } from './game-state';
export function evaluateEventEligibility(state: GameState, event: EventDefinition) {
  const requirements = evaluateRequirements(state,event.requirements);
  requireHeatState(state.city);
  const heat = {minimum:event.minimumHeat,current:state.city.heat,met:state.city.heat >= event.minimumHeat};
  return {met:requirements.met && heat.met,requirements,heat};
}
export function eligibleEvents(state: GameState) { return EVENT_CATALOG.filter(event=>evaluateEventEligibility(state,event).met); }
export function selectEventChoice(state: GameState, choice: EventChoice) {
  const affordable = canAfford(state.economy,choice.cost);
  return {choice,affordable,canChoose:affordable};
}
export function selectCityEvents(state: GameState) {
  requireEventState(state.events);
  const pending = findEvent(state.events.pendingEventId) ?? null;
  return {...state.events,pending,configuredCount:EVENT_CATALOG.length,
    untilOpportunityMs:pending ? null : EVENT_OPPORTUNITY_MS-state.events.opportunityElapsedMs,
    choices:pending?.choices.map(choice=>selectEventChoice(state,choice)) ?? []};
}
