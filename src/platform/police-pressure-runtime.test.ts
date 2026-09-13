import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../game/game-state';
import { performDiscreetDelivery, performRiskyDelivery } from '../game/perform-starter-job';
import { rebirthRuntime } from './test-fixtures/rebirth-runtime';
import { parseSave } from '../game/save-schema';

function fixture(heat: number, remainder = 0) {
  const s = createInitialGameState();
  return rebirthRuntime({ ...s, city: { ...s.city, heat, heatDecayElapsedMs: remainder } });
}
describe('Police Pressure runtime', () => {
  it('reconciles passive cooling before selecting the current risk premium', () => {
    const f = fixture(40, 59999); f.at(1);
    expect(f.game.execute(performRiskyDelivery)).toMatchObject({ ok: true, moneyEarned: '3750' });
    expect(f.game.getSnapshot().result.state.city.heat).toBe(44); f.game.stop();
  });
  it('does not pay a discreet job when reconciliation already cooled to zero', () => {
    const f = fixture(1, 59999); f.at(1);
    expect(f.game.execute(performDiscreetDelivery)).toMatchObject({ ok: false, error: 'already-cold' });
    expect(f.game.getSnapshot().result.state.economy.cash).toBe('0');
    expect(f.game.getSnapshot().result.state.city.heat).toBe(0); f.game.stop();
  });
  it('persists the successful reduction and restores it without repeating the action', () => {
    const f = fixture(60, 2000);
    f.game.execute(performDiscreetDelivery);
    const parsed = parseSave(f.raw());
    expect(parsed.ok && parsed.envelope.state).toMatchObject({ economy: { cash: '1125' }, city: { heat: 58 }, progression: { xp: 0 } });
    f.game.stop(); const reload = f.make(); reload.start();
    expect(reload.getSnapshot().result.state.city.heat).toBe(58);
    expect(reload.getSnapshot().result.state.permanentProgression.statistics.manualJobsCompleted).toBe(1);
    reload.stop();
  });
  it('reports storage failure using the existing manual-action persistence policy', () => {
    const f = fixture(80), raw = f.raw(); f.fail();
    f.game.execute(performDiscreetDelivery);
    expect(f.game.getSnapshot().persistence.kind).toBe('error');
    expect(f.raw()).toBe(raw);
    expect(f.game.getSnapshot().result.state.city.heat).toBe(78); f.game.stop();
  });
});
