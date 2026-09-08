import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { City } from './City';
import { territoryPresentation, describeTerritoryAcquisition } from './territory-presentation';
import { ModifierBreakdown } from './ModifierBreakdown';
import { RebirthPanelView } from './RebirthPanel';
import { createRebirthControls } from './rebirth-controls';
import { describeAction } from './game-presentation';
import { createInitialGameState } from '../game/game-state';
import { territoryState } from '../game/test-fixtures/territory-state';
import { rebirthState } from '../game/test-fixtures/rebirth-state';
import { FAST } from '../game/test-fixtures/skill-state';
import { NEON_MILE as N, WATERFRONT as W } from '../features/territories';
import { moneyFromMinorUnits } from '../features/economy';
import { acquireTerritory } from '../game/acquire-territory';
import { evaluateJobReward } from '../game/effective-stats';
import { performStarterJob } from '../game/perform-starter-job';
import { selectRebirth } from '../game/rebirth';
import { rebirthRuntime } from '../platform/test-fixtures/rebirth-runtime';

const render = (state = createInitialGameState(), paused = false) => renderToStaticMarkup(<City state={state} paused={paused} onLayLow={() => {}} onAcquire={() => {}} />);
describe('Solara City presentation and interaction', () => {
  it('shows two labelled cards in explicit order with a free controlled Waterfront foothold', () => {
    const html = render();
    expect(html).toContain('SOLARA CITY'); expect(html).toContain('Territories controlled: 1 / 2');
    expect(html.match(/class="panel territory-card/g)).toHaveLength(2);
    expect(html.indexOf(`${W.id}-heading`)).toBeLessThan(html.indexOf(`${N.id}-heading`));
    const waterfrontStart = html.indexOf('class="panel territory-card');
    const waterfront = html.slice(waterfrontStart, html.indexOf('</article>', waterfrontStart));
    expect(waterfront).toContain('CONTROLLED'); expect(waterfront).toContain('Starting foothold · No gameplay bonus');
    expect(waterfront).not.toContain('<button'); expect(waterfront).not.toContain('Price:');
    expect(html).toContain('territory-catalog'); expect(html).toContain('territory-card');
    expect(html).toContain('aria-labelledby="city-heading"');
  });
  it('shows exact price/effect and central met/unmet requirements with accessible disabled action', () => {
    const html = render();
    expect(html).toContain('$100,000.00'); expect(html).toContain('+10% starter-job &amp; Dispatcher cash reward');
    expect(html).toContain('XP unchanged'); expect(html).toContain('LOCKED');
    for (const label of ['Player Level 12', 'Own Dockside Detail', 'Dockside Detail Level 15']) expect(html).toContain(`Not met — ${label}`);
    expect(html).toContain('aria-label="Take control of Neon Mile"');
    expect(html).toContain('aria-describedby="territory:neon-mile-requirements"'); expect(html).toContain('disabled=""');
  });
  it('keeps cash shortage distinct from requirement locks', () => {
    const state = { ...territoryState(), economy: { cash: moneyFromMinorUnits('9000000') } };
    const view = territoryPresentation(state, N.id);
    expect(view).toMatchObject({ status: 'AVAILABLE', eligible: true, affordable: false, canAcquire: false });
    const html = render(state); expect(html).toContain('Requirements satisfied · Insufficient cash.');
    expect(html).not.toContain('LOCKED'); expect(html).toContain('disabled=""');
    expect(territoryPresentation(territoryState(), N.id)).toMatchObject({ canAcquire: true, status: 'AVAILABLE' });
    expect(render(territoryState()).match(/<button[^>]*aria-label="Take control of Neon Mile"[^>]*>/)?.[0]).not.toContain('disabled');
    expect(render(territoryState(), true)).toContain('disabled=""');
  });
  it('immediately switches to controlled, updates count and removes repurchase action', () => {
    const f = rebirthRuntime(territoryState()); let feedback = '';
    f.game.execute(state => { const result = acquireTerritory(state, N.id); feedback = describeTerritoryAcquisition(result, N.id); return result; });
    const html = render(f.game.getSnapshot().result.state);
    expect(html).toContain('Territories controlled: 2 / 2'); expect(html.match(/CONTROLLED/g)).toHaveLength(2);
    expect(html).not.toContain('aria-label="Take control'); expect(feedback).toContain('Neon Mile controlled');
    expect(feedback).toContain('-$100,000.00'); expect(feedback).toContain('+10%'); f.game.stop();
  });
  it('grandfathered ownership stays controlled below acquisition requirements', () => {
    const state = { ...createInitialGameState(), city: { heat: 0, heatDecayElapsedMs: 0, ownedTerritoryIds: [W.id, N.id] } };
    expect(render(state)).not.toContain('LOCKED'); expect(render(state)).not.toContain('Not met'); expect(render(state)).not.toContain('aria-label="Take control');
  });
  it('uses typed failures for requirement, affordability, ownership and unknown-ID feedback', () => {
    expect(describeTerritoryAcquisition(acquireTerritory(createInitialGameState(), N.id), N.id)).toContain('Player Level 12');
    const broke = { ...territoryState(), economy: { cash: moneyFromMinorUnits('0') } };
    expect(describeTerritoryAcquisition(acquireTerritory(broke, N.id), N.id)).toContain('Not enough cash');
    expect(describeTerritoryAcquisition(acquireTerritory(territoryState(true), N.id), N.id)).toContain('already controlled');
    expect(describeTerritoryAcquisition(acquireTerritory(broke, 'unknown'), 'unknown')).toContain('unavailable');
  });
  it('names Neon Mile in the shared breakdown and reports actual Money/XP', () => {
    const state = { ...territoryState(true), permanentProgression: { empirePoints: 0, rebirthCount: 0, skills: { [FAST]: 1 } } };
    const reward = evaluateJobReward(state); if (!reward.ok) throw Error('fixture');
    const html = renderToStaticMarkup(<ModifierBreakdown modifiers={reward.applied} />);
    expect(html).toContain('Neon Mile: +10%'); expect(html).toContain('Fast Talker: +10%');
    expect(describeAction('delivery', performStarterJob(state))).toContain('+$30.25 · +10 XP');
  });
  it('Rebirth confirmation describes territory loss, cancellation preserves it, success restores only Waterfront', () => {
    const f = rebirthRuntime({ ...rebirthState(), city: { heat: 0, heatDecayElapsedMs: 0, ownedTerritoryIds: [W.id, N.id] } });
    const controls = createRebirthControls(() => f.game.rebirth(), () => {});
    const panel = () => renderToStaticMarkup(<RebirthPanelView preview={selectRebirth(f.game.getSnapshot().result.state)}
      unavailable={false} interaction={controls.getSnapshot()} controls={controls} />);
    const before = f.raw(); controls.request();
    expect(panel()).toContain('Territories beyond the starting Waterfront foothold');
    expect(panel()).toContain('Permanent skills'); expect(panel()).toContain('Vehicles'); expect(f.raw()).toBe(before);
    controls.cancel(); expect(f.raw()).toBe(before); controls.confirm(); expect(f.raw()).toBe(before);
    controls.request(); controls.confirm();
    expect(panel()).toContain('REBIRTH COMPLETE'); expect(render(f.game.getSnapshot().result.state)).toContain('Territories controlled: 1 / 2');
    expect(render(f.game.getSnapshot().result.state)).toContain('LOCKED'); f.game.stop();
  });
});
