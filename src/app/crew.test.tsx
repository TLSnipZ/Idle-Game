import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CrewPanel } from './CrewPanel';
import { HeatPanel } from './HeatPanel';
import { ModifierBreakdown } from './ModifierBreakdown';
import { RebirthPanelView } from './RebirthPanel';
import { createRebirthControls } from './rebirth-controls';
import { crewPresentation, describeCrewCommand } from './crew-presentation';
import { heatPresentation } from './heat-presentation';
import { selectRebirth } from '../game/rebirth';
import { selectCrew } from '../game/crew-selectors';
import { crewState } from '../game/test-fixtures/crew-state';
import { rebirthState } from '../game/test-fixtures/rebirth-state';
import { createInitialGameState } from '../game/game-state';
import { recruitCrewMember, assignCrewMember, unassignCrewSlot } from '../game/crew-commands';
import { evaluateJobReward, evaluateBusinessProduction } from '../game/effective-stats';
import { rebirthRuntime } from '../platform/test-fixtures/rebirth-runtime';
import { RICO_VALE as R, MARA_KNOX as M, JAX_MERCER as J, CREW_CATALOG, createInitialCrewState } from '../features/crew';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { moneyFromMinorUnits } from '../features/economy';
import type { GameState } from '../game/game-state';
function render(state:GameState=createInitialGameState(),paused=false){return renderToStaticMarkup(<CrewPanel state={state} paused={paused} onRecruit={()=>{}} onAssign={()=>{}} onUnassign={()=>{}}/>);}
describe('Crew presentation and actions',()=>{
  it('renders exactly three members and two named slots in deterministic, mobile-safe structure',()=>{
    const html=render();expect(html).toContain('CREW');expect(html).toContain('Recruited: 0 / 3 · Active: 0 / 2');
    expect(html.match(/class="panel crew-card"/g)).toHaveLength(3);expect(html.match(/class="panel crew-slot"/g)).toHaveLength(2);
    expect(html.indexOf('Rico Vale')).toBeLessThan(html.indexOf('Mara Knox'));expect(html.indexOf('Mara Knox')).toBeLessThan(html.indexOf('Jax Mercer'));
    expect(html.indexOf('OPERATIONS')).toBeLessThan(html.indexOf('LOGISTICS'));expect(html).toContain('No active specialist');expect(html).toContain('crew-catalog');
    expect(html).toContain('Operations is a choice');expect(html).not.toMatch(/<img|auto.assign|wages|crew-xp/);
  });
  it.each([[R,'$20,000.00','Player Level 8'],[M,'$30,000.00','Control Neon Mile'],[J,'$40,000.00','Dockside Detail Level 15']] as const)('shows $0.name price and central requirement text', (member,cost,requirement)=>{
    const html=render();expect(html).toContain(cost);expect(html).toContain(requirement);
    expect(html).toContain(`aria-label="Recruit ${member.name}"`);expect(html).toContain(`aria-describedby="${member.id}-requirements"`);
    expect(crewPresentation(createInitialGameState(),member.id)).toMatchObject({status:'LOCKED',canRecruit:false});
  });
  it.each(CREW_CATALOG)('$name distinguishes unlocked cash shortage from requirement locks and recruitment readiness',member=>{
    const s={...crewState(),crew:createInitialCrewState(),economy:{cash:moneyFromMinorUnits('0')}};
    expect(crewPresentation(s,member.id)).toMatchObject({status:'AVAILABLE',availability:'Insufficient cash',canRecruit:false});
    const ready={...s,economy:{cash:member.recruitmentCost}};expect(crewPresentation(ready,member.id)).toMatchObject({canRecruit:true,availability:'Ready to recruit'});
    const recruited=recruitCrewMember(ready,member.id).state;expect(crewPresentation(recruited,member.id)).toMatchObject({status:'RECRUITED',availability:'Unassigned — effect inactive',activeEffect:null});
  });
  it('offers only compatible assignment actions, no automatic effects or repeated recruitment',()=>{
    const html=render(crewState());expect(html).toContain('Recruited: 3 / 3 · Active: 0 / 2');
    for(const member of CREW_CATALOG)expect(html).not.toContain(`aria-label="Recruit ${member.name}"`);
    expect(html).toContain('aria-label="Assign Rico Vale to Operations"');expect(html).toContain('aria-label="Assign Mara Knox to Operations"');expect(html).toContain('aria-label="Assign Jax Mercer to Logistics"');
    expect(html).not.toMatch(/Assign Rico Vale to Logistics|Assign Mara Knox to Logistics|Assign Jax Mercer to Operations/);
  });
  it('replacement and unassignment update cards, active counts and explicit action labels through runtime',()=>{
    const f=rebirthRuntime(crewState({operations:R.id,logistics:J.id}));let feedback='';
    expect(render(f.game.getSnapshot().result.state)).toContain('Assign Mara Knox to Operations, replacing Rico Vale');
    f.game.execute(state=>{const r=assignCrewMember(state,'operations',M.id);feedback=describeCrewCommand(r,'assign',M.id,'operations');return r;});
    const s=f.game.getSnapshot().result.state,html=render(s);expect(html).toContain('Recruited: 3 / 3 · Active: 2 / 2');
    expect(crewPresentation(s,R.id)?.status).toBe('RECRUITED');expect(crewPresentation(s,M.id)?.status).toBe('ACTIVE');
    expect(html).toContain('aria-label="Unassign Operations"');expect(html).toContain('Heat cools every 45s');expect(feedback).toBe('Mara Knox assigned to Operations. Heat cools every 45s.');
    f.game.execute(state=>{const r=unassignCrewSlot(state,'operations');feedback=describeCrewCommand(r,'unassign',undefined,'operations');return r;});
    expect(selectCrew(f.game.getSnapshot().result.state).activeAssignmentCount).toBe(1);expect(feedback).toContain('remains recruited');
    expect(render(f.game.getSnapshot().result.state)).not.toContain('aria-label="Unassign Operations"');
  });
  it.each([[R,'+10% Job & Dispatcher cash'],[M,'Heat cools every 45s'],[J,'+15% global business production']] as const)('names active effect for $0.name without claiming bench activation', (member,effect)=>{
    const s=assignCrewMember(crewState(),member.allowedSlots[0],member.id).state;
    expect(crewPresentation(s,member.id)).toMatchObject({status:'ACTIVE',effect});expect(crewPresentation(crewState(),member.id)?.availability).toContain('inactive');
    const result=recruitCrewMember({...crewState(),crew:createInitialCrewState()},member.id);
    expect(describeCrewCommand(result,'recruit',member.id)).toContain('Effect inactive until assigned');
    expect(describeCrewCommand(result,'recruit',member.id)).toContain('Available for');
  });
  it('failure feedback comes from structured categories',()=>{
    const s=createInitialGameState();expect(describeCrewCommand(recruitCrewMember(s,R.id),'recruit',R.id)).toContain('Player Level 8');
    expect(describeCrewCommand(recruitCrewMember({...crewState(),crew:createInitialCrewState(),economy:s.economy},R.id),'recruit',R.id)).toContain('Not enough cash');
    expect(describeCrewCommand(assignCrewMember(crewState(),'logistics',R.id),'assign',R.id,'logistics')).toContain('cannot fill');
    expect(describeCrewCommand(unassignCrewSlot(crewState(),'operations'),'unassign')).toContain('already empty');
    expect(describeCrewCommand(recruitCrewMember(s,'unknown'),'recruit')).toContain('failed');
  });
  it('Mara cooling text and countdown derive from the same interval including overdue progress',()=>{
    const s={...crewState(),city:{...crewState().city,heat:20,heatDecayElapsedMs:40000}};
    expect(heatPresentation(s)).toMatchObject({cooling:'Cooling: 1 Heat every 60s',countdown:'Cooling in 20s'});
    const mara=assignCrewMember(s,'operations',M.id).state;expect(heatPresentation(mara)).toMatchObject({cooling:'Cooling: 1 Heat every 45s',countdown:'Cooling in 5s'});
    expect(renderToStaticMarkup(<HeatPanel state={mara} paused={false} onLayLow={()=>{}}/>)).toContain('Cooling: 1 Heat every 45s');
    const rico=assignCrewMember(mara,'operations',R.id).state;expect(heatPresentation(rico).cooling).toContain('60s');
    expect(heatPresentation({...mara,city:{...mara.city,heatDecayElapsedMs:50000}}).countdown).toBe('Cooling in 0s');
  });
  it('central breakdown includes only assigned Rico/Jax and updates after replacement/unassignment',()=>{
    const s=crewState({operations:R.id,logistics:J.id});
    const job=evaluateJobReward(s),production=evaluateBusinessProduction(s,B.id,1);if(!job.ok||!production.ok)throw Error('fixture');
    expect(renderToStaticMarkup(<ModifierBreakdown modifiers={job.applied}/>)).toContain('Rico Vale: +10%');
    expect(renderToStaticMarkup(<ModifierBreakdown modifiers={production.applied}/>)).toContain('Jax Mercer: +15%');
    const changed=unassignCrewSlot(assignCrewMember(s,'operations',M.id).state,'logistics').state;
    const j=evaluateJobReward(changed),p=evaluateBusinessProduction(changed,B.id,1);if(!j.ok||!p.ok)throw Error('fixture');
    expect(renderToStaticMarkup(<ModifierBreakdown modifiers={j.applied}/>)).not.toContain('Rico');expect(renderToStaticMarkup(<ModifierBreakdown modifiers={p.applied}/>)).not.toContain('Jax');
  });
  it('Rebirth confirmation discloses Crew loss and successful reset immediately removes active cards',()=>{
    const f=rebirthRuntime({...rebirthState(),crew:crewState({operations:R.id,logistics:J.id}).crew});
    const controls=createRebirthControls(()=>f.game.rebirth(),()=>{});controls.request();
    const html=renderToStaticMarkup(<RebirthPanelView preview={selectRebirth(f.game.getSnapshot().result.state)} unavailable={false} interaction={controls.getSnapshot()} controls={controls}/>);
    expect(html).toContain('Recruited Crew and active assignments');expect(html).toContain('Permanent skills');
    controls.confirm();expect(render(f.game.getSnapshot().result.state)).toContain('Recruited: 0 / 3 · Active: 0 / 2');
  });
  it('paused session disables recruitment and compatible assignment/unassignment buttons',()=>{
    expect(render(crewState({operations:R.id,logistics:J.id}),true).match(/<button[^>]*disabled=""/g)).toHaveLength(3);
    expect(render({...crewState(),crew:createInitialCrewState()},true).match(/<button[^>]*disabled=""/g)).toHaveLength(3);
  });
});
