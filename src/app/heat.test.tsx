import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HeatPanel } from './HeatPanel';
import { City } from './City';
import { heatPresentation, describeLayLow } from './heat-presentation';
import { ModifierBreakdown } from './ModifierBreakdown';
import { describeAction } from './game-presentation';
import { formatBonus } from './stat-format';
import { createInitialGameState } from '../game/game-state';
import { territoryState } from '../game/test-fixtures/territory-state';
import { evaluateJobReward } from '../game/effective-stats';
import { performStarterJob } from '../game/perform-starter-job';
import { layLow } from '../game/lay-low';
import { REBIRTH_POLICY } from '../game/rebirth';
import { moneyFromMinorUnits } from '../features/economy';
import { rebirthRuntime } from '../platform/test-fixtures/rebirth-runtime';

function state(heat=0,remainder=0,cash='50000') {
  const s=createInitialGameState();return{...s,economy:{cash:moneyFromMinorUnits(cash)},city:{...s.city,heat,heatDecayElapsedMs:remainder}};
}
function render(s=state(),paused=false){return renderToStaticMarkup(<HeatPanel state={s} paused={paused} onLayLow={()=>{}}/>);}
describe('Heat presentation and city interaction',()=>{
  it.each([[0,'COLD'],[20,'NOTICED'],[40,'WATCHED'],[60,'HOT'],[80,'MANHUNT'],[100,'MANHUNT']] as const)('shows exact bounded Heat and readable tier at %i', (heat,label)=>{
    const html=render(state(heat));expect(html).toContain('HEAT');expect(html).toContain(`${heat} / 100 — ${label}`);
    expect(html).toContain(`aria-label="Current Heat" max="100" value="${heat}"`);
    expect(html).toContain('XP and business production unaffected');
    expect(html).not.toMatch(/wanted-star|siren|police encounter/);
  });
  it.each([0,20,59])('shows no penalty below HOT (%i)',heat=>{
    expect(render(state(heat))).toContain('No starter-job cash penalty');
  });
  it.each([[60,'-10%'],[80,'-25%']] as const)('explains the active cash penalty at %i', (heat,penalty)=>{
    expect(render(state(heat))).toContain(`Starter jobs &amp; Dispatcher cash ${penalty}`);
    const reward=evaluateJobReward(state(heat));if(!reward.ok)throw Error('fixture');
    const html=renderToStaticMarkup(<ModifierBreakdown modifiers={reward.applied}/>);
    expect(html).toContain(`Heat — ${heat===60?'HOT':'MANHUNT'}: ${penalty}`);expect(html).not.toContain('modifier:heat');
  });
  it('formats signed percentage deltas exactly',()=>{
    expect(formatBonus(-1000)).toBe('-10%');expect(formatBonus(-25)).toBe('-0.25%');expect(formatBonus(2500)).toBe('+25%');
  });
  it('hides cooling when cold and rounds only the displayed seconds upward',()=>{
    expect(heatPresentation(state()).countdown).toBeNull();expect(render()).not.toContain('Cooling in');
    expect(heatPresentation(state(42,37000))).toMatchObject({untilDecayMs:23000,countdown:'Cooling in 23s',heatDecayElapsedMs:37000,percentage:42});
    expect(render(state(1,59999))).toContain('Cooling in 1s');
  });
  it('distinguishes cold, cash shortage, ready and paused controls',()=>{
    expect(render()).toContain('Already cold');expect(render()).toContain('disabled=""');
    const broke=render(state(20,0,'49900'));expect(broke).toContain('Insufficient cash');expect(broke).toContain('disabled=""');
    const ready=render(state(20));expect(ready).toContain('Reduce Heat by 10');expect(ready).toContain('$500.00');
    expect(ready).toContain('aria-label="Lay low to reduce Heat"');expect(ready).not.toContain('disabled=""');
    expect(render(state(20),true)).toContain('Session paused');
  });
  it('uses the runtime command and actual final Heat in successful feedback',()=>{
    const f=rebirthRuntime(state(75,42000,'1000000'));let feedback='';
    f.game.execute(s=>{const result=layLow(s);feedback=describeLayLow(result);return result;});
    expect(feedback).toContain('-$500.00');expect(feedback).toContain('Heat now 65');
    expect(render(f.game.getSnapshot().result.state)).toContain('65 / 100 — HOT');f.game.stop();
    expect(describeLayLow(layLow(state()))).toContain('Already cold');
    expect(describeLayLow(layLow(state(20,0,'49900')))).toContain('Not enough cash');
  });
  it('manual feedback uses actual payout before its Heat gain crosses a tier',()=>{
    expect(describeAction('delivery',performStarterJob(state(59)))).toContain('+$25.00 · +10 XP');
    expect(describeAction('delivery',performStarterJob(state(79)))).toContain('+$22.50 · +10 XP');
    expect(describeAction('delivery',performStarterJob(state(80)))).toContain('+$18.75 · +10 XP');
  });
  it('integrates Heat with exactly two territory cards and discloses acquisition Heat',()=>{
    const html=renderToStaticMarkup(<City state={territoryState()} paused={false} onAcquire={()=>{}} onLayLow={()=>{}}/>);
    expect(html).toContain('SOLARA CITY');expect(html).toContain('Territories controlled: 1 / 2');
    expect(html.match(/class="panel territory-card/g)).toHaveLength(2);
    expect(html).toContain('Acquisition generates +10 Heat');expect(html).toContain('heat-panel');
    const base=territoryState(true),hot={...base,city:{...base.city,heat:100}};
    const owned=renderToStaticMarkup(<City state={hot} paused={false} onAcquire={()=>{}} onLayLow={()=>{}}/>);
    expect(owned).toContain('Territories controlled: 2 / 2');expect(owned).not.toContain('Take control');
    expect(owned).not.toContain('Acquisition generates');expect(owned).toContain('100 / 100 — MANHUNT');
  });
  it('explicitly lists Heat as temporary in the shared Rebirth confirmation policy',()=>{
    expect(REBIRTH_POLICY.city.action).toBe('reset');expect(REBIRTH_POLICY.city.labels).toContain('Heat / current police attention');
    expect(REBIRTH_POLICY.garage.action).toBe('retain');expect(REBIRTH_POLICY.permanentProgression.labels).toContain('Permanent skills');
  });
});
