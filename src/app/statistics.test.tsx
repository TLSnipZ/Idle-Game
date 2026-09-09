import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Statistics } from './Statistics';
import { selectStatistics } from '../game/statistics-selectors';
import { createInitialGameState } from '../game/game-state';
import { rebirthState } from '../game/test-fixtures/rebirth-state';
import { performRebirth } from '../game/rebirth';
import { RebirthPanel } from './RebirthPanel';
const labels = ['Manual Jobs', 'Automated Jobs', 'Business Upgrades', 'Territories Taken', 'Crew Recruited', 'Events Resolved', 'Rebirths', 'Peak Heat'];
describe('compact permanent statistics presentation', () => {
  it('renders exactly eight accessible labeled entries in fixed order, with no controls/charts', () => {
    const s = createInitialGameState(), html = renderToStaticMarkup(<Statistics state={s} />);
    expect(selectStatistics(s).map(entry => entry.label)).toEqual(labels);
    expect(html).toContain('aria-labelledby="statistics-heading"'); expect(html).toContain('STATISTICS');
    expect(html.match(/<dt>/g)).toHaveLength(8); expect(html.match(/<dd>/g)).toHaveLength(8);
    let previous = -1; for (const label of labels) { const i = html.indexOf(`<dt>${label}</dt>`); expect(i).toBeGreaterThan(previous); previous = i; }
    expect(html).toContain('0 / 100'); expect(html).not.toMatch(/<button|<select|<svg|<canvas|<table/);
    expect(html).toContain('class="statistics-grid"'); expect(html).toContain('class="statistics-entry"');
  });
  it('formats exact safe integer counts and peak through the selector without mutation', () => {
    const s = createInitialGameState(), state = { ...s, permanentProgression: { ...s.permanentProgression, statistics: {
      manualJobsCompleted: 1284, automatedJobsCompleted: 8419, businessLevelsPurchased: 31, territoriesAcquired: 2,
      crewMembersRecruited: 6, eventsResolved: Number.MAX_SAFE_INTEGER, rebirthsCompleted: 1, peakHeat: 87 } } };
    const before = structuredClone(state);
    expect(selectStatistics(state).map(entry => entry.formattedValue)).toEqual(['1,284', '8,419', '31', '2', '6', '9,007,199,254,740,991', '1', '87 / 100']);
    renderToStaticMarkup(<Statistics state={state} />); expect(state).toEqual(before);
  });
  it('retains values after Rebirth and explicitly appears in the keep summary', () => {
    const s = rebirthState(), state = { ...s, permanentProgression: { ...s.permanentProgression, statistics: { ...s.permanentProgression.statistics, manualJobsCompleted: 1284, peakHeat: 87 } } };
    const after = performRebirth(state); expect(after.ok).toBe(true);
    const html = renderToStaticMarkup(<Statistics state={after.state} />); expect(html).toContain('1,284'); expect(html).toContain('87 / 100');
    expect(selectStatistics(after.state).find(entry => entry.key === 'rebirthsCompleted')?.value).toBe(1);
    const rebirth = renderToStaticMarkup(<RebirthPanel state={state} unavailable={false} onRebirth={() => ({ ok: false, error: 'runtime-unavailable' })} />);
    expect(rebirth.slice(rebirth.indexOf('You keep'), rebirth.indexOf('You lose'))).toContain('<li>Lifetime Statistics</li>');
  });
});
