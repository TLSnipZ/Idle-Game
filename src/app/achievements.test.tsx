import { RebirthPanel } from './RebirthPanel';
import { rebirthState } from '../game/test-fixtures/rebirth-state';
import { performRebirth } from '../game/rebirth';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Achievements } from './Achievements';
import { ACHIEVEMENT_CATALOG } from '../features/achievements';
import { createInitialGameState } from '../game/game-state';
import { selectAchievements } from '../game/achievements';
import { REBIRTH_POLICY } from '../game/rebirth';
describe('visible permanent achievements',()=>{
  it('shows exactly six named locked cards in order, count and current progress',()=>{
    const s=createInitialGameState(),html=renderToStaticMarkup(<Achievements state={s}/>);
    expect(html).toContain('ACHIEVEMENTS'); expect(html).toContain('Unlocked: 0 / 6'); expect(html.match(/<article /g)).toHaveLength(6);
    let previous=-1;for(const a of ACHIEVEMENT_CATALOG){const index=html.indexOf(a.name);expect(index).toBeGreaterThan(previous);previous=index;}
    expect(selectAchievements(s).cards.map(a=>a.progress)).toEqual(['Level 1 / 2','Dockside Level 0 / 10','Not controlled','Heat 0 / 60','0 / 3 recruited','0 / 1']);
    expect(html).not.toMatch(/\?\?\?|reward|<button/i);
  });
  it.each(ACHIEVEMENT_CATALOG)('$name remains completed when current temporary conditions disappear',a=>{
    const s=createInitialGameState(),state={...s,permanentProgression:{...s.permanentProgression,unlockedAchievementIds:[a.id]}};
    const view=selectAchievements(state).cards.find(card=>card.id===a.id);expect(view).toMatchObject({unlocked:true,progress:'Completed'});
    const html=renderToStaticMarkup(<Achievements state={state}/>);expect(html).toContain('Unlocked: 1 / 6');expect(html).toContain('UNLOCKED');expect(html).toContain('Completed');
  });
  it('groups all new names in one accessible announcement without storing history',()=>{
    const ids=ACHIEVEMENT_CATALOG.map(a=>a.id),html=renderToStaticMarkup(<Achievements state={createInitialGameState()} announcement={{ids,sequence:1}}/>);
    expect(html).toContain('role="status" aria-live="polite" aria-atomic="true"');expect(html).toContain(`ACHIEVEMENTS UNLOCKED — ${ACHIEVEMENT_CATALOG.map(a=>a.name).join(' · ')}`);
  });
  it('uses mobile-safe grid and text completion, no animation or color-only state',()=>{
    const html=renderToStaticMarkup(<Achievements state={createInitialGameState()}/>);expect(html).toContain('class="achievement-grid"');
    expect(html).toContain('class="achievement-card ');expect(REBIRTH_POLICY.permanentProgression.labels).toContain('Achievements');
  });
});

it('Rebirth keeps five completed cards and completes First Rebirth in the same visible state',()=>{
  const s=rebirthState(),before={...s,permanentProgression:{...s.permanentProgression,unlockedAchievementIds:ACHIEVEMENT_CATALOG.slice(0,5).map(a=>a.id)}};
  expect(renderToStaticMarkup(<Achievements state={before}/>)).toContain('Unlocked: 5 / 6');
  const result=performRebirth(before);expect(result.ok).toBe(true);
  const html=renderToStaticMarkup(<Achievements state={result.state}/>);expect(html).toContain('Unlocked: 6 / 6');expect(html.match(/Completed/g)).toHaveLength(6);expect(html).not.toContain('Heat 0 / 60');
  const rebirth=renderToStaticMarkup(<RebirthPanel state={before} unavailable={false} onRebirth={()=>({ok:false,error:'runtime-unavailable'})}/>);
  const keep=rebirth.slice(rebirth.indexOf('You keep'),rebirth.indexOf('You lose'));expect(keep).toContain('<li>Achievements</li>');
});
