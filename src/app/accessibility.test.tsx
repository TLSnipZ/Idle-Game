// @vitest-environment happy-dom
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createInitialGameState } from '../game/game-state';
import { autoUpgraderState } from '../game/test-fixtures/auto-upgrader-state';
import { moneyFromMinorUnits } from '../features/economy';
import { selectAutoUpgrader, selectDispatcher } from '../game/automation-selectors';
import { DELIVERY_DISPATCHER } from '../features/automation';
import { selectBusinessProgress } from '../game/selectors';
import { STARTER_BUSINESS } from '../features/businesses';
import { BusinessCard } from './BusinessCard';
import { HeatPanel } from './HeatPanel';
import { PlayerProgress } from './PlayerProgress';
import { AutoUpgraderCard } from './AutoUpgraderCard';
import { AutomationCard } from './AutomationCard';
import { CityEvents } from './CityEvents';
import { CrewPanel } from './CrewPanel';
import { City } from './City';
import { SkillTree } from './SkillTree';
import { Achievements } from './Achievements';
import { Statistics } from './Statistics';
import { Navigation } from './Navigation';
import { PRIMARY_SECTIONS } from './navigation';

const noop = () => {};
function dom(node: ReactNode) { const el = document.createElement('div'); el.innerHTML = renderToStaticMarkup(node); return el; }
function linkedText(root: Element, el: Element, attr: string) {
  return (el.getAttribute(attr) ?? '').split(' ').filter(Boolean).map(id => [...root.querySelectorAll('[id]')].find(e=>e.id===id)?.textContent ?? '').join(' ');
}
describe('presentation accessibility contracts', () => {
  it.each(PRIMARY_SECTIONS)('keeps native ordered navigation with a single current $label', section => {
    const root = dom(<Navigation active={section.id} onNavigate={noop} />);
    const buttons = [...root.querySelectorAll('nav button')];
    expect(buttons.map(b=>b.textContent)).toEqual(PRIMARY_SECTIONS.map(s=>s.label));
    expect(root.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(root.querySelector('[aria-current="page"]')?.textContent).toBe(section.label);
    expect(buttons.every(b=>b.getAttribute('type')==='button' && !b.hasAttribute('disabled') && !b.hasAttribute('tabindex'))).toBe(true);
  });
  it('exposes bounded Heat/tier and disabled Lay Low reason without color', () => {
    const root=dom(<HeatPanel state={createInitialGameState()} paused={false} onLayLow={noop} />);
    const bar=root.querySelector('progress'); expect(bar?.max).toBe(100); expect(bar?.value).toBe(0);
    expect(bar?.getAttribute('aria-label')).toContain('0 of 100, COLD');
    expect(root.querySelector('button')?.disabled).toBe(true); expect(root.textContent).toContain('Already cold');
    expect(root.querySelector('[aria-live]')).toBeNull();
  });
  it.each([0, 100, Number.MAX_SAFE_INTEGER])('XP %i has a label and a truthful next-level or max-level target', xp => {
    const root=dom(<PlayerProgress xp={xp} paused={false} event={undefined} />);
    const bar=root.querySelector('progress'); expect(bar?.value).toBeLessThanOrEqual(bar?.max ?? 0);
    expect(root.querySelector('label')?.htmlFor).toBe(bar?.id);
    expect(bar?.closest('[aria-live], [role="status"]')).toBeNull();
    if(xp===Number.MAX_SAFE_INTEGER) { expect(root.textContent).toContain('MAX LEVEL'); expect(root.textContent).not.toContain('Level 101'); }
  });
  it.each([true,false])('automation progress and enabled=%s state are readable on demand', enabled => {
    const s=autoUpgraderState(); const state={...s,automation:{...s.automation,enabledIds:enabled?s.automation.enabledIds:[]}};
    const root=dom(<AutoUpgraderCard view={selectAutoUpgrader(state)} paused={false} onPurchase={noop} onToggle={noop}/>);
    const bar=root.querySelector('progress'), button=root.querySelector('button');
    expect(bar?.getAttribute('aria-label')).toContain('Auto-Upgrader attempt');
    expect(linkedText(root,bar!, 'aria-describedby')).toContain(enabled?'enabled':'disabled');
    expect(button?.getAttribute('aria-label')).toBe(`${enabled?'Disable':'Enable'} Business Auto-Upgrader`);
    expect(linkedText(root,button!, 'aria-describedby')).toContain('Automatically spends cash');
    expect(bar?.closest('[aria-live], [role="status"]')).toBeNull();
  });
  it('Dispatcher progress names its system; repeated income is not a live announcement', () => {
    const s=autoUpgraderState(), state={...s,automation:{...s.automation,unlockedIds:[...s.automation.unlockedIds,DELIVERY_DISPATCHER.id]}};
    const root=dom(<AutomationCard view={selectDispatcher(state)} paused={false} onPurchase={noop} event={undefined}/>);
    expect(root.querySelector('progress')?.getAttribute('aria-label')).toBe('Delivery Dispatcher progress');
    expect(root.querySelector('[aria-live], [role="status"]')).toBeNull();
  });
  it('each event has a named choice group and exact described outcomes with an available alternative', () => {
    const s=createInitialGameState();
    for(const id of ['event:hot-tip','event:shakedown','event:warehouse-opportunity'] as const) {
      const root=dom(<CityEvents state={{...s,events:{pendingEventId:id,opportunityElapsedMs:0}}} paused={false} onChoose={noop}/>);
      const buttons=[...root.querySelectorAll('button')]; expect(buttons).toHaveLength(2);
      expect(root.querySelector('.event-choices')?.getAttribute('aria-labelledby')).toBe('pending-event-heading');
      for(const button of buttons) { expect(linkedText(root,button,'aria-labelledby')).toContain(root.querySelector('h3')?.textContent); expect(linkedText(root,button,'aria-describedby').length).toBeGreaterThan(0); }
      expect(buttons[1]?.disabled).toBe(false); expect(buttons[0]?.disabled).toBe(id!=='event:hot-tip');
      expect(root.querySelector('[autofocus]')).toBeNull();
    }
  });
  it('business purchase/upgrade names include Dockside and max level stays disabled', () => {
    const s=autoUpgraderState(); const progress=selectBusinessProgress(s,STARTER_BUSINESS.id);
    if(!progress) throw Error('fixture');
    const root=dom(<BusinessCard progress={{...progress,upgradeCost:null,canUpgrade:false,level:100}} owned canPurchase={false} paused={false} onUpgrade={noop} onPurchase={noop}/>);
    expect(root.querySelector('button')?.getAttribute('aria-label')).toContain('Upgrade Dockside Detail');
    expect(root.querySelector('button')?.disabled).toBe(true); expect(root.textContent).toContain('MAX LEVEL');
  });
  it('Crew requirements and contextual assignments remain distinct', () => {
    const s=createInitialGameState(), props={paused:false,onRecruit:noop,onAssign:noop,onUnassign:noop};
    const locked=dom(<CrewPanel {...props} state={s}/>);
    expect(locked.querySelector('[aria-label="Recruit Rico Vale"]')?.hasAttribute('disabled')).toBe(true);
    expect(locked.textContent).toContain('Not met');
    const recruited=dom(<CrewPanel {...props} state={{...s,crew:{recruitedIds:['crew:rico-vale','crew:mara-knox','crew:jax-mercer'],assignments:{operations:null,logistics:null}}}}/>);
    expect([...recruited.querySelectorAll('button')].map(b=>b.getAttribute('aria-label'))).toEqual(['Assign Rico Vale to Operations','Assign Mara Knox to Operations','Assign Jax Mercer to Logistics']);
    expect(recruited.textContent).toContain('No active specialist');
  });
  it('territory requirements and affordability remain separate text', () => {
    const s=autoUpgraderState(), state={...s,city:{...s.city,ownedTerritoryIds:['territory:waterfront'] as const},economy:{cash:moneyFromMinorUnits('0')}};
    const root=dom(<City state={state} paused={false} onAcquire={noop} onLayLow={noop}/>);
    expect(root.querySelector('[aria-label="Take control of Neon Mile"]')?.hasAttribute('disabled')).toBe(true);
    expect(root.textContent).toContain('Insufficient cash'); expect(root.textContent).toContain('Met');
  });
  it('five skills have named purchases and explicit prerequisites independent of graphics', () => {
    const root=dom(<SkillTree state={createInitialGameState()} paused={false} onPurchase={noop}/>);
    expect(root.querySelectorAll('.skill-node')).toHaveLength(5);
    for(const card of root.querySelectorAll('.skill-node')) {
      expect(card.textContent).toContain('Rank'); expect(card.querySelector('button')?.getAttribute('aria-label')).toContain(card.querySelector('h3')?.textContent);
      expect(card.querySelector('.requirements')).not.toBeNull();
    }
  });
  it('six visible achievements and eight definition-list statistics retain reading order', () => {
    const s=createInitialGameState(), a=dom(<Achievements state={s}/>), stats=dom(<Statistics state={s}/>);
    expect(a.querySelectorAll('.achievement-card')).toHaveLength(6);
    for(const card of a.querySelectorAll('.achievement-card')) { expect(card.querySelector('h3')?.textContent).not.toBe('???'); expect(card.textContent).toContain('LOCKED'); }
    expect([...stats.querySelectorAll('dt')].map(e=>e.textContent)).toEqual(['Manual Jobs','Automated Jobs','Business Upgrades','Territories Taken','Crew Recruited','Events Resolved','Rebirths','Peak Heat']);
    expect(stats.querySelectorAll('dd')).toHaveLength(8);
  });
  it('shared focus/motion styles cover native actions without runtime settings', () => {
    const global=readFileSync('src/styles/global.css','utf8'), app=readFileSync('src/app/App.css','utf8');
    expect(global).toContain('button:focus-visible'); expect(app).toContain('.action-button:focus-visible');
    expect(global).toContain('prefers-reduced-motion: reduce'); expect(global).toContain('animation: none'); expect(global).toContain('transition: none'); expect(global).toContain('scroll-behavior: auto');
    expect(app).toContain('min-height: 44px'); expect(app).toContain('text-decoration: underline'); expect(app).toContain('.save-confirm .action-button + .action-button');
  });
});
