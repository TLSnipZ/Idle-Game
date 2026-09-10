// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BUSINESS_CATALOG } from '../features/businesses';
import type { BusinessDefinition } from '../features/businesses';
import { createInitialGameState } from '../game/game-state';
import type { GameState } from '../game/game-state';
import { autoUpgraderState } from '../game/test-fixtures/auto-upgrader-state';
import { selectBusinessProgress, selectCanPurchaseBusiness } from '../game/selectors';
import { evaluateRequirements } from '../game/requirements';
import { selectAutoUpgrader } from '../game/automation-selectors';
import { BusinessCard } from './BusinessCard';
import { AutoUpgraderCard } from './AutoUpgraderCard';
import { moneyFromMinorUnits } from '../features/economy';
function render(d: BusinessDefinition, s = createInitialGameState()) {
  const root = document.createElement('div'); root.innerHTML = renderToStaticMarkup(<BusinessCard definition={d}
    requirements={evaluateRequirements(s, d.requirements)} progress={selectBusinessProgress(s, d.id)}
    owned={Object.hasOwn(s.businesses.owned, d.id)} canPurchase={selectCanPurchaseBusiness(s, d.id)} paused={false}
    onPurchase={() => {}} onUpgrade={() => {}} />); return root;
}
function auto(s: GameState) {
  const root = document.createElement('div'); root.innerHTML = renderToStaticMarkup(<AutoUpgraderCard view={selectAutoUpgrader(s)}
    paused={false} onPurchase={() => {}} onToggle={() => {}} onTargetChange={() => {}} />); return root;
}
describe('shared portfolio presentation and accessible states', () => {
  it.each(BUSINESS_CATALOG.slice(1))('$name exposes exact unmet requirements and an identified native purchase action', d => {
    const root = render(d); expect(root.textContent).toContain('LOCKED');
    for (const detail of evaluateRequirements(createInitialGameState(), d.requirements).requirements) expect(root.textContent).toContain(`Required — ${detail.description}`);
    const b = root.querySelector('button'); expect(b?.disabled).toBe(true); expect(b?.getAttribute('aria-label')).toBe(`Buy ${d.name}`);
    expect(root.querySelector('h3')?.textContent).toBe(d.name); expect(root.querySelector('[aria-live]')).toBeNull();
    expect(root.querySelectorAll('img, svg, canvas')).toHaveLength(0);
  });
  it.each(BUSINESS_CATALOG.slice(1))('$name distinguishes eligible insufficient Cash from a progression lock', d => {
    const s = autoUpgraderState(), poor = { ...s, economy: { cash: moneyFromMinorUnits('0') } };
    const root = render(d, poor); expect(root.textContent).toContain('INSUFFICIENT CASH'); expect(root.textContent).not.toContain('LOCKED');
    expect(render(d, s).querySelector('button')?.disabled).toBe(false);
  });
  it.each(BUSINESS_CATALOG)('$name owned/max state removes acquisition clutter and preserves contextual upgrade name', d => {
    const s = autoUpgraderState(), owned = { ...s, businesses: { ...s.businesses, owned: { [d.id]: { level: 5 } } } };
    const root = render(d, owned); expect(root.textContent).toContain('OWNED'); expect(root.textContent).toContain('Level 5 / 100');
    expect(root.textContent).not.toContain('Purchase price'); expect(root.textContent).not.toContain('Requirements');
    expect(root.querySelector('button')?.getAttribute('aria-label')).toBe(`Upgrade ${d.name} to Level 6`);
    const maxed = render(d, { ...owned, businesses: { ...owned.businesses, owned: { [d.id]: { level: 100 } } } });
    expect(maxed.textContent).toContain('MAX LEVEL'); expect(maxed.textContent).not.toContain('Next upgrade price'); expect(maxed.querySelector('button')?.disabled).toBe(true);
  });
  it('uses a static one-Business target and a labeled native owned-only selector in canonical order', () => {
    const s = autoUpgraderState(); expect(auto(s).querySelector('select')).toBeNull();
    const input = { ...s, businesses: { ...s.businesses, owned: { 'business:solara-nights': { level: 100 }, ...s.businesses.owned, 'business:neon-laundry': { level: 3 } } },
      automation: { ...s.automation, businessAutoUpgradeTargetId: 'business:solara-nights' as const } };
    const root = auto(input), select = root.querySelector('select');
    expect(root.querySelector('label[for="auto-upgrader-target"]')?.textContent).toBe('Target Business');
    expect([...select!.options].map(o => o.textContent)).toEqual(['Dockside Detail', 'Neon Laundry', 'Solara Nights']);
    expect(select?.querySelector('option[selected]')?.getAttribute('value')).toBe('business:solara-nights'); expect(root.textContent).toContain('TARGET MAXED');
    expect(root.querySelectorAll('progress')).toHaveLength(1); expect(root.querySelector('[aria-live]')).toBeNull();
  });
});
