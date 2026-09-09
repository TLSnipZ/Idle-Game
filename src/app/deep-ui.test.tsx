// @vitest-environment happy-dom
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OverviewSection } from './OverviewSection';
import { BusinessCard } from './BusinessCard';
import { AutoUpgraderCard } from './AutoUpgraderCard';
import { HeatPanel } from './HeatPanel';
import { CityEvents } from './CityEvents';
import { Garage } from './Garage';
import { CrewPanel } from './CrewPanel';
import { createInitialGameState as fresh } from '../game/game-state';
import { autoUpgraderState } from '../game/test-fixtures/auto-upgrader-state';
import { crewState } from '../game/test-fixtures/crew-state';
import { selectBusinessProgress } from '../game/selectors';
import { selectAutoUpgrader } from '../game/automation-selectors';
import { STARTER_BUSINESS } from '../features/businesses';
import { EVENT_CATALOG } from '../features/events';
import { VEHICLE_CATALOG } from '../features/vehicles';
import { describeChoiceEffects } from './event-presentation';

const noop = () => {};
function dom(element: ReactElement) {
  const container = document.createElement('div');
  container.innerHTML = renderToStaticMarkup(element);
  return container;
}

describe('POST 1B system compositions', () => {
  it('keeps a logical mobile reading order and a summary-only pending Event', () => {
    const s = fresh();
    const state = { ...s, events: { pendingEventId: 'event:hot-tip' as const, opportunityElapsedMs: 1234 } };
    const panel = dom(<OverviewSection state={state} paused={false} onNavigate={noop} />);
    expect([...panel.querySelectorAll('article > h2')].map(h => h.textContent)).toEqual([
      'ECONOMY', 'PLAYER', 'CITY PRESSURE', 'EMPIRE', 'CITY EVENT', 'CREW', 'COLLECTION',
    ]);
    expect(panel.textContent).toContain('Hot Tip');
    expect(panel.textContent).toContain('VIEW EVENT');
    expect(panel.querySelectorAll('progress')).toHaveLength(1);
    expect(panel.textContent).not.toMatch(/TAKE THE TIP|PLAY IT SAFE|Recruit Rico|Purchase rank/);
    expect(state.events).toEqual({ pendingEventId: 'event:hot-tip', opportunityElapsedMs: 1234 });
  });
  it.each([null, 15, 100])('Dockside exposes acquisition or production context at level %s', level => {
    const state = level === null ? fresh() : autoUpgraderState(level);
    const panel = dom(<BusinessCard progress={selectBusinessProgress(state, STARTER_BUSINESS.id)}
      owned={level !== null} canPurchase={false} paused={false} onUpgrade={noop} onPurchase={noop} />);
    const button = panel.querySelector('button');
    if (level === null) {
      expect(panel.textContent).toContain('Purchase price');
      expect(panel.textContent).toContain('Production begins after purchase');
      expect(button?.getAttribute('aria-label')).toBe('Buy Dockside Detail');
    } else {
      expect(panel.textContent).toContain(`Level ${level}`);
      expect(panel.textContent).not.toContain('Purchase price');
      if (level === 100) {
        expect(panel.textContent).toContain('MAX LEVEL');
        expect(panel.textContent).not.toContain('Next upgrade price');
        expect(button?.disabled).toBe(true);
      } else {
        expect(panel.textContent).toContain('Next upgrade price');
        expect(button?.getAttribute('aria-label')).toBe('Upgrade Dockside Detail to Level 16');
      }
    }
  });
  it.each([15, 100])('Auto-Upgrader preserves paused/max information and adjacent spending disclosure at %i', level => {
    const s = autoUpgraderState(level);
    const state = { ...s, automation: { ...s.automation, enabledIds: [] } };
    const panel = dom(<AutoUpgraderCard view={selectAutoUpgrader(state)} paused={false} onPurchase={noop} onToggle={noop} />);
    expect(panel.textContent).toContain('DISABLED');
    expect(panel.textContent).toContain('Progress paused');
    expect(panel.textContent).toContain('30s');
    const toggle = panel.querySelector('button');
    expect(toggle?.getAttribute('aria-label')).toBe('Enable Business Auto-Upgrader');
    expect(toggle?.previousElementSibling?.textContent).toContain('Automatically spends cash');
    expect(panel.querySelector('progress')?.getAttribute('max')).toBe('30000');
    if (level === 100) expect(panel.textContent).toContain('No further upgrades available');
  });
  it.each([0, 60, 80])('Heat uses explicit tier/penalty and honest cooling state at %i', heat => {
    const s = fresh(), state = { ...s, city: { ...s.city, heat } };
    const panel = dom(<HeatPanel state={state} paused={false} onLayLow={noop} />);
    expect(panel.textContent).toContain(`${heat} / 100 — ${heat === 0 ? 'COLD' : heat === 60 ? 'HOT' : 'MANHUNT'}`);
    expect(panel.textContent).toContain('1 Heat every 60s');
    if (heat === 0) {
      expect(panel.textContent).toContain('No active Heat');
      expect(panel.textContent).not.toContain('Cooling in');
      expect(panel.querySelector('button')?.disabled).toBe(true);
    } else expect(panel.textContent).toContain(heat === 60 ? '-10%' : '-25%');
  });
  it('names the active cooling specialist and separates assignments from roster', () => {
    const s = crewState({ operations: 'crew:mara-knox', logistics: 'crew:jax-mercer' });
    const heat = dom(<HeatPanel state={s} paused={false} onLayLow={noop} />);
    expect(heat.textContent).toContain('CREW EFFECT · Mara Knox');
    expect(heat.textContent).toContain('1 Heat every 45s');
    const crew = dom(<CrewPanel state={s} paused={false} onRecruit={noop} onAssign={noop} onUnassign={noop} />);
    expect([...crew.querySelectorAll('h3')].map(h => h.textContent)).toEqual(['Active assignments', 'Roster']);
    expect(crew.querySelector('button[aria-label="Assign Rico Vale to Operations, replacing Mara Knox"]')).not.toBeNull();
    expect(crew.querySelectorAll('h4')).toHaveLength(5);
  });
  it.each(EVENT_CATALOG)('pending $name retains exactly two explicit outcomes and paused timer', event => {
    const s = fresh(), state = { ...s, events: { pendingEventId: event.id, opportunityElapsedMs: 1234 } };
    const panel = dom(<CityEvents state={state} paused={false} onChoose={noop} />);
    const choices = [...panel.querySelectorAll('button')];
    expect(choices).toHaveLength(2);
    expect(panel.textContent).toContain('TIMER PAUSED');
    event.choices.forEach((choice, index) => {
      expect(choices[index]?.textContent).toBe(choice.label);
      for (const effect of describeChoiceEffects(choice)) expect(panel.textContent).toContain(effect);
      expect(choices[index]?.disabled).toBe(choice.cost !== '0');
    });
    if (event.choices.some(choice => choice.cost !== '0')) expect(panel.textContent).toContain('INSUFFICIENT CASH');
  });
  it.each([false, true])('Garage stays complete without artwork, owned=%s', owned => {
    const s = fresh(), vehicle = VEHICLE_CATALOG[0];
    if (!vehicle) throw Error('catalog fixture');
    const state = owned ? { ...s, garage: { ownedVehicleIds: [vehicle.id] } } : s;
    const panel = dom(<Garage state={state} paused={false} onPurchase={noop} />);
    expect(panel.querySelectorAll('article')).toHaveLength(1);
    expect(panel.querySelectorAll('img')).toHaveLength(0);
    expect(panel.textContent).toContain('Vortex S9');
    expect(panel.textContent).toContain('PERMANENT VEHICLE');
    expect(panel.textContent).toContain('+15% global business production');
    expect(panel.querySelectorAll('button')).toHaveLength(owned ? 0 : 1);
    expect(panel.textContent?.includes('Price:')).toBe(!owned);
  });
});
