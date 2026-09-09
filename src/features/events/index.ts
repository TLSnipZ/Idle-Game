export type { EventId, EventChoiceId, EventState, EventChoice, EventDefinition, RandomSource } from './model/event';
export { EVENT_CATALOG, EVENT_OPPORTUNITY_MS, EVENT_SPAWN_CHANCE, findEvent } from './config/event-config';
export { createInitialEventState, isEventState, requireEventState, advanceEventOpportunity, eventChanceSucceeds, selectEventId } from './model/event-state';
