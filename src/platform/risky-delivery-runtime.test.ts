import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../game/game-state';
import { performRiskyDelivery } from '../game/perform-starter-job';
import { rebirthRuntime } from './test-fixtures/rebirth-runtime';
import { parseSave } from '../game/save-schema';

describe('risk delivery runtime boundary', () => {
  it('reconciles cooling before eligibility and persists one successful delivery', () => {
    const base = createInitialGameState();
    const f = rebirthRuntime({ ...base, city: { ...base.city, heat: 60, heatDecayElapsedMs: 59999 } });
    f.at(1);
    const result = f.game.execute(performRiskyDelivery);
    expect(result).toMatchObject({ ok: true, moneyEarned: '3125' });
    expect(f.game.getSnapshot().result.state.city.heat).toBe(64);
    const decoded = parseSave(f.raw());
    expect(decoded.ok && decoded.envelope.state.city.heat).toBe(64);
    expect(f.game.getSnapshot().result.state.permanentProgression.unlockedAchievementIds).toContain('achievement:running-hot');
    const raw = f.raw();
    expect(f.game.execute(performRiskyDelivery)).toMatchObject({ ok: false, error: 'too-hot' });
    expect(f.raw()).toBe(raw);
    f.game.stop();
  });
  it('reports save failure without claiming the ordinary job was durably written', () => {
    const f = rebirthRuntime(createInitialGameState()), raw = f.raw();
    f.fail();
    f.game.execute(performRiskyDelivery);
    expect(f.game.getSnapshot().persistence.kind).toBe('error');
    expect(f.raw()).toBe(raw);
    // Same publish-then-save policy as the existing manual delivery command.
    expect(f.game.getSnapshot().result.state.city.heat).toBe(5);
    f.game.stop();
  });
  it('does not execute after the runtime stops', () => {
    const f = rebirthRuntime(createInitialGameState());
    f.game.stop(); const before = f.game.getSnapshot().result.state;
    expect(f.game.execute(performRiskyDelivery)).toBeUndefined();
    expect(f.game.getSnapshot().result.state).toBe(before);
  });
});
