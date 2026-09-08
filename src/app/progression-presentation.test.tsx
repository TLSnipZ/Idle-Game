import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlayerProgress } from './PlayerProgress';
import { OfflineReturn } from './OfflineReturn';
import { describeLevelIncrease, formatXp } from './progression-presentation';
import { describeAction } from './game-presentation';
import { describeAutomatedJobs } from './automation-presentation';
import { createInitialGameState } from '../game/game-state';
import { performStarterJob } from '../game/perform-starter-job';
import { upgradeBusiness } from '../game/upgrade-business';
import { reconcileOffline } from '../game/offline-progress';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { DELIVERY_DISPATCHER as D } from '../features/automation';
import { moneyFromMinorUnits } from '../features/economy';
describe('player progression presentation', () => {
  it.each([{ xp: 0, level: 1, progress: '0 / 100' }, { xp: 99, level: 1, progress: '99 / 100' },
    { xp: 100, level: 2, progress: '0 / 300' }, { xp: 1850, level: 5, progress: '250 / 900' }])('labels within-level XP at $xp', ({ xp, level, progress }) => {
    const html = renderToStaticMarkup(<PlayerProgress xp={xp} event={undefined} paused={false} />);
    expect(html).toContain('Level '+level);
    expect(html).toContain(progress+' XP toward Level '+(level+1));
    expect(html).toContain('for="player-xp-progress"'); expect(html).toContain('<progress');
  });
  it('caps the level display and progress without hiding total XP', () => {
    const html = renderToStaticMarkup(<PlayerProgress xp={1000000} event={undefined} paused={false} />);
    expect(html).toContain('Level 100'); expect(html).toContain('MAX LEVEL');
    expect(html).toContain('Total XP: 1,000,000'); expect(html).not.toContain('Level 101');
  });
  it('announces one or multiple levels politely, hiding stale feedback when paused', () => {
    expect(describeLevelIncrease({ fromLevel: 5, toLevel: 6 })).toBe('LEVEL UP — Level 6');
    expect(describeLevelIncrease({ fromLevel: 6, toLevel: 8 })).toBe('LEVEL UP — Level 6 → 8');
    const event = { fromLevel: 1, toLevel: 4, sequence: 1 };
    const html = renderToStaticMarkup(<PlayerProgress xp={900} event={event} paused={false} />);
    expect(html).toContain('aria-live="polite"'); expect(html).toContain('LEVEL UP');
    expect(renderToStaticMarkup(<PlayerProgress xp={900} event={event} paused={true} />)).not.toContain('LEVEL UP');
    expect(formatXp(4020)).toBe('4,020');
  });
  it('aggregates source XP with existing action feedback', () => {
    const initial = createInitialGameState();
    expect(describeAction('delivery',performStarterJob(initial))).toContain('+$25.00 · +10 XP');
    const state = { ...initial, economy: { cash: moneyFromMinorUnits('100000') },
      businesses: { ...initial.businesses, owned: { [B.id]: { level: 1 } } } };
    expect(describeAction('upgrade',upgradeBusiness(state,B.id))).toContain('+25 XP');
    expect(describeAutomatedJobs({ completedJobs: 3, income: moneyFromMinorUnits('10800'), xpEarned: 15 }))
      .toBe('3 automated deliveries · +$108.00 · +15 XP');
  });
  it('shows offline XP and level change only when earned from dispatcher jobs', () => {
    const initial = createInitialGameState();
    const state = { ...initial, progression: { xp: 95 },
      businesses: { ...initial.businesses, owned: { [B.id]: { level: 1 } } },
      automation: { unlockedIds: [D.id], starterJobElapsedMs: 5000 } };
    const result = reconcileOffline(state,0,25000); if (!result.ok) throw Error('fixture');
    const html = renderToStaticMarkup(<OfflineReturn progress={result.progress} onDismiss={() => {}} />);
    expect(html).toContain('XP earned: +15 XP'); expect(html).toContain('LEVEL UP — Level 2');
    const business = reconcileOffline({ ...state, automation: initial.automation },0,25000); if (!business.ok) throw Error('fixture');
    expect(renderToStaticMarkup(<OfflineReturn progress={business.progress} onDismiss={() => {}} />)).not.toContain('XP earned');
  });
});
