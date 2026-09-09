import { describe,expect,it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AutoUpgraderCard } from './AutoUpgraderCard';
import { OfflineReturn } from './OfflineReturn';
import { selectAutoUpgrader } from '../game/automation-selectors';
import { autoUpgraderState as initial } from '../game/test-fixtures/auto-upgrader-state';
import { createInitialGameState } from '../game/game-state';
import { purchaseAutomation } from '../game/purchase-automation';
import { setAutomationEnabled } from '../game/set-automation-enabled';
import { BUSINESS_AUTO_UPGRADER as A, DELIVERY_DISPATCHER as D } from '../features/automation';
import { describeAction } from './game-presentation';
import { describeAutomationToggle } from './automation-presentation';
import { reconcileOffline } from '../game/offline-progress';
import { REBIRTH_POLICY } from '../game/rebirth';
function render(state=initial(),paused=false) {return renderToStaticMarkup(<AutoUpgraderCard view={selectAutoUpgrader(state)} paused={paused} onPurchase={()=>{}} onToggle={()=>{}} />);}
describe('explicit automatic spending presentation',()=>{
  it('shows a locked card, exact price/gates and spending disclosure',()=>{
    const html=render(createInitialGameState());
    for(const text of ['BUSINESS AUTO-UPGRADER','$250,000.00','Player Level 20','Own Dockside Detail','Dockside Detail Level 25','Control Neon Mile','every 30 seconds','Automatically spends cash','LOCKED'])expect(html).toContain(text);
    expect(html).toContain('disabled=""');expect(html).toContain('aria-describedby="auto-upgrader-requirements auto-upgrader-spending"');
  });
  it('separates insufficient cash from satisfied requirements; ready purchase remains explicit',()=>{
    const s=initial(),available={...s,automation:createInitialGameState().automation};
    expect(render(available)).toContain('Ready to purchase. Starts disabled');expect(render(available)).not.toContain('disabled=""');
    const poor={...initial(25,'24999900'),automation:createInitialGameState().automation};
    expect(render(poor)).toContain('More cash needed');expect(render(poor)).not.toContain('LOCKED');expect(render(poor)).toContain('disabled=""');
  });
  it('purchase starts disabled, removes buying, then enabled/disabled states follow the command',()=>{
    const s=initial(),purchased=purchaseAutomation({...s,automation:createInitialGameState().automation},A.id).state;
    const html=render(purchased);expect(html).toContain('DISABLED');expect(html).toContain('aria-label="Enable Business Auto-Upgrader"');
    expect(html).toContain('Progress paused');expect(html).not.toContain('Buy Business Auto-Upgrader');
    const enabled=setAutomationEnabled(purchased,A.id,true).state;expect(render(enabled)).toContain('ACTIVE');expect(render(enabled)).toContain('aria-label="Disable Business Auto-Upgrader"');
    expect(render(setAutomationEnabled(enabled,A.id,false).state)).toContain('DISABLED');
  });
  it('shows exact level/cost and accessible paused/current progress without a new UI clock',()=>{
    const s=initial(),state={...s,automation:{...s.automation,businessAutoUpgradeElapsedMs:20001}},html=render(state);
    for(const text of ['Dockside Level 25','$93,750.00','Next attempt in 10s','for="auto-upgrader-progress"','max="30000"','value="20001"'])expect(html).toContain(text);
    expect(render(state,true)).toContain('PAUSED');expect(render(state,true)).toContain('disabled=""');
    expect(html).toContain('panel upgrade-panel');expect(html).not.toMatch(/<canvas|<svg|<select/);
  });
  it('max level still shows cadence and toggle, with no next cost or extra purchase',()=>{
    const html=render(initial(100));expect(html).toContain('MAX LEVEL');expect(html).not.toContain('Next upgrade:');
    expect(html).toContain('Next attempt in 30s');expect(html).toContain('DISABLE');
  });
  it('reports no target after a structurally valid low-progression import without rechecking purchase gates',()=>{
    const s=initial(),html=render({...s,businesses:createInitialGameState().businesses,progression:{xp:0}});
    expect(html).toContain('Dockside not owned');expect(html).not.toContain('LOCKED');expect(html).toContain('DISABLE');
  });
  it('purchase/toggle feedback explains opt-in and preserves Dispatcher feedback',()=>{
    const s=initial(),base={...s,automation:createInitialGameState().automation};
    expect(describeAction('automation',purchaseAutomation(base,A.id),A.id)).toContain('Disabled until you enable');
    expect(describeAction('automation',purchaseAutomation(base,D.id),D.id)).toContain('deliveries are active');
    expect(describeAutomationToggle(setAutomationEnabled(s,A.id,true),true)).toContain('Cash will fund');
    expect(describeAutomationToggle(setAutomationEnabled(s,A.id,false),false)).toContain('progress is paused');
    expect(describeAutomationToggle(setAutomationEnabled(base,A.id,true),true)).toContain('Purchase');
  });
  it('offline welcome shows levels and spending separately from gross income even when cash fell',()=>{
    const r=reconcileOffline(initial(25,'9262500'),0,90000);if(!r.ok)throw Error(r.error);
    const html=renderToStaticMarkup(<OfflineReturn progress={r.progress} onDismiss={()=>{}} />);
    expect(html).toContain('Business Auto-Upgrader: Dockside +1 levels');expect(html).toContain('Spent $93,750.00');expect(html).toContain('$1,710.00 earned before automatic spending');
    expect(html).toContain('role="status"');expect(html).toContain('Continue');
  });
  it('no upgrades means no fake auto-upgrade welcome summary; Rebirth loses this automation',()=>{
    const r=reconcileOffline(initial(25,'0'),0,30000);if(!r.ok)throw Error(r.error);
    expect(renderToStaticMarkup(<OfflineReturn progress={r.progress} onDismiss={()=>{}} />)).not.toContain('Business Auto-Upgrader:');
    expect(REBIRTH_POLICY.automation.action).toBe('reset');expect(REBIRTH_POLICY.automation.labels.join(' ')).toContain('Business Auto-Upgrader ownership, enabled state and progress');
  });
});
