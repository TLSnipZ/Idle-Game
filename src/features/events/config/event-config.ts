import { moneyFromMinorUnits as money } from '../../economy';
import { STARTER_BUSINESS } from '../../businesses';
import type { EventDefinition } from '../model/event';
export const EVENT_OPPORTUNITY_MS = 600000;
export const EVENT_SPAWN_CHANCE = 0.35;
export const EVENT_CATALOG: readonly EventDefinition[] = [
  { id:'event:hot-tip', name:'Hot Tip', description:'Someone has a quick-money lead.',
    requirements:[{type:'player-level',minimumLevel:5}], minimumHeat:0,
    choices:[
      {id:'choice:take-tip',label:'TAKE THE TIP',outcome:'Tip taken',cost:money('0'),reward:money('150000'),heatChange:5},
      {id:'choice:play-safe',label:'PLAY IT SAFE',outcome:'Played it safe',cost:money('0'),reward:money('0'),heatChange:-5},
    ] },
  { id:'event:shakedown', name:'Shakedown', description:'Someone wants a cut of the operation.',requirements:[],minimumHeat:20,
    choices:[
      {id:'choice:pay-off',label:'PAY THEM OFF',outcome:'Paid them off',cost:money('100000'),reward:money('0'),heatChange:-10},
      {id:'choice:refuse',label:'REFUSE',outcome:'Refused',cost:money('0'),reward:money('0'),heatChange:10},
    ] },
  { id:'event:warehouse-opportunity',name:'Warehouse Opportunity',description:'A short-lived logistics opportunity is available.',
    requirements:[{type:'business-owned',businessId:STARTER_BUSINESS.id},{type:'player-level',minimumLevel:10}],minimumHeat:0,
    choices:[
      {id:'choice:invest',label:'INVEST',outcome:'Investment returned',cost:money('250000'),reward:money('400000'),heatChange:5},
      {id:'choice:pass',label:'PASS',outcome:'Opportunity passed',cost:money('0'),reward:money('0'),heatChange:0},
    ] },
];
for (const event of EVENT_CATALOG) {
  event.requirements.forEach(Object.freeze); Object.freeze(event.requirements);
  event.choices.forEach(Object.freeze); Object.freeze(event.choices); Object.freeze(event);
}
Object.freeze(EVENT_CATALOG);
export function findEvent(id: unknown) { return EVENT_CATALOG.find(event => event.id === id); }
