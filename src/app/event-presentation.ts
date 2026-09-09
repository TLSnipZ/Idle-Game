import type { EventChoice } from '../features/events';
import { findEvent } from '../features/events';
import { formatCash } from '../features/economy/ui';
import { subtractMoney } from '../features/economy';
import { selectCityEvents } from '../game/event-selectors';
import type { GameState } from '../game/game-state';
import type { EventResolutionResult } from '../game/resolve-event-choice';
export function describeChoiceEffects(choice: EventChoice): readonly string[] {
  const lines: string[] = [];
  if (choice.cost !== '0') lines.push(`${choice.reward !== '0' ? 'Cost: ' : '-'}${formatCash(choice.cost)}`);
  if (choice.reward !== '0') lines.push(`${choice.cost !== '0' ? 'Return: ' : '+'}${formatCash(choice.reward)}`);
  if (choice.heatChange !== 0) lines.push(`${choice.heatChange > 0 ? '+' : ''}${choice.heatChange} Heat`);
  return lines.length ? lines : ['No effect'];
}
export function eventPresentation(state: GameState) {
  const view = selectCityEvents(state);
  const seconds = view.untilOpportunityMs === null ? null : Math.ceil(view.untilOpportunityMs / 1000);
  return {...view,countdown:seconds === null ? null : `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`,
    choices:view.choices.map(view=>({...view,effects:describeChoiceEffects(view.choice),unavailable:view.affordable ? null : `Requires ${formatCash(view.choice.cost)} — insufficient cash`}))};
}
export function describeEventResolution(result: EventResolutionResult): string {
  if (!result.ok) {
    switch (result.error) {
      case 'no-pending-event': return 'No active event.';
      case 'wrong-event': case 'unknown-choice': return 'That event choice is unavailable.';
      case 'insufficient-funds': return 'Not enough cash for this choice. Event remains active.';
      case 'overflow': return 'Cash limit reached. Event remains active; nothing changed.';
      case 'invalid-amount': return 'Invalid event amount. Nothing changed.';
    }
  }
  const {choice} = result;
  const net = choice.cost !== '0' && choice.reward !== '0' ? subtractMoney(choice.reward,choice.cost) : null;
  return `${choice.outcome} — ${describeChoiceEffects(choice).join(' · ')}${net?.ok ? ` · net +${formatCash(net.value)}` : ''}.`;
}
export function describeEventSpawn(id: unknown): string { const event=findEvent(id);return event ? `CITY EVENT — ${event.name} is available.` : ''; }
