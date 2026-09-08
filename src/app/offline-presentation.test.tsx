import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { formatOfflineDuration, showOfflineReward } from './offline-presentation';
import { OfflineReturn } from './OfflineReturn';
import { reconcileOffline, OFFLINE_CAP_MS } from '../game/offline-progress';
import { createInitialGameState } from '../game/game-state';
import { STARTER_BUSINESS } from '../features/businesses';

describe('offline return presentation', () => {
  it.each([[0, '0s'], [42000, '42s'], [312000, '5m 12s'], [8040000, '2h 14m'], [28800000, '8h']])('formats %s', (ms, expected) => {
    expect(formatOfflineDuration(Number(ms))).toBe(expected);
  });
  it('only shows positive income with accessible dismissible capped feedback', () => {
    const state = { ...createInitialGameState(), businesses: { ownedIds: [STARTER_BUSINESS.id], productionRemainderMilliCents: 0 } };
    const result = reconcileOffline(state, 0, OFFLINE_CAP_MS + 1); if (!result.ok) throw Error('fixture');
    expect(showOfflineReward(result.progress)).toBe(true);
    const html = renderToStaticMarkup(<OfflineReturn progress={result.progress} onDismiss={() => {}} />);
    expect(html).toContain('Welcome back'); expect(html).toContain('capped at 8h');
    expect(html).toContain('Continue'); expect(html).toContain('role="status"');
  });
  it('does not show fake reward for no business or no elapsed time', () => {
    const result = reconcileOffline(createInitialGameState(), 0, 1); if (!result.ok) throw Error('fixture');
    expect(showOfflineReward(result.progress)).toBe(false);
    expect(renderToStaticMarkup(<OfflineReturn progress={result.progress} onDismiss={() => {}} />)).toBe('');
    expect(showOfflineReward(null)).toBe(false);
  });
});
