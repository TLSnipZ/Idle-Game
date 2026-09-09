import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AutomationCard } from './AutomationCard';
import { OfflineReturn } from './OfflineReturn';
import { describeAutomatedJobs, formatRemainingTime } from './automation-presentation';
import { describeAction } from './game-presentation';
import { selectDispatcher } from '../game/automation-selectors';
import { createInitialGameState } from '../game/game-state';
import type { GameState } from '../game/game-state';
import { DELIVERY_DISPATCHER as D } from '../features/automation';
import { STARTER_BUSINESS } from '../features/businesses';
import { STREET_CONNECTIONS, EXPRESS_TIPS } from '../features/upgrades';
import { moneyFromMinorUnits } from '../features/economy';
import { purchaseAutomation } from '../game/purchase-automation';
import { reconcileOffline } from '../game/offline-progress';
function eligible(cash = D.purchaseCost): GameState {
  const state = createInitialGameState();
  return { ...state, progression: { xp: 400 }, economy: { cash }, businesses: { ...state.businesses, owned: { [STARTER_BUSINESS.id]: { level: 4 } } } };
}
function render(state: GameState, paused = false) {
  return renderToStaticMarkup(<AutomationCard view={selectDispatcher(state)} paused={paused} onPurchase={() => {}} event={undefined} />);
}
describe('delegation presentation', () => {
  it('explains the locked requirement, cost, interval and current effective reward', () => {
    const state = createInitialGameState(); const view = selectDispatcher(state);
    expect(view).toMatchObject({ unlocked: false, eligible: false, canPurchase: false, reward: '2500', intervalMs: 10000, progressMs: 0, remainingMs: 10000 });
    const html = render(state);
    expect(html).toContain('Delivery Dispatcher'); expect(html).toContain('$5,000.00');
    expect(html).toContain('Runs every 10s'); expect(html).toContain('$25.00 per delivery');
    expect(html).toContain('Own Dockside Detail'); expect(html).toContain('Requirement not met');
    expect(html).toContain('disabled'); expect(html).not.toContain('ACTIVE');
    expect(html).toContain('aria-describedby="dispatcher-requirement"');
  });
  it('distinguishes unaffordable and ready states with semantic buttons', () => {
    expect(render(eligible(moneyFromMinorUnits('499999')))).toContain('More cash needed');
    const html = render(eligible()); expect(html).toContain('Ready to hire'); expect(html).toContain('<button'); expect(html).not.toContain('disabled');
    expect(render(eligible(), true)).toContain('Session paused');
  });
  it('shows active progress, modified reward and removes buying controls', () => {
    const bought = purchaseAutomation(eligible(), D.id).state;
    const state = { ...bought, automation: { ...bought.automation, starterJobElapsedMs: 4321 }, upgrades: { purchasedIds: [STREET_CONNECTIONS.id, EXPRESS_TIPS.id] } };
    expect(selectDispatcher(state)).toMatchObject({ unlocked: true, reward: '3600', progressMs: 4321, remainingMs: 5679 });
    const html = render(state);
    expect(html).toContain('ACTIVE'); expect(html).toContain('$36.00 per delivery'); expect(html).toContain('Next delivery in 6s');
    expect(html).toContain('max="10000"'); expect(html).toContain('value="4321"'); expect(html).toContain('for="dispatcher-progress"');
    expect(html).not.toContain('<button'); expect(render(state, true)).toContain('PAUSED');
  });
  it('aggregates recent dispatch feedback without notification history', () => {
    const event = { sequence: 1, xpEarned: 15, completedJobs: 3, income: moneyFromMinorUnits('10800') };
    const state = purchaseAutomation(eligible(), D.id).state;
    const html = renderToStaticMarkup(<AutomationCard view={selectDispatcher(state)} paused={false} onPurchase={() => {}} event={event} />);
    expect(html).toContain('3 automated deliveries · +$108.00'); expect(html).not.toContain('role="status"'); expect(html).not.toContain('aria-live="polite"');
    expect(describeAutomatedJobs({ completedJobs: 1, xpEarned: 5, income: moneyFromMinorUnits('2500') })).toBe('1 automated delivery · +$25.00 · +5 XP');
    expect(describeAction('automation', purchaseAutomation(eligible(), D.id))).toContain('hired');
  });
  it.each([[10000, '10s'], [5679, '6s'], [1, '1s']])('formats remaining time %#', (ms, text) => {
    expect(formatRemainingTime(Number(ms))).toBe(text);
  });
  it('shows business and dispatcher offline income with a dismissible total', () => {
    const state = purchaseAutomation(eligible(), D.id).state;
    const result = reconcileOffline(state, 0, 25000); if (!result.ok) throw Error('fixture');
    const html = renderToStaticMarkup(<OfflineReturn progress={result.progress} onDismiss={() => {}} />);
    expect(html).toContain('Business income: $75.00'); expect(html).toContain('Dispatcher: 2 deliveries · $50.00');
    expect(html).toContain('+$125.00'); expect(html).toContain('Continue');
  });
});
