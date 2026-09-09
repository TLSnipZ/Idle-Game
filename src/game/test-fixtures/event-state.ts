import { createInitialGameState } from '../game-state';
import type { GameState } from '../game-state';
import type { EventId } from '../../features/events';
import { getXpThresholdForLevel } from '../../features/progression';
import { moneyFromMinorUnits } from '../../features/economy';
import { STARTER_BUSINESS } from '../../features/businesses';
export const TIP = 'event:hot-tip';
export const SHAKE = 'event:shakedown';
export const WAREHOUSE = 'event:warehouse-opportunity';
export function eventState(pendingEventId: EventId | null = null, cash = '1000000', heat = 50): GameState {
  const s = createInitialGameState();
  return {...s,economy:{cash:moneyFromMinorUnits(cash)},progression:{xp:getXpThresholdForLevel(10)},
    businesses:{...s.businesses,owned:{[STARTER_BUSINESS.id]:{level:1}}},
    city:{...s.city,heat,heatDecayElapsedMs:heat ? 30000 : 0},
    events:{pendingEventId,opportunityElapsedMs:123456}};
}
export function fakeRandom(...values: number[]) {
  let calls=0;
  return {next:()=>{const value=values[calls++];if(value===undefined)throw Error('Unexpected RNG call');return value;},calls:()=>calls};
}
