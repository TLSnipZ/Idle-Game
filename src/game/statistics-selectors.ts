import type { StatisticsState } from '../features/statistics';
import type { GameState } from './game-state';

const ENTRIES = [
  { key: 'manualJobsCompleted', label: 'Manual Jobs', description: 'Successful manual deliveries completed.' },
  { key: 'automatedJobsCompleted', label: 'Automated Jobs', description: 'Deliveries completed by the Dispatcher.' },
  { key: 'businessLevelsPurchased', label: 'Business Upgrades', description: 'Paid level upgrades, excluding initial purchases.' },
  { key: 'territoriesAcquired', label: 'Territories Taken', description: 'Paid takeovers across all runs, excluding Waterfront.' },
  { key: 'crewMembersRecruited', label: 'Crew Recruited', description: 'Recruitments across all runs, including repeat recruits.' },
  { key: 'eventsResolved', label: 'Events Resolved', description: 'City event choices completed, including passing.' },
  { key: 'rebirthsCompleted', label: 'Rebirths', description: 'Successful Rebirths completed.' },
  { key: 'peakHeat', label: 'Peak Heat', description: 'Highest Heat recorded after a completed action or elapsed batch.' },
] as const satisfies readonly { readonly key: keyof StatisticsState; readonly label: string; readonly description: string }[];
const numberFormat = new Intl.NumberFormat('en-US');
export function selectStatistics(state: GameState) {
  return ENTRIES.map(entry => {
    const value = state.permanentProgression.statistics[entry.key];
    return { ...entry, value, formattedValue: numberFormat.format(value) + (entry.key === 'peakHeat' ? ' / 100' : '') };
  });
}
