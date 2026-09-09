import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CityEvents } from './CityEvents';
import { eventPresentation, describeEventResolution } from './event-presentation';
import { EVENT_CATALOG } from '../features/events';
import { eventState, fakeRandom, TIP, SHAKE, WAREHOUSE } from '../game/test-fixtures/event-state';
import { createInitialGameState } from '../game/game-state';
import type { GameState } from '../game/game-state';
import { resolveEventChoice } from '../game/resolve-event-choice';
import { rebirthRuntime } from '../platform/test-fixtures/rebirth-runtime';
import { performStarterJob } from '../game/perform-starter-job';
import { selectRebirth, REBIRTH_POLICY } from '../game/rebirth';
import { rebirthState } from '../game/test-fixtures/rebirth-state';
function render(state:GameState=createInitialGameState(),paused=false) {return renderToStaticMarkup(<CityEvents state={state} paused={paused} onChoose={()=>{}}/>);}
describe('non-blocking City Events presentation',()=>{
  it.each([[0,'10:00'],[300000,'05:00'],[599000,'00:01'],[599999,'00:01']])('idle progress %i gives derived countdown %s',(opportunityElapsedMs,countdown)=>{
    const s={...createInitialGameState(),events:{pendingEventId:null,opportunityElapsedMs}};
    expect(eventPresentation(s).countdown).toBe(countdown);const html=render(s);
    expect(html).toContain('CITY EVENTS');expect(html).toContain('No active event');expect(html).toContain(`Next opportunity: ${countdown}`);
    expect(html).toContain('A city situation may appear when the online opportunity timer completes');expect(html).not.toMatch(/guaranteed|Hot Tip|SHAKEDOWN|event-history|<button/);
  });
  it.each(EVENT_CATALOG)('$name exposes exactly two deterministic choices and outcomes without blocking play',event=>{
    const s=eventState(event.id),view=eventPresentation(s),html=render(s);
    expect(html).toContain(event.name.toUpperCase());expect(html).toContain(event.description);expect(view.choices).toHaveLength(2);
    expect(html.match(/<button/g)).toHaveLength(2);expect(html).toContain('Event timer paused until resolved');expect(html).toContain('Your operation continues');
    expect(html).toContain('class="event-choices"');expect(html).toContain('aria-labelledby="city-events-heading"');
    expect(html).not.toMatch(/role="dialog"|aria-modal|<img|tabindex="-1"|animation|disabled=""/);expect(view.countdown).toBeNull();
    for(const c of view.choices){expect(html).toContain(c.choice.label);expect(html).toContain(`aria-describedby="${c.choice.id}-effects"`);for(const effect of c.effects)expect(html).toContain(effect);}
  });
  it.each([
    [TIP,['+$1,500.00','+5 Heat','-5 Heat']],
    [SHAKE,['-$1,000.00','-10 Heat','+10 Heat']],
    [WAREHOUSE,['Cost: $2,500.00','Return: $4,000.00','+5 Heat','No effect']],
  ] as const)('%s shows exact visible consequences', (id,effects)=>{const html=render(eventState(id));for(const effect of effects)expect(html).toContain(effect);});
  it.each([[SHAKE,'99999','$1,000.00'],[WAREHOUSE,'249999','$2,500.00']] as const)('%s keeps free alternative enabled when cash is short',(id,cash,cost)=>{
    const s=eventState(id,cash),html=render(s),view=eventPresentation(s);
    expect(view.choices.map(c=>c.canChoose)).toEqual([false,true]);expect(html.match(/disabled=""/g)).toHaveLength(1);
    expect(html).toContain(`Requires ${cost} to choose this option`);expect(html).not.toContain('LOCKED');
  });
  it('persistence/runtime suspension semantically disables both choices',()=>{
    expect(render(eventState(TIP),true).match(/disabled=""/g)).toHaveLength(2);
  });
  it.each(EVENT_CATALOG.flatMap(e=>e.choices.map(c=>({event:e.id,choice:c.id,outcome:c.outcome}))))('$event / $choice feedback describes the configured outcome and resolved UI',({event,choice,outcome})=>{
    const f=rebirthRuntime(eventState(event),fakeRandom());let feedback='';
    f.game.execute(s=>{const r=resolveEventChoice(s,event,choice);feedback=describeEventResolution(r);return r;});
    expect(feedback).toContain(outcome);expect(feedback).not.toMatch(/XP|Empire Points|vehicle|confiscat|arrest/);
    if(choice==='choice:invest'){expect(feedback).toContain('Return: $4,000.00');expect(feedback).toContain('net +$1,500.00');}
    const html=render(f.game.getSnapshot().result.state);expect(html).toContain('No active event');expect(html).toContain('10:00');f.game.stop();
  });
  it.each([[SHAKE,'choice:pay-off'],[WAREHOUSE,'choice:invest']] as const)('failed %s feedback leaves the panel and frozen remainder', (id,choice)=>{
    const s=eventState(id,'0'),r=resolveEventChoice(s,id,choice);
    expect(describeEventResolution(r)).toContain('Not enough cash');expect(render(r.state)).toContain('Event timer paused');expect(r.state.events).toBe(s.events);
  });
  it('announces one new event, keeps announcement identity stable across refreshes, and never announces imported/loaded events',()=>{
    const s={...eventState(),events:{opportunityElapsedMs:599999,pendingEventId:null}},rng=fakeRandom(0,0),f=rebirthRuntime(s,rng);f.at(1);f.tick();
    const view=f.game.getSnapshot(),a=view.cityEvent;expect(a).toBeDefined();
    const html=renderToStaticMarkup(<CityEvents state={view.result.state} paused={false} announcement={a} onChoose={()=>{}}/>);
    expect(html.match(/Hot Tip is available\./g)).toHaveLength(1);expect(html).toContain('role="status"');expect(html).toContain('aria-live="polite"');
    f.at(1000);f.tick();f.game.execute(performStarterJob);expect(f.game.getSnapshot().cityEvent).toBe(a);expect(rng.calls()).toBe(2);
    expect(render(view.result.state)).not.toContain('is available.');f.game.stop();
  });
  it('render/selection/feedback never call a browser RNG',()=>{
    const random=vi.spyOn(Math,'random').mockImplementation(()=>{throw Error('Rendering must not roll');});
    try {for(const e of EVENT_CATALOG){const s=eventState(e.id);render(s);eventPresentation(s);describeEventResolution(resolveEventChoice(s,e.id,e.choices[1].id));}expect(random).not.toHaveBeenCalled();}finally{random.mockRestore();}
  });
  it('Rebirth preview remains unchanged and declares temporary event loss',()=>{
    const s=rebirthState();expect(selectRebirth({...s,events:eventState(TIP).events})).toEqual(selectRebirth(s));
    expect(REBIRTH_POLICY.events).toEqual({action:'reset',labels:['Active city event and opportunity progress']});
  });
});
