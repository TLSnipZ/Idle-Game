import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { UpgradeCard } from './UpgradeCard';
import { AutomationCard } from './AutomationCard';
import { PlayerProgress } from './PlayerProgress';
import { selectUpgrade } from '../game/selectors';
import { selectDispatcher } from '../game/automation-selectors';
import { createInitialGameState } from '../game/game-state';
import { STREET_CONNECTIONS as S, FLEET_LOGISTICS as F, PRESSURE_WASHER as W } from '../features/upgrades';
import { DELIVERY_DISPATCHER as D } from '../features/automation';
import { moneyFromMinorUnits } from '../features/economy';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { describeAction } from './game-presentation';
import { purchaseUpgrade } from '../game/purchase-upgrade';

const rich=()=>({ ...createInitialGameState(),economy:{cash:moneyFromMinorUnits('10000000')} });
function upgrade(xp:number) {
  return renderToStaticMarkup(<UpgradeCard view={selectUpgrade({...rich(),progression:{xp}},S.id)} paused={false} onPurchase={()=>{}} />);
}
describe('requirements presentation',()=>{
  it('distinguishes a rich but locked player from eligibility and cash shortfall',()=>{
    expect(upgrade(99)).toContain('Required — Player Level 2'); expect(upgrade(99)).toContain('disabled');
    expect(upgrade(100)).toContain('Met — Player Level 2'); expect(upgrade(100)).not.toContain('disabled');
    const poor={...createInitialGameState(),progression:{xp:100}};
    expect(renderToStaticMarkup(<UpgradeCard view={selectUpgrade(poor,S.id)} paused={false} onPurchase={()=>{}} />)).toContain('INSUFFICIENT CASH');
  });
  it('lists all fleet requirements in order with accessible states',()=>{
    const html=renderToStaticMarkup(<UpgradeCard view={selectUpgrade(rich(),F.id)} paused={false} onPurchase={()=>{}} />);
    expect(html).toContain('Required — Own at least one business');
    expect(html).toContain('Required — Purchase Commercial Pressure Washer');
    expect(html).toContain('Required — Player Level 5');
    expect(html.indexOf('Own at least')).toBeLessThan(html.indexOf('Purchase Commercial'));
    expect(html).toContain('aria-describedby');
    expect(describeAction('equipment',purchaseUpgrade(rich(),F.id))).toContain('Player Level 5');
  });
  it('owned content displays purchased/active rather than locked despite unmet gates',()=>{
    const state={...rich(),upgrades:{purchasedIds:[F.id,S.id]},automation: { businessAutoUpgradeTargetId: 'business:dockside-detail' as const,enabledIds:[],businessAutoUpgradeElapsedMs:0,unlockedIds:[D.id],starterJobElapsedMs:123}};
    const html=renderToStaticMarkup(<UpgradeCard view={selectUpgrade(state,F.id)} paused={false} onPurchase={()=>{}} />);
    expect(html).toContain('PURCHASED'); expect(html).not.toContain('LOCKED'); expect(html).not.toContain('<button');
    const dispatcher=renderToStaticMarkup(<AutomationCard view={selectDispatcher(state)} event={undefined} paused={false} onPurchase={()=>{}} />);
    expect(dispatcher).toContain('ACTIVE'); expect(dispatcher).not.toContain('LOCKED'); expect(dispatcher).toContain('value="123"');
  });
  it('dispatcher becomes ready at Level 3 with ownership, and remains locked without ownership',()=>{
    const initial=rich();
    const render=(xp:number,owned:boolean)=>renderToStaticMarkup(<AutomationCard view={selectDispatcher({...initial,progression:{xp},
      businesses:{...initial.businesses,owned:owned?{[B.id]:{level:1}}:{}}})} event={undefined} paused={false} onPurchase={()=>{}} />);
    expect(render(399,true)).toContain('Required — Player Level 3');
    expect(render(400,true)).toContain('Ready to hire');
    expect(render(400,false)).toContain('Required — Own Dockside Detail');
  });
  it('announces available content alongside level feedback without persistent unlock flags',()=>{
    const html=renderToStaticMarkup(<PlayerProgress xp={400} paused={false} event={{fromLevel:2,toLevel:3,sequence:1,unlocks:[D.name]}} />);
    expect(html).toContain('LEVEL UP — Level 3'); expect(html).toContain('New unlock available: Delivery Dispatcher');
    expect(html).toContain('aria-live="polite"');
    expect(selectUpgrade({...rich(),progression:{xp:1600},upgrades:{purchasedIds:[W.id]}},F.id)?.eligible).toBe(false);
  });
});
