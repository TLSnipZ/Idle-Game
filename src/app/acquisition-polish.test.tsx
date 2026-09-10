// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { City } from './City';
import { CrewPanel } from './CrewPanel';
import { RequirementList } from './RequirementList';
import { BUSINESS_CATALOG } from '../features/businesses';
import { createInitialGameState } from '../game/game-state';
import { territoryState } from '../game/test-fixtures/territory-state';
import { moneyFromMinorUnits as money } from '../features/economy';
import { evaluateRequirements } from '../game/requirements';
function root(html: string) { const node = document.createElement('div'); node.innerHTML = html; return node; }
const noop = () => {};
describe('shared Territory and Crew acquisition hierarchy', () => {
  it.each(['Territory', 'Crew'] as const)('%s distinguishes locked, unaffordable and purchasable with a separate action group', kind => {
    const initial = createInitialGameState();
    for (const phase of ['locked', 'poor', 'ready'] as const) {
      const eligible = territoryState();
      const state = phase === 'locked' ? initial : { ...eligible, economy: { cash: money(phase === 'poor' ? '0' : '100000000') } };
      const node = root(renderToStaticMarkup(kind === 'Territory'
        ? <City state={state} paused={false} onAcquire={noop} onLayLow={noop} />
        : <CrewPanel state={state} paused={false} onRecruit={noop} onAssign={noop} onUnassign={noop} />));
      const button = node.querySelector<HTMLButtonElement>(kind === 'Territory' ? '[aria-label="Take control of Neon Mile"]' : '[aria-label="Recruit Rico Vale"]')!;
      const card = button.closest('article')!;
      expect(button.disabled).toBe(phase !== 'ready');
      expect(card.textContent).toContain(phase === 'locked' ? 'LOCKED' : phase === 'poor' ? 'INSUFFICIENT CASH' : 'PURCHASABLE');
      expect(card.querySelector('.requirements')?.nextElementSibling).toBe(button.parentElement);
      expect(button.parentElement?.classList.contains('card-action-area')).toBe(true);
      expect(button.querySelector('[aria-hidden]')).toBeNull();
      if (phase === 'ready') expect(card.querySelector('.purchase-note')).toBeNull();
      else expect(card.querySelector('.purchase-note')?.textContent).toContain(phase === 'locked' ? 'Meet the requirements above' : 'Build your Cash balance');
      expect(card.textContent).not.toContain(phase === 'locked' ? 'Build your Cash balance' : 'Meet the requirements above');
      expect(card.querySelector('[aria-live]')).toBeNull();
    }
  });
  it.each([['business:afterdark-customs', 'business:neon-laundry', 'Neon Laundry', 10],
    ['business:solara-nights', 'business:afterdark-customs', 'Afterdark Customs', 8]] as const)('%s renders the generic previous-Business Level with Met/Required text', (id, previous, name, level) => {
    const fresh = createInitialGameState(), definition = BUSINESS_CATALOG.find(b => b.id === id)!;
    for (const current of [level - 1, level]) {
      const state = { ...fresh, businesses: { ...fresh.businesses, owned: { [previous]: { level: current } } } };
      const node = root(renderToStaticMarkup(<RequirementList id="gate-requirements" result={evaluateRequirements(state, definition.requirements)} />));
      expect(node.textContent).toContain(`${current === level ? 'Met' : 'Required'} — ${name} Level ${level}`);
      expect(node.textContent).not.toContain('business:');
    }
  });
});
