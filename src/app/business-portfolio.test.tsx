// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
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
import { getXpThresholdForLevel } from '../features/progression';
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
    const b = root.querySelector('button'); expect(b?.disabled).toBe(true); expect(b?.getAttribute('aria-label')).toBe(`Acquire ${d.name}`);
    expect(root.querySelector('h3')?.textContent).toBe(d.name); expect(root.querySelector('[aria-live]')).toBeNull();
    expect(root.querySelectorAll('img, svg, canvas')).toHaveLength(0);
  });
  it.each(BUSINESS_CATALOG.slice(1))('$name distinguishes eligible insufficient Cash from a progression lock', d => {
    const initial = autoUpgraderState();
    const s = { ...initial, businesses: { ...initial.businesses, owned: { ...initial.businesses.owned, ...Object.fromEntries(d.requirements.filter(r => r.type === 'business-level').map(r => [r.businessId, { level: r.minimumLevel }])) } } };
    const poor = { ...s, economy: { cash: moneyFromMinorUnits('0') } };
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


describe('POST 3C acquisition helpers', () => {
  it.each([
    ['business:afterdark-customs', 10, 11],
    ['business:solara-nights', 16, 12],
  ] as const)('%s prioritizes the unmet gate even when Cash is zero', (id, player, dockside) => {
    const d = BUSINESS_CATALOG.find(b => b.id === id)!;
    const s = createInitialGameState();
    const root = render(d, { ...s, progression: { xp: getXpThresholdForLevel(player) },
      businesses: { ...s.businesses, owned: { 'business:dockside-detail': { level: dockside } } } });
    expect(root.textContent).toContain('LOCKED');
    expect(root.textContent).toContain(`Met — Player Level ${player}`);
    expect(root.textContent).toContain('Required —');
    expect(root.textContent).toContain('Meet the requirements above to unlock this Business.');
    expect(root.textContent).not.toContain('Build your Cash balance');
    expect(root.querySelector('button')?.querySelector('[aria-hidden]')).toBeNull();
  });
  it('eligible Laundry uses Cash copy, then removes it when affordable or owned', () => {
    const d = BUSINESS_CATALOG[1]!, s = createInitialGameState();
    const eligible = { ...s, progression: { xp: getXpThresholdForLevel(5) },
      businesses: { ...s.businesses, owned: { 'business:dockside-detail': { level: 7 } } } };
    const poor = render(d, eligible);
    expect(poor.textContent).toContain('INSUFFICIENT CASH');
    expect(poor.textContent).toContain('Build your Cash balance to acquire this Business.');
    expect(poor.textContent).not.toContain('Meet the requirements');
    const ready = render(d, { ...eligible, economy: { cash: d.purchaseCost } });
    expect(ready.querySelector('button')?.disabled).toBe(false);
    expect(ready.querySelector('button')?.getAttribute('aria-describedby')).toBeNull();
    expect(ready.textContent).not.toContain('Build your Cash balance');
    const owned = { ...eligible, businesses: { ...eligible.businesses, owned: { [d.id]: { level: 1 } } } };
    expect(render(d, owned).textContent).toContain('Insufficient Cash for the next Level.');
    expect(render(d, owned).textContent).not.toContain('acquire this Business');
    const max = render(d, { ...owned, businesses: { ...owned.businesses, owned: { [d.id]: { level: 100 } } } });
    expect(max.textContent).toContain('MAX LEVEL');
    expect(max.textContent).not.toContain('Insufficient Cash');
    expect(max.querySelector('button')?.querySelector('[aria-hidden]')).toBeNull();
  });
  it('automation acquisition uses the same gate-first helper policy', () => {
    expect(auto(createInitialGameState()).textContent).toContain('Meet the requirements above');
    const s = autoUpgraderState();
    const unowned = { ...s, automation: { ...s.automation, unlockedIds: [], enabledIds: [] }, economy: { cash: moneyFromMinorUnits('0') } };
    expect(auto(unowned).textContent).toContain('Build your Cash balance to acquire this automation.');
  });
});

it('keeps requirements separate from the shared action/helper group with wrapping local navigation', () => {
  const card = render(BUSINESS_CATALOG[1]!);
  const requirements = card.querySelector('.requirements');
  const area = requirements?.nextElementSibling;
  expect(area?.classList.contains('card-action-area')).toBe(true);
  expect(area?.querySelector('button')?.nextElementSibling?.textContent).toContain('Meet the requirements');
  const css = readFileSync('src/app/sections.css', 'utf8');
  expect(css).toMatch(/\.operations-navigation\s*\{[^}]*flex-wrap:\s*wrap/);
  expect(css).toMatch(/\.card-action-area\s*\{[^}]*gap:\s*var\(--space-sm\)[^}]*margin-block-start:\s*var\(--space-md\)/);
  expect(css).toMatch(/@media[^}]*\.business-grid\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\)/);
});
