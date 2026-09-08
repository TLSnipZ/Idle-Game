import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { UpgradeCard } from './UpgradeCard';
import { BusinessCard } from './BusinessCard';
import { formatProduction, formatBonus } from './stat-format';
import { selectUpgrade, selectBusinessProgress } from '../game/selectors';
import { createInitialGameState } from '../game/game-state';
import { purchaseUpgrade } from '../game/purchase-upgrade';
import { PRESSURE_WASHER } from '../features/upgrades';
import { STARTER_BUSINESS } from '../features/businesses';
import { moneyFromMinorUnits } from '../features/economy';
import { describeAction } from './game-presentation';
import { rational } from '../shared/rational';
function owned(cash = '250000') {
  const initial = createInitialGameState();
  return { ...initial, economy: { cash: moneyFromMinorUnits(cash) }, businesses: { ...initial.businesses, owned: { [STARTER_BUSINESS.id]: { level: 5 } } } };
}
describe('equipment presentation', () => {
  it('shows real requirement, effect and price with an accessible disabled button', () => {
    const view = selectUpgrade(createInitialGameState(), PRESSURE_WASHER.id);
    const html = renderToStaticMarkup(<UpgradeCard view={view} paused={false} onPurchase={() => {}} />);
    expect(html).toContain('Commercial Pressure Washer'); expect(html).toContain('$2,500.00');
    expect(html).toContain('+25% Dockside Detail production'); expect(html).toContain('Requires ownership of Dockside Detail');
    expect(html).toContain('disabled=""'); expect(html).toContain('aria-labelledby="upgrades-heading"');
    expect(html).toContain('aria-describedby="equipment-requirement"');
  });
  it('shows affordability and enables exactly at the purchase price', () => {
    const poor = selectUpgrade(owned('249999'), PRESSURE_WASHER.id);
    expect(poor?.canPurchase).toBe(false);
    expect(renderToStaticMarkup(<UpgradeCard view={poor} paused={false} onPurchase={() => {}} />)).toContain('More cash needed');
    const ready = selectUpgrade(owned(), PRESSURE_WASHER.id);
    expect(ready?.canPurchase).toBe(true);
    expect(renderToStaticMarkup(<UpgradeCard view={ready} paused={false} onPurchase={() => {}} />)).not.toContain('disabled');
    expect(renderToStaticMarkup(<UpgradeCard view={ready} paused onPurchase={() => {}} />)).toContain('Session paused');
  });
  it('removes buying controls after purchase and provides action feedback', () => {
    const result = purchaseUpgrade(owned(), PRESSURE_WASHER.id);
    const view = selectUpgrade(result.state, PRESSURE_WASHER.id);
    const html = renderToStaticMarkup(<UpgradeCard view={view} paused={false} onPurchase={() => {}} />);
    expect(html).toContain('PURCHASED'); expect(html).toContain('Active'); expect(html).not.toContain('<button');
    expect(describeAction('equipment', result)).toContain('Production bonus is active');
    expect(selectUpgrade(result.state, 'upgrade:missing')).toBeNull();
  });
  it('shows exact effective and next-level rate with the base/bonus explanation', () => {
    const state = purchaseUpgrade(owned(), PRESSURE_WASHER.id).state;
    const progress = selectBusinessProgress(state, STARTER_BUSINESS.id);
    const html = renderToStaticMarkup(<BusinessCard progress={progress} onUpgrade={() => {}} owned canPurchase={false} paused={false} onPurchase={() => {}} />);
    expect(html).toContain('$4.6875'); expect(html).toContain('$5.625');
    expect(html).toContain('$3.75/sec'); expect(html).toContain('+25%');
  });
  it.each([[75n, 1n, '$0.75'], [375n, 4n, '$0.9375'], [1875n, 4n, '$4.6875'], [1n, 3n, '≈$0.0033'], [100000000n, 1n, '$1,000,000.00']])('formats rational rate %# without Number conversion', (n, d, expected) => {
    if (typeof n !== 'bigint' || typeof d !== 'bigint') throw Error('fixture');
    expect(formatProduction(rational(n, d))).toBe(expected);
  });
  it('formats basis points exactly for presentation', () => {
    expect(formatBonus(2500)).toBe('+25%'); expect(formatBonus(1)).toBe('+0.01%');
    expect(formatBonus(3333)).toBe('+33.33%');
  });
});
