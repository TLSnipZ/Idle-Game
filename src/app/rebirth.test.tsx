import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RebirthPanelView } from './RebirthPanel';
import { createRebirthControls } from './rebirth-controls';
import { exportSaveCode } from '../game/save-code';
import { Garage } from './Garage';
import { selectRebirth } from '../game/rebirth';
import { createInitialGameState } from '../game/game-state';
import { rebirthState } from '../game/test-fixtures/rebirth-state';
import { rebirthRuntime } from '../platform/test-fixtures/rebirth-runtime';
import { getXpThresholdForLevel } from '../features/progression';

function harness(f = rebirthRuntime()) {
  const controls = createRebirthControls(() => f.game.rebirth(), () => {});
  const render = () => renderToStaticMarkup(<RebirthPanelView preview={selectRebirth(f.game.getSnapshot().result.state)}
    unavailable={false} interaction={controls.getSnapshot()} controls={controls} />);
  return { f, controls, render };
}
describe('Rebirth confirmation', () => {
  it('shows unmet requirements, permanent totals and a disabled first action', () => {
    const h = harness(rebirthRuntime(createInitialGameState()));
    const html = h.render();
    expect(html).toContain('Not eligible'); expect(html).toContain('Player Level 20');
    expect(html).toContain('Dockside Detail Level 25'); expect(html).toContain('0 EP');
    expect(html).toContain('disabled=""'); expect(html).toContain('aria-live="polite"');
    expect(html).not.toContain('Confirm your Rebirth'); h.f.game.stop();
  });
  it('review and cancel change only interaction state and repeat the complete policy', () => {
    const h = harness(), before = h.f.game.getSnapshot().result.state, raw = h.f.raw(), reads = h.f.clockReads();
    for (const text of ['You keep', 'You lose', 'Vehicles', 'Empire Points', 'Rebirth count', 'Cash',
      'Businesses and business levels', 'Normal upgrades', 'Delivery Dispatcher', 'Player XP / Level', 'Temporary production progress']) {
      expect(h.render()).toContain(text);
    }
    h.controls.request();
    expect(h.render()).toContain('Confirm your Rebirth'); expect(h.render()).toContain('+4 Empire Points');
    expect(h.render()).toContain('aria-describedby="rebirth-policy"'); expect(h.render()).toContain('You lose');
    expect(h.f.events).toEqual([]);
    h.controls.cancel(); h.controls.confirm();
    expect(h.f.game.getSnapshot().result.state).toBe(before); expect(h.f.raw()).toBe(raw);
    expect(h.f.clockReads()).toBe(reads); expect(h.controls.getSnapshot().message).toContain('cancelled');
    h.f.game.stop();
  });
  it('confirmation re-evaluates a reward changed by dispatcher XP while open', () => {
    const initial = rebirthState(29);
    const h = harness(rebirthRuntime({ ...initial, progression: { xp: getXpThresholdForLevel(30) - 5 } }));
    h.controls.request(); expect(h.render()).toContain('+4 Empire Points');
    h.f.at(10000); h.f.wall(11000); h.controls.confirm();
    expect(h.controls.getSnapshot().message).toContain('+5 Empire Points');
    expect(h.render()).toContain('5 EP'); expect(h.render()).toContain('REBIRTH COMPLETE');
    const after = h.f.game.getSnapshot().result.state;
    expect(after.economy.cash).toBe('0'); expect(after.progression.xp).toBe(0);
    expect(after.businesses.owned).toEqual({}); expect(after.upgrades.purchasedIds).toEqual([]);
    expect(after.automation.unlockedIds).toEqual([]); expect(after.permanentProgression.rebirthCount).toBe(1);
    expect(renderToStaticMarkup(<Garage state={after} paused={false} onPurchase={() => {}} />)).toContain('OWNED');
    const raw = h.f.raw(); h.controls.confirm(); expect(h.f.raw()).toBe(raw); h.f.game.stop();
  });
  it('storage failure reports no reset and keeps the previous save and live operation', () => {
    const h = harness(), before = h.f.game.getSnapshot().result.state, raw = h.f.raw();
    h.controls.request(); h.f.fail(); h.controls.confirm();
    expect(h.f.game.getSnapshot().result.state).toBe(before); expect(h.f.raw()).toBe(raw);
    expect(h.render()).toContain('Nothing was reset'); expect(h.render()).not.toContain('REBIRTH COMPLETE');
    expect(h.render()).toContain('0 EP'); h.f.game.stop();
  });
});


it('an imported ineligible state invalidates an open confirmation without resetting again', () => {
  const h = harness(); h.controls.request();
  const fresh = createInitialGameState(); const code = exportSaveCode(fresh, 1);
  if (!code.ok) throw Error('fixture');
  expect(h.f.game.importCode(code.code).ok).toBe(true);
  const raw = h.f.raw();
  expect(h.render()).toContain('Requirements are no longer met');
  h.controls.confirm();
  expect(h.f.raw()).toBe(raw); expect(h.f.game.getSnapshot().result.state).toEqual(fresh);
  expect(h.controls.getSnapshot().message).toContain('Nothing was reset'); h.f.game.stop();
});
